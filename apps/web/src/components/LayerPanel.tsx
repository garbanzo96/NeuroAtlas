import { CategoricalLegend } from '@neuroatlas/viewer-2d';
import { useAppStore } from '../state/store';
import { ASSET_NATURE } from './labels';

/** Visibilidad y opacidad por capa. La opacidad es un control de visibilidad, no de confianza. */
export function LayerPanel() {
  const kb = useAppStore((s) => s.kb)!;
  const selection = useAppStore((s) => s.selection)!;
  const layerOpacity = useAppStore((s) => s.layerOpacity);
  const toggleLayer = useAppStore((s) => s.toggleLayer);
  const setLayerOpacity = useAppStore((s) => s.setLayerOpacity);
  const scene = kb.scene(selection.sceneId)!;
  const layers = kb.resolveLayers(scene.sceneId);

  return (
    <section className="na-panel" aria-labelledby="na-layers-title">
      <h2 id="na-layers-title">Capas</h2>
      <p className="na-hint">
        La transparencia solo cambia la visibilidad; no indica confianza en los datos.
      </p>
      <ul className="na-layers">
        {layers.map(({ layer, asset, available }) => {
          const visible = selection.visibleLayerIds.includes(layer.id);
          const opacity = layerOpacity[layer.id] ?? layer.defaultOpacity;
          return (
            <li key={layer.id} className={available ? undefined : 'is-blocked'}>
              <label className="na-layer__toggle">
                <input
                  type="checkbox"
                  checked={visible}
                  disabled={!available}
                  onChange={() => toggleLayer(layer.id)}
                />
                <span>{layer.label.es}</span>
              </label>
              <span className="na-layer__nature">
                {asset ? ASSET_NATURE[asset.nature] : '—'}
                {!available && ' · no disponible'}
              </span>
              {available && (
                <label className="na-layer__opacity">
                  <span className="na-visually-hidden">Opacidad de {layer.label.es}</span>
                  <input
                    type="range"
                    min={0.05}
                    max={1}
                    step={0.05}
                    value={opacity}
                    disabled={!visible}
                    onChange={(e) => setLayerOpacity(layer.id, Number(e.target.value))}
                  />
                  <output>{Math.round(opacity * 100)}%</output>
                </label>
              )}
            </li>
          );
        })}
      </ul>
      <CategoricalLegend
        title="Leyenda de colores"
        items={scene.legend.map((l) => ({ key: l.colorGroup, color: l.color, label: l.label.es }))}
      />
    </section>
  );
}
