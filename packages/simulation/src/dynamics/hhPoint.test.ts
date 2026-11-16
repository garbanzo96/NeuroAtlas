import { describe, expect, it } from 'vitest';
import { simulateHHPoint } from './hhPoint';

describe('HH puntual', () => {
  it('dispara con 10 µA/cm² y no con 1 µA/cm²', () => {
    expect(Math.max(...simulateHHPoint(10, 40).v)).toBeGreaterThan(0);
    expect(Math.max(...simulateHHPoint(1, 40).v)).toBeLessThan(0);
  });
});
