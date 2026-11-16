import { describe, expect, it } from 'vitest';
import {
  IZH_PRESETS,
  simulateIzhikevich,
  simulateLIF,
  lifRateAnalytic,
  simulateWilsonCowan,
  WC_OSCILLATORY,
  TM_PRESETS,
  tmResponses,
  nernst,
  ghk,
  TYPICAL_MAMMALIAN_CONC,
  pumpPhase,
  simulateNetwork,
  simulateKuramoto,
  stdpWindow,
  simulateAxon,
} from './index';
describe('modelos dinámicos', () => {
  it('reproduce adaptación, disparo rápido y ráfagas', () => {
    const run = (params: typeof IZH_PRESETS.RS) =>
      simulateIzhikevich({ params, current: 10, tMax: 1000 });
    const rs = run(IZH_PRESETS.RS).spikes,
      fs = run(IZH_PRESETS.FS).spikes,
      ch = run(IZH_PRESETS.CH).spikes;
    const intervals = ch.slice(1).map((x, i) => x - ch[i]!);
    expect(rs.length).toBeGreaterThan(3);
    expect(rs[2]! - rs[1]!).toBeGreaterThan(rs[1]! - rs[0]!);
    expect(fs.length).toBeGreaterThan(rs.length);
    expect(Math.max(...intervals)).toBeGreaterThan(3 * Math.min(...intervals));
  });
  it('reproduce la frecuencia LIF y la reobase', () => {
    const p = { tauM: 20, R: 10, vRest: -65, vThresh: -50, vReset: -65, tRef: 2 },
      I = 2;
    const r = simulateLIF({ ...p, current: I, tMax: 10000, dt: 0.05 });
    expect(Math.abs(r.spikes.length / 10 / lifRateAnalytic(I, p) - 1)).toBeLessThan(0.05);
    expect(simulateLIF({ ...p, current: 1, tMax: 1000, dt: 0.1 }).spikes).toHaveLength(0);
  });
  it('oscila en el régimen Wilson-Cowan', () => {
    const { E } = simulateWilsonCowan(WC_OSCILLATORY, { tMax: 200, dt: 0.02, E0: 0.1, I0: 0.1 });
    const peaks: number[] = [];
    for (let i = (E.length / 2) | 0; i < E.length - 1; i++)
      if (E[i]! > E[i - 1]! && E[i]! > E[i + 1]!) peaks.push(E[i]!);
    expect(peaks.length).toBeGreaterThanOrEqual(3);
    expect(Math.max(...E.slice(E.length / 2)) - Math.min(...E.slice(E.length / 2))).toBeGreaterThan(
      0.05,
    );
  });
  it('deprime y facilita respuestas sinápticas', () => {
    const d = tmResponses([0, 20, 40, 60, 80], TM_PRESETS.depressing),
      f = tmResponses([0, 20], TM_PRESETS.facilitating);
    expect(d[4]!).toBeLessThan(d[0]!);
    expect(f[1]!).toBeGreaterThan(f[0]!);
  });
  it('calcula potenciales iónicos', () => {
    const c = TYPICAL_MAMMALIAN_CONC;
    expect(nernst(1, c.K.out, c.K.in)).toBeGreaterThan(-100);
    expect(nernst(1, c.K.out, c.K.in)).toBeLessThan(-90);
    expect(nernst(1, c.Na.out, c.Na.in)).toBeGreaterThan(55);
    expect(nernst(1, c.Na.out, c.Na.in)).toBeLessThan(70);
    expect(ghk({ pK: 1, pNa: 0.05, pCl: 0.45 }, c)).toBeGreaterThan(-75);
    expect(ghk({ pK: 1, pNa: 0.05, pCl: 0.45 }, c)).toBeLessThan(-60);
  });
  it('recorre la bomba y cuenta ciclos', () => {
    for (let j = 0; j < 6; j++) expect(pumpPhase((j + 0.5) / 6, 1).stateIndex).toBe(j);
    expect(pumpPhase(2.5, 1)).toEqual({ stateIndex: 3, progress: 0, cycles: 2 });
  });
  it('reproduce la red y ambas poblaciones', () => {
    const p = { ne: 160, ni: 40, tMax: 1000, seed: 12 },
      start = performance.now(),
      a = simulateNetwork(p),
      elapsed = performance.now() - start,
      b = simulateNetwork(p);
    expect(a.spikeIds).toEqual(b.spikeIds);
    expect(a.spikeTimes).toEqual(b.spikeTimes);
    expect(a.spikeIds.some((x) => x < 160)).toBe(true);
    expect(a.spikeIds.some((x) => x >= 160)).toBe(true);
    expect(elapsed).toBeLessThan(1000);
  });
  it('sincroniza osciladores acoplados', () => {
    const p = { n: 100, tMax: 50, dt: 0.05, seed: 4, omegaSd: 1 };
    const strong = simulateKuramoto({ ...p, K: 4 }),
      weak = simulateKuramoto({ ...p, K: 0.2 });
    expect(strong.r.at(-1)!).toBeGreaterThan(weak.r.at(-1)!);
  });
  it('aplica la ventana STDP', () => {
    expect(stdpWindow(5)).toBeGreaterThan(0);
    expect(stdpWindow(-5)).toBeLessThan(0);
    expect(stdpWindow(50)).toBeLessThan(stdpWindow(5));
    expect(Math.abs(stdpWindow(-50))).toBeLessThan(Math.abs(stdpWindow(-5)));
  });
  it('propaga por un axón gigante idealizado', () => {
    const a = simulateAxon({ tMax: 15 });
    expect(a.spikeTimeByCompartment[45]!).toBeGreaterThan(a.spikeTimeByCompartment[15]!);
    expect(a.conductionVelocity).toBeGreaterThan(10);
    expect(a.conductionVelocity).toBeLessThan(30);
  });
});
