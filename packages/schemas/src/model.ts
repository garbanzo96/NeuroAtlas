import { z } from 'zod';
import {
  ClaimId,
  ContentStatus,
  ContextId,
  LocalId,
  LocalizedText,
  ModelId,
  Provenance,
  Review,
  SourceId,
} from './common';

// ---------------------------------------------------------------------------
// Especificación de modelo (ficha ejecutable)
// ---------------------------------------------------------------------------

export const ModelParameter = z.strictObject({
  id: LocalId,
  symbol: z.string().min(1),
  value: z.number(),
  units: z.string().min(1),
  description: LocalizedText,
  sourceId: SourceId,
  locator: z.string().min(1),
  locatorVerified: z.boolean(),
  adjustable: z.boolean(),
  range: z.tuple([z.number(), z.number()]).optional(),
});
export type ModelParameter = z.infer<typeof ModelParameter>;

export const ModelSpecification = z.strictObject({
  id: ModelId,
  version: z.int().positive(),
  name: LocalizedText,
  formalism: z.enum(['conductance_based', 'integrate_and_fire', 'rate', 'other']),
  /** Clave de la implementación en @neuroatlas/simulation (registro de modelos). */
  implementation: z.string().regex(/^[a-z0-9_]+$/),
  contextId: ContextId,
  description: LocalizedText,
  /** Convenciones de signo, origen de voltaje y unidades. */
  conventions: LocalizedText,
  equations: z
    .array(
      z.strictObject({
        id: LocalId,
        latex: z.string().min(1),
        description: LocalizedText,
      }),
    )
    .min(1),
  stateVariables: z
    .array(
      z.strictObject({
        id: LocalId,
        symbol: z.string().min(1),
        units: z.string().min(1),
        description: LocalizedText,
        initialValue: z.number(),
      }),
    )
    .min(1),
  parameters: z.array(ModelParameter).min(1),
  inputs: z.array(
    z.strictObject({
      id: LocalId,
      units: z.string().min(1),
      description: LocalizedText,
      range: z.tuple([z.number(), z.number()]),
      default: z.number(),
    }),
  ),
  observables: z
    .array(
      z.strictObject({
        id: LocalId,
        units: z.string().min(1),
        description: LocalizedText,
      }),
    )
    .min(1),
  solver: z.strictObject({
    method: z.enum(['rk4', 'euler']),
    defaultDt: z.number().positive(),
    maxDt: z.number().positive(),
    dtUnits: z.literal('ms'),
    notes: LocalizedText,
  }),
  assumptions: z.array(LocalizedText).min(1),
  validity: LocalizedText,
  limitations: z.array(LocalizedText).min(1),
  sourceIds: z.array(SourceId).min(1),
  claimIds: z.array(ClaimId).default([]),
  status: ContentStatus,
  reviews: z.array(Review).default([]),
  provenance: Provenance,
});
export type ModelSpecification = z.infer<typeof ModelSpecification>;

// ---------------------------------------------------------------------------
// Contrato de simulación
// ---------------------------------------------------------------------------

export const StimulusProtocol = z.discriminatedUnion('kind', [
  z.strictObject({ kind: z.literal('none') }),
  z.strictObject({
    kind: z.literal('current_step'),
    /** Densidad de corriente externa; positiva = despolarizante. */
    amplitude: z.number(),
    amplitudeUnits: z.literal('uA/cm^2'),
    start: z.number().min(0),
    duration: z.number().min(0),
    timeUnits: z.literal('ms'),
  }),
]);
export type StimulusProtocol = z.infer<typeof StimulusProtocol>;

export const SimulationInput = z.strictObject({
  modelId: ModelId,
  modelVersion: z.int().positive(),
  protocol: StimulusProtocol,
  /** Duración total simulada (tiempo del modelo, no de la animación). */
  duration: z.number().positive(),
  dt: z.number().positive(),
  timeUnits: z.literal('ms'),
  /** Guardar una muestra cada N pasos de integración. */
  sampleEvery: z.int().positive(),
  solver: z.enum(['rk4', 'euler']),
  /** "rest": estado estacionario sin estímulo calculado por el modelo. */
  initialConditions: z.union([z.literal('rest'), z.record(z.string(), z.number())]),
  parameterOverrides: z.record(z.string(), z.number()).default({}),
  /** Semilla para modelos estocásticos; null si el modelo es determinista. */
  seed: z.int().nullable(),
});
export type SimulationInput = z.infer<typeof SimulationInput>;

export const SimulationChunk = z.strictObject({
  runId: z.string().min(1),
  index: z.int().min(0),
  time: z.strictObject({ units: z.literal('ms'), values: z.array(z.number()) }),
  variables: z.record(
    z.string(),
    z.strictObject({ units: z.string().min(1), values: z.array(z.number()) }),
  ),
  done: z.boolean(),
});
export type SimulationChunk = z.infer<typeof SimulationChunk>;

export type ValidationResult = { ok: true } | { ok: false; errors: string[] };

/**
 * Adaptador de simulación. No conoce cámaras, materiales ni objetos de Three.js:
 * entrega muestras con unidades; el renderizado las mapea mediante VisualMapping.
 */
export interface SimulationAdapter {
  readonly modelId: string;
  readonly modelVersion: number;
  describe(): Promise<ModelSpecification>;
  validate(input: SimulationInput): ValidationResult;
  run(input: SimulationInput, signal: AbortSignal): AsyncIterable<SimulationChunk>;
}
