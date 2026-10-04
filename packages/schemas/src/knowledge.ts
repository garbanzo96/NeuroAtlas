import { z } from 'zod';
import {
  ClaimId,
  ContentStatus,
  ContextId,
  EntityId,
  IsoDate,
  LocalizedText,
  ModelId,
  Provenance,
  RelationId,
  Review,
  SceneId,
  SemanticScale,
  SourceId,
  SpeciesScope,
} from './common';

// ---------------------------------------------------------------------------
// Fuente
// ---------------------------------------------------------------------------

/**
 * Escalera de verificación de una fuente. Cada peldaño exige evidencia propia:
 * resolver un DOI (metadata_verified) no equivale a leer el contenido (content_inspected).
 */
export const SourceVerificationStatus = z.enum([
  'candidate',
  'metadata_verified',
  'content_inspected',
]);

export const Source = z.strictObject({
  id: SourceId,
  /** ID del registro preliminar del plan (research/source-register.json), si existe. */
  legacyId: z.string().optional(),
  type: z.enum([
    'book',
    'article',
    'review',
    'dataset',
    'atlas',
    'tool',
    'repository',
    'website',
    'standard',
  ]),
  title: z.string().min(1),
  authors: z.array(z.string()).default([]),
  year: z.int().nullable(),
  container: z.string().optional(),
  edition: z.string().optional(),
  doi: z
    .string()
    .regex(/^10\.\d{4,9}\/\S+$/, 'DOI sin prefijo https://doi.org/')
    .optional(),
  urls: z.array(z.url()).default([]),
  plannedUse: z.string().min(1),
  limitations: z.string().min(1),
  verification: z.strictObject({
    status: SourceVerificationStatus,
    verifiedOn: IsoDate.nullable(),
    /** Qué se comprobó exactamente (p. ej. "Crossref: título, DOI y fecha; contenido no leído"). */
    scope: z.string().min(1),
    method: z.string().optional(),
  }),
  license: z.strictObject({
    reviewed: z.boolean(),
    redistribution: z.enum(['allowed', 'link_only', 'not_allowed', 'unknown']),
    summary: z.string().min(1),
  }),
});
export type Source = z.infer<typeof Source>;

// ---------------------------------------------------------------------------
// Contexto
// ---------------------------------------------------------------------------

/**
 * Contexto científico de una escena, afirmación o relación: especie, preparación,
 * atlas, modalidad. Dos contextos distintos nunca se tratan como el mismo espacio.
 */
export const Context = z.strictObject({
  id: ContextId,
  label: LocalizedText,
  kind: z.enum([
    'anatomical_reference',
    'schematic',
    'experimental_preparation',
    'computational_model',
  ]),
  species: SpeciesScope,
  developmentalStage: z.string().min(1),
  preparation: z.string().min(1),
  modality: z.string().min(1),
  atlas: z.strictObject({ name: z.string().min(1), version: z.string().min(1) }).nullable(),
  description: LocalizedText,
});
export type Context = z.infer<typeof Context>;

// ---------------------------------------------------------------------------
// Entidad
// ---------------------------------------------------------------------------

export const EntityType = z.enum([
  'organism',
  'system',
  'region',
  'structure',
  'nucleus',
  'tract',
  'layer',
  'population',
  'cell_type',
  'cell',
  'compartment',
  'synapse',
  'ion_channel',
  'ion_current',
  'pathway',
  'network',
  'process',
  'task',
  'capacity',
  'variable',
]);
export type EntityType = z.infer<typeof EntityType>;

/**
 * Identidad estable. La entidad no contiene afirmaciones científicas: su descripción
 * proviene de `Claim`. Solo guarda nombre, tipo, alcance taxonómico y referencias externas.
 */
export const Entity = z.strictObject({
  id: EntityId,
  type: EntityType,
  semanticScale: SemanticScale,
  label: LocalizedText,
  synonyms: z
    .array(z.strictObject({ text: z.string().min(1), lang: z.enum(['es', 'en', 'la']) }))
    .default([]),
  taxonScope: z.discriminatedUnion('kind', [
    z.strictObject({ kind: z.literal('general'), note: z.string().min(1) }),
    z.strictObject({ kind: z.literal('species'), scientificName: z.string().min(1) }),
  ]),
  externalRefs: z
    .array(
      z.strictObject({
        system: z.enum(['UBERON', 'NeuroNames', 'AllenMouseCCF', 'JulichBrain', 'CL', 'other']),
        id: z.string().min(1),
        version: z.string().optional(),
        verified: z.boolean(),
        verifiedOn: IsoDate.nullable(),
      }),
    )
    .default([]),
  status: ContentStatus,
  /** Nota editorial (no científica), p. ej. por qué existe la entidad. */
  notes: z.string().optional(),
});
export type Entity = z.infer<typeof Entity>;

// ---------------------------------------------------------------------------
// Relación
// ---------------------------------------------------------------------------

/**
 * Códigos estables de relación. Correspondencia con el plan (02-modelo-cientifico.md):
 * parte_de→part_of, ubicado_en→located_in, clasificado_como→classified_as,
 * conecta_con→connects_to, proyecta_a→projects_to, modula→modulates,
 * participa_en→participates_in, medido_por→measured_by,
 * implementado_por_modelo→implemented_by_model, corresponde_a→corresponds_to,
 * derivado_de→derived_from. `sustenta`/`contradice` son relaciones de evidencia (Claim.evidence).
 */
export const RelationType = z.enum([
  'part_of',
  'located_in',
  'classified_as',
  'connects_to',
  'projects_to',
  'modulates',
  'participates_in',
  'measured_by',
  'implemented_by_model',
  'corresponds_to',
  'derived_from',
]);
export type RelationType = z.infer<typeof RelationType>;

/** Modalidad de la evidencia de conexión. Nunca convertir una en otra. */
export const ConnectionModality = z.enum([
  'synaptic_reconstruction',
  'axonal_tracing',
  'tractography',
  'functional_connectivity',
  'effective_connectivity',
  'physiology',
  /** La modalidad primaria aún no se ha extraído de las fuentes. */
  'pending_extraction',
]);
export type ConnectionModality = z.infer<typeof ConnectionModality>;

export const Relation = z.strictObject({
  id: RelationId,
  version: z.int().positive(),
  type: RelationType,
  subjectId: EntityId,
  objectId: z.union([EntityId, ModelId]),
  contextId: ContextId,
  /** Afirmaciones que sustentan la relación. Una relación científica sin afirmación no existe. */
  claimIds: z.array(ClaimId).min(1),
  connection: z
    .strictObject({
      modality: ConnectionModality,
      directed: z.union([z.boolean(), z.literal('unknown')]),
      sign: z.enum(['excitatory', 'inhibitory', 'modulatory', 'mixed', 'unknown']),
      weight: z
        .strictObject({
          value: z.number(),
          units: z.string().min(1),
          measure: z.string().min(1),
        })
        .nullable(),
    })
    .optional(),
  correspondence: z
    .strictObject({
      category: z.enum(['equivalent_per_scheme', 'approximate', 'one_to_many', 'uncertain']),
      scheme: z.string().min(1),
    })
    .optional(),
  status: ContentStatus,
});
export type Relation = z.infer<typeof Relation>;

// ---------------------------------------------------------------------------
// Afirmación (Claim)
// ---------------------------------------------------------------------------

/**
 * Tipo epistémico. `didactic_bridge` es una afirmación sobre la representación
 * (p. ej. "la escena siguiente es un esquema sin registro espacial"), no sobre biología.
 */
export const ClaimKind = z.enum([
  'observation',
  'association',
  'causal_intervention',
  'inference',
  'model_prediction',
  'didactic_bridge',
]);
export type ClaimKind = z.infer<typeof ClaimKind>;

/** Etiqueta visible permanente en la interfaz. */
export const DisplayLabel = z.enum(['observation', 'inference', 'model', 'educational_schematic']);
export type DisplayLabel = z.infer<typeof DisplayLabel>;

export const Evidence = z.strictObject({
  sourceId: SourceId,
  /** Figura, tabla, página o pasaje. "pending" si aún no se ha localizado. */
  locator: z.string().min(1),
  locatorVerified: z.boolean(),
  relation: z.enum(['supports', 'contradicts', 'contextualizes']),
  methodLimitations: z.string().min(1),
});
export type Evidence = z.infer<typeof Evidence>;

export const ClaimObject = z.discriminatedUnion('type', [
  z.strictObject({ type: z.literal('entity'), id: z.union([EntityId, ModelId, SceneId]) }),
  z.strictObject({ type: z.literal('quantity'), value: z.number(), units: z.string().min(1) }),
  z.strictObject({ type: z.literal('text'), text: z.string().min(1) }),
]);

export const Claim = z.strictObject({
  id: ClaimId,
  version: z.int().positive(),
  proposition: LocalizedText,
  kind: ClaimKind,
  subjectIds: z.array(z.union([EntityId, ModelId, SceneId])).min(1),
  predicate: z.string().regex(/^[a-z][a-z0-9_]*$/),
  object: ClaimObject,
  contextId: ContextId,
  /** Método y variable medida; "not_applicable" o "pending_extraction" cuando corresponda. */
  measurement: z.string().min(1),
  modelId: ModelId.nullable(),
  evidence: z.array(Evidence),
  uncertainty: z.strictObject({
    measurement: z.string().min(1),
    samplingGeneralization: z.string().min(1),
    competingExplanations: z.string().min(1),
  }),
  status: ContentStatus,
  reviews: z.array(Review).default([]),
  provenance: Provenance,
  display: z.strictObject({ label: DisplayLabel, note: z.string().optional() }),
});
export type Claim = z.infer<typeof Claim>;
