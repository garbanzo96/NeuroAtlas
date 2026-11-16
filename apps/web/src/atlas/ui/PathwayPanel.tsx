import { useEffect, useState } from 'react';
import * as THREE from 'three';
import { resolvePoint } from '../data';
import { CircuitPanel } from './CircuitPanel';
import { DIRECTION_COLOR, directionOf, pathwayBox } from '../scene/Pathways';
import { useAtlas } from '../store';

export function activatePathway(id: string | null) {
  const s = useAtlas.getState();
  s.setPathway(id);
  if (!id || !s.data) return;
  const p = s.data.pathways.pathways.find((x) => x.id === id);
  if (!p) return;
  if (s.level !== 'sistema' && s.level !== 'encefalo' && s.level !== 'areas')
    s.setLevel('encefalo');
  s.select(null);
  const box = pathwayBox(s.data, p);
  s.command({ type: 'box', min: box.min.toArray(), max: box.max.toArray() });
}

/** Catálogo de vías y recorrido paso a paso de la vía activa. */
export function PathwayPanel({ open, onClose }: { open: boolean; onClose(): void }) {
  const data = useAtlas((s) => s.data)!;
  const [tab, setTab] = useState<'vias' | 'circuitos'>('vias');
  const circuit = useAtlas((s) => s.circuit);
  const active = useAtlas((s) => s.pathway);
  const step = useAtlas((s) => s.pathwayStep);
  const setStep = useAtlas((s) => s.setPathwayStep);
  const pathway = data.pathways.pathways.find((p) => p.id === active);

  useEffect(() => {
    const on = (e: Event) => activatePathway((e as CustomEvent<string>).detail);
    window.addEventListener('na:pathway', on);
    return () => window.removeEventListener('na:pathway', on);
  }, []);

  if (circuit)
    return (
      <CircuitPanel
        onClose={() => {
          const state = useAtlas.getState();
          state.setCircuit(null);
          state.command({ type: 'level', level: 'encefalo' });
        }}
      />
    );

  if (pathway) {
    const paso = pathway.pasos[step];
    const dirs = [...new Set(pathway.tramos.map((t) => directionOf(pathway, t.n)))];
    return (
      <section className="na-path" aria-label={`Vía: ${pathway.n}`}>
        <header>
          <p className="na-kicker">
            Vía · paso {step + 1} de {pathway.pasos.length}
          </p>
          <h2>{pathway.n}</h2>
          <div className="na-legend">
            {dirs.map((d) => (
              <span key={d} style={{ '--c': DIRECTION_COLOR[d] } as React.CSSProperties}>
                {d}
              </span>
            ))}
          </div>
          <button
            type="button"
            className="na-sheet__close"
            onClick={() => activatePathway(null)}
            aria-label="Cerrar vía"
          >
            ×
          </button>
        </header>
        <div className="na-path__progress" aria-hidden="true">
          {pathway.pasos.map((_, i) => (
            <button
              key={i}
              type="button"
              tabIndex={-1}
              data-on={i <= step ? '' : undefined}
              onClick={() => setStep(i)}
            />
          ))}
        </div>
        {paso && (
          <div className="na-path__step" key={step}>
            <h3>{paso.t}</h3>
            <p>{paso.d}</p>
          </div>
        )}
        <div className="na-path__nav">
          <button type="button" disabled={step === 0} onClick={() => setStep(step - 1)}>
            ← Anterior
          </button>
          <button
            type="button"
            className="na-path__next"
            disabled={step >= pathway.pasos.length - 1}
            onClick={() => setStep(step + 1)}
          >
            Siguiente →
          </button>
        </div>
        {pathway.clin && step === pathway.pasos.length - 1 && (
          <p className="na-path__clin">{pathway.clin}</p>
        )}
      </section>
    );
  }

  if (!open) return null;
  return (
    <section className="na-path na-path--list" aria-label="Vías y circuitos">
      <header>
        <p className="na-kicker">22 vías y circuitos</p>
        <h2>Vías y circuitos</h2>
        <div className="na-path__nav">
          <button type="button" aria-pressed={tab === 'vias'} onClick={() => setTab('vias')}>
            Vías
          </button>
          <button
            type="button"
            aria-pressed={tab === 'circuitos'}
            onClick={() => setTab('circuitos')}
          >
            Circuitos
          </button>
        </div>
        <div className="na-legend">
          {(['aferente', 'eferente', 'modulador'] as const).map((d) => (
            <span key={d} style={{ '--c': DIRECTION_COLOR[d] } as React.CSSProperties}>
              {d}
            </span>
          ))}
        </div>
        <button type="button" className="na-sheet__close" onClick={onClose} aria-label="Cerrar">
          ×
        </button>
      </header>
      <div className="na-path__groups">
        {tab === 'circuitos' ? (
          <div>
            <h3>Circuitos con signo</h3>
            <ul>
              {data.circuits.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => {
                      const state = useAtlas.getState();
                      state.setPathway(null);
                      state.setLevel('encefalo');
                      state.setCircuit(c.id);
                      const points = c.nodes
                        .map((node) => resolvePoint(data, node.at))
                        .filter((point): point is THREE.Vector3 => !!point);
                      if (points.length) {
                        const box = new THREE.Box3().setFromPoints(points).expandByScalar(1.5);
                        state.command({
                          type: 'box',
                          min: box.min.toArray(),
                          max: box.max.toArray(),
                        });
                      }
                      state.runCircuit(c.scenarios[0]!.id);
                    }}
                  >
                    <span>{c.n}</span>
                    <small>{c.sub}</small>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          data.pathways.groups.map(([g, name]) => (
            <div key={g}>
              <h3>{name}</h3>
              <ul>
                {data.pathways.pathways
                  .filter((p) => p.g === g)
                  .map((p) => (
                    <li key={p.id}>
                      <button type="button" onClick={() => activatePathway(p.id)}>
                        <span>{p.n}</span>
                        {p.sub && <small>{p.sub}</small>}
                      </button>
                    </li>
                  ))}
              </ul>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
