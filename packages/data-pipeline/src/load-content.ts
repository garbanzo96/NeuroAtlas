import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import {
  CONTENT_COLLECTIONS,
  type ContentCollection,
  KnowledgePack,
  Release,
  SchematicGeometry,
} from '@neuroatlas/schemas';
import { parse as parseYaml } from 'yaml';
import type { z } from 'zod';

export interface LoadProblem {
  file: string;
  message: string;
}

export interface LoadedContent {
  pack: KnowledgePack | null;
  geometries: Map<string, SchematicGeometry>;
  /** assetId → ruta absoluta del archivo a distribuir. */
  assetFiles: Map<string, string>;
  problems: LoadProblem[];
  /** Archivos leídos por colección (para informes). */
  fileCount: number;
}

function listYamlFiles(dir: string): string[] {
  if (!existsSync(dir)) return [];
  const out: string[] = [];
  for (const name of readdirSync(dir).sort()) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out.push(...listYamlFiles(full));
    else if (/\.ya?ml$/.test(name)) out.push(full);
  }
  return out;
}

function formatZodError(error: z.ZodError): string {
  return error.issues
    .map((issue) => `  - ${issue.path.length ? issue.path.join('.') : '(raíz)'}: ${issue.message}`)
    .join('\n');
}

/**
 * Lee content/ (YAML), valida cada registro con su esquema y arma el KnowledgePack.
 * No aplica reglas epistémicas: eso lo hace validateKnowledge sobre el resultado.
 */
export function loadContent(contentDir: string): LoadedContent {
  const problems: LoadProblem[] = [];
  const rel = (file: string) => relative(contentDir, file);
  let fileCount = 0;

  const readYaml = (file: string): unknown => {
    fileCount += 1;
    try {
      return parseYaml(readFileSync(file, 'utf8'));
    } catch (error) {
      problems.push({ file: rel(file), message: `YAML inválido: ${(error as Error).message}` });
      return undefined;
    }
  };

  // Release
  const releaseFile = join(contentDir, 'release.yaml');
  let release: Release | null = null;
  if (!existsSync(releaseFile)) {
    problems.push({ file: 'release.yaml', message: 'Falta content/release.yaml' });
  } else {
    const parsed = Release.safeParse(readYaml(releaseFile));
    if (parsed.success) release = parsed.data;
    else
      problems.push({
        file: 'release.yaml',
        message: `Release inválido:\n${formatZodError(parsed.error)}`,
      });
  }

  // Colecciones
  const collections = {} as Record<ContentCollection, unknown[]>;
  for (const [name, schema] of Object.entries(CONTENT_COLLECTIONS) as Array<
    [ContentCollection, z.ZodType]
  >) {
    collections[name] = [];
    for (const file of listYamlFiles(join(contentDir, name))) {
      const data = readYaml(file);
      if (data === undefined || data === null) continue;
      const records = Array.isArray(data) ? data : [data];
      records.forEach((record, index) => {
        const parsed = schema.safeParse(record);
        if (parsed.success) collections[name].push(parsed.data);
        else {
          const where = Array.isArray(data) ? `${rel(file)}[${index}]` : rel(file);
          const id =
            record && typeof record === 'object'
              ? ((record as Record<string, unknown>).id ??
                (record as Record<string, unknown>).sceneId ??
                (record as Record<string, unknown>).lessonId)
              : undefined;
          problems.push({
            file: where,
            message: `Registro inválido${id ? ` (${String(id)})` : ''} en ${name}:\n${formatZodError(parsed.error)}`,
          });
        }
      });
    }
  }

  let pack: KnowledgePack | null = null;
  if (release) {
    const parsed = KnowledgePack.safeParse({ schemaVersion: '1', release, ...collections });
    if (parsed.success) pack = parsed.data;
    else problems.push({ file: '(paquete)', message: formatZodError(parsed.error) });
  }

  // Archivos de assets y geometrías esquemáticas
  const geometries = new Map<string, SchematicGeometry>();
  const assetFiles = new Map<string, string>();
  for (const asset of pack?.assets ?? []) {
    if (!asset.file) continue;
    const path = join(contentDir, 'assets', 'files', asset.file.path);
    if (!existsSync(path)) {
      problems.push({
        file: `assets/files/${asset.file.path}`,
        message: `Archivo de ${asset.id} no encontrado.`,
      });
      continue;
    }
    assetFiles.set(asset.id, path);
    if (asset.kind === 'schematic_geometry') {
      fileCount += 1;
      try {
        const parsed = SchematicGeometry.safeParse(JSON.parse(readFileSync(path, 'utf8')));
        if (parsed.success) geometries.set(asset.id, parsed.data);
        else
          problems.push({
            file: `assets/files/${asset.file.path}`,
            message: `Geometría inválida:\n${formatZodError(parsed.error)}`,
          });
      } catch (error) {
        problems.push({
          file: `assets/files/${asset.file.path}`,
          message: `JSON inválido: ${(error as Error).message}`,
        });
      }
    }
  }

  return { pack, geometries, assetFiles, problems, fileCount };
}
