export type Progress = Record<string, { box: number; due: number }>;
export const STORAGE_KEY = 'na:quiz:v1';

export function shuffle<T>(items: readonly T[], seed: number): T[] {
  const result = [...items];
  let state = seed >>> 0;
  for (let i = result.length - 1; i > 0; i--) {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    const j = Math.floor((state / 4294967296) * (i + 1));
    [result[i], result[j]] = [result[j]!, result[i]!];
  }
  return result;
}
export const correct = (answer: string, expected: string) => answer === expected;
export function schedule(progress: Progress, id: string, passed: boolean, turn: number): Progress {
  const box = passed ? Math.min(3, (progress[id]?.box ?? 0) + 1) : 0;
  return { ...progress, [id]: { box, due: turn + [1, 3, 6, 12][box]! } };
}
export function orderByDue(ids: string[], progress: Progress): string[] {
  return [...ids].sort((a, b) => (progress[a]?.due ?? 0) - (progress[b]?.due ?? 0));
}
export function loadProgress(): Progress {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
    if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
    return Object.fromEntries(
      Object.entries(value).filter(
        ([, v]) => v && typeof v === 'object' && Number.isFinite(v.box) && Number.isFinite(v.due),
      ),
    ) as Progress;
  } catch {
    return {};
  }
}
export function saveProgress(progress: Progress): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    /* almacenamiento opcional */
  }
}
