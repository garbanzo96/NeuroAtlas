import { z } from 'zod';
import { CONTENT_COLLECTIONS } from './index';
import { KnowledgePack, PackCatalog, Release, SelectionState } from './pack';
import { SimulationChunk, SimulationInput } from './model';
import { SchematicGeometry } from './representation';

const SINGULAR: Record<keyof typeof CONTENT_COLLECTIONS, string> = {
  sources: 'source',
  contexts: 'context',
  entities: 'entity',
  relations: 'relation',
  claims: 'claim',
  assets: 'asset',
  representations: 'representation',
  scenes: 'scene',
  lessons: 'lesson',
  models: 'model',
};

function toJson(schema: z.ZodType, title: string): Record<string, unknown> {
  return {
    ...z.toJSONSchema(schema, { io: 'input', target: 'draft-2020-12', unrepresentable: 'any' }),
    title,
  };
}

/**
 * JSON Schemas derivados de los contratos Zod. Se exportan a packages/schemas/json/
 * (npm run schemas:export) para editores YAML y herramientas externas.
 * Los archivos *.file.schema.json aceptan un registro o una lista de registros.
 */
export function buildJsonSchemas(): Record<string, Record<string, unknown>> {
  const out: Record<string, Record<string, unknown>> = {};
  for (const [collection, schema] of Object.entries(CONTENT_COLLECTIONS)) {
    const name = SINGULAR[collection as keyof typeof CONTENT_COLLECTIONS];
    out[`${name}.schema.json`] = toJson(schema, `NeuroAtlas ${name}`);
    out[`${name}.file.schema.json`] = toJson(
      z.union([schema, z.array(schema)]),
      `NeuroAtlas ${name} (archivo: registro o lista)`,
    );
  }
  out['release.schema.json'] = toJson(Release, 'NeuroAtlas release');
  out['schematic-geometry.schema.json'] = toJson(
    SchematicGeometry,
    'NeuroAtlas schematic geometry',
  );
  out['knowledge-pack.schema.json'] = toJson(KnowledgePack, 'NeuroAtlas knowledge pack');
  out['pack-catalog.schema.json'] = toJson(PackCatalog, 'NeuroAtlas pack catalog');
  out['selection-state.schema.json'] = toJson(SelectionState, 'NeuroAtlas selection state');
  out['simulation-input.schema.json'] = toJson(SimulationInput, 'NeuroAtlas simulation input');
  out['simulation-chunk.schema.json'] = toJson(SimulationChunk, 'NeuroAtlas simulation chunk');
  return out;
}
