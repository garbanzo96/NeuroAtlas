import { z } from 'zod';
import {
  AssetId,
  ContextId,
  DecisionRef,
  EntityId,
  IsoDate,
  LocalId,
  LocalizedText,
  RelationId,
  RepresentationId,
  SourceId,
  Vec3,
  WorkPackageRef,
} from './common';

// ---------------------------------------------------------------------------
// Asset: archivo con derechos y procedencia
// ---------------------------------------------------------------------------

/**
 * Naturaleza de lo que muestra un asset. La interfaz la rotula siempre:
 * un esquema nunca se presenta como reconstrucción.
 */
export const AssetNature = z.enum([
  'schematic',
  'reconstruction',
  'atlas_derived',
  'interpolated',
  'illustration',
]);
export type AssetNature = z.infer<typeof AssetNature>;

export const Asset = z.strictObject({
  id: AssetId,
  title: LocalizedText,
  kind: z.enum(['schematic_geometry', 'mesh', 'volume', 'morphology', 'image', 'timeseries']),
  nature: AssetNature,
  origin: z.enum(['project_original', 'external']),
  /** blocked_*: el asset es necesario pero no puede publicarse todavía. */
  status: z.enum(['available', 'blocked_missing', 'blocked_license']),
  /** Ruta relativa a content/assets/files/. null si el archivo no está en el repositorio. */
  file: z
    .strictObject({
      path: z.string().regex(/^[a-z0-9_\-/.]+$/),
      format: z.enum(['schematic+json', 'glb', 'swc', 'nii', 'png', 'json']),
    })
    .nullable(),
  license: z.strictObject({
    status: z.enum(['verified', 'pending', 'project_original']),
    spdx: z.string().nullable(),
    holder: z.string().nullable(),
    attribution: z.string().nullable(),
    redistribution: z.enum(['allowed', 'link_only', 'internal_only', 'unknown']),
    url: z.url().nullable(),
    verifiedOn: IsoDate.nullable(),
  }),
  sourceIds: z.array(SourceId).default([]),
  units: z.string().min(1),
  coordinateFrameId: z.string().min(1),
  processing: z.array(z.string()).default([]),
  /** Para assets bloqueados: dónde podría obtenerse y qué falta decidir. */
  blocked: z
    .strictObject({
      reason: LocalizedText,
      candidateSourceIds: z.array(SourceId).default([]),
      workPackage: WorkPackageRef,
      decisions: z.array(DecisionRef).default([]),
    })
    .optional(),
});
export type Asset = z.infer<typeof Asset>;

// ---------------------------------------------------------------------------
// Geometría esquemática (contenido de assets kind=schematic_geometry)
// ---------------------------------------------------------------------------

export const SchematicNode = z.strictObject({
  id: LocalId,
  entityId: EntityId,
  /** Rótulo propio del nodo (p. ej. "NGL izquierdo"); si falta se usa el de la entidad. */
  label: LocalizedText.optional(),
  /** Dimensiones totales en x/y/z (diámetros para esfera/cilindro/cono). */
  shape: z.enum(['sphere', 'box', 'capsule', 'cylinder', 'cone']),
  position: Vec3,
  size: Vec3,
  rotation: Vec3.optional(),
  side: z.enum(['left', 'right', 'midline', 'none']).default('none'),
  group: LocalId,
  /** Clave de color; su significado lo declara la leyenda de la escena. */
  colorGroup: LocalId.optional(),
  /** "focus": el rótulo solo aparece al seleccionar o señalar (control de densidad de rótulos). */
  labelMode: z.enum(['always', 'focus']).default('always'),
  /** Desplazamiento del rótulo respecto de la posición del nodo (por defecto, encima). */
  labelOffset: Vec3.optional(),
});
export type SchematicNode = z.infer<typeof SchematicNode>;

export const SchematicLink = z.strictObject({
  id: LocalId,
  /** Si el trazo representa una estructura (p. ej. tracto óptico), su entidad. */
  entityId: EntityId.optional(),
  /** Relación del grafo que este trazo ilustra, si existe. */
  relationId: RelationId.optional(),
  label: LocalizedText.optional(),
  style: z.enum(['projection', 'conceptual']),
  points: z.array(Vec3).min(2),
  radius: z.number().positive().default(0.05),
  /** Dibuja una punta de flecha al final (solo si la relación es dirigida). */
  arrow: z.boolean().default(false),
  side: z.enum(['left', 'right', 'midline', 'none']).default('none'),
  group: LocalId,
  colorGroup: LocalId.optional(),
});
export type SchematicLink = z.infer<typeof SchematicLink>;

export const SchematicGeometry = z.strictObject({
  schemaVersion: z.literal('1'),
  assetId: AssetId,
  frame: z.strictObject({ units: z.literal('arbitrary'), axes: z.string().min(1) }),
  /** Advertencia visible junto al visor. */
  disclaimer: LocalizedText,
  nodes: z.array(SchematicNode),
  links: z.array(SchematicLink).default([]),
});
export type SchematicGeometry = z.infer<typeof SchematicGeometry>;

// ---------------------------------------------------------------------------
// Representation: un asset en un contexto
// ---------------------------------------------------------------------------

export const Representation = z.strictObject({
  id: RepresentationId,
  label: LocalizedText,
  contextId: ContextId,
  assetId: AssetId,
  /** Grupos de la geometría que muestra esta representación (vacío = todos). */
  groups: z.array(LocalId).default([]),
  description: LocalizedText,
});
export type Representation = z.infer<typeof Representation>;
