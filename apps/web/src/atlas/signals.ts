/**
 * Canal simulación → escena sin React: el simulador publica valores por nombre y las escenas los leen en
 * `useFrame`. No dispara renders.
 */
const values = new Map<string, number>();

export function publish(name: string, value: number): void {
  values.set(name, value);
}

export function read(name: string, fallback = 0): number {
  return values.get(name) ?? fallback;
}

export function clearSignals(prefix = ''): void {
  for (const k of [...values.keys()]) if (k.startsWith(prefix)) values.delete(k);
}
