import {
  KnowledgePack,
  PackCatalog,
  SchematicGeometry,
  type PackCatalog as PackCatalogType,
} from '@neuroatlas/schemas';

/** Ruta base de los paquetes (respeta el `base` de Vite). */
export const PACKS_BASE = `${import.meta.env.BASE_URL}packs/`;

async function sha256Hex(buffer: ArrayBuffer): Promise<string | null> {
  if (!globalThis.crypto?.subtle) return null; // contextos no seguros: se omite la comprobación
  const digest = await crypto.subtle.digest('SHA-256', buffer);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function fetchVerified(path: string, expectedSha256: string): Promise<unknown> {
  const response = await fetch(`${PACKS_BASE}${path}`);
  if (!response.ok) throw new Error(`No se pudo descargar ${path} (HTTP ${response.status}).`);
  const buffer = await response.arrayBuffer();
  const hash = await sha256Hex(buffer);
  if (hash && hash !== expectedSha256) {
    throw new Error(
      `Integridad: ${path} no coincide con el catálogo (sha256). Reconstruye con "npm run packs".`,
    );
  }
  return JSON.parse(new TextDecoder().decode(buffer));
}

export interface LoadedRelease {
  catalog: PackCatalogType;
  pack: KnowledgePack;
  assetPaths: Map<string, { path: string; sha256: string }>;
}

/** Descarga y valida catálogo y conocimiento del release actual. */
export async function loadRelease(): Promise<LoadedRelease> {
  const response = await fetch(`${PACKS_BASE}catalog.json`);
  if (!response.ok) {
    throw new Error(
      'No se encontró el catálogo de paquetes. Ejecuta "npm run packs" (o "npm run dev", que lo hace automáticamente).',
    );
  }
  const catalog = PackCatalog.parse(await response.json());
  const release = catalog.releases.find((r) => r.id === catalog.currentRelease);
  if (!release) throw new Error(`El catálogo no contiene el release ${catalog.currentRelease}.`);
  const pack = KnowledgePack.parse(
    await fetchVerified(release.knowledge.path, release.knowledge.sha256),
  );
  const assetPaths = new Map(
    release.assets.map((a) => [a.assetId, { path: a.path, sha256: a.sha256 }]),
  );
  return { catalog, pack, assetPaths };
}

const geometryCache = new Map<string, Promise<SchematicGeometry>>();

/** Carga diferida (y cacheada) de una geometría esquemática. */
export function loadGeometry(
  assetId: string,
  assetPaths: ReadonlyMap<string, { path: string; sha256: string }>,
): Promise<SchematicGeometry> {
  const cached = geometryCache.get(assetId);
  if (cached) return cached;
  const entry = assetPaths.get(assetId);
  const promise = entry
    ? fetchVerified(entry.path, entry.sha256).then((json) => SchematicGeometry.parse(json))
    : Promise.reject(new Error(`El asset ${assetId} no está disponible en este release.`));
  geometryCache.set(assetId, promise);
  promise.catch(() => geometryCache.delete(assetId));
  return promise;
}
