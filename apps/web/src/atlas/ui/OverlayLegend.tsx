import { useRef } from 'react';
import type { Overlay } from '../data';
import { useAtlas } from '../store';

export function OverlayLegend({ overlay }: { overlay: Overlay }) {
  const solo = useAtlas((s) => s.overlaySolo);
  const setSolo = useAtlas((s) => s.setOverlaySolo);
  const pinned = useRef<string | null>(null);
  const preview = (id: string | null) => setSolo(id ?? pinned.current);
  return (
    <section className="na-overlay-legend" aria-label={`Leyenda: ${overlay.n}`}>
      <div className="na-overlay-legend__classes">
        {overlay.classes?.map((c) => (
          <button
            key={c.id}
            type="button"
            aria-pressed={pinned.current === c.id && solo === c.id}
            onPointerEnter={() => preview(c.id)}
            onPointerLeave={() => preview(null)}
            onFocus={() => preview(c.id)}
            onBlur={() => preview(null)}
            onClick={() => {
              pinned.current = pinned.current === c.id ? null : c.id;
              setSolo(pinned.current);
            }}
          >
            <span style={{ background: c.col }} />
            {c.n}
          </button>
        ))}
      </div>
      <p>
        {overlay.source.cite} · {overlay.source.license} · {overlay.source.method}.
      </p>
      <p>{overlay.note}</p>
    </section>
  );
}
