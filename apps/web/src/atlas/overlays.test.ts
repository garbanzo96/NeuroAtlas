import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type { AtlasData } from './data';
import { builtinOverlays, overlayStyle } from './overlays';

const json = (name: string) =>
  JSON.parse(
    readFileSync(new URL(`../../public/atlas/${name}.json`, import.meta.url), 'utf8'),
  ) as unknown;
const data = {
  structures: json('structures'),
  taxonomy: json('taxonomy'),
  meshes: json('meshes'),
  pathways: json('pathways'),
} as AtlasData;

describe('capas de lectura', () => {
  const overlays = builtinOverlays(data);
  it('asigna una clase a cada estructura cortical y conserva las 60 fichas de Brodmann', () => {
    const lobes = overlays.find((o) => o.id === 'lobulos')!;
    const brodmann = overlays.find((o) => o.id === 'brodmann')!;
    const cortex = Object.entries(data.structures).filter(([, s]) => s.g.startsWith('ctx.'));
    expect(cortex.every(([key]) => overlayStyle(lobes, null, `${key}_L`))).toBe(true);
    const labelled = Object.entries(data.structures).filter(([, s]) => s.ba);
    expect(labelled).toHaveLength(60);
    expect(labelled.every(([key]) => overlayStyle(brodmann, null, key))).toBe(true);
  });
  it('aísla la clase elegida y no inventa pertenencias', () => {
    const territories = overlays.find((o) => o.id === 'territorios')!;
    expect(overlayStyle(territories, 'acm', 'primary_motor_cortex_L')?.w).toBe(1);
    expect(overlayStyle(territories, 'aca', 'primary_motor_cortex_L')?.w).toBe(0);
    expect(overlayStyle(territories, null, 'no_existe')).toBeNull();
    expect(overlays).toHaveLength(6);
    for (const overlay of overlays)
      expect(new Set(overlay.classes?.map((c) => c.col)).size).toBeLessThanOrEqual(8);
  });
});
