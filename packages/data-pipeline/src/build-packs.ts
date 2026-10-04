import { createHash } from 'node:crypto';
import { copyFileSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import type { PackCatalog } from '@neuroatlas/schemas';
import type { LoadedContent } from './load-content';

function sha256(data: Buffer | string): string {
  return createHash('sha256').update(data).digest('hex');
}

/**
 * Escribe un release inmutable en `outDir`:
 *   outDir/catalog.json
 *   outDir/<release>/knowledge.json
 *   outDir/<release>/assets/<archivo>
 * Solo se distribuyen assets con estado `available` (la validación ya comprobó licencias).
 */
export function buildPacks(loaded: LoadedContent, outDir: string): PackCatalog {
  const pack = loaded.pack;
  if (!pack) throw new Error('No hay paquete válido que construir.');
  const releaseId = pack.release.id;
  rmSync(outDir, { recursive: true, force: true });
  const releaseDir = join(outDir, releaseId);
  mkdirSync(join(releaseDir, 'assets'), { recursive: true });

  const knowledgeJson = JSON.stringify(pack);
  writeFileSync(join(releaseDir, 'knowledge.json'), knowledgeJson);

  const assets: PackCatalog['releases'][number]['assets'] = [];
  for (const asset of pack.assets) {
    if (asset.status !== 'available') continue;
    const source = loaded.assetFiles.get(asset.id);
    if (!source || !asset.file) throw new Error(`Falta el archivo de ${asset.id}`);
    const target = join(releaseDir, 'assets', asset.file.path);
    mkdirSync(dirname(target), { recursive: true });
    copyFileSync(source, target);
    const data = readFileSync(target);
    assets.push({
      assetId: asset.id,
      path: `${releaseId}/assets/${asset.file.path}`,
      sha256: sha256(data),
      bytes: data.byteLength,
    });
  }

  const catalog: PackCatalog = {
    schemaVersion: '1',
    currentRelease: releaseId,
    releases: [
      {
        id: releaseId,
        knowledge: {
          path: `${releaseId}/knowledge.json`,
          sha256: sha256(knowledgeJson),
          bytes: Buffer.byteLength(knowledgeJson),
        },
        assets,
      },
    ],
  };
  writeFileSync(join(outDir, 'catalog.json'), JSON.stringify(catalog, null, 2));
  return catalog;
}
