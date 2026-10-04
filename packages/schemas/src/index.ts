import type { z } from 'zod';
import { Claim, Context, Entity, Relation, Source } from './knowledge';
import { ModelSpecification } from './model';
import { Asset, Representation } from './representation';
import { Lesson, SceneManifest } from './scene';

export * from './common';
export * from './knowledge';
export * from './representation';
export * from './scene';
export * from './model';
export * from './pack';

/**
 * Colecciones de contenido: directorio en content/ → esquema de cada registro.
 * Cada archivo YAML de un directorio contiene un registro o una lista de registros.
 */
export const CONTENT_COLLECTIONS = {
  sources: Source,
  contexts: Context,
  entities: Entity,
  relations: Relation,
  claims: Claim,
  assets: Asset,
  representations: Representation,
  scenes: SceneManifest,
  lessons: Lesson,
  models: ModelSpecification,
} as const satisfies Record<string, z.ZodType>;

export type ContentCollection = keyof typeof CONTENT_COLLECTIONS;
