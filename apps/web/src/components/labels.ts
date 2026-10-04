import type {
  AssetNature,
  ClaimKind,
  ConnectionModality,
  ContentStatus,
  ContextChange,
  DisplayLabel,
  EntityType,
  RelationType,
  SemanticScale,
} from '@neuroatlas/schemas';
import type { ContextDifference } from '@neuroatlas/knowledge';

/** Rótulos en español de los vocabularios controlados (la interfaz nunca muestra códigos crudos). */

export const DISPLAY_LABEL: Record<DisplayLabel, string> = {
  observation: 'Observación',
  inference: 'Inferencia',
  model: 'Modelo',
  educational_schematic: 'Esquema educativo',
};

export const CLAIM_KIND: Record<ClaimKind, string> = {
  observation: 'observación',
  association: 'asociación',
  causal_intervention: 'intervención causal',
  inference: 'inferencia',
  model_prediction: 'afirmación de modelo',
  didactic_bridge: 'puente didáctico',
};

export const STATUS: Record<ContentStatus, string> = {
  draft: 'Borrador',
  reviewed: 'Revisada',
  published: 'Publicada',
  questioned: 'Cuestionada',
  retired: 'Retirada',
};

export const SOURCE_VERIFICATION: Record<string, string> = {
  candidate: 'Fuente candidata (no comprobada)',
  metadata_verified: 'Metadatos verificados (contenido no leído)',
  content_inspected: 'Contenido inspeccionado',
};

export const EVIDENCE_RELATION: Record<string, string> = {
  supports: 'sustenta',
  contradicts: 'contradice',
  contextualizes: 'contextualiza',
};

export const RELATION_OUT: Record<RelationType, string> = {
  part_of: 'es parte de',
  located_in: 'se ubica en',
  classified_as: 'se clasifica como',
  connects_to: 'conecta con',
  projects_to: 'proyecta a',
  modulates: 'modula',
  participates_in: 'participa en',
  measured_by: 'se mide con',
  implemented_by_model: 'se modela con',
  corresponds_to: 'corresponde a',
  derived_from: 'deriva de',
};

export const RELATION_IN: Record<RelationType, string> = {
  part_of: 'contiene',
  located_in: 'contiene',
  classified_as: 'clasifica',
  connects_to: 'conecta con',
  projects_to: 'recibe proyección de',
  modulates: 'es modulado por',
  participates_in: 'involucra',
  measured_by: 'mide',
  implemented_by_model: 'modela',
  corresponds_to: 'corresponde a',
  derived_from: 'origina',
};

export const MODALITY: Record<ConnectionModality, string> = {
  synaptic_reconstruction: 'sinapsis reconstruidas',
  axonal_tracing: 'trazado axonal',
  tractography: 'tractografía',
  functional_connectivity: 'conectividad funcional',
  effective_connectivity: 'conectividad efectiva estimada',
  physiology: 'fisiología',
  pending_extraction: 'modalidad pendiente de extracción',
};

export const CONTEXT_CHANGE: Record<ContextChange, string> = {
  species: 'Especie',
  dataset: 'Dataset',
  atlas: 'Atlas',
  modality: 'Modalidad',
  abstraction: 'Nivel de abstracción',
};

export const DIFFERENCE_ASPECT: Record<ContextDifference['aspect'], string> = {
  species: 'Especie',
  kind: 'Tipo de contexto',
  atlas: 'Atlas',
  modality: 'Modalidad',
  preparation: 'Preparación',
  developmentalStage: 'Etapa de desarrollo',
};

export const CONTEXT_KIND: Record<string, string> = {
  anatomical_reference: 'Anatomía de referencia',
  schematic: 'Esquema didáctico',
  experimental_preparation: 'Preparación experimental',
  computational_model: 'Modelo computacional',
};

export const SCALE: Record<SemanticScale, string> = {
  organism: 'Organismo',
  system: 'Sistema',
  pathway: 'Vía',
  region: 'Región',
  circuit: 'Circuito',
  cell: 'Célula',
  subcellular: 'Subcelular',
  molecular: 'Molecular',
};

export const SCALE_ORDER: SemanticScale[] = [
  'organism',
  'system',
  'pathway',
  'region',
  'circuit',
  'cell',
  'subcellular',
  'molecular',
];

export const ENTITY_TYPE: Record<EntityType, string> = {
  organism: 'organismo',
  system: 'sistema',
  region: 'región',
  structure: 'estructura',
  nucleus: 'núcleo',
  tract: 'haz / tracto',
  layer: 'capa',
  population: 'población',
  cell_type: 'tipo celular',
  cell: 'célula',
  compartment: 'compartimento',
  synapse: 'sinapsis',
  ion_channel: 'canal iónico',
  ion_current: 'corriente iónica',
  pathway: 'vía',
  network: 'red',
  process: 'proceso',
  task: 'tarea',
  capacity: 'capacidad',
  variable: 'variable',
};

export const ASSET_NATURE: Record<AssetNature, string> = {
  schematic: 'Esquema didáctico',
  reconstruction: 'Reconstrucción',
  atlas_derived: 'Derivado de atlas',
  interpolated: 'Interpolación',
  illustration: 'Ilustración',
};

export const SIGN: Record<string, string> = {
  excitatory: 'excitador',
  inhibitory: 'inhibidor',
  modulatory: 'modulador',
  mixed: 'mixto',
  unknown: 'signo no establecido',
};
