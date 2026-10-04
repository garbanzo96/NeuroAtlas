/** Utilidades puras de escalas y muestreo para gráficos (sin DOM). */

export function linearScale(domain: readonly [number, number], range: readonly [number, number]) {
  const [d0, d1] = domain;
  const [r0, r1] = range;
  const span = d1 - d0 || 1;
  return (value: number) => r0 + ((value - d0) / span) * (r1 - r0);
}

/** Marcas "redondas" (1, 2, 5 × 10^k) que cubren el dominio. */
export function niceTicks(min: number, max: number, count = 5): number[] {
  if (!Number.isFinite(min) || !Number.isFinite(max)) return [];
  if (min === max) return [min];
  const span = max - min;
  const raw = span / Math.max(count, 1);
  const magnitude = Math.pow(10, Math.floor(Math.log10(raw)));
  const step =
    [1, 2, 5, 10].map((m) => m * magnitude).find((s) => span / s <= count) ?? 10 * magnitude;
  const start = Math.ceil(min / step) * step;
  const ticks: number[] = [];
  for (let v = start; v <= max + step * 1e-9; v += step) ticks.push(Number(v.toFixed(10)));
  return ticks;
}

export function extent(values: readonly number[]): [number, number] {
  let lo = Infinity;
  let hi = -Infinity;
  for (const v of values) {
    if (v < lo) lo = v;
    if (v > hi) hi = v;
  }
  return lo <= hi ? [lo, hi] : [0, 1];
}

/**
 * Reduce una serie a ≤ 2·buckets puntos conservando mínimo y máximo de cada tramo,
 * para que los picos (p. ej. potenciales de acción) no desaparezcan al dibujar.
 */
export function minMaxDecimate(
  x: readonly number[],
  y: readonly number[],
  buckets: number,
): { x: number[]; y: number[] } {
  const n = Math.min(x.length, y.length);
  if (n <= buckets * 2) return { x: x.slice(0, n), y: y.slice(0, n) };
  const outX: number[] = [];
  const outY: number[] = [];
  const size = n / buckets;
  for (let b = 0; b < buckets; b++) {
    const start = Math.floor(b * size);
    const end = Math.min(n, Math.floor((b + 1) * size));
    let iMin = start;
    let iMax = start;
    for (let i = start; i < end; i++) {
      if (y[i]! < y[iMin]!) iMin = i;
      if (y[i]! > y[iMax]!) iMax = i;
    }
    const [first, second] = iMin < iMax ? [iMin, iMax] : [iMax, iMin];
    outX.push(x[first]!);
    outY.push(y[first]!);
    if (second !== first) {
      outX.push(x[second]!);
      outY.push(y[second]!);
    }
  }
  return { x: outX, y: outY };
}

/** Índice de la muestra más cercana a t en un vector de tiempos creciente. */
export function nearestIndex(time: readonly number[], t: number): number {
  if (time.length === 0) return -1;
  let lo = 0;
  let hi = time.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (time[mid]! < t) lo = mid;
    else hi = mid;
  }
  return Math.abs(time[lo]! - t) <= Math.abs(time[hi]! - t) ? lo : hi;
}

/**
 * Escala de color divergente perceptualmente ordenada (azul → gris claro → rojo),
 * legible para daltonismo rojo-verde. Devuelve "#rrggbb".
 */
export function divergingColor(value: number, domain: readonly [number, number]): string {
  const [d0, d1] = domain;
  const t = Math.min(1, Math.max(0, (value - d0) / (d1 - d0 || 1)));
  const stops: Array<[number, [number, number, number]]> = [
    [0, [33, 102, 172]],
    [0.25, [103, 169, 207]],
    [0.5, [230, 230, 230]],
    [0.75, [239, 138, 98]],
    [1, [178, 24, 43]],
  ];
  let i = 0;
  while (i < stops.length - 2 && t > stops[i + 1]![0]) i++;
  const [t0, c0] = stops[i]!;
  const [t1, c1] = stops[i + 1]!;
  const f = (t - t0) / (t1 - t0 || 1);
  const hex = c0.map((c, k) =>
    Math.round(c + (c1[k]! - c) * f)
      .toString(16)
      .padStart(2, '0'),
  );
  return `#${hex.join('')}`;
}
