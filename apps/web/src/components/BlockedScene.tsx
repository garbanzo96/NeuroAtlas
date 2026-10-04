import { useAppStore } from '../state/store';
import { ClaimCard } from './ClaimCard';

/** Escena sin geometría autorizada: explica qué falta y mantiene accesible la información. */
export function BlockedScene({ sceneId }: { sceneId: string }) {
  const kb = useAppStore((s) => s.kb)!;
  const layers = kb.resolveLayers(sceneId).filter((l) => !l.available);
  return (
    <div className="na-blocked" role="note" aria-label="Escena bloqueada">
      <h3>Escena bloqueada: falta un recurso autorizado</h3>
      {layers.map(({ layer, asset }) => (
        <div key={layer.id} className="na-blocked__layer">
          <p>
            <strong>{layer.label.es}.</strong> {asset?.blocked?.reason.es}
          </p>
          {asset?.blocked && (
            <>
              <p className="na-muted">
                Paquete de trabajo: <code>{asset.blocked.workPackage}</code>
                {asset.blocked.decisions.length > 0 && (
                  <>
                    {' '}
                    · Decisiones pendientes: <code>{asset.blocked.decisions.join(', ')}</code>
                  </>
                )}
              </p>
              <p>Fuentes candidatas (no verificadas):</p>
              <ul>
                {asset.blocked.candidateSourceIds.map((id) => {
                  const source = kb.source(id);
                  return (
                    <li key={id}>
                      {source?.urls[0] ? (
                        <a href={source.urls[0]} target="_blank" rel="noreferrer">
                          {source.title}
                        </a>
                      ) : (
                        (source?.title ?? id)
                      )}
                    </li>
                  );
                })}
              </ul>
            </>
          )}
          {layer.evidenceClaimIds.length > 0 && (
            <>
              <p>Lo que se puede consultar sin la geometría:</p>
              {layer.evidenceClaimIds.map((id) => {
                const claim = kb.claim(id);
                return claim ? (
                  <ClaimCard key={id} claim={claim} sceneContextId={kb.scene(sceneId)!.contextId} />
                ) : null;
              })}
            </>
          )}
        </div>
      ))}
    </div>
  );
}
