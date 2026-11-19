import { useEffect, useState } from 'react';
import { loadNeurons, loadMicrocircuits, type Microcircuit, type NeuronRecord } from '../data';
import { MICRO_VARIANTS } from '../micro/variants';
import { useAtlas } from '../store';

/** Selector de variantes de la escena micro activa (tipo de neurona, de sinapsis…). */
export function MicroBar() {
  const level = useAtlas((s) => s.level);
  const variant = useAtlas((s) => s.variant);
  const setVariant = useAtlas((s) => s.setVariant);
  const run = useAtlas((s) => s.circuitRun);
  const runCircuit = useAtlas((s) => s.runCircuit);
  const [circuits, setCircuits] = useState<Microcircuit[]>([]);
  useEffect(() => {
    if (level === 'circuito') void loadMicrocircuits().then(setCircuits);
  }, [level]);
  const [neurons, setNeurons] = useState<NeuronRecord[]>([]);
  useEffect(() => {
    if (level === 'neurona') void loadNeurons().then(setNeurons);
  }, [level]);
  const list = MICRO_VARIANTS[level];
  if (!list?.length) return null;
  const current = variant ?? list[0]!.id;
  const circuit = level === 'circuito' ? circuits.find((c) => c.id === current) : undefined;
  if (level === 'circuito')
    return (
      <div className="na-microbar na-microbar--circuits">
        <label htmlFor="na-circuit-variant">Circuito</label>
        <select
          id="na-circuit-variant"
          value={current}
          onChange={(e) => setVariant(e.target.value)}
        >
          {list.map((v) => (
            <option key={v.id} value={v.id}>
              {v.label}
            </option>
          ))}
        </select>
        {circuit && (
          <div className="na-micro-controls">
            <span>Escenarios</span>
            {circuit.scenarios.map((sc) => (
              <button
                key={sc.id}
                type="button"
                aria-pressed={run?.scenario === sc.id}
                onClick={() => runCircuit(sc.id, run?.lesions ?? [])}
              >
                {sc.name}
              </button>
            ))}
            <label htmlFor="na-lesion">Silenciar</label>
            <select
              id="na-lesion"
              value={run?.lesions[0] ?? ''}
              onChange={(e) =>
                runCircuit(
                  run?.scenario ?? circuit.scenarios[0]!.id,
                  e.target.value ? [e.target.value] : [],
                )
              }
            >
              <option value="">Ninguna clase</option>
              {circuit.cells.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            {run && circuit.scenarios.some((sc) => sc.id === run.scenario) && (
              <span role="status">
                {circuit.scenarios.find((sc) => sc.id === run.scenario)?.name}
              </span>
            )}
            <small>Verde: excitación · magenta: inhibición. Pesos didácticos.</small>
          </div>
        )}
      </div>
    );
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
