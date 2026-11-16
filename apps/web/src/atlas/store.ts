import { create } from 'zustand';
import type { AtlasData } from './data';
import type { LevelId } from './levels';

export type LayerId =
  | 'piel'
  | 'esqueleto'
  | 'visceras'
  | 'arterias'
  | 'nervios'
  | 'medula'
  | 'corteza'
  | 'blanca'
  | 'nucleos'
  | 'tronco'
  | 'cerebelo'
  | 'ventriculos';

export const LAYERS: { id: LayerId; name: string }[] = [
  { id: 'piel', name: 'Piel' },
  { id: 'esqueleto', name: 'Esqueleto' },
  { id: 'visceras', name: 'Vísceras' },
  { id: 'arterias', name: 'Arterias' },
  { id: 'nervios', name: 'Nervios' },
  { id: 'medula', name: 'Médula' },
  { id: 'corteza', name: 'Corteza' },
  { id: 'blanca', name: 'Sustancia blanca' },
  { id: 'nucleos', name: 'Núcleos profundos' },
  { id: 'tronco', name: 'Tronco encefálico' },
  { id: 'cerebelo', name: 'Cerebelo' },
  { id: 'ventriculos', name: 'Ventrículos' },
];

/** Capa a la que pertenece un grupo anatómico (`g` de la ficha o del metadato de malla). */
export function layerOfGroup(g: string): LayerId {
  if (g.startsWith('ctx')) return 'corteza';
  if (g === 'sb' || g === 'bp_encefalo') return 'blanca';
  if (g === 'mes' || g === 'pon' || g === 'bul') return 'tronco';
  if (g === 'cb') return 'cerebelo';
  if (g === 'ven') return 'ventriculos';
  if (g.startsWith('medula')) return 'medula';
  if (['raices', 'plexos', 'nc', 'sna'].includes(g)) return 'nervios';
  if (['craneo', 'columna', 'esqueleto'].includes(g)) return 'esqueleto';
  if (g === 'piel') return 'piel';
  if (g === 'arterias') return 'arterias';
  if (g === 'visceras' || g === 'ojo') return 'visceras';
  return 'nucleos';
}

export interface Hover {
  /** Nombre de malla (nivel áreas) o grupo (nivel encéfalo). */
  key: string;
  title: string;
  subtitle: string;
  anchor: [number, number, number];
}

/** Ficha de una parte de una escena micro (la registra la propia escena). */
export interface PartInfo {
  title: string;
  kicker?: string;
  body: string;
  items?: string[];
  /** id de simulador del laboratorio relacionado */
  model?: string;
}

export type CameraCommand =
  | { type: 'level'; level: LevelId }
  | { type: 'mesh'; name: string }
  | { type: 'box'; min: [number, number, number]; max: [number, number, number] }
  | { type: 'home' };

interface AtlasState {
  data: AtlasData | null;
  level: LevelId;
  hover: Hover | null;
  selected: string | null;
  pathway: string | null;
  pathwayStep: number;
  layers: Record<LayerId, boolean>;
  /** 0 = todo visible; cada paso retira una capa externa (piel → esqueleto → corteza → sustancia blanca). */
  peel: number;
  camera: { command: CameraCommand; nonce: number } | null;
  sheet: 'structure' | 'level' | null;
  /** Partes con ficha de la escena micro activa. */
  parts: Record<string, PartInfo>;
  /** Variante elegida en la escena micro activa (p. ej. tipo de neurona). */
  variant: string | null;
  setParts(parts: Record<string, PartInfo>): void;
  setVariant(variant: string | null): void;
  setData(data: AtlasData): void;
  setLevel(level: LevelId): void;
  setHover(hover: Hover | null): void;
  select(name: string | null): void;
  setPathway(id: string | null): void;
  setPathwayStep(i: number): void;
  toggleLayer(id: LayerId): void;
  setPeel(peel: number): void;
  command(command: CameraCommand): void;
  setSheet(sheet: AtlasState['sheet']): void;
}

const allLayers = Object.fromEntries(LAYERS.map((l) => [l.id, true])) as Record<LayerId, boolean>;

export const useAtlas = create<AtlasState>((set) => ({
  data: null,
  level: 'encefalo',
  hover: null,
  selected: null,
  pathway: null,
  pathwayStep: 0,
  layers: { ...allLayers, visceras: false, arterias: false },
  peel: 0,
  camera: null,
  sheet: null,
  parts: {},
  variant: null,
  setParts: (parts) => set({ parts }),
  setVariant: (variant) => set({ variant }),
  setData: (data) => set({ data }),
  setLevel: (level) =>
    set((s) =>
      s.level === level
        ? s
        : {
            level,
            hover: null,
            variant: null,
            ...(s.selected && !s.parts[s.selected] ? {} : { selected: null }),
          },
    ),
  setHover: (hover) => set({ hover }),
  select: (selected) => set({ selected, sheet: selected ? 'structure' : null }),
  setPathway: (pathway) => set({ pathway, pathwayStep: 0 }),
  setPathwayStep: (pathwayStep) => set({ pathwayStep }),
  toggleLayer: (id) => set((s) => ({ layers: { ...s.layers, [id]: !s.layers[id] } })),
  setPeel: (peel) => set({ peel }),
  command: (command) => set((s) => ({ camera: { command, nonce: (s.camera?.nonce ?? 0) + 1 } })),
  setSheet: (sheet) => set({ sheet }),
}));

/** Capas retiradas por el control de pelado, de fuera hacia dentro. */
export const PEEL_ORDER: LayerId[][] = [
  ['piel'],
  ['esqueleto', 'visceras'],
  ['corteza'],
  ['blanca', 'cerebelo'],
];

export function isLayerShown(layers: Record<LayerId, boolean>, peel: number, id: LayerId) {
  if (!layers[id]) return false;
  for (let i = 0; i < Math.min(peel, PEEL_ORDER.length); i++)
    if (PEEL_ORDER[i]!.includes(id)) return false;
  return true;
}
