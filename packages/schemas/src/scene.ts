import { z } from 'zod';
import {
  ClaimId,
  ContentStatus,
  ContextId,
  EntityId,
  LessonId,
  LocalId,
  LocalizedText,
  ModelId,
  RepresentationId,
  SceneId,
  SemanticScale,
  SpatialMappingId,
  Vec3,
} from './common';

export const CoordinateFrame = z.discriminatedUnion('kind', [
  z.strictObject({
    kind: z.literal('physical'),
    id: z.string().min(1),
    units: z.enum(['m', 'mm', 'um', 'nm']),
    axes: z.string().min(1),
  }),
  z.strictObject({
    kind: z.literal('schematic'),
    id: z.string().min(1),
    units: z.literal('arbitrary'),
    axes: z.string().min(1),
  }),
]);
export type CoordinateFrame = z.infer<typeof CoordinateFrame>;

export const ContextChange = z.enum(['species', 'dataset', 'atlas', 'modality', 'abstraction']);
export type ContextChange = z.infer<typeof ContextChange>;

export const SceneLayer = z.strictObject({
  id: LocalId,
  label: LocalizedText,
  kind: z.enum(['mesh', 'volume', 'morphology', 'graph', 'schematic', 'labels']),
  representationId: RepresentationId,
  /** Entidades seleccionables en esta capa. */
  entityIds: z.array(EntityId).default([]),
  /** Afirmaciones que justifican lo que muestra la capa. */
  evidenceClaimIds: z.array(ClaimId).default([]),
  lodRefs: z.array(z.string()).default([]),
  defaultVisible: z.boolean(),
  defaultOpacity: z.number().min(0).max(1).default(1),
});
export type SceneLayer = z.infer<typeof SceneLayer>;

/**
 * Transición entre escenas. `registered` exige un mapeo espacial documentado;
 * todo lo demás es un puente conceptual que la interfaz explica antes y después.
 */
export const SceneTransition = z.strictObject({
  targetSceneId: SceneId,
  label: LocalizedText,
  bridgeClaimId: ClaimId,
  correspondence: z.enum(['registered', 'conceptual']),
  contextChanges: z.array(ContextChange),
  spatialMappingId: SpatialMappingId.optional(),
});
export type SceneTransition = z.infer<typeof SceneTransition>;

/** Mapeo explícito variable de simulación → representación visual (con leyenda). */
export const VisualMapping = z.strictObject({
  variable: z.string().min(1),
  units: z.string().min(1),
  encoding: z.enum(['color']),
  domain: z.tuple([z.number(), z.number()]),
  /** Nodos de la geometría esquemática que reciben la codificación. */
  targetNodeIds: z.array(LocalId).min(1),
  legend: LocalizedText,
});
export type VisualMapping = z.infer<typeof VisualMapping>;

/** Significado de cada color usado en la escena (texto además de color). */
export const LegendEntry = z.strictObject({
  colorGroup: LocalId,
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  label: LocalizedText,
});
export type LegendEntry = z.infer<typeof LegendEntry>;

export const SceneManifest = z.strictObject({
  schemaVersion: z.literal('1'),
  sceneId: SceneId,
  title: LocalizedText,
  summary: LocalizedText,
  contextId: ContextId,
  semanticScale: SemanticScale,
  coordinateFrame: CoordinateFrame,
  camera: z.strictObject({ position: Vec3, target: Vec3 }).optional(),
  layers: z.array(SceneLayer).min(1),
  transitions: z.array(SceneTransition).default([]),
  legend: z.array(LegendEntry).default([]),
  /** Entidades destacadas al entrar en la escena. */
  entryEntityIds: z.array(EntityId).default([]),
  simulation: z
    .strictObject({
      modelId: ModelId,
      visualMappings: z.array(VisualMapping).default([]),
    })
    .optional(),
});
export type SceneManifest = z.infer<typeof SceneManifest>;

// ---------------------------------------------------------------------------
// Lección (recorrido guiado)
// ---------------------------------------------------------------------------

export const LessonStep = z.strictObject({
  id: LocalId,
  sceneId: SceneId,
  title: LocalizedText,
  /**
   * Texto didáctico (preguntas, instrucciones). Las afirmaciones científicas
   * van en `claimIds`, no en la narrativa.
   */
  narrative: LocalizedText,
  claimIds: z.array(ClaimId).default([]),
  focusEntityIds: z.array(EntityId).default([]),
  visibleLayerIds: z.array(LocalId).optional(),
  task: z
    .strictObject({
      kind: z.enum(['observe', 'locate', 'manipulate', 'explain']),
      prompt: LocalizedText,
      successCriteria: LocalizedText.optional(),
    })
    .optional(),
});
export type LessonStep = z.infer<typeof LessonStep>;

export const Lesson = z.strictObject({
  schemaVersion: z.literal('1'),
  lessonId: LessonId,
  title: LocalizedText,
  audience: z.string().min(1),
  durationMinutes: z.int().positive(),
  objectives: z.array(LocalizedText).min(1),
  status: ContentStatus,
  steps: z.array(LessonStep).min(1),
});
export type Lesson = z.infer<typeof Lesson>;
