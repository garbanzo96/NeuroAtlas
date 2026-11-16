import { rates } from '../models/hh-classic';

/** HH clásico de un compartimento, axón gigante de calamar a 6,3 °C. ms, mV y µA/cm². */
export function simulateHHPoint(amplitude: number, duration: number, tMax = 60, dt = 0.01) {
  const count = Math.floor(tMax / dt) + 1;
  const t = new Float64Array(count),
    v = new Float64Array(count),
    m = new Float64Array(count),
    h = new Float64Array(count),
    n = new Float64Array(count);
  const r = rates(-65, 1);
  let voltage = -65,
    mm = r.am / (r.am + r.bm),
    hh = r.ah / (r.ah + r.bh),
    nn = r.an / (r.an + r.bn);
  for (let i = 0; i < count; i++) {
    t[i] = i * dt;
    v[i] = voltage;
    m[i] = mm;
    h[i] = hh;
    n[i] = nn;
    const rate = rates(voltage, 1);
    const next =
      voltage +
      dt *
        ((i * dt >= 5 && i * dt < 5 + duration ? amplitude : 0) -
          120 * mm ** 3 * hh * (voltage - 50) -
          36 * nn ** 4 * (voltage + 77) -
          0.3 * (voltage + 54.4));
    mm += dt * (rate.am * (1 - mm) - rate.bm * mm);
    hh += dt * (rate.ah * (1 - hh) - rate.bh * hh);
    nn += dt * (rate.an * (1 - nn) - rate.bn * nn);
    voltage = next;
  }
  return { t, v, m, h, n };
}
