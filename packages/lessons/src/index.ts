import type { Lesson, LessonStep, SceneManifest } from '@neuroatlas/schemas';

export interface LessonProgress {
  index: number;
  total: number;
  isFirst: boolean;
  isLast: boolean;
}

/** Índice válido más cercano dentro de la lección. */
export function clampStepIndex(lesson: Lesson, index: number): number {
  if (!Number.isFinite(index)) return 0;
  return Math.min(Math.max(Math.trunc(index), 0), lesson.steps.length - 1);
}

export function stepAt(lesson: Lesson, index: number): LessonStep {
  return lesson.steps[clampStepIndex(lesson, index)]!;
}

export function progress(lesson: Lesson, index: number): LessonProgress {
  const i = clampStepIndex(lesson, index);
  return {
    index: i,
    total: lesson.steps.length,
    isFirst: i === 0,
    isLast: i === lesson.steps.length - 1,
  };
}

export function nextStepIndex(lesson: Lesson, index: number): number {
  return clampStepIndex(lesson, index + 1);
}

export function previousStepIndex(lesson: Lesson, index: number): number {
  return clampStepIndex(lesson, index - 1);
}

/** Capas visibles por defecto de una escena. */
export function defaultVisibleLayers(scene: SceneManifest): string[] {
  return scene.layers.filter((l) => l.defaultVisible).map((l) => l.id);
}

/**
 * Lo que un paso de lección pide a la vista: escena, selección y capas.
 * El motor no conoce la interfaz; la aplicación decide cómo aplicarlo.
 */
export interface StepView {
  sceneId: string;
  selectedEntityIds: string[];
  visibleLayerIds: string[];
}

export function stepView(step: LessonStep, scene: SceneManifest): StepView {
  if (scene.sceneId !== step.sceneId) {
    throw new Error(`El paso ${step.id} pertenece a ${step.sceneId}, no a ${scene.sceneId}.`);
  }
  return {
    sceneId: step.sceneId,
    selectedEntityIds: [...step.focusEntityIds],
    visibleLayerIds: step.visibleLayerIds ? [...step.visibleLayerIds] : defaultVisibleLayers(scene),
  };
}

/** Pasos donde la lección cambia de escena (y por tanto quizá de contexto). */
export function sceneChanges(
  lesson: Lesson,
): Array<{ fromIndex: number; fromSceneId: string; toSceneId: string }> {
  const out: Array<{ fromIndex: number; fromSceneId: string; toSceneId: string }> = [];
  lesson.steps.forEach((step, i) => {
    const next = lesson.steps[i + 1];
    if (next && next.sceneId !== step.sceneId)
      out.push({ fromIndex: i, fromSceneId: step.sceneId, toSceneId: next.sceneId });
  });
  return out;
}
