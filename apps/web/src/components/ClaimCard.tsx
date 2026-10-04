import type { Claim } from '@neuroatlas/schemas';
import { useAppStore } from '../state/store';
import {
  CLAIM_KIND,
  DISPLAY_LABEL,
  EVIDENCE_RELATION,
  SOURCE_VERIFICATION,
  STATUS,
} from './labels';

/**
 * Afirmación con su etiqueta epistémica permanente, estado editorial, contexto y evidencia.
 * Si el contexto de la afirmación difiere del de la escena, se señala.
 */
export function ClaimCard({ claim, sceneContextId }: { claim: Claim; sceneContextId?: string }) {
  const kb = useAppStore((s) => s.kb)!;
  const context = kb.context(claim.contextId);
  const otherContext = sceneContextId !== undefined && sceneContextId !== claim.contextId;
  const expertReview = claim.reviews.find((r) => r.kind === 'human_expert');
  return (
    <article
      className={`na-claim na-claim--${claim.display.label}`}
      aria-label={`Afirmación ${claim.id}`}
    >
      <header className="na-claim__badges">
        <span className={`na-badge na-badge--label-${claim.display.label}`}>
          {DISPLAY_LABEL[claim.display.label]}
        </span>
        <span className={`na-badge na-badge--status-${claim.status}`}>{STATUS[claim.status]}</span>
        {otherContext && <span className="na-badge na-badge--context">otro contexto</span>}
      </header>
      <p className="na-claim__text">{claim.proposition.es}</p>
      <p className="na-claim__meta">
        Tipo: {CLAIM_KIND[claim.kind]} · Contexto: {context?.label.es ?? claim.contextId}
        {claim.measurement !== 'not_applicable' && claim.measurement !== 'pending_extraction' && (
          <> · Medición: {claim.measurement}</>
        )}
        {claim.measurement === 'pending_extraction' && (
          <> · Método de medición pendiente de extracción</>
        )}
      </p>
      {claim.evidence.length > 0 && (
        <ul className="na-evidence" aria-label="Evidencia">
          {claim.evidence.map((ev) => {
            const source = kb.source(ev.sourceId);
            const url = source?.doi ? `https://doi.org/${source.doi}` : source?.urls[0];
            return (
              <li key={`${ev.sourceId}-${ev.relation}`}>
                <span className="na-evidence__relation">{EVIDENCE_RELATION[ev.relation]}:</span>{' '}
                {url ? (
                  <a href={url} target="_blank" rel="noreferrer">
                    {source?.title ?? ev.sourceId}
                  </a>
                ) : (
                  (source?.title ?? ev.sourceId)
                )}
                {source?.year ? ` (${source.year})` : ''}
                <div className="na-evidence__meta">
                  <span
                    className={`na-badge na-badge--source-${source?.verification.status ?? 'candidate'}`}
                  >
                    {SOURCE_VERIFICATION[source?.verification.status ?? 'candidate']}
                  </span>
                  <span>
                    Localizador: {ev.locator === 'pending' ? 'pendiente' : ev.locator}
                    {ev.locator !== 'pending' && !ev.locatorVerified && ' (sin verificar)'}
                  </span>
                </div>
                <p className="na-evidence__limits">{ev.methodLimitations}</p>
              </li>
            );
          })}
        </ul>
      )}
      <details className="na-claim__details">
        <summary>Incertidumbre, procedencia y revisión</summary>
        <dl>
          <dt>Generalización</dt>
          <dd>{claim.uncertainty.samplingGeneralization}</dd>
          <dt>Explicaciones alternativas</dt>
          <dd>{claim.uncertainty.competingExplanations}</dd>
          <dt>Redacción</dt>
          <dd>
            {claim.provenance.extractor} · {claim.provenance.createdOn} · {claim.provenance.method}
          </dd>
          <dt>Revisión experta</dt>
          <dd>
            {expertReview
              ? `${expertReview.reviewer} (${expertReview.role}), ${expertReview.date}: ${expertReview.scope}`
              : 'Ninguna registrada.'}
          </dd>
          <dt>ID</dt>
          <dd>
            <code>{claim.id}</code> v{claim.version}
          </dd>
        </dl>
      </details>
    </article>
  );
}
