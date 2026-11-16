import type { LevelId } from '../levels';

/** Variantes que ofrece cada escena micro (la escena lee `useAtlas().variant`; null = la primera). */
export const MICRO_VARIANTS: Partial<Record<LevelId, { id: string; label: string }[]>> = {};
