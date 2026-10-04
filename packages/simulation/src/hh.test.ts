import { describe, expect, it } from 'vitest';
import { createInProcessAdapter } from './adapters';
import { makeHHTestSpec, stepInput } from './fixtures/hh-spec';
import {
  HH_REFERENCE_TOLERANCES as TOL,
  compareWithReference,
  referenceCaseNames,
} from './hh-reference';
import { vtrap } from './models/hh-classic';
import { checkSpecCompatibility } from './models/registry';
import { AbortError, detectSpikes, integrate, simulate, validateInput } from './runner';

const spec = makeHHTestSpec();

describe('HH clásico: comparación con NEURON (referencia independiente)', () => {
  for (const name of referenceCaseNames()) {
    it(`caso ${name}`, () => {
      const c = compareWithReference(spec, name);
      expect(c.restDifference).toBeLessThan(TOL.rest);
      expect(c.spikeCount.model).toBe(c.spikeCount.reference);
      expect(c.maxSpikeTimeDifference).toBeLessThan(TOL.spikeTime);
      expect(c.peakDifference).toBeLessThan(TOL.peak);
      expect(c.rmsVoltageDifference).toBeLessThan(TOL.rms);
    });
  }
});

describe('HH clásico: propiedades numéricas', () => {
  it('converge con orden alto al reducir dt (RK4)', () => {
    const run = (dt: number) => {
      const r = simulate(spec, {
        ...stepInput(10, 10, 40, 40, dt),
        sampleEvery: Math.round(0.1 / dt),
      });
      return { v: r.variables.v!.values, spikes: detectSpikes(r.time, r.variables.v!.values) };
    };
    const coarse = run(0.02);
    const mid = run(0.01);
    const fine = run(0.005);
    const maxDiff = (a: number[], b: number[]) =>
      a.reduce((m, x, i) => Math.max(m, Math.abs(x - b[i]!)), 0);
    const e1 = maxDiff(coarse.v, fine.v);
    const e2 = maxDiff(mid.v, fine.v);
    expect(e2).toBeLessThan(e1);
    // RK4: halving dt debería reducir el error ~16×; exigimos al menos 8× con margen.
    expect(e1 / e2).toBeGreaterThan(8);
    expect(mid.spikes.length).toBe(fine.spikes.length);
    mid.spikes.forEach((t, i) => expect(Math.abs(t - fine.spikes[i]!)).toBeLessThan(0.005));
  });

  it('Euler con paso pequeño concuerda con RK4 (comprobación cruzada de solvers)', () => {
    const rk = simulate(spec, stepInput(20, 5, 1, 20, 0.01, 'rk4'));
    const eu = simulate(spec, stepInput(20, 5, 1, 20, 0.001, 'euler'));
    const sRk = detectSpikes(rk.time, rk.variables.v!.values);
    const sEu = detectSpikes(eu.time, eu.variables.v!.values);
    expect(sEu.length).toBe(sRk.length);
    expect(Math.abs(sEu[0]! - sRk[0]!)).toBeLessThan(0.05);
  });

  it('mantiene las compuertas en [0, 1]', () => {
    const r = simulate(spec, stepInput(100, 5, 50, 60));
    for (const id of ['m', 'h', 'n']) {
      const values = r.variables[id]!.values;
      expect(Math.min(...values)).toBeGreaterThanOrEqual(0);
      expect(Math.max(...values)).toBeLessThanOrEqual(1);
    }
  });

  it('emite chunks con unidades y marca el último', () => {
    const chunks = [...integrate(spec, stepInput(10, 5, 20, 30), { runId: 'r', chunkSize: 500 })];
    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks.at(-1)!.done).toBe(true);
    expect(chunks.slice(0, -1).every((c) => !c.done)).toBe(true);
    expect(chunks[0]!.variables.v!.units).toBe('mV');
    expect(chunks[0]!.variables.i_na!.units).toBe('uA/cm^2');
    const total = chunks.reduce((n, c) => n + c.time.values.length, 0);
    expect(total).toBe(3001);
  });

  it('el límite de vtrap es continuo en la singularidad', () => {
    expect(vtrap(0, 10)).toBe(10);
    expect(Math.abs(vtrap(1e-4, 10) - vtrap(-1e-4, 10))).toBeLessThan(1e-3);
  });
});

describe('validación de entradas y fichas', () => {
  it('rechaza dt por encima del máximo estable, parámetros no ajustables y amplitudes fuera de rango', () => {
    const bad = {
      ...stepInput(500, 5, 10, 20, 0.2),
      parameterOverrides: { e_na: 60, g_na: 1000 },
    };
    const result = validateInput(spec, bad);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.join('\n')).toMatch(/dt/);
      expect(result.errors.join('\n')).toMatch(/e_na no es ajustable/);
      expect(result.errors.join('\n')).toMatch(/g_na fuera de rango/);
      expect(result.errors.join('\n')).toMatch(/Amplitud/);
    }
  });

  it('detecta fichas con unidades distintas a la implementación', () => {
    const wrong = makeHHTestSpec();
    wrong.parameters.find((p) => p.id === 'g_na')!.units = 'S/cm^2';
    expect(checkSpecCompatibility(wrong).join('\n')).toMatch(/g_na/);
    expect(checkSpecCompatibility(makeHHTestSpec())).toEqual([]);
  });
});

describe('adaptador en proceso', () => {
  it('se cancela con AbortSignal', async () => {
    const adapter = createInProcessAdapter(spec);
    const controller = new AbortController();
    const seen: number[] = [];
    await expect(
      (async () => {
        for await (const chunk of adapter.run(
          { ...stepInput(10, 5, 500, 1000), sampleEvery: 1 },
          controller.signal,
        )) {
          seen.push(chunk.index);
          controller.abort();
        }
      })(),
    ).rejects.toBeInstanceOf(AbortError);
    expect(seen).toEqual([0]);
  });
});
