import { KnowledgeBase } from '@neuroatlas/knowledge';
import { makeFixturePack } from '@neuroatlas/knowledge/testing';
import { describe, expect, it } from 'vitest';
import { applyLessonStep, contextNotice, enterScene, selectFromSearch } from './logic';
import { decodeUrlState, encodeUrlState } from './url';

const kb = new KnowledgeBase(makeFixturePack());

describe('navegación entre escenas', () => {
  it('una transición declarada produce aviso con puente y cambios de contexto', () => {
    const notice = contextNotice(kb, 'scene.a', 'scene.b');
    expect(notice).toMatchObject({
      bridgeClaimId: 'claim.bridge_a_b',
      correspondence: 'conceptual',
      contextChanges: ['species'],
    });
    expect(notice!.differences.map((d) => d.aspect)).toContain('species');
  });

  it('un salto sin transición declarada avisa igualmente si cambia el contexto', () => {
    const notice = contextNotice(kb, 'scene.b', 'scene.a');
    expect(notice?.bridgeClaimId).toBeNull();
    expect(notice?.correspondence).toBe('none');
    expect(notice?.differences.length).toBeGreaterThan(0);
  });

  it('entrar en una escena restablece capas por defecto y limpia la selección', () => {
    const entry = enterScene(kb, 'scene.a', 'scene.b', 'jump');
    expect(entry.selection).toMatchObject({
      sceneId: 'scene.b',
      selectedEntityIds: [],
      visibleLayerIds: ['structures'],
    });
    expect(enterScene(kb, null, 'scene.a', 'initial').notice).toBeNull();
  });

  it('la búsqueda lleva a la escena que contiene la entidad', () => {
    const result = selectFromSearch(kb, 'scene.a', 'ent.b1');
    expect(result.selection).toMatchObject({ sceneId: 'scene.b', selectedEntityIds: ['ent.b1'] });
    const local = selectFromSearch(kb, 'scene.a', 'ent.a2');
    expect(local).toEqual({ selection: null, selectedEntityIds: ['ent.a2'] });
  });

  it('un paso de lección aplica escena, foco y capas', () => {
    const step = applyLessonStep(kb, 'lesson.a', 0, null)!;
    expect(step.selection).toMatchObject({
      sceneId: 'scene.a',
      selectedEntityIds: ['ent.a1'],
      visibleLayerIds: ['structures'],
    });
    const next = applyLessonStep(kb, 'lesson.a', 1, 'scene.a')!;
    expect(next.notice?.toSceneId).toBe('scene.b');
  });
});

describe('estado en la URL', () => {
  it('ida y vuelta conserva escena, selección, capas, lección y protocolo', () => {
    const selection = {
      ...enterScene(kb, null, 'scene.a', 'initial').selection,
      selectedEntityIds: ['ent.a2'],
    };
    const query = encodeUrlState({
      release: kb.release.id,
      selection,
      lesson: { lessonId: 'lesson.a', stepIndex: 1 },
      simulation: { amplitude: 20, start: 5, duration: 1, total: 30, dt: 0.01 },
    });
    const decoded = decodeUrlState(kb, `?${query}`);
    expect(decoded.warnings).toEqual([]);
    expect(decoded.selection).toMatchObject({
      sceneId: 'scene.a',
      selectedEntityIds: ['ent.a2'],
      visibleLayerIds: ['structures'],
    });
    expect(decoded.lesson).toEqual({ lessonId: 'lesson.a', stepIndex: 1 });
    expect(decoded.simulation).toEqual({
      amplitude: 20,
      start: 5,
      duration: 1,
      total: 30,
      dt: 0.01,
    });
  });

  it('avisa si el release del enlace no coincide y descarta IDs desconocidos', () => {
    const decoded = decodeUrlState(
      kb,
      '?r=2020.01.0&s=scene.a&e=ent.a1,ent.nope&l=structures,nope',
    );
    expect(decoded.warnings.join(' ')).toMatch(/2020\.01\.0/);
    expect(decoded.selection?.selectedEntityIds).toEqual(['ent.a1']);
    expect(decoded.selection?.visibleLayerIds).toEqual(['structures']);
    expect(decodeUrlState(kb, '?s=scene.nope').selection).toBeNull();
    expect(decodeUrlState(kb, '?sim=amp:x').simulation).toBeNull();
  });
});
