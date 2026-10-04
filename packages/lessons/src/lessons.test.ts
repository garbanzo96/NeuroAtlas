import { Lesson, SceneManifest } from '@neuroatlas/schemas';
import { describe, expect, it } from 'vitest';
import {
  clampStepIndex,
  nextStepIndex,
  previousStepIndex,
  progress,
  sceneChanges,
  stepAt,
  stepView,
} from './index';

const lesson = Lesson.parse({
  schemaVersion: '1',
  lessonId: 'lesson.test',
  title: { es: 'Prueba' },
  audience: 'test',
  durationMinutes: 10,
  objectives: [{ es: 'Objetivo' }],
  status: 'draft',
  steps: [
    {
      id: 'a',
      sceneId: 'scene.one',
      title: { es: 'A' },
      narrative: { es: 'A' },
      focusEntityIds: ['ent.x'],
    },
    {
      id: 'b',
      sceneId: 'scene.one',
      title: { es: 'B' },
      narrative: { es: 'B' },
      visibleLayerIds: ['l2'],
    },
    { id: 'c', sceneId: 'scene.two', title: { es: 'C' }, narrative: { es: 'C' } },
  ],
});

const sceneOne = SceneManifest.parse({
  schemaVersion: '1',
  sceneId: 'scene.one',
  title: { es: 'Uno' },
  summary: { es: 'Uno' },
  contextId: 'ctx.test',
  semanticScale: 'pathway',
  coordinateFrame: { kind: 'schematic', id: 'f', units: 'arbitrary', axes: 'x' },
  layers: [
    {
      id: 'l1',
      label: { es: 'L1' },
      kind: 'schematic',
      representationId: 'rep.a',
      defaultVisible: true,
    },
    {
      id: 'l2',
      label: { es: 'L2' },
      kind: 'schematic',
      representationId: 'rep.a',
      defaultVisible: false,
    },
  ],
});

describe('motor de lecciones', () => {
  it('acota índices y calcula progreso', () => {
    expect(clampStepIndex(lesson, -3)).toBe(0);
    expect(clampStepIndex(lesson, 99)).toBe(2);
    expect(clampStepIndex(lesson, Number.NaN)).toBe(0);
    expect(nextStepIndex(lesson, 2)).toBe(2);
    expect(previousStepIndex(lesson, 0)).toBe(0);
    expect(progress(lesson, 1)).toEqual({ index: 1, total: 3, isFirst: false, isLast: false });
    expect(stepAt(lesson, 5).id).toBe('c');
  });

  it('traduce un paso a escena, selección y capas', () => {
    expect(stepView(lesson.steps[0]!, sceneOne)).toEqual({
      sceneId: 'scene.one',
      selectedEntityIds: ['ent.x'],
      visibleLayerIds: ['l1'],
    });
    expect(stepView(lesson.steps[1]!, sceneOne).visibleLayerIds).toEqual(['l2']);
    expect(() => stepView(lesson.steps[2]!, sceneOne)).toThrow();
  });

  it('identifica cambios de escena para anunciar cambios de contexto', () => {
    expect(sceneChanges(lesson)).toEqual([
      { fromIndex: 1, fromSceneId: 'scene.one', toSceneId: 'scene.two' },
    ]);
  });
});
