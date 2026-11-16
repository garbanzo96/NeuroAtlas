import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { simulateSignedGraph, type GraphScenario, type SignedGraph } from './signedGraph';

const doc = JSON.parse(
  readFileSync(new URL('../../../../apps/web/public/atlas/circuits.json', import.meta.url), 'utf8'),
) as { circuits: (SignedGraph & { id: string; scenarios: (GraphScenario & { id: string })[] })[] };
const graph = doc.circuits.find((c) => c.id === 'gb-motor')!;
const run = (id: string) =>
  simulateSignedGraph(
    graph,
    graph.scenarios.find((s) => s.id === id)!,
    { dt: 0.05, T: 16, tau: 0.5 },
  );
const thalamus = graph.nodes.findIndex((n) => n.id === 'talamo');
const delta = (r: ReturnType<typeof run>) =>
  Array.from(r.activity[thalamus]!, (v) => v - r.activity[thalamus]![0]!);

describe('esquema de signos de ganglios basales', () => {
  it('la vía directa desinhibe el tálamo y la indirecta lo inhibe', () => {
    expect(Math.max(...delta(run('directa')))).toBeGreaterThan(0.03);
    expect(Math.min(...delta(run('indirecta')))).toBeLessThan(-0.03);
  });
  it('la vía hiperdirecta frena antes de que llegue la directa', () => {
    const d = delta(run('hiperdirecta'));
    expect(d.slice(0, 65).some((x) => x < -0.01)).toBe(true);
    expect(d.findIndex((x) => x < -0.01)).toBeLessThan(d.findIndex((x) => x > 0.01));
  });
  it('sin dopamina se reduce la respuesta directa', () => {
    expect(Math.max(...delta(run('sin-dopamina')))).toBeLessThan(
      Math.max(...delta(run('directa'))),
    );
  });
  it('la lesión subtalámica eleva el basal del tálamo', () => {
    expect(run('lesion-stn').activity[thalamus]![0]).toBeGreaterThan(
      run('directa').activity[thalamus]![0]!,
    );
  });
});
