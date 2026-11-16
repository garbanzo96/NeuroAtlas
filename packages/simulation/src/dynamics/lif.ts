/** Integración y disparo de Lapicque (1907), Journal de Physiologie et de Pathologie Générale. ms, mV y corriente en unidades compatibles con R; neurona puntual sin canales explícitos. */
export interface LIFParams {
  tauM: number;
  R: number;
  vRest: number;
  vThresh: number;
  vReset: number;
  tRef: number;
}
export function lifRateAnalytic(I: number, p: LIFParams) {
  const steady = p.vRest + p.R * I;
  if (steady <= p.vThresh) return 0;
  return 1000 / (p.tRef + p.tauM * Math.log((steady - p.vReset) / (steady - p.vThresh)));
}
export function simulateLIF({
  current,
  tMax,
  dt,
  ...p
}: LIFParams & { current: number | ((t: number) => number); tMax: number; dt: number }) {
  const count = Math.floor(tMax / dt) + 1,
    t = new Float64Array(count),
    v = new Float64Array(count),
    spikes: number[] = [];
  let voltage = p.vRest,
    until = -Infinity;
  for (let i = 0; i < count; i++) {
    const time = i * dt;
    t[i] = time;
    v[i] = voltage;
    if (i === count - 1) break;
    if (time < until) {
      voltage = p.vReset;
      continue;
    }
    const input = typeof current === 'function' ? current(time) : current;
    voltage += (p.vRest - voltage + p.R * input) * (1 - Math.exp(-dt / p.tauM));
    if (voltage >= p.vThresh) {
      spikes.push(time + dt);
      voltage = p.vReset;
      until = time + dt + p.tRef;
    }
  }
  return { t, v, spikes };
}
