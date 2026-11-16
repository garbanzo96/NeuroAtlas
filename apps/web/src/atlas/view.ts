import { LEVELS, type LevelId } from './levels';
import { type CameraCommand, LAYERS, type LayerId, useAtlas } from './store';
import { activatePathway } from './ui/PathwayPanel';
import { goToLevel } from './ui/ScaleRail';

/** Estado serializable del atlas: lo usan enlaces, recorridos, curso y evaluación. */
export interface AtlasView {
  level?: LevelId;
  select?: string | null;
  overlay?: string | null;
  overlaySolo?: string | null;
  layers?: Partial<Record<LayerId, boolean>>;
  peel?: number;
  pathway?: string | null;
  pathwayStep?: number;
  circuit?: string | null;
  scenario?: string | null;
  lesions?: string[];
  variant?: string | null;
  lab?: string | null;
  camera?: CameraCommand;
}

// Claves cortas en español. `s`, `r`, `lesson` y `unidad` son de la unidad curada (main.tsx): no se usan.
const K = {
  level: 'n',
  select: 'e',
  overlay: 'capa',
  overlaySolo: 'solo',
  pathway: 'via',
  pathwayStep: 'paso',
  circuit: 'circ',
  scenario: 'esc',
  variant: 'var',
  lab: 'lab',
  peel: 'pel',
  layers: 'cv',
  lesions: 'les',
  camera: 'cam',
} as const;

const STRINGS = [
  'select',
  'overlay',
  'overlaySolo',
  'pathway',
  'circuit',
  'scenario',
  'variant',
  'lab',
] as const;
const round = (x: number) => Math.round(x * 100) / 100;

export function viewToQuery(v: AtlasView): string {
  const q = new URLSearchParams();
  if (v.level) q.set(K.level, v.level);
  for (const k of STRINGS) if (v[k]) q.set(K[k], v[k]);
  if (v.pathwayStep) q.set(K.pathwayStep, String(v.pathwayStep));
  if (v.peel) q.set(K.peel, String(v.peel));
  if (v.layers && Object.keys(v.layers).length)
    q.set(
      K.layers,
      Object.entries(v.layers)
        .map(([id, on]) => (on ? id : `-${id}`))
        .join(','),
    );
  if (v.lesions?.length) q.set(K.lesions, v.lesions.join(','));
  if (v.camera?.type === 'pose')
    q.set(K.camera, [...v.camera.pos, ...v.camera.target].map(round).join(','));
  return q.toString();
}

/** Lee una vista desde `location.search`; descarta en silencio lo que no reconoce. */
export function queryToView(query: string): AtlasView {
  const q = new URLSearchParams(query);
  const v: AtlasView = {};
  const level = q.get(K.level);
  if (level && LEVELS.some((l) => l.id === level)) v.level = level as LevelId;
  for (const k of STRINGS) {
    const x = q.get(K[k]);
    if (x) v[k] = x;
  }
  const int = (key: string) => {
    const n = Number(q.get(key));
    return Number.isInteger(n) && n > 0 ? n : undefined;
  };
  const step = int(K.pathwayStep);
  if (step) v.pathwayStep = step;
  const peel = int(K.peel);
  if (peel) v.peel = peel;
  const layers = q.get(K.layers);
  if (layers) {
    const ids = new Set<string>(LAYERS.map((l) => l.id));
    v.layers = {};
    for (const raw of layers.split(',')) {
      const id = raw.replace(/^-/, '');
      if (ids.has(id)) v.layers[id as LayerId] = !raw.startsWith('-');
    }
  }
  const lesions = q.get(K.lesions);
  if (lesions) v.lesions = lesions.split(',').filter(Boolean);
  const cam = q.get(K.camera)?.split(',').map(Number);
  if (cam?.length === 6 && cam.every(Number.isFinite))
    v.camera = {
      type: 'pose',
      pos: cam.slice(0, 3) as [number, number, number],
      target: cam.slice(3) as [number, number, number],
    };
  return v;
}

/** Lleva el atlas a una vista usando solo las acciones existentes del store. */
export function applyView(v: AtlasView): void {
  const s = useAtlas.getState();
  if (v.level) goToLevel(v.level);
  if (v.layers)
    for (const [id, on] of Object.entries(v.layers))
      if (useAtlas.getState().layers[id as LayerId] !== on) s.toggleLayer(id as LayerId);
  if (v.peel !== undefined) s.setPeel(v.peel);
  if (v.overlay !== undefined) s.setOverlay(v.overlay);
  if (v.overlaySolo !== undefined) s.setOverlaySolo(v.overlaySolo);
  if (v.pathway !== undefined) {
    activatePathway(v.pathway);
    if (v.pathwayStep) s.setPathwayStep(v.pathwayStep);
  }
  if (v.select !== undefined) {
    s.select(v.select);
    if (v.select && !v.camera && !v.pathway) s.command({ type: 'mesh', name: v.select });
  }
  if (v.circuit !== undefined) s.setCircuit(v.circuit);
  if (v.scenario) s.runCircuit(v.scenario, v.lesions);
  if (v.variant !== undefined) s.setVariant(v.variant);
  if (v.camera) s.command(v.camera);
  if (v.lab) window.dispatchEvent(new CustomEvent('na:lab', { detail: v.lab }));
}
