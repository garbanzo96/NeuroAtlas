/** Kuramoto (1975), International Symposium on Mathematical Problems in Theoretical Physics; Kuramoto (1984), Chemical Oscillations, Waves, and Turbulence. Tiempo arbitrario, fases en radianes; osciladores ideales, no poblaciones anatómicas. */
export function simulateKuramoto({
  n,
  K,
  tMax,
  dt,
  seed = 1,
  omegaSd = 1,
}: {
  n: number;
  K: number;
  tMax: number;
  dt: number;
  seed?: number;
  omegaSd?: number;
}) {
  let s = seed | 0;
  const rand = () => {
    s = (s + 0x6d2b79f5) | 0;
    let x = Math.imul(s ^ (s >>> 15), 1 | s);
    x ^= x + Math.imul(x ^ (x >>> 7), 61 | x);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
  const phases = new Float64Array(n),
    omega = new Float64Array(n),
    count = Math.floor(tMax / dt) + 1,
    t = new Float64Array(count),
    r = new Float64Array(count);
  for (let j = 0; j < n; j++) {
    phases[j] = 2 * Math.PI * rand();
    omega[j] =
      omegaSd *
      Math.sqrt(-2 * Math.log(Math.max(rand(), Number.MIN_VALUE))) *
      Math.cos(2 * Math.PI * rand());
  }
  for (let i = 0; i < count; i++) {
    let x = 0,
      y = 0;
    for (let j = 0; j < n; j++) {
      x += Math.cos(phases[j]!);
      y += Math.sin(phases[j]!);
    }
    x /= n;
    y /= n;
    t[i] = i * dt;
    r[i] = Math.hypot(x, y);
    if (i < count - 1)
      for (let j = 0; j < n; j++) {
        const p = phases[j]!;
        phases[j] = p + dt * (omega[j]! + K * (y * Math.cos(p) - x * Math.sin(p)));
      }
  }
  return { t, r, phases };
}
