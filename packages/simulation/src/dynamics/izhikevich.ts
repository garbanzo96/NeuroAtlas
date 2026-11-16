/** Izhikevich (2003), IEEE Transactions on Neural Networks. Tiempo en ms y voltaje en mV; modelo fenomenológico, no reconstrucción celular. */
export interface IzhParams {
  a: number;
  b: number;
  c: number;
  d: number;
}
export const IZH_PRESETS = {
  RS: {
    a: 0.02,
    b: 0.2,
    c: -65,
    d: 8,
    name: 'Disparo regular',
    description: 'Piramidal de disparo regular.',
  },
  IB: {
    a: 0.02,
    b: 0.2,
    c: -55,
    d: 4,
    name: 'Ráfagas intrínsecas',
    description: 'Neurona con ráfagas intrínsecas.',
  },
  CH: {
    a: 0.02,
    b: 0.2,
    c: -50,
    d: 2,
    name: 'Disparo en ráfagas',
    description: 'Neurona con ráfagas sostenidas.',
  },
  FS: {
    a: 0.1,
    b: 0.2,
    c: -65,
    d: 2,
    name: 'Disparo rápido',
    description: 'Interneurona de disparo rápido.',
  },
  LTS: {
    a: 0.02,
    b: 0.25,
    c: -65,
    d: 2,
    name: 'Umbral bajo',
    description: 'Interneurona de umbral bajo.',
  },
  TC: {
    a: 0.02,
    b: 0.25,
    c: -65,
    d: 0.05,
    name: 'Tálamo cortical',
    description: 'Neurona de relevo talamocortical.',
  },
  RZ: {
    a: 0.1,
    b: 0.26,
    c: -65,
    d: 2,
    name: 'Resonadora',
    description: 'Neurona con comportamiento resonador.',
  },
} satisfies Record<string, IzhParams & { name: string; description: string }>;
export function simulateIzhikevich({
  params,
  current,
  tMax,
  dt = 0.1,
}: {
  params: IzhParams;
  current: number | ((t: number) => number);
  tMax: number;
  dt?: number;
}) {
  const count = Math.floor(tMax / dt) + 1,
    t = new Float64Array(count),
    v = new Float64Array(count),
    u = new Float64Array(count),
    spikes: number[] = [];
  let voltage = -65,
    recovery = params.b * voltage,
    peaked = false;
  for (let i = 0; i < count; i++) {
    const time = i * dt;
    t[i] = time;
    v[i] = peaked ? 30 : voltage;
    u[i] = recovery;
    peaked = false;
    if (i === count - 1) break;
    const input = typeof current === 'function' ? current(time) : current;
    const next = voltage + dt * (0.04 * voltage * voltage + 5 * voltage + 140 - recovery + input);
    recovery += dt * params.a * (params.b * voltage - recovery);
    voltage = next;
    if (voltage >= 30) {
      spikes.push((i + 1) * dt);
      voltage = params.c;
      recovery += params.d;
      peaked = true;
    }
  }
  return { t, v, u, spikes };
}
