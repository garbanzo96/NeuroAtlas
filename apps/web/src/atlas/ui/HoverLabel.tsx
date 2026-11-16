import { useEffect, useRef, useState } from 'react';
import { type Hover, useAtlas } from '../store';

/**
 * Rótulo flotante: su posición la escribe LabelTracker (variables CSS, suavizadas por frame).
 * Al cambiar de estructura, el texto anterior sale mientras entra el nuevo (fundido cruzado).
 */
export function HoverLabel() {
  const hover = useAtlas((s) => s.hover);
  const [prev, setPrev] = useState<Hover | null>(null);
  const last = useRef<Hover | null>(null);
  useEffect(() => {
    if (last.current && last.current.key !== hover?.key) setPrev(last.current);
    last.current = hover;
    const t = setTimeout(() => setPrev(null), 260);
    return () => clearTimeout(t);
  }, [hover]);
  return (
    <div id="na-hover" className="na-hover" data-on={hover ? '' : undefined} aria-live="polite">
      <span className="na-hover__pin" />
      <span className="na-hover__lead" />
      {prev && hover && (
        <div
          className="na-hover__card na-hover__card--out"
          key={`out-${prev.key}`}
          aria-hidden="true"
        >
          <span className="na-hover__title">{prev.title}</span>
          {prev.subtitle && <span className="na-hover__sub">{prev.subtitle}</span>}
        </div>
      )}
      {hover && (
        <div className="na-hover__card" key={hover.key}>
          <span className="na-hover__title">{hover.title}</span>
          {hover.subtitle && <span className="na-hover__sub">{hover.subtitle}</span>}
        </div>
      )}
    </div>
  );
}
