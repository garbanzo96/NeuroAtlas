import { z } from 'zod';
import {
  AssetId,
  ContextId,
  EntityId,
  IsoDate,
  LocalId,
  LocalizedText,
  RepresentationId,
  SceneId,
} from './common';
import { Claim, Context, Entity, Relation, Source } from './knowledge';
import { ModelSpecification } from './model';
import { Asset, Representation } from './representation';
import { Lesson, SceneManifest } from './scene';

// ---------------------------------------------------------------------------
// Release y paquete de conocimiento
// ---------------------------------------------------------------------------

export const ReleaseId = z
  .string()
  .regex(/^\d{4}\.\d{2}\.\d+(-[a-z0-9.]+)?$/, 'Formato AAAA.MM.N(-sufijo)');

export const Release = z.strictObject({
  id: ReleaseId,
  /** dev: borradores visibles con aviso; review: para asesores; public: solo contenido publicado. */
  channel: z.enum(['dev', 'review', 'public']),
  /** Fecha de corte bibliográfica declarada para este release. */
  cutoffDate: IsoDate,
  notes: LocalizedText,
});
export type Release = z.infer<typeof Release>;

/** Todo el conocimiento de un release, tal como lo consume la aplicación. */
export const KnowledgePack = z.strictObject({
  schemaVersion: z.literal('1'),
  release: Release,
  sources: z.array(Source),
  contexts: z.array(Context),
  entities: z.array(Entity),
  relations: z.array(Relation),
  claims: z.array(Claim),
  assets: z.array(Asset),
  representations: z.array(Representation),
  scenes: z.array(SceneManifest),
  lessons: z.array(Lesson),
  models: z.array(ModelSpecification),
});
export type KnowledgePack = z.infer<typeof KnowledgePack>;

/** Catálogo publicado en /packs/catalog.json. */
export const PackCatalog = z.strictObject({
  schemaVersion: z.literal('1'),
  currentRelease: ReleaseId,
  releases: z.array(
    z.strictObject({
      id: ReleaseId,
      knowledge: z.strictObject({
        path: z.string().min(1),
        sha256: z.string().regex(/^[a-f0-9]{64}$/),
        bytes: z.int().positive(),
      }),
      assets: z.array(
        z.strictObject({
          assetId: AssetId,
          path: z.string().min(1),
          sha256: z.string().regex(/^[a-f0-9]{64}$/),
          bytes: z.int().positive(),
        }),
      ),
    }),
  ),
});
export type PackCatalog = z.infer<typeof PackCatalog>;

// ---------------------------------------------------------------------------
// Estado de selección compartido
// ---------------------------------------------------------------------------

export const SelectionState = z.strictObject({
  sceneId: SceneId,
  contextId: ContextId,
  selectedEntityIds: z.array(EntityId),
  focusedRepresentationId: RepresentationId.optional(),
  visibleLayerIds: z.array(LocalId),
  filters: z.record(z.string(), z.array(z.string())),
  timeCursor: z
    .strictObject({
      runId: z.string().min(1),
      value: z.number(),
      units: z.enum(['ms', 's']),
    })
    .optional(),
  compareWith: z.strictObject({ sceneId: SceneId, contextId: ContextId }).optional(),
});
export type SelectionState = z.infer<typeof SelectionState>;
