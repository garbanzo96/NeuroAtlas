import { mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { buildJsonSchemas } from '@neuroatlas/schemas/json-schema';

/** Escribe los JSON Schema derivados de Zod y elimina los obsoletos. Devuelve los nombres. */
export function exportSchemas(outDir: string): string[] {
  mkdirSync(outDir, { recursive: true });
  const schemas = buildJsonSchemas();
  for (const name of readdirSync(outDir)) {
    if (name.endsWith('.json') && !(name in schemas)) rmSync(join(outDir, name));
  }
  for (const [name, schema] of Object.entries(schemas)) {
    writeFileSync(join(outDir, name), JSON.stringify(schema, null, 2) + '\n');
  }
  return Object.keys(schemas).sort();
}
