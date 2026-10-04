import { useAppStore } from '../state/store';
import { CONTEXT_CHANGE, CONTEXT_KIND, DIFFERENCE_ASPECT } from './labels';

/** Aviso de cambio de contexto tras una transición o un salto entre escenas. */
export function TransitionNotice() {
  const kb = useAppStore((s) => s.kb)!;
  const notice = useAppStore((s) => s.notice);
  const dismiss = useAppStore((s) => s.dismissNotice);
  if (!notice) return null;
  const bridge = notice.bridgeClaimId ? kb.claim(notice.bridgeClaimId) : undefined;
  const from = kb.scene(notice.fromSceneId);
  return (
    <section className="na-notice" role="status" aria-live="polite" aria-label="Cambio de contexto">
      <header>
        <strong>Cambio de contexto</strong>
        <span className="na-muted"> desde «{from?.title.es}»</span>
      </header>
      {notice.contextChanges.length > 0 && (
        <ul className="na-chips" aria-label="Qué cambia">
          {notice.contextChanges.map((c) => (
            <li key={c} className="na-chip">
              {CONTEXT_CHANGE[c]}
            </li>
          ))}
        </ul>
      )}
      {bridge ? (
        <p className="na-notice__bridge">{bridge.proposition.es}</p>
      ) : (
        <p className="na-notice__bridge">
          Salto directo sin puente didáctico declarado: compara los contextos antes de relacionar
          ambas escenas.
        </p>
      )}
      {notice.differences.length > 0 && (
        <details className="na-notice__details">
          <summary>Ver diferencias entre contextos ({notice.differences.length})</summary>
          <table className="na-notice__diff">
            <caption className="na-visually-hidden">Diferencias entre contextos</caption>
            <thead>
              <tr>
                <th scope="col">Aspecto</th>
                <th scope="col">Antes</th>
                <th scope="col">Ahora</th>
              </tr>
            </thead>
            <tbody>
              {notice.differences.map((d) => (
                <tr key={d.aspect}>
                  <th scope="row">{DIFFERENCE_ASPECT[d.aspect]}</th>
                  <td>{d.aspect === 'kind' ? (CONTEXT_KIND[d.from] ?? d.from) : d.from}</td>
                  <td>{d.aspect === 'kind' ? (CONTEXT_KIND[d.to] ?? d.to) : d.to}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
      )}
      <p className="na-muted">
        {notice.correspondence === 'registered'
          ? 'Correspondencia espacial registrada.'
          : 'Correspondencia conceptual: no hay registro espacial entre las escenas.'}
      </p>
      <button type="button" onClick={dismiss}>
        Entendido
      </button>
    </section>
  );
}
