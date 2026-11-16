/** Izhikevich (2003), IEEE Transactions on Neural Networks. Tiempo en ms; red puntual con ruido talámico, no conectoma anatómico. */
function randomGenerator(seed: number) {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let x = Math.imul(s ^ (s >>> 15), 1 | s);
    x ^= x + Math.imul(x ^ (x >>> 7), 61 | x);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}
export function simulateNetwork({
  ne = 800,
  ni = 200,
  tMax,
  seed = 1,
}: {
  ne?: number;
  ni?: number;
  tMax: number;
  seed?: number;
}) {
  const n = ne + ni,
    rand = randomGenerator(seed),
    a = new Float64Array(n),
    b = new Float64Array(n),
    c = new Float64Array(n),
    d = new Float64Array(n),
    v = new Float64Array(n),
    u = new Float64Array(n),
    weights = new Float32Array(n * n),
    input = new Float64Array(n),
    times: number[] = [],
    ids: number[] = [];
  for (let j = 0; j < n; j++) {
    const r = rand();
    if (j < ne) {
      a[j] = 0.02;
      b[j] = 0.2;
      c[j] = -65 + 15 * r * r;
      d[j] = 8 - 6 * r * r;
    } else {
      a[j] = 0.02 + 0.08 * r;
      b[j] = 0.25 - 0.05 * r;
      c[j] = -65;
      d[j] = 2;
    }
    v[j] = -65;
    u[j] = b[j]! * v[j]!;
  }
  for (let pre = 0; pre < n; pre++)
    for (let post = 0; post < n; post++) weights[pre * n + post] = (pre < ne ? 0.5 : -1) * rand();
  const normal = () =>
    Math.sqrt(-2 * Math.log(Math.max(rand(), Number.MIN_VALUE))) * Math.cos(2 * Math.PI * rand());
  for (let time = 0; time < tMax; time++) {
    for (let j = 0; j < n; j++) input[j] = (j < ne ? 5 : 2) * normal();
    for (let pre = 0; pre < n; pre++) {
      if (v[pre]! >= 30) {
        times.push(time);
        ids.push(pre);
        v[pre] = c[pre]!;
        u[pre]! += d[pre]!;
        for (let post = 0; post < n; post++) input[post]! += weights[pre * n + post]!;
      }
    }
    for (let j = 0; j < n; j++) {
      let x = v[j]!;
      const y = u[j]!;
      x += 0.5 * (0.04 * x * x + 5 * x + 140 - y + input[j]!);
      x += 0.5 * (0.04 * x * x + 5 * x + 140 - y + input[j]!);
      v[j] = x;
      u[j] = y + a[j]! * (b[j]! * x - y);
    }
  }
  return { spikeTimes: Float32Array.from(times), spikeIds: Int32Array.from(ids), ne, ni };
}
