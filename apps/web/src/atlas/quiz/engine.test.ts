import { describe, expect, it } from 'vitest';
import { correct, orderByDue, schedule, shuffle } from './engine';
describe('motor de evaluación', () => {
  it('baraja de manera reproducible sin alterar el original', () => {
    const source = [1, 2, 3, 4, 5];
    expect(shuffle(source, 42)).toEqual(shuffle(source, 42));
    expect(shuffle(source, 42)).not.toEqual(shuffle(source, 43));
    expect(source).toEqual([1, 2, 3, 4, 5]);
  });
  it('corrige y adelanta los errores en la agenda', () => {
    expect(correct('a', 'a')).toBe(true);
    expect(correct('b', 'a')).toBe(false);
    let p = schedule({}, 'a', true, 0);
    p = schedule(p, 'a', true, 1);
    p = schedule(p, 'b', false, 1);
    expect(orderByDue(['a', 'b'], p)).toEqual(['b', 'a']);
    expect(schedule(p, 'a', false, 2).a).toEqual({ box: 0, due: 3 });
  });
});
