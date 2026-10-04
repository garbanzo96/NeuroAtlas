import { z } from 'zod';

/**
 * Identificadores estables: `<prefijo>.<segmento>(.<segmento>)*`, en minúsculas ASCII.
 * El prefijo indica la colección. Un ID publicado nunca se reutiliza para otro significado:
 * si el significado cambia, se crea un ID nuevo y el anterior pasa a `retired`.
 */
export const ID_PREFIXES = {
  source: 'src',
  context: 'ctx',
  entity: 'ent',
  relation: 'rel',
  claim: 'claim',
  asset: 'asset',
  representation: 'rep',
  scene: 'scene',
  lesson: 'lesson',
  model: 'model',
  spatialMapping: 'map',
} as const;

export type IdKind = keyof typeof ID_PREFIXES;

export function idPattern(prefix: string): RegExp {
  return new RegExp(`^${prefix}\\.[a-z0-9_]+(\\.[a-z0-9_]+)*$`);
}

function idSchema(kind: IdKind) {
  const prefix = ID_PREFIXES[kind];
  return z
    .string()
    .regex(idPattern(prefix), `Debe tener la forma "${prefix}.<segmento>" en minúsculas ASCII`)
    .meta({ description: `Identificador estable de ${kind} (prefijo "${prefix}.")` });
}

export const SourceId = idSchema('source');
export const ContextId = idSchema('context');
export const EntityId = idSchema('entity');
export const RelationId = idSchema('relation');
export const ClaimId = idSchema('claim');
export const AssetId = idSchema('asset');
export const RepresentationId = idSchema('representation');
export const SceneId = idSchema('scene');
export const LessonId = idSchema('lesson');
export const ModelId = idSchema('model');
export const SpatialMappingId = idSchema('spatialMapping');

/** Identificador local dentro de un documento (capa, nodo, paso). */
export const LocalId = z
  .string()
  .regex(/^[a-z0-9_]+$/, 'Identificador local: minúsculas ASCII, dígitos y "_"');

/** Referencia a una decisión pendiente registrada en docs/decisions-pending.md. */
export const DecisionRef = z.string().regex(/^DEC-\d{3}$/, 'Formato DEC-000');
/** Referencia a un paquete de trabajo del backlog (docs/backlog.md). */
export const WorkPackageRef = z.string().regex(/^WP-\d{3}$/, 'Formato WP-000');

export const IsoDate = z.iso.date();

/** Texto localizado. El español es obligatorio; el inglés es opcional. */
export const LocalizedText = z.strictObject({
  es: z.string().min(1),
  en: z.string().min(1).optional(),
});
export type LocalizedText = z.infer<typeof LocalizedText>;

export const Vec3 = z.tuple([z.number(), z.number(), z.number()]);
export type Vec3 = z.infer<typeof Vec3>;

/** Estado editorial de un registro científico (afirmación, relación, entidad, modelo, lección). */
export const ContentStatus = z.enum(['draft', 'reviewed', 'published', 'questioned', 'retired']);
export type ContentStatus = z.infer<typeof ContentStatus>;

/** Escala semántica de una escena o entidad. */
export const SemanticScale = z.enum([
  'organism',
  'system',
  'pathway',
  'region',
  'circuit',
  'cell',
  'subcellular',
  'molecular',
]);
export type SemanticScale = z.infer<typeof SemanticScale>;

/**
 * Revisión de un registro. Solo `human_expert` cuenta como revisión científica.
 * Una revisión entre modelos de lenguaje (`llm_crosscheck`) ayuda a detectar problemas,
 * pero nunca habilita los estados `reviewed` o `published`.
 */
export const Review = z.strictObject({
  kind: z.enum(['human_expert', 'human_editorial', 'llm_crosscheck']),
  reviewer: z.string().min(1),
  role: z.string().min(1),
  date: IsoDate,
  scope: z.string().min(1),
  criteria: z.string().min(1),
  outcome: z.enum(['approved', 'approved_with_changes', 'rejected', 'needs_more_evidence']),
});
export type Review = z.infer<typeof Review>;

/** Quién creó el registro y cómo. */
export const Provenance = z.strictObject({
  author: z.string().min(1),
  /** Persona o modelo que extrajo/redactó: p. ej. "humano:<nombre>" o "llm:<modelo>". */
  extractor: z.string().min(1),
  createdOn: IsoDate,
  method: z.string().min(1),
  transformations: z.array(z.string()).default([]),
});
export type Provenance = z.infer<typeof Provenance>;

/** Especie o alcance taxonómico de un contexto. */
export const SpeciesScope = z.discriminatedUnion('scope', [
  z.strictObject({
    scope: z.literal('species'),
    scientificName: z.string().min(1),
    /** Formato "NCBITaxon:<n>"; null si aún no se verificó. */
    ncbiTaxon: z
      .string()
      .regex(/^NCBITaxon:\d+$/)
      .nullable(),
  }),
  z.strictObject({
    scope: z.literal('general'),
    /** Alcance de la generalización (p. ej. "neocorteza de mamíferos, esquema didáctico"). */
    description: z.string().min(1),
  }),
  z.strictObject({
    scope: z.literal('pending_decision'),
    decision: DecisionRef,
    description: z.string().min(1),
  }),
  z.strictObject({ scope: z.literal('not_applicable') }),
]);
export type SpeciesScope = z.infer<typeof SpeciesScope>;
