import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { KnowledgeBase } from '@neuroatlas/knowledge';
import { PackCatalog } from '@neuroatlas/schemas';
import {
  HH_REFERENCE_TOLERANCES as TOL,
  compareWithReference,
  referenceCaseNames,
} from '@neuroatlas/simulation/reference';
import { afterAll, describe, expect, it } from 'vitest';
import { buildPacks } from './build-packs';
import { loadContent } from './load-content';
import { CONTENT_DIR } from './paths';
import { validateContent } from './validate-content';

const report = validateContent(CONTENT_DIR);

describe('contenido del repositorio (content/)', () => {
  it('no tiene errores de esquema ni de reglas epistémicas', () => {
    const errors = report.issues.filter((i) => i.severity === 'error');
    expect(errors, errors.map((e) => `[${e.code}] ${e.id}: ${e.message}`).join('\n')).toEqual([]);
  });

  it('no declara como revisado nada sin revisión experta (canal dev)', () => {
    const pack = report.loaded.pack!;
    expect(pack.release.channel).toBe('dev');
    // Mientras no haya revisiones expertas registradas, nada puede superar "draft".
    const advanced = pack.claims.filter((c) => c.status !== 'draft' && c.reviews.length === 0);
    expect(advanced).toEqual([]);
  });

  it('cada escena tiene contexto visible y cada transición entre contextos tiene puente', () => {
    const kb = new KnowledgeBase(report.loaded.pack!);
    for (const scene of kb.pack.scenes) {
      expect(kb.context(scene.contextId)).toBeDefined();
      for (const t of scene.transitions) {
        expect(kb.claim(t.bridgeClaimId)?.kind).toBe('didactic_bridge');
      }
    }
  });
});

describe('ficha HH del contenido frente a NEURON', () => {
  const spec = report.loaded.pack!.models.find((m) => m.id === 'model.hh_classic')!;
  for (const name of referenceCaseNames()) {
    it(`caso ${name}`, () => {
      const c = compareWithReference(spec, name);
      expect(c.restDifference).toBeLessThan(TOL.rest);
      expect(c.spikeCount.model).toBe(c.spikeCount.reference);
      expect(c.maxSpikeTimeDifference).toBeLessThan(TOL.spikeTime);
      expect(c.peakDifference).toBeLessThan(TOL.peak);
      expect(c.rmsVoltageDifference).toBeLessThan(TOL.rms);
    });
  }
});

describe('cargador de contenido', () => {
  const dir = mkdtempSync(join(tmpdir(), 'neuroatlas-content-'));
  afterAll(() => rmSync(dir, { recursive: true, force: true }));

  it('informa archivo, índice y campo de cada registro inválido', () => {
    writeFileSync(
      join(dir, 'release.yaml'),
      'id: 2026.10.0-test\nchannel: dev\ncutoffDate: 2026-10-04\nnotes: { es: prueba }\n',
    );
    mkdirSync(join(dir, 'entities'));
    // Error típico: coma sin comillas dentro de un mapa en línea.
    writeFileSync(
      join(dir, 'entities', 'bad.yaml'),
      '- id: ent.x\n  type: structure\n  semanticScale: region\n  label: { es: Uno, dos }\n  taxonScope: { kind: general, note: n }\n  status: draft\n',
    );
    const loaded = loadContent(dir);
    expect(loaded.problems).toHaveLength(1);
    expect(loaded.problems[0]!.file).toBe('entities/bad.yaml[0]');
    expect(loaded.problems[0]!.message).toMatch(/label/);
  });
});

describe('paquetes versionados', () => {
  const out = mkdtempSync(join(tmpdir(), 'neuroatlas-packs-'));
  afterAll(() => rmSync(out, { recursive: true, force: true }));

  it('escriben catálogo con hashes y solo assets disponibles', () => {
    const catalog = PackCatalog.parse(buildPacks(report.loaded, out));
    const release = catalog.releases[0]!;
    expect(release.id).toBe(report.loaded.pack!.release.id);
    const ids = release.assets.map((a) => a.assetId);
    expect(ids).not.toContain('asset.atlas.human_cortical_surface');
    expect(ids).toContain('asset.schematic.visual_pathway');
    const knowledge = JSON.parse(readFileSync(join(out, release.knowledge.path), 'utf8'));
    expect(knowledge.release.id).toBe(release.id);
  });
});
