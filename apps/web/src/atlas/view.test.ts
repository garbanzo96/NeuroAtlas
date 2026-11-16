import { describe, expect, it } from 'vitest';
import { type AtlasView, queryToView, viewToQuery } from './view';

describe('vista serializable', () => {
  it('ida y vuelta conserva la vista', () => {
    const v: AtlasView = {
      level: 'areas',
      select: 'putamen_L',
      overlay: 'sistemas',
      overlaySolo: 'motor',
      layers: { arterias: true, piel: false },
      peel: 2,
      pathway: 'corticoespinal',
      pathwayStep: 3,
      circuit: 'gb-motor',
      scenario: 'indirecta',
      lesions: ['stn', 'gpe'],
      variant: 'piramidal',
      lab: 'hh',
      camera: { type: 'pose', pos: [1.25, -2, 30], target: [0, 0.5, 0] },
    };
    expect(queryToView(viewToQuery(v))).toEqual(v);
  });

  it('ignora parámetros desconocidos o inválidos', () => {
    expect(queryToView('n=galaxia&cv=alas,-piel&cam=1,2&zzz=1&paso=-4')).toEqual({
      layers: { piel: false },
    });
  });

  it('no usa las claves de la unidad curada', () => {
    const q = new URLSearchParams(viewToQuery({ level: 'sinapsis', select: 'x', lab: 'lif' }));
    for (const k of ['s', 'r', 'lesson', 'unidad']) expect(q.has(k)).toBe(false);
  });
});
