import type { KnowledgePack } from '@neuroatlas/schemas';
import { describe, expect, it } from 'vitest';
import { makeFixtureGeometry, makeFixturePack } from './test-fixtures';
import { validateKnowledge } from './validate';

function codes(pack: KnowledgePack, withGeometry = false): string[] {
  return validateKnowledge(pack, withGeometry ? { geometries: makeFixtureGeometry() } : {})
    .filter((i) => i.severity === 'error')
    .map((i) => i.code);
}

function mutate(fn: (pack: KnowledgePack) => void): KnowledgePack {
  const pack = makeFixturePack();
  fn(pack);
  return pack;
}

describe('validateKnowledge', () => {
  it('el paquete de referencia no tiene errores', () => {
    expect(codes(makeFixturePack(), true)).toEqual([]);
  });

  it('detecta referencias rotas', () => {
    const pack = mutate((p) => {
      p.claims[0]!.evidence[0]!.sourceId = 'src.missing';
    });
    expect(codes(pack)).toContain('REF_MISSING');
  });

  it('detecta IDs duplicados entre colecciones', () => {
    const pack = mutate((p) => {
      p.entities.push({ ...p.entities[0]! });
    });
    expect(codes(pack)).toContain('ID_DUPLICATE');
  });

  it('impide publicar sin revisión experta humana; una revisión LLM no basta', () => {
    const pack = mutate((p) => {
      const claim = p.claims[0]!;
      claim.status = 'published';
      claim.reviews = [
        {
          kind: 'llm_crosscheck',
          reviewer: 'llm:otro-modelo',
          role: 'revisión cruzada',
          date: '2026-10-04',
          scope: 'todo',
          criteria: 'plan',
          outcome: 'approved',
        },
      ];
    });
    const found = codes(pack);
    expect(found).toContain('CLAIM_STATUS_WITHOUT_EXPERT_REVIEW');
    expect(found).toContain('CLAIM_STATUS_UNVERIFIED_LOCATOR');
    expect(found).toContain('CLAIM_STATUS_SOURCE_NOT_INSPECTED');
  });

  it('exige evidencia salvo en puentes didácticos', () => {
    const pack = mutate((p) => {
      p.claims[0]!.evidence = [];
    });
    expect(codes(pack)).toContain('CLAIM_NO_EVIDENCE');
  });

  it('impide etiquetar un modelo como observación', () => {
    const pack = mutate((p) => {
      p.claims[0]!.kind = 'model_prediction';
    });
    const found = codes(pack);
    expect(found).toContain('CLAIM_LABEL_MISMATCH');
    expect(found).toContain('CLAIM_MODEL_REQUIRED');
  });

  it('detecta mezcla de especies en una relación que no es correspondencia', () => {
    const pack = mutate((p) => {
      p.relations[0]!.objectId = 'ent.b1';
    });
    expect(codes(pack)).toContain('RELATION_CONTEXT_MIXING');
  });

  it('impide mostrar en una escena entidades de otra especie', () => {
    const pack = mutate((p) => {
      p.scenes[0]!.layers[0]!.entityIds.push('ent.b1');
    });
    expect(codes(pack)).toContain('SCENE_CONTEXT_MIXING');
  });

  it('exige explicar en la leyenda cada color usado', () => {
    const geometries = makeFixtureGeometry();
    geometries.get('asset.geom_a')!.nodes[0]!.colorGroup = 'unexplained';
    const found = validateKnowledge(makeFixturePack(), { geometries }).map((i) => i.code);
    expect(found).toContain('SCENE_LEGEND_MISSING');
  });

  it('no permite dirección a partir de tractografía', () => {
    const pack = mutate((p) => {
      p.relations[0]!.connection = {
        modality: 'tractography',
        directed: true,
        sign: 'unknown',
        weight: null,
      };
    });
    expect(codes(pack)).toContain('RELATION_DIRECTION_NOT_SUPPORTED_BY_METHOD');
  });

  it('exige bloque de conexión en proyecciones', () => {
    const pack = mutate((p) => {
      delete p.relations[0]!.connection;
    });
    expect(codes(pack)).toContain('RELATION_CONNECTION_REQUIRED');
  });

  it('exige declarar el cambio de especie en una transición', () => {
    const pack = mutate((p) => {
      p.scenes[0]!.transitions[0]!.contextChanges = ['abstraction'];
    });
    expect(codes(pack)).toContain('TRANSITION_SPECIES_UNDECLARED');
  });

  it('rechaza transiciones "registered" sin mapeo espacial', () => {
    const pack = mutate((p) => {
      p.scenes[0]!.transitions[0]!.correspondence = 'registered';
    });
    expect(codes(pack)).toContain('TRANSITION_REGISTERED_UNSUPPORTED');
  });

  it('exige que el puente sea una afirmación didáctica', () => {
    const pack = mutate((p) => {
      p.scenes[0]!.transitions[0]!.bridgeClaimId = 'claim.a1_to_a2';
    });
    expect(codes(pack)).toContain('TRANSITION_BRIDGE_KIND');
  });

  it('impide mostrar en una escena una representación de otro contexto', () => {
    const pack = mutate((p) => {
      p.scenes[0]!.layers[0]!.representationId = 'rep.b';
    });
    expect(codes(pack)).toContain('SCENE_REPRESENTATION_CONTEXT');
  });

  it('impide situar datos reconstruidos en un marco esquemático', () => {
    const pack = mutate((p) => {
      p.representations[0]!.assetId = 'asset.geom_b';
    });
    expect(codes(pack)).toContain('SCENE_NATURE_FRAME_MISMATCH');
  });

  it('no distribuye assets externos sin licencia verificada', () => {
    const pack = mutate((p) => {
      const asset = p.assets[1]!;
      asset.status = 'available';
      asset.file = { path: 'b.glb', format: 'glb' };
      delete asset.blocked;
    });
    expect(codes(pack)).toContain('ASSET_EXTERNAL_LICENSE');
  });

  it('exige motivo y paquete de trabajo para assets bloqueados', () => {
    const pack = mutate((p) => {
      delete p.assets[1]!.blocked;
    });
    expect(codes(pack)).toContain('ASSET_BLOCKED_WITHOUT_REASON');
  });

  it('comprueba que las entidades de cada capa existen en la geometría', () => {
    const geometries = makeFixtureGeometry();
    geometries.get('asset.geom_a')!.nodes.splice(0, 1);
    const found = validateKnowledge(makeFixturePack(), { geometries }).map((i) => i.code);
    expect(found).toContain('SCENE_LAYER_ENTITY_NOT_IN_GEOMETRY');
  });

  it('una fuente candidata no puede llevar fecha de verificación', () => {
    const pack = mutate((p) => {
      p.sources[0]!.verification.verifiedOn = '2026-10-04';
    });
    expect(codes(pack)).toContain('SOURCE_CANDIDATE_WITH_DATE');
  });

  it('un release público rechaza borradores', () => {
    const pack = mutate((p) => {
      p.release.channel = 'public';
    });
    expect(codes(pack)).toContain('RELEASE_PUBLIC_UNPUBLISHED');
  });

  it('detecta capas de lección inexistentes', () => {
    const pack = mutate((p) => {
      p.lessons[0]!.steps[0]!.visibleLayerIds = ['nope'];
    });
    expect(codes(pack)).toContain('LESSON_LAYER_NOT_IN_SCENE');
  });
});
