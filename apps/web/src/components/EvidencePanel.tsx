import { describeSpecies } from '@neuroatlas/knowledge';
import type { Relation } from '@neuroatlas/schemas';
import { useAppStore } from '../state/store';
import { ClaimCard } from './ClaimCard';
import {
  CONTEXT_KIND,
  ENTITY_TYPE,
  MODALITY,
  RELATION_IN,
  RELATION_OUT,
  SCALE,
  SIGN,
  STATUS,
} from './labels';

function RelationItem({ relation, direction }: { relation: Relation; direction: 'out' | 'in' }) {
  const kb = useAppStore((s) => s.kb)!;
  const selectFromSearch = useAppStore((s) => s.selectFromSearch);
  const otherId = direction === 'out' ? relation.objectId : relation.subjectId;
  const other = kb.entity(otherId);
  const model = kb.model(otherId);
  const verb = direction === 'out' ? RELATION_OUT[relation.type] : RELATION_IN[relation.type];
  return (
    <li>
      <span>{verb} </span>
      {other ? (
        <button type="button" className="na-link" onClick={() => selectFromSearch(other.id)}>
          {other.label.es}
        </button>
      ) : (
        <strong>{model?.name.es ?? otherId}</strong>
      )}
      <span className={`na-badge na-badge--status-${relation.status}`}>
        {STATUS[relation.status]}
      </span>
      {relation.connection && (
        <div className="na-muted">
          {MODALITY[relation.connection.modality]} ·{' '}
          {relation.connection.directed === true
            ? 'dirigida'
            : relation.connection.directed === false
              ? 'no dirigida'
              : 'dirección desconocida'}{' '}
          · {SIGN[relation.connection.sign]}
          {relation.connection.weight
            ? ` · peso ${relation.connection.weight.value} ${relation.connection.weight.units}`
            : ' · sin peso cuantificado'}
        </div>
      )}
    </li>
  );
}

function SceneOverview() {
  const kb = useAppStore((s) => s.kb)!;
  const selection = useAppStore((s) => s.selection)!;
  const selectEntity = useAppStore((s) => s.selectEntity);
  const scene = kb.scene(selection.sceneId)!;
  const context = kb.context(scene.contextId)!;
  const claimIds = [...new Set(scene.layers.flatMap((l) => l.evidenceClaimIds))];
  const model = scene.simulation ? kb.model(scene.simulation.modelId) : undefined;
  return (
    <>
      <h2>{scene.title.es}</h2>
      <p>{scene.summary.es}</p>
      <section className="na-context-card" aria-label="Contexto">
        <h3>Contexto de la escena</h3>
        <dl>
          <dt>Tipo</dt>
          <dd>{CONTEXT_KIND[context.kind]}</dd>
          <dt>Especie / alcance</dt>
          <dd>{describeSpecies(context)}</dd>
          <dt>Etapa</dt>
          <dd>{context.developmentalStage}</dd>
          <dt>Preparación</dt>
          <dd>{context.preparation}</dd>
          <dt>Modalidad</dt>
          <dd>{context.modality}</dd>
          <dt>Atlas</dt>
          <dd>{context.atlas ? `${context.atlas.name} ${context.atlas.version}` : 'ninguno'}</dd>
        </dl>
        <p className="na-muted">{context.description.es}</p>
      </section>
      {scene.entryEntityIds.length > 0 && (
        <p>
          Sugerencia: empieza por{' '}
          {scene.entryEntityIds.map((id, i) => (
            <span key={id}>
              {i > 0 && ', '}
              <button type="button" className="na-link" onClick={() => selectEntity(id)}>
                {kb.entity(id)?.label.es ?? id}
              </button>
            </span>
          ))}
          .
        </p>
      )}
      {model && (
        <p className="na-muted">
          Modelo de la escena: <strong>{model.name.es}</strong> (estado: {STATUS[model.status]}). Su
          ficha completa está en el panel del experimento.
        </p>
      )}
      <h3>Afirmaciones de las capas</h3>
      {claimIds.map((id) => {
        const claim = kb.claim(id);
        return claim ? <ClaimCard key={id} claim={claim} sceneContextId={scene.contextId} /> : null;
      })}
    </>
  );
}

/** Ficha científica con profundidad progresiva: identidad → relaciones → afirmaciones y evidencia. */
export function EvidencePanel() {
  const kb = useAppStore((s) => s.kb)!;
  const selection = useAppStore((s) => s.selection)!;
  const goToScene = useAppStore((s) => s.goToScene);
  const selectEntity = useAppStore((s) => s.selectEntity);
  const entityId = selection.selectedEntityIds[0];
  const entity = entityId ? kb.entity(entityId) : undefined;
  const sceneContextId = kb.scene(selection.sceneId)?.contextId;

  if (!entity) {
    return (
      <div className="na-info__body">
        <SceneOverview />
      </div>
    );
  }

  const { outgoing, incoming } = kb.relationsOfEntity(entity.id);
  const claims = kb.claimsAboutEntity(entity.id);
  const scenes = kb.scenesContainingEntity(entity.id);

  return (
    <div className="na-info__body">
      <button type="button" className="na-link na-info__back" onClick={() => selectEntity(null)}>
        ← Volver a la escena
      </button>
      <h2>
        {entity.label.es}
        {entity.label.en && <span className="na-muted na-info__en"> ({entity.label.en})</span>}
      </h2>
      <p className="na-claim__badges">
        <span className="na-badge">{ENTITY_TYPE[entity.type]}</span>
        <span className="na-badge">escala: {SCALE[entity.semanticScale]}</span>
        <span className="na-badge">
          {entity.taxonScope.kind === 'species'
            ? entity.taxonScope.scientificName
            : 'alcance general'}
        </span>
        <span className={`na-badge na-badge--status-${entity.status}`}>
          {STATUS[entity.status]}
        </span>
      </p>
      {entity.taxonScope.kind === 'general' && <p className="na-muted">{entity.taxonScope.note}</p>}
      {entity.synonyms.length > 0 && (
        <p>
          <strong>Sinónimos:</strong> {entity.synonyms.map((s) => s.text).join(', ')}
        </p>
      )}
      {entity.notes && <p className="na-muted">{entity.notes}</p>}
      <p className="na-muted">
        {entity.externalRefs.length === 0
          ? 'Sin referencias a ontologías externas verificadas todavía.'
          : entity.externalRefs
              .map((r) => `${r.system}:${r.id}${r.verified ? '' : ' (sin verificar)'}`)
              .join(' · ')}
      </p>

      {scenes.length > 0 && (
        <section>
          <h3>Aparece en</h3>
          <ul className="na-inline-list">
            {scenes.map((s) => (
              <li key={s.sceneId}>
                {s.sceneId === selection.sceneId ? (
                  <span>{s.title.es} (actual)</span>
                ) : (
                  <button
                    type="button"
                    className="na-link"
                    onClick={() => goToScene(s.sceneId, 'jump')}
                  >
                    {s.title.es}
                  </button>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {(outgoing.length > 0 || incoming.length > 0) && (
        <section>
          <h3>Relaciones</h3>
          <p className="na-hint">La ausencia de una relación no demuestra ausencia de conexión.</p>
          <ul className="na-relations">
            {outgoing.map((r) => (
              <RelationItem key={r.id} relation={r} direction="out" />
            ))}
            {incoming.map((r) => (
              <RelationItem key={r.id} relation={r} direction="in" />
            ))}
          </ul>
        </section>
      )}

      <section>
        <h3>Afirmaciones y evidencia ({claims.length})</h3>
        {claims.length === 0 && (
          <p className="na-muted">No hay afirmaciones registradas sobre esta entidad.</p>
        )}
        {claims.map((claim) => (
          <ClaimCard key={claim.id} claim={claim} sceneContextId={sceneContextId} />
        ))}
      </section>
    </div>
  );
}
