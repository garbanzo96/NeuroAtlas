import { useEffect, useState } from 'react';
import { playback } from '../scene/Circuits';
import { useAtlas } from '../store';

export function CircuitPanel({ onClose }: { onClose(): void }) {
  const data = useAtlas((s) => s.data)!;
  const id = useAtlas((s) => s.circuit);
  const run = useAtlas((s) => s.circuitRun);
  const circuit = data.circuits.find((c) => c.id === id);
  const [, refresh] = useState(0);
  useEffect(() => {
    const timer = window.setInterval(() => refresh((n) => n + 1), 100);
    const key = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.closest('input,textarea,select,button')) return;
      if (e.code === 'Space') {
        e.preventDefault();
        if (!playback.playing && playback.time >= playback.duration) playback.time = 0;
        playback.playing = !playback.playing;
      }
      if (e.key.toLowerCase() === 'a' && run)
        useAtlas.getState().runCircuit(run.scenario, run.lesions);
    };
    window.addEventListener('keydown', key);
    return () => {
      clearInterval(timer);
      window.removeEventListener('keydown', key);
    };
  }, [run]);
  if (!circuit) return null;
  const scenario = circuit.scenarios.find((s) => s.id === run?.scenario);
  const lesions = run?.lesions ?? [];
  const toggle = (node: string) => {
    const next = lesions.includes(node) ? lesions.filter((x) => x !== node) : [...lesions, node];
    useAtlas.getState().runCircuit(run?.scenario ?? circuit.scenarios[0]!.id, next);
  };
  return (
    <section className="na-path na-circuit" aria-label={`Circuito: ${circuit.n}`}>
      <header>
        <p className="na-kicker">Circuito · {circuit.nature} · borrador — sin revisión experta</p>
        <h2>{circuit.n}</h2>
        <p>Esquema de signos; no es una simulación biofísica.</p>
        <p>{circuit.res}</p>
        <p>Los marcadores indicados representan posiciones esquemáticas.</p>
        <div className="na-circuit__legend">
          <span>
            <i className="na-circuit__comet" />
            Excitación · cometa
          </span>
          <span>
            <i className="na-circuit__dashes" />
            Inhibición · trazos
          </span>
          <span>
            <i className="na-circuit__halo" />
            Modulación · halo
          </span>
        </div>
        <button
          type="button"
          className="na-sheet__close"
          onClick={onClose}
          aria-label="Cerrar circuito"
        >
          ×
        </button>
      </header>
      <div className="na-path__groups">
        <h3>Escenarios</h3>
        <div className="na-circuit__scenarios">
          {circuit.scenarios.map((s) => (
            <button
              key={s.id}
              type="button"
              aria-pressed={run?.scenario === s.id}
              onClick={() => useAtlas.getState().runCircuit(s.id, lesions)}
            >
              {s.n}
            </button>
          ))}
        </div>
        {scenario && <p>{scenario.d}</p>}
        <h3>Reproducción</h3>
        <p>Cámara lenta: 1 s ≈ 10 ms · escala ilustrativa</p>
        <div className="na-path__nav">
          <button
            type="button"
            onClick={() => {
              if (!playback.playing && playback.time >= playback.duration) playback.time = 0;
              playback.playing = !playback.playing;
              refresh((n) => n + 1);
            }}
          >
            {playback.playing ? 'Pausar' : 'Reproducir'}
          </button>
          <button
            type="button"
            onClick={() => {
              playback.playing = false;
              playback.time =
                playback.arrivals.find((t) => t.time > playback.time + 0.01)?.time ??
                playback.duration;
              refresh((n) => n + 1);
            }}
          >
            Paso siguiente
          </button>
        </div>
        <label>
          Velocidad{' '}
          <select
            value={playback.speed}
            onChange={(e) => {
              playback.speed = Number(e.target.value);
              refresh((n) => n + 1);
            }}
          >
            {[0.25, 0.5, 1, 2].map((v) => (
              <option key={v} value={v}>
                ×{v}
              </option>
            ))}
          </select>
        </label>
        <label>
          Tiempo{' '}
          <input
            type="range"
            min="0"
            max={playback.duration}
            step="0.05"
            value={playback.time}
            onChange={(e) => {
              playback.time = Number(e.target.value);
              refresh((n) => n + 1);
            }}
          />
        </label>
        <div className="na-circuit__ticks" aria-label={`${playback.arrivals.length} llegadas`}>
          {playback.arrivals.map((t, i) => (
            <span
              key={i}
              data-sign={t.sign}
              style={{ left: `${(t.time / playback.duration) * 100}%` }}
            />
          ))}
        </div>
        <h3>Lesiones</h3>
        {circuit.nodes.map((n) => (
          <button
            type="button"
            key={n.id}
            className="na-circuit__lesion"
            aria-pressed={lesions.includes(n.id)}
            onClick={() => toggle(n.id)}
          >
            <span>
              {n.n}
              {n.marker ? ' (posición esquemática)' : ''}
            </span>
            <i aria-hidden="true" />
          </button>
        ))}
        <p>Haz clic en un nodo para estimularlo; A repite el último estímulo.</p>
      </div>
    </section>
  );
}
