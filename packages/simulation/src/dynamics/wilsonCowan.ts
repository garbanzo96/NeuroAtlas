/** Wilson y Cowan (1972), Biophysical Journal. Tiempo arbitrario y actividad adimensional; poblaciones medias, no neuronas individuales. */
export interface WCParams {
  c1: number;
  c2: number;
  c3: number;
  c4: number;
  aE: number;
  thetaE: number;
  aI: number;
  thetaI: number;
  rE: number;
  rI: number;
  tauE: number;
  tauI: number;
  P: number;
  Q: number;
}
export const WC_OSCILLATORY: WCParams = {
  c1: 16,
  c2: 12,
  c3: 15,
  c4: 3,
  aE: 1.3,
  thetaE: 4,
  aI: 2,
  thetaI: 3.7,
  rE: 1,
  rI: 1,
  tauE: 1,
  tauI: 1,
  P: 1.25,
  Q: 0,
};
export function simulateWilsonCowan(
  p: WCParams,
  { tMax, dt, E0, I0 }: { tMax: number; dt: number; E0: number; I0: number },
) {
  const count = Math.floor(tMax / dt) + 1,
    t = new Float64Array(count),
    E = new Float64Array(count),
    I = new Float64Array(count);
  let e = E0,
    i = I0;
  const sig = (x: number, a: number, theta: number) =>
    1 / (1 + Math.exp(-a * (x - theta))) - 1 / (1 + Math.exp(a * theta));
  const f = (x: number, y: number): [number, number] => [
    (-x + (1 - p.rE * x) * sig(p.c1 * x - p.c2 * y + p.P, p.aE, p.thetaE)) / p.tauE,
    (-y + (1 - p.rI * y) * sig(p.c3 * x - p.c4 * y + p.Q, p.aI, p.thetaI)) / p.tauI,
  ];
  for (let j = 0; j < count; j++) {
    t[j] = j * dt;
    E[j] = e;
    I[j] = i;
    if (j === count - 1) break;
    const a = f(e, i),
      b = f(e + (dt * a[0]) / 2, i + (dt * a[1]) / 2),
      c = f(e + (dt * b[0]) / 2, i + (dt * b[1]) / 2),
      d = f(e + dt * c[0], i + dt * c[1]);
    e += (dt * (a[0] + 2 * b[0] + 2 * c[0] + d[0])) / 6;
    i += (dt * (a[1] + 2 * b[1] + 2 * c[1] + d[1])) / 6;
  }
  return { t, E, I };
}
