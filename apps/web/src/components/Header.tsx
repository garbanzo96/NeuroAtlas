import { useAppStore } from '../state/store';

export function Header() {
  const kb = useAppStore((s) => s.kb)!;
  const lesson = useAppStore((s) => s.lesson);
  const startLesson = useAppStore((s) => s.startLesson);
  const exitLesson = useAppStore((s) => s.exitLesson);
  const showLabels = useAppStore((s) => s.showLabels);
  const setShowLabels = useAppStore((s) => s.setShowLabels);
  const reducedMotion = useAppStore((s) => s.reducedMotion);
  const setReducedMotion = useAppStore((s) => s.setReducedMotion);
  const setShortcutsOpen = useAppStore((s) => s.setShortcutsOpen);
  const warnings = useAppStore((s) => s.warnings);
  const dismissWarnings = useAppStore((s) => s.dismissWarnings);

  const claims = kb.pack.claims;
  const reviewed = claims.filter((c) => c.status === 'reviewed' || c.status === 'published').length;
  const firstLesson = kb.pack.lessons[0];

  return (
    <header className="na-header">
      <div className="na-header__brand">
        <span className="na-logo" aria-hidden="true">
          ◎
        </span>
        <h1>NeuroAtlas</h1>
        <span
          className="na-badge na-badge--release"
          title={`Fecha de corte: ${kb.release.cutoffDate}`}
        >
          {kb.release.id} · {kb.release.channel === 'dev' ? 'desarrollo' : kb.release.channel}
        </span>
      </div>
      <p className="na-draft-notice" role="note">
        <strong>Prototipo:</strong> {reviewed} de {claims.length} afirmaciones tienen revisión
        experta. Todo el contenido marcado «Borrador» está pendiente de verificación.
      </p>
      <div className="na-header__actions">
        {firstLesson &&
          (lesson ? (
            <button type="button" onClick={exitLesson}>
              Salir del recorrido
            </button>
          ) : (
            <button
              type="button"
              className="na-primary"
              onClick={() => startLesson(firstLesson.lessonId)}
            >
              Recorrido guiado
            </button>
          ))}
        <label className="na-toggle">
          <input
            type="checkbox"
            checked={showLabels}
            onChange={(e) => setShowLabels(e.target.checked)}
          />
          Rótulos
        </label>
        <label className="na-toggle">
          <input
            type="checkbox"
            checked={reducedMotion}
            onChange={(e) => setReducedMotion(e.target.checked)}
          />
          Movimiento reducido
        </label>
        <button type="button" onClick={() => setShortcutsOpen(true)} aria-label="Atajos de teclado">
          ?
        </button>
      </div>
      {warnings.length > 0 && (
        <div className="na-warnings" role="alert">
          <ul>
            {warnings.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
          <button type="button" onClick={dismissWarnings}>
            Entendido
          </button>
        </div>
      )}
    </header>
  );
}
