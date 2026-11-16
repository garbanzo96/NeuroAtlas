/** Hodgkin y Huxley (1952), Journal of Physiology: cable cilíndrico no mielinizado. Tiempo ms, voltaje mV, diámetro y longitud µm, Ra Ω·cm; modelo uniforme idealizado de axón gigante de calamar, sin mielina ni ramificaciones. A 6.3 °C se espera orden de magnitud 10–30 m/s para diámetro ~500 µm; depende de geometría y condiciones. */
import { rates } from '../models/hh-classic';
export function simulateAxon({
  n = 60,
  tMax,
  stimAmp = 100,
  stimDur = 1,
  diameter = 500,
  Ra = 35.4,
  compartmentLength = 1000,
  temperature = 6.3,
  dt = 0.01,
}: {
  n?: number;
  tMax: number;
  stimAmp?: number;
  stimDur?: number;
  diameter?: number;
  Ra?: number;
  compartmentLength?: number;
  temperature?: number;
  dt?: number;
}) {
  const stride = Math.round(0.05 / dt);
  if (stride < 1 || Math.abs(stride * dt - 0.05) > 1e-9)
    throw new Error('dt debe dividir 0,05 ms.');
  const steps = Math.floor(tMax / dt),
    samples = Math.floor(steps / stride) + 1,
    vSnapshots = new Float32Array(n * samples),
    v = new Float64Array(n).fill(-65),
    next = new Float64Array(n),
    m = new Float64Array(n),
    h = new Float64Array(n),
    gateN = new Float64Array(n),
    spikeTimeByCompartment = new Array<number>(n).fill(NaN),
    phi = 3 ** ((temperature - 6.3) / 10),
    r0 = rates(-65, phi);
  m.fill(r0.am / (r0.am + r0.bm));
  h.fill(r0.ah / (r0.ah + r0.bh));
  gateN.fill(r0.an / (r0.an + r0.bn));
  const coupling = ((diameter * 1e-4) / (4 * Ra * (compartmentLength * 1e-4) ** 2)) * 1000;
  for (let step = 0; step <= steps; step++) {
    if (step % stride === 0) {
      const offset = (step / stride) * n;
      for (let j = 0; j < n; j++) vSnapshots[offset + j] = v[j]!;
    }
    if (step === steps) break;
    for (let j = 0; j < n; j++) {
      const x = v[j]!,
        mm = m[j]!,
        hh = h[j]!,
        nn = gateN[j]!,
        left = v[j === 0 ? j : j - 1]!,
        right = v[j === n - 1 ? j : j + 1]!,
        current =
          (j === 0 && step * dt < stimDur ? stimAmp : 0) -
          120 * mm ** 3 * hh * (x - 50) -
          36 * nn ** 4 * (x + 77) -
          0.3 * (x + 54.4) +
          coupling * (left + right - 2 * x);
      next[j] = x + dt * current;
      const r = rates(x, phi);
      m[j] = r.am / (r.am + r.bm) + (mm - r.am / (r.am + r.bm)) * Math.exp(-(r.am + r.bm) * dt);
      h[j] = r.ah / (r.ah + r.bh) + (hh - r.ah / (r.ah + r.bh)) * Math.exp(-(r.ah + r.bh) * dt);
      gateN[j] = r.an / (r.an + r.bn) + (nn - r.an / (r.an + r.bn)) * Math.exp(-(r.an + r.bn) * dt);
      if (x < 0 && next[j]! >= 0 && Number.isNaN(spikeTimeByCompartment[j]))
        spikeTimeByCompartment[j] = (step + 1) * dt;
    }
    v.set(next);
  }
  const first = Math.floor(n / 4),
    last = Math.floor((3 * n) / 4),
    elapsed = spikeTimeByCompartment[last]! - spikeTimeByCompartment[first]!,
    conductionVelocity = elapsed > 0 ? ((last - first) * compartmentLength * 0.001) / elapsed : NaN;
  return { dt, n, vSnapshots, spikeTimeByCompartment, conductionVelocity };
}
