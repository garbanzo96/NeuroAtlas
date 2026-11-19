import { useEffect, useState } from 'react';
import { loadNeurons, type NeuronRecord } from '../data';
import { MICRO_VARIANTS } from '../micro/variants';
import { useAtlas } from '../store';

/** Selector de variantes de la escena micro activa (tipo de neurona, de sinapsis…). */
export function MicroBar() {
  const level = useAtlas((s) => s.level);
  const variant = useAtlas((s) => s.variant);
  const setVariant = useAtlas((s) => s.setVariant);
  const [neurons, setNeurons] = useState<NeuronRecord[]>([]);
  useEffect(() => {
    if (level === 'neurona') void loadNeurons().then(setNeurons);
  }, [level]);
  const list = MICRO_VARIANTS[level];
  if (!list?.length) return null;
  const current = variant ?? list[0]!.id;
  if (level === 'neurona')
    return (
      <div className="na-microbar">
        <label htmlFor="na-neuron-variant">Célula</label>
        <select id="na-neuron-variant" value={current} onChange={(e) => setVariant(e.target.value)}>
          {[
            'Corteza',
            'Hipocampo',
            'Cerebelo',
            'Ganglios basales',
            'Médula',
            'Retina y bulbo',
            'Glía',
          ].map((group) => (
            <optgroup label={group} key={group}>
              {neurons
                .filter((n) => n.group === group)
                .map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.name} · {n.species}
                  </option>
                ))}
            </optgroup>
          ))}
          <optgroup label="Esquemas">
            {list.map((v) => (
              <option key={v.id} value={v.id}>
                {v.label}
              </option>
            ))}
          </optgroup>
        </select>
      </div>
    );
  return (
    <div className="na-microbar" role="radiogroup" aria-label="Variantes de la escena" key={level}>
      {list.map((v) => (
        <button
          key={v.id}
          type="button"
          role="radio"
          aria-checked={v.id === current}
          onClick={() => setVariant(v.id)}
        >
          {v.label}
        </button>
      ))}
    </div>
  );
}
