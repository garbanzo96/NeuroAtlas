import type { ContextDifference, KnowledgeBase } from '@neuroatlas/knowledge';
import { clampStepIndex, stepAt, stepView } from '@neuroatlas/lessons';
import type { ContextChange, SceneTransition, SelectionState } from '@neuroatlas/schemas';

/**
 * Lógica pura de navegación (sin React ni DOM) para poder probarla en Node.
 */

/** Aviso que la interfaz muestra al cambiar de escena entre contextos distintos. */
export interface ContextNotice {
  fromSceneId: string;
  toSceneId: string;
  /** Afirmación puente (tipo didactic_bridge), si el salto corresponde a una transición declarada. */
  bridgeClaimId: string | null;
  correspondence: SceneTransition['correspondence'] | 'none';
  contextChanges: ContextChange[];
  differences: ContextDifference[];
}

export type EntryMode = 'transition' | 'jump' | 'lesson' | 'initial';

export function defaultVisibleLayerIds(kb: KnowledgeBase, sceneId: string): string[] {
  return (
    kb
      .scene(sceneId)
      ?.layers.filter((l) => l.defaultVisible)
      .map((l) => l.id) ?? []
  );
}

export function defaultLayerOpacity(kb: KnowledgeBase, sceneId: string): Record<string, number> {
  return Object.fromEntries(kb.scene(sceneId)?.layers.map((l) => [l.id, l.defaultOpacity]) ?? []);
}

export function initialSelection(kb: KnowledgeBase, sceneId: string): SelectionState {
  const scene = kb.scene(sceneId);
  if (!scene) throw new Error(`Escena desconocida: ${sceneId}`);
  return {
    sceneId,
    contextId: scene.contextId,
    selectedEntityIds: [],
    visibleLayerIds: defaultVisibleLayerIds(kb, sceneId),
    filters: {},
  };
}

/** Escena inicial: la primera escena de la primera lección, o la primera escena del paquete. */
export function defaultSceneId(kb: KnowledgeBase): string {
  const lesson = kb.pack.lessons[0];
  return lesson?.steps[0]?.sceneId ?? kb.pack.scenes[0]!.sceneId;
}

/**
 * Calcula el aviso de contexto al pasar de `fromSceneId` a `toSceneId`.
 * Devuelve null si no hay cambio de contexto ni transición declarada.
 */
export function contextNotice(
  kb: KnowledgeBase,
  fromSceneId: string,
  toSceneId: string,
): ContextNotice | null {
  if (fromSceneId === toSceneId) return null;
  const from = kb.scene(fromSceneId);
  const to = kb.scene(toSceneId);
  if (!from || !to) return null;
  const transition = from.transitions.find((t) => t.targetSceneId === toSceneId);
  const differences = kb.contextDifferences(from.contextId, to.contextId);
  if (!transition && differences.length === 0) return null;
  return {
    fromSceneId,
    toSceneId,
    bridgeClaimId: transition?.bridgeClaimId ?? null,
    correspondence: transition?.correspondence ?? 'none',
    contextChanges: transition?.contextChanges ?? [],
    differences,
  };
}

export interface SceneEntry {
  selection: SelectionState;
  layerOpacity: Record<string, number>;
  notice: ContextNotice | null;
}

/** Entrar en una escena: capas por defecto, selección vacía y aviso de contexto si procede. */
export function enterScene(
  kb: KnowledgeBase,
  fromSceneId: string | null,
  toSceneId: string,
  mode: EntryMode,
): SceneEntry {
  const selection = initialSelection(kb, toSceneId);
  const notice =
    fromSceneId && mode !== 'initial' ? contextNotice(kb, fromSceneId, toSceneId) : null;
  return { selection, layerOpacity: defaultLayerOpacity(kb, toSceneId), notice };
}

/** Aplica un paso de lección: escena, selección de foco y capas visibles. */
export function applyLessonStep(
  kb: KnowledgeBase,
  lessonId: string,
  index: number,
  currentSceneId: string | null,
): (SceneEntry & { stepIndex: number }) | null {
  const lesson = kb.lesson(lessonId);
  if (!lesson) return null;
  const stepIndex = clampStepIndex(lesson, index);
  const step = stepAt(lesson, stepIndex);
  const scene = kb.scene(step.sceneId);
  if (!scene) return null;
  const view = stepView(step, scene);
  const entry = enterScene(kb, currentSceneId, step.sceneId, 'lesson');
  return {
    ...entry,
    stepIndex,
    selection: {
      ...entry.selection,
      selectedEntityIds: view.selectedEntityIds,
      visibleLayerIds: view.visibleLayerIds,
    },
  };
}

/**
 * Selección desde la búsqueda: si la entidad no está en la escena actual, se va a la primera
 * escena que la contiene (con aviso de contexto); si no aparece en ninguna, solo se abre su ficha.
 */
export function selectFromSearch(
  kb: KnowledgeBase,
  currentSceneId: string,
  entityId: string,
): SceneEntry | { selection: null; selectedEntityIds: string[] } {
  const inCurrent = kb.sceneEntities(currentSceneId).some((e) => e.id === entityId);
  if (inCurrent) return { selection: null, selectedEntityIds: [entityId] };
  const target = kb.scenesContainingEntity(entityId)[0];
  if (!target) return { selection: null, selectedEntityIds: [entityId] };
  const entry = enterScene(kb, currentSceneId, target.sceneId, 'jump');
  return { ...entry, selection: { ...entry.selection, selectedEntityIds: [entityId] } };
}
