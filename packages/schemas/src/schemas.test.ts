import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { Claim, EntityId, SceneManifest, SimulationInput, idPattern } from './index';
import { buildJsonSchemas } from './json-schema';

const draftClaim = {
  id: 'claim.test.example',
  version: 1,
  proposition: { es: 'Proposición de prueba.' },
  kind: 'observation',
  subjectIds: ['ent.test_a'],
  predicate: 'projects_to',
  object: { type: 'entity', id: 'ent.test_b' },
  contextId: 'ctx.test',
  measurement: 'pending_extraction',
  modelId: null,
  evidence: [
    {
      sourceId: 'src.test',
      locator: 'pending',
      locatorVerified: false,
      relation: 'supports',
      methodLimitations: 'Sin extraer.',
    },
  ],
  uncertainty: {
    measurement: 'no_reportado',
    samplingGeneralization: 'Pendiente.',
    competingExplanations: 'Pendiente.',
  },
  status: 'draft',
  provenance: {
    author: 'test',
    extractor: 'humano:test',
    createdOn: '2026-10-04',
    method: 'prueba',
  },
  display: { label: 'observation' },
};

describe('identificadores', () => {
  it('acepta IDs con el prefijo de su colección y rechaza los demás', () => {
    expect(EntityId.safeParse('ent.visual.lgn').success).toBe(true);
    expect(EntityId.safeParse('claim.visual.lgn').success).toBe(false);
    expect(EntityId.safeParse('ent.Visual.LGN').success).toBe(false);
    expect(EntityId.safeParse('ent.').success).toBe(false);
    expect(idPattern('scene').test('scene.visual.pathway')).toBe(true);
  });
});

describe('Claim', () => {
  it('acepta un borrador completo y aplica valores por defecto', () => {
    const parsed = Claim.parse(draftClaim);
    expect(parsed.reviews).toEqual([]);
    expect(parsed.provenance.transformations).toEqual([]);
  });

  it('rechaza claves desconocidas (errores tipográficos en YAML)', () => {
    const result = Claim.safeParse({ ...draftClaim, staus: 'draft' });
    expect(result.success).toBe(false);
  });

  it('exige texto en español', () => {
    const result = Claim.safeParse({ ...draftClaim, proposition: { en: 'Only English' } });
    expect(result.success).toBe(false);
  });

  it('no admite un tipo epistémico fuera del vocabulario', () => {
    const result = Claim.safeParse({ ...draftClaim, kind: 'consensus' });
    expect(result.success).toBe(false);
  });
});

describe('SceneManifest', () => {
  it('distingue marcos físicos y esquemáticos', () => {
    const base = {
      schemaVersion: '1',
      sceneId: 'scene.test',
      title: { es: 'Prueba' },
      summary: { es: 'Prueba' },
      contextId: 'ctx.test',
      semanticScale: 'pathway',
      layers: [
        {
          id: 'structures',
          label: { es: 'Estructuras' },
          kind: 'schematic',
          representationId: 'rep.test',
          defaultVisible: true,
        },
      ],
    };
    expect(
      SceneManifest.safeParse({
        ...base,
        coordinateFrame: { kind: 'schematic', id: 'frame', units: 'arbitrary', axes: 'x' },
      }).success,
    ).toBe(true);
    // Un marco esquemático con unidades físicas es una contradicción.
    expect(
      SceneManifest.safeParse({
        ...base,
        coordinateFrame: { kind: 'schematic', id: 'frame', units: 'mm', axes: 'x' },
      }).success,
    ).toBe(false);
  });
});

describe('SimulationInput', () => {
  it('requiere unidades explícitas en el protocolo', () => {
    const input = {
      modelId: 'model.test',
      modelVersion: 1,
      protocol: {
        kind: 'current_step',
        amplitude: 10,
        amplitudeUnits: 'uA/cm^2',
        start: 5,
        duration: 50,
        timeUnits: 'ms',
      },
      duration: 100,
      dt: 0.01,
      timeUnits: 'ms',
      sampleEvery: 5,
      solver: 'rk4',
      initialConditions: 'rest',
      seed: null,
    };
    expect(SimulationInput.safeParse(input).success).toBe(true);
    expect(
      SimulationInput.safeParse({
        ...input,
        protocol: { ...input.protocol, amplitudeUnits: 'nA' },
      }).success,
    ).toBe(false);
  });
});

describe('JSON Schemas exportados', () => {
  it('coinciden con los contratos Zod (ejecuta `npm run schemas:export` si falla)', () => {
    const dir = join(dirname(fileURLToPath(import.meta.url)), '..', 'json');
    const generated = buildJsonSchemas();
    const files = readdirSync(dir).filter((f) => f.endsWith('.json'));
    expect(files.sort()).toEqual(Object.keys(generated).sort());
    for (const [name, schema] of Object.entries(generated)) {
      const onDisk = JSON.parse(readFileSync(join(dir, name), 'utf8'));
      expect(onDisk, name).toEqual(schema);
    }
  });
});
