import { expect, it } from 'vitest';
import { sameStructure, structureQuestions } from './generators';
import type { AtlasData } from '../data';
it('genera cuatro nombres del mismo grupo y acepta el lado opuesto', () => {
  const structures = Object.fromEntries(
    ['a', 'b', 'c', 'd', 'e'].map((id) => [id, { n: id, g: id === 'e' ? 'otro' : 'grupo' }]),
  );
  const data = {
    structures,
    meshes: { brain: Object.fromEntries(Object.keys(structures).map((id) => [id + '_L', {}])) },
  } as unknown as AtlasData;
  const questions = structureQuestions(data, 7);
  expect(questions).toHaveLength(4);
  expect(new Set(questions[0]!.options)).toEqual(new Set(['a', 'b', 'c', 'd']));
  expect(sameStructure('a_L', 'a_R')).toBe(true);
  expect(sameStructure('a_L', 'b_L')).toBe(false);
});
