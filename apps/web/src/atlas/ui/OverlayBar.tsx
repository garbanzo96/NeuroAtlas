import { useMemo } from 'react';
import { builtinOverlays } from '../overlays';
import { useAtlas } from '../store';
import { OverlayLegend } from './OverlayLegend';

export function OverlayBar() {
  const data = useAtlas((s) => s.data)!;
  const active = useAtlas((s) => s.overlay);
  const setOverlay = useAtlas((s) => s.setOverlay);
  const overlays = useMemo(() => builtinOverlays(data), [data]);
  const overlay = overlays.find((o) => o.id === active);
  return (
    <div className="na-overlays">
      <label htmlFor="na-overlay-select">Capas de lectura</label>
      <select
        id="na-overlay-select"
        value={active ?? ''}
        onChange={(e) => setOverlay(e.target.value || null)}
      >
        <option value="">Sin capa</option>
        {overlays.map((o) => (
          <option key={o.id} value={o.id}>
            {o.n}
          </option>
        ))}
      </select>
      {overlay && <OverlayLegend key={overlay.id} overlay={overlay} />}
    </div>
  );
}
