import { LAYERS, PEEL_ORDER, useAtlas } from '../store';

const PEEL_LABELS = ['Todo', 'Sin piel', 'Sin esqueleto', 'Sin corteza', 'Núcleos'];

/** Capas y pelado: retirar envolturas de fuera hacia dentro. */
export function Dock() {
  const layers = useAtlas((s) => s.layers);
  const peel = useAtlas((s) => s.peel);
  const level = useAtlas((s) => s.level);
  const toggle = useAtlas((s) => s.toggleLayer);
  const setPeel = useAtlas((s) => s.setPeel);
  const visible =
    level === 'sistema' ? LAYERS : LAYERS.filter((l) => !['piel', 'visceras'].includes(l.id));
  return (
    <section className="na-dock" aria-label="Capas">
      <div className="na-peel">
        <label htmlFor="na-peel">
          Pelar capas <output>{PEEL_LABELS[peel]}</output>
        </label>
        <input
          id="na-peel"
          type="range"
          min={0}
          max={PEEL_ORDER.length}
          step={1}
          value={peel}
          onChange={(e) => setPeel(Number(e.target.value))}
          style={{ '--p': peel / PEEL_ORDER.length } as React.CSSProperties}
        />
      </div>
      <div className="na-layers" role="group" aria-label="Capas visibles">
        {visible.map((l) => (
          <button
            key={l.id}
            type="button"
            className="na-layer"
            aria-pressed={layers[l.id]}
            onClick={() => toggle(l.id)}
          >
            {l.name}
          </button>
        ))}
      </div>
    </section>
  );
}
