import { describe, expect, it } from 'vitest';
import { KnowledgeBase } from './knowledge-base';
import { makeFixturePack } from './test-fixtures';

describe('KnowledgeBase', () => {
  const kb = new KnowledgeBase(makeFixturePack());

  it('busca sin distinguir mayúsculas ni acentos y prioriza coincidencias exactas', () => {
    expect(kb.searchEntities('nucleo a').map((e) => e.id)).toEqual(['ent.a1']);
    expect(kb.searchEntities('NA')[0]?.id).toBe('ent.a1');
    expect(kb.searchEntities('nucleo').map((e) => e.id)).toEqual(['ent.a1', 'ent.b1']);
    expect(kb.searchEntities('   ')).toEqual([]);
  });

  it('reúne afirmaciones y relaciones de una entidad', () => {
    expect(kb.claimsAboutEntity('ent.a2').map((c) => c.id)).toEqual(['claim.a1_to_a2']);
    const rels = kb.relationsOfEntity('ent.a1');
    expect(rels.outgoing.map((r) => r.id)).toEqual(['rel.a1_to_a2']);
    expect(rels.incoming).toEqual([]);
  });

  it('informa disponibilidad de escena según sus assets', () => {
    expect(kb.sceneAvailability('scene.a')).toBe('available');
    expect(kb.sceneEntities('scene.a').map((e) => e.id)).toEqual(['ent.a1', 'ent.a2']);
  });

  it('describe las diferencias de contexto para rotular transiciones', () => {
    const diffs = kb.contextDifferences('ctx.schematic_a', 'ctx.schematic_b');
    expect(diffs).toEqual([{ aspect: 'species', from: 'Testus a', to: 'Testus b' }]);
    expect(kb.contextDifferences('ctx.schematic_a', 'ctx.schematic_a')).toEqual([]);
  });
});
