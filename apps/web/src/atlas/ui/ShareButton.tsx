import { useEffect, useRef, useState, type RefObject } from 'react';
import type { CameraCommand } from '../store';
import { currentView, viewUrl } from '../view';

export function ShareButton({
  cameraPose,
  lab,
}: {
  cameraPose: RefObject<(() => CameraCommand | null) | null>;
  lab: string | null;
}) {
  const [message, setMessage] = useState('');
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  async function copy() {
    const camera = cameraPose.current?.();
    if (!camera) {
      setMessage('La cámara aún no está lista');
      return;
    }
    try {
      await navigator.clipboard.writeText(viewUrl({ ...currentView(), lab, camera }));
      setMessage('Enlace copiado');
    } catch {
      setMessage('No se pudo copiar el enlace');
    }
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setMessage(''), 2400);
  }

  return (
    <>
      <style>{`@keyframes na-share-confirm { from { opacity: 0; transform: translateY(3px); } to { opacity: 1; transform: translateY(0); } } @media (prefers-reduced-motion: reduce) { .na-share-status { animation: none !important; } }`}</style>
      <button
        type="button"
        onClick={copy}
        style={{
          borderColor: 'var(--na-line-hi)',
          background: 'var(--na-glass)',
          backdropFilter: 'blur(12px)',
        }}
      >
        <span aria-hidden="true" style={{ marginRight: 6 }}>
          ↗
        </span>
        Copiar enlace
      </button>
      <span
        aria-live="polite"
        role="status"
        className="na-share-status"
        key={message}
        style={{
          position: 'absolute',
          top: '100%',
          right: 0,
          padding: message ? '8px 12px' : 0,
          borderRadius: 10,
          background: 'var(--na-glass-hi)',
          color: 'var(--na-fg)',
          animation: message ? 'na-share-confirm 180ms ease-out' : undefined,
        }}
      >
        {message}
      </span>
    </>
  );
}
