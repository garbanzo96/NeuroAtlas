import { lazy, Suspense, useRef, useState } from 'react';
import './lab.css';

export const LAB_MODELS: Record<string, { name: string; short: string }> = {
  hh: { name: 'Hodgkin–Huxley', short: 'Canales y potencial de acción' },
  izhikevich: { name: 'Izhikevich', short: 'Patrones de disparo' },
  lif: { name: 'Integración y disparo', short: 'Umbral y tasa' },
  'wilson-cowan': { name: 'Wilson–Cowan', short: 'Poblaciones excitadoras e inhibidoras' },
  kuramoto: { name: 'Kuramoto', short: 'Sincronización de osciladores' },
  network: { name: 'Red neuronal', short: 'Espigas de una red puntual' },
  'tsodyks-markram': { name: 'Tsodyks–Markram', short: 'Plasticidad a corto plazo' },
  stdp: { name: 'STDP', short: 'Ventana de plasticidad' },
  nernst: { name: 'Nernst', short: 'Potencial de equilibrio' },
  ghk: { name: 'Goldman–Hodgkin–Katz', short: 'Permeabilidad y potencial' },
  'nak-pump': { name: 'Bomba Na⁺/K⁺', short: 'Ciclo Post–Albers' },
  axon: { name: 'Axón', short: 'Propagación en un cable' },
};
const components = {
  hh: lazy(() => import('./models/Models').then((m) => ({ default: m.HH }))),
  izhikevich: lazy(() => import('./models/Models').then((m) => ({ default: m.Izhikevich }))),
  lif: lazy(() => import('./models/Models').then((m) => ({ default: m.LIF }))),
  'wilson-cowan': lazy(() => import('./models/Models').then((m) => ({ default: m.WilsonCowan }))),
  kuramoto: lazy(() => import('./models/Models').then((m) => ({ default: m.Kuramoto }))),
  network: lazy(() => import('./models/Models').then((m) => ({ default: m.Network }))),
  'tsodyks-markram': lazy(() =>
    import('./models/Models').then((m) => ({ default: m.TsodyksMarkram })),
  ),
  stdp: lazy(() => import('./models/Models').then((m) => ({ default: m.STDP }))),
  nernst: lazy(() => import('./models/Models').then((m) => ({ default: m.Nernst }))),
  ghk: lazy(() => import('./models/Models').then((m) => ({ default: m.GHK }))),
  'nak-pump': lazy(() => import('./models/Models').then((m) => ({ default: m.NakPump }))),
  axon: lazy(() => import('./models/Models').then((m) => ({ default: m.Axon }))),
} satisfies Record<string, React.LazyExoticComponent<() => React.JSX.Element>>;
export function Lab({
  models,
  initial,
}: {
  models: string[];
  initial?: string;
}): React.JSX.Element {
  const available = models.filter((id) => id in components);
  const [selected, setSelected] = useState(
    initial && available.includes(initial) ? initial : available[0],
  );
  const active = selected && available.includes(selected) ? selected : available[0];
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const Component = active ? components[active as keyof typeof components] : undefined;
  return (
    <section className="na-lab">
      <div role="tablist" aria-label="Modelos de simulación" className="na-lab-tabs">
        {available.map((id, i) => (
          <button
            key={id}
            ref={(el) => {
              tabs.current[i] = el;
            }}
            role="tab"
            id={`na-lab-tab-${id}`}
            aria-controls={`na-lab-panel-${id}`}
            aria-selected={id === active}
            tabIndex={id === active ? 0 : -1}
            onClick={() => setSelected(id)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
                e.preventDefault();
                const j =
                  (i + (e.key === 'ArrowRight' ? 1 : -1) + available.length) % available.length;
                setSelected(available[j]);
                tabs.current[j]?.focus();
              }
            }}
          >
            {LAB_MODELS[id]?.name}
          </button>
        ))}
      </div>
      {active && Component ? (
        <div role="tabpanel" id={`na-lab-panel-${active}`} aria-labelledby={`na-lab-tab-${active}`}>
          <Suspense fallback={<p>Cargando modelo…</p>}>
            <Component />
          </Suspense>
        </div>
      ) : (
        <p>No hay modelos disponibles.</p>
      )}
    </section>
  );
}
