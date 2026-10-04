import { describe, expect, it } from 'vitest';
import { divergingColor, minMaxDecimate, nearestIndex, niceTicks } from './scales';

describe('escalas 2D', () => {
  it('genera marcas redondas que cubren el dominio', () => {
    expect(niceTicks(0, 100, 5)).toEqual([0, 20, 40, 60, 80, 100]);
    expect(niceTicks(-80, 50, 4)).toEqual([-50, 0, 50]);
    expect(niceTicks(3, 3)).toEqual([3]);
  });

  it('la decimación conserva el pico de una serie', () => {
    const x = Array.from({ length: 10_000 }, (_, i) => i);
    const y = x.map((i) => (i === 5_123 ? 40 : -65));
    const d = minMaxDecimate(x, y, 100);
    expect(d.x.length).toBeLessThanOrEqual(200);
    expect(Math.max(...d.y)).toBe(40);
  });

  it('encuentra la muestra más cercana', () => {
    expect(nearestIndex([0, 1, 2, 3], 2.4)).toBe(2);
    expect(nearestIndex([0, 1, 2, 3], 2.6)).toBe(3);
    expect(nearestIndex([], 1)).toBe(-1);
  });

  it('la escala divergente va de azul a rojo pasando por gris', () => {
    expect(divergingColor(-80, [-80, 50])).toBe('#2166ac');
    expect(divergingColor(50, [-80, 50])).toBe('#b2182b');
    expect(divergingColor(-15, [-80, 50])).toBe('#e6e6e6');
    expect(divergingColor(999, [-80, 50])).toBe('#b2182b');
  });
});
