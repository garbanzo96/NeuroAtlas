/**
 * Construye la vista previa publicable como página de claude.ai (Artifact):
 *   - rutas relativas (base "./"), sin sourcemaps, en apps/web/dist-artifact/;
 *   - index.html sin <!doctype>/<html>/<head>/<body> (la plataforma añade su propio esqueleto)
 *     y con <title> al principio.
 * Requiere los paquetes de datos: `npm run build:artifact` ejecuta antes `npm run packs`.
 */
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'vite';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const WEB = join(ROOT, 'apps', 'web');
const OUT = join(WEB, 'dist-artifact');

/** Convierte el index.html de Vite en el contenido de página que espera la plataforma. */
export function toArtifactPage(html: string): string {
  const title = html.match(/<title>[\s\S]*?<\/title>/i)?.[0] ?? '<title>NeuroAtlas</title>';
  const head = html.match(/<head[^>]*>([\s\S]*?)<\/head>/i)?.[1] ?? '';
  const body = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i)?.[1] ?? '';
  const headAssets = head
    .replace(/<title>[\s\S]*?<\/title>/gi, '')
    .replace(/<meta[^>]*>/gi, '')
    .trim();
  return [title, headAssets, body.trim()].filter(Boolean).join('\n') + '\n';
}

function listFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    return statSync(full).isDirectory() ? listFiles(full) : [full];
  });
}

async function main() {
  process.env.VITE_NEUROATLAS_TARGET = 'artifact';
  await build({
    root: WEB,
    configFile: join(WEB, 'vite.config.ts'),
    base: './',
    logLevel: 'warn',
    build: { outDir: OUT, emptyOutDir: true, sourcemap: false },
  });
  const indexPath = join(OUT, 'index.html');
  writeFileSync(indexPath, toArtifactPage(readFileSync(indexPath, 'utf8')));
  const files = listFiles(OUT)
    .map((f) => relative(OUT, f).split('\\').join('/'))
    .filter((f) => f !== 'index.html')
    .sort();
  writeFileSync(join(OUT, 'artifact-files.json'), JSON.stringify(files, null, 2) + '\n');
  console.log(
    `Vista previa en ${relative(ROOT, OUT)}/ (${files.length} archivos de apoyo + index.html)`,
  );
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  });
}
