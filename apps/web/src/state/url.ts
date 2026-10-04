import type { KnowledgeBase } from '@neuroatlas/knowledge';
import { defaultVisibleLayerIds, initialSelection } from './logic';
import type { SelectionState } from '@neuroatlas/schemas';

/**
 * Codificación del estado compartible en la URL:
 *   r=<release>  s=<sceneId>  e=<entidades,…>  l=<capas,…>  lesson=<id>  step=<n>
 *   sim=amp:<µA/cm²>,start:<ms>,dur:<ms>,total:<ms>,dt:<ms>
 * Al decodificar se descartan IDs desconocidos y se avisa si el release no coincide.
 */

export interface SimulationProtocolState {
  amplitude: number;
  start: number;
  duration: number;
  total: number;
  dt: number;
}

export interface UrlState {
  release: string;
  selection: SelectionState;
  lesson: { lessonId: string; stepIndex: number } | null;
  simulation: SimulationProtocolState | null;
}

export interface DecodedUrl {
  selection: SelectionState | null;
  lesson: { lessonId: string; stepIndex: number } | null;
  simulation: SimulationProtocolState | null;
  warnings: string[];
}

const list = (value: string | null) => (value ? value.split(',').filter(Boolean) : []);

export function encodeUrlState(state: UrlState): string {
  const params = new URLSearchParams();
  params.set('r', state.release);
  params.set('s', state.selection.sceneId);
  if (state.selection.selectedEntityIds.length)
    params.set('e', state.selection.selectedEntityIds.join(','));
  params.set('l', state.selection.visibleLayerIds.join(','));
  if (state.lesson) {
    params.set('lesson', state.lesson.lessonId);
    params.set('step', String(state.lesson.stepIndex));
  }
  if (state.simulation) {
    const s = state.simulation;
    params.set(
      'sim',
      `amp:${s.amplitude},start:${s.start},dur:${s.duration},total:${s.total},dt:${s.dt}`,
    );
  }
  return params.toString();
}

function decodeSimulation(raw: string | null): SimulationProtocolState | null {
  if (!raw) return null;
  const fields = Object.fromEntries(
    raw.split(',').map((pair) => {
      const [k, v] = pair.split(':');
      return [k, Number(v)];
    }),
  );
  const values = [fields.amp, fields.start, fields.dur, fields.total, fields.dt];
  if (values.some((v) => v === undefined || !Number.isFinite(v))) return null;
  return {
    amplitude: fields.amp!,
    start: fields.start!,
    duration: fields.dur!,
    total: fields.total!,
    dt: fields.dt!,
  };
}

export function decodeUrlState(kb: KnowledgeBase, search: string): DecodedUrl {
  const params = new URLSearchParams(search);
  const warnings: string[] = [];
  const release = params.get('r');
  if (release && release !== kb.release.id) {
    warnings.push(
      `Este enlace se creó con el release ${release}; estás viendo ${kb.release.id}. El contenido puede haber cambiado.`,
    );
  }
  const sceneId = params.get('s');
  let selection: SelectionState | null = null;
  if (sceneId) {
    if (!kb.scene(sceneId)) {
      warnings.push(`La escena "${sceneId}" no existe en este release.`);
    } else {
      selection = initialSelection(kb, sceneId);
      const entities = list(params.get('e'));
      const validEntities = entities.filter((id) => kb.entity(id));
      if (validEntities.length !== entities.length)
        warnings.push('Se ignoraron entidades desconocidas del enlace.');
      const layerIds = new Set(kb.scene(sceneId)!.layers.map((l) => l.id));
      const layers = params.has('l')
        ? list(params.get('l')).filter((id) => layerIds.has(id))
        : defaultVisibleLayerIds(kb, sceneId);
      selection = { ...selection, selectedEntityIds: validEntities, visibleLayerIds: layers };
    }
  }
  let lesson: DecodedUrl['lesson'] = null;
  const lessonId = params.get('lesson');
  if (lessonId) {
    if (kb.lesson(lessonId))
      lesson = { lessonId, stepIndex: Math.max(0, Number(params.get('step')) || 0) };
    else warnings.push(`La lección "${lessonId}" no existe en este release.`);
  }
  return { selection, lesson, simulation: decodeSimulation(params.get('sim')), warnings };
}
