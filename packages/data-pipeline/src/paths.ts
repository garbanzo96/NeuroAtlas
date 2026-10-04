import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

/** Raíz del repositorio (packages/data-pipeline/src → ../../..). */
export const REPO_ROOT = fileURLToPath(new URL('../../../', import.meta.url));
export const CONTENT_DIR = join(REPO_ROOT, 'content');
export const PACKS_DIR = join(REPO_ROOT, 'apps', 'web', 'public', 'packs');
export const JSON_SCHEMA_DIR = join(REPO_ROOT, 'packages', 'schemas', 'json');
export const METADATA_CHECKS_DIR = join(REPO_ROOT, 'docs', 'research', 'metadata-checks');
