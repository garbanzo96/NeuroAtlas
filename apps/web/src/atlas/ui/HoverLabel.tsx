import { useAtlas } from '../store';

/**
 * Rótulo flotante: su posición la escribe LabelTracker (variables CSS, suavizadas por frame);
 * el texto entra con una animación propia cada vez que cambia la estructura.
 */
export function HoverLabel() {
  const hover = useAtlas((s) => s.hover);
  return (
    <div id="na-hover" className="na-hover" data-on={hover ? '' : undefined} aria-live="polite">
      <span className="na-hover__pin" />
      <span className="na-hover__lead" />
      {hover && (
        <div className="na-hover__card" key={hover.key}>
          <span className="na-hover__title">{hover.title}</span>
          {hover.subtitle && <span className="na-hover__sub">{hover.subtitle}</span>}
        </div>
      )}
    </div>
  );
}
