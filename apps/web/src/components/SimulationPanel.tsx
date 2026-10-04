import type { SimulationInput } from '@neuroatlas/schemas';
import { ColorScaleLegend, TimeSeriesChart, nearestIndex } from '@neuroatlas/viewer-2d';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DOWNLOADS_SUPPORTED } from '../runtime';
import { useSimulationStore } from '../simulation/simulation-store';
import { useAppStore } from '../state/store';
import type { SimulationProtocolState } from '../state/url';
import { ModelCard } from './ModelCard';

const PRESETS: Array<{ label: string; protocol: Partial<SimulationProtocolState> }> = [
  {
    label: 'Pulso subumbral (2 µA/cm², 1 ms)',
    protocol: { amplitude: 2, start: 5, duration: 1, total: 30 },
  },
  {
    label: 'Pulso supraumbral (20 µA/cm², 1 ms)',
    protocol: { amplitude: 20, start: 5, duration: 1, total: 30 },
  },
  {
    label: 'Escalón sostenido (10 µA/cm², 80 ms)',
    protocol: { amplitude: 10, start: 10, duration: 80, total: 100 },
  },
];

const SPEEDS = [1, 5, 20];

function toInput(
  modelId: string,
  modelVersion: number,
  p: SimulationProtocolState,
): SimulationInput {
  return {
    modelId,
    modelVersion,
    protocol:
      p.amplitude === 0 || p.duration === 0
        ? { kind: 'none' }
        : {
            kind: 'current_step',
            amplitude: p.amplitude,
            amplitudeUnits: 'uA/cm^2',
            start: p.start,
            duration: p.duration,
            timeUnits: 'ms',
          },
    duration: p.total,
    dt: p.dt,
    timeUnits: 'ms',
    sampleEvery: Math.max(1, Math.round(0.05 / p.dt)),
    solver: 'rk4',
    initialConditions: 'rest',
    parameterOverrides: {},
    seed: null,
  };
}

function download(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 1)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Experimento reproducible: protocolo → simulación en Worker → curvas con unidades y cursor de
 * tiempo compartido con el visor 3D. El tiempo del modelo y la velocidad de reproducción se muestran por separado.
 */
export function SimulationPanel() {
  const kb = useAppStore((s) => s.kb)!;
  const selection = useAppStore((s) => s.selection)!;
  const protocol = useAppStore((s) => s.protocol);
  const setProtocol = useAppStore((s) => s.setProtocol);
  const setTimeCursor = useAppStore((s) => s.setTimeCursor);
  const reducedMotion = useAppStore((s) => s.reducedMotion);
  const sim = useSimulationStore();
  const scene = kb.scene(selection.sceneId)!;
  const spec = kb.model(scene.simulation!.modelId)!;
  const mapping = scene.simulation!.visualMappings[0];
  const [speed, setSpeed] = useState(5);
  const [playing, setPlaying] = useState(false);
  const raf = useRef<number | null>(null);

  const run = useCallback(() => {
    void sim.run(spec, toInput(spec.id, spec.version, protocol));
  }, [sim, spec, protocol]);

  // Primera ejecución al entrar en la escena, con el protocolo actual (p. ej. el del enlace).
  const ranOnce = useRef(false);
  useEffect(() => {
    if (!ranOnce.current) {
      ranOnce.current = true;
      run();
    }
  }, [run]);

  const result = sim.result;
  const runId = result?.runId ?? '';

  // Tras cada ejecución, situar el cursor en el máximo de V (momento más ilustrativo).
  useEffect(() => {
    if (!result) return;
    const v = result.variables.v?.values ?? [];
    let iMax = 0;
    v.forEach((x, i) => {
      if (x > v[iMax]!) iMax = i;
    });
    setTimeCursor(result.runId, result.time[iMax] ?? 0);
  }, [result, setTimeCursor]);

  // Reproducción: avanza el cursor a `speed` ms de modelo por segundo real.
  useEffect(() => {
    if (!playing || !result) return;
    let last = performance.now();
    const end = result.time[result.time.length - 1] ?? 0;
    const tick = (now: number) => {
      const state = useAppStore.getState();
      const current = state.selection?.timeCursor?.value ?? 0;
      const next = current + ((now - last) / 1000) * speed;
      last = now;
      if (next >= end) {
        state.setTimeCursor(result.runId, end);
        setPlaying(false);
        return;
      }
      state.setTimeCursor(result.runId, next);
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => {
      if (raf.current !== null) cancelAnimationFrame(raf.current);
    };
  }, [playing, result, speed]);

  const cursor = selection.timeCursor?.runId === runId ? selection.timeCursor.value : null;
  const cursorValue = useMemo(() => {
    if (!result || cursor === null || !mapping) return null;
    return result.variables[mapping.variable]?.values[nearestIndex(result.time, cursor)] ?? null;
  }, [result, cursor, mapping]);

  const onCursor = (t: number) => {
    setPlaying(false);
    setTimeCursor(runId, t);
  };

  const exportRun = () => {
    if (!result || !sim.input) return;
    download(`neuroatlas-${spec.id}-${runId.replace(/[^a-z0-9]+/gi, '_')}.json`, {
      generator: 'NeuroAtlas',
      release: kb.release.id,
      exportedAt: new Date().toISOString(),
      note: 'Resultados de simulación de un modelo; no son registros experimentales.',
      model: spec,
      input: sim.input,
      backend: sim.backend,
      spikeTimes_ms: sim.spikes,
      result,
    });
  };

  const v = result?.variables;
  return (
    <section className="na-sim" aria-labelledby="na-sim-title">
      <h2 id="na-sim-title">Experimento: {spec.name.es}</h2>
      <p className="na-hint">
        Las curvas son resultados del modelo (simulación), no mediciones. Corriente positiva =
        despolarizante; I_Na negativa = entrante.
      </p>
      <form
        className="na-sim__form"
        onSubmit={(e) => {
          e.preventDefault();
          run();
        }}
      >
        <div className="na-sim__presets" role="group" aria-label="Protocolos predefinidos">
          {PRESETS.map((preset) => (
            <button key={preset.label} type="button" onClick={() => setProtocol(preset.protocol)}>
              {preset.label}
            </button>
          ))}
        </div>
        <label>
          Amplitud (µA/cm²)
          <input
            type="number"
            step={0.5}
            min={-20}
            max={150}
            value={protocol.amplitude}
            onChange={(e) => setProtocol({ amplitude: Number(e.target.value) })}
          />
        </label>
        <label>
          Inicio (ms)
          <input
            type="number"
            step={0.5}
            min={0}
            value={protocol.start}
            onChange={(e) => setProtocol({ start: Number(e.target.value) })}
          />
        </label>
        <label>
          Duración del estímulo (ms)
          <input
            type="number"
            step={0.5}
            min={0}
            value={protocol.duration}
            onChange={(e) => setProtocol({ duration: Number(e.target.value) })}
          />
        </label>
        <label>
          Tiempo simulado (ms)
          <select
            value={protocol.total}
            onChange={(e) => setProtocol({ total: Number(e.target.value) })}
          >
            {[30, 50, 100, 200, 500].map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
        <label>
          Paso dt (ms)
          <select value={protocol.dt} onChange={(e) => setProtocol({ dt: Number(e.target.value) })}>
            {[0.005, 0.01, 0.02, 0.05].map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
        <div className="na-sim__actions">
          {sim.status === 'running' ? (
            <button type="button" onClick={sim.cancel}>
              Cancelar
            </button>
          ) : (
            <button type="submit" className="na-primary">
              Ejecutar simulación
            </button>
          )}
          <button
            type="button"
            onClick={exportRun}
            disabled={!result || !DOWNLOADS_SUPPORTED}
            title={
              DOWNLOADS_SUPPORTED
                ? undefined
                : 'Esta vista previa no permite descargas; usa la versión local o GitHub Pages.'
            }
          >
            Exportar experimento (JSON)
          </button>
        </div>
      </form>
      <p className="na-sim__status" role="status" aria-live="polite">
        {sim.status === 'running' && 'Simulando…'}
        {sim.status === 'error' && <span className="na-error">Entrada no válida: {sim.error}</span>}
        {sim.status === 'cancelled' && 'Simulación cancelada.'}
        {sim.status === 'done' &&
          result &&
          `Listo: ${result.time.length} muestras en ${sim.elapsedMs?.toFixed(0)} ms (${
            sim.backend === 'worker' ? 'Web Worker' : 'hilo principal'
          }); ${sim.spikes.length} potencial(es) de acción${
            sim.spikes.length ? ` a t = ${sim.spikes.map((t) => t.toFixed(2)).join(', ')} ms` : ''
          }.`}
      </p>
      {result && v && (
        <>
          <div className="na-sim__playback" role="group" aria-label="Reproducción">
            <button type="button" onClick={() => setPlaying((p) => !p)} disabled={!result}>
              {playing ? 'Pausar' : 'Reproducir'}
            </button>
            <label>
              Velocidad
              <select value={speed} onChange={(e) => setSpeed(Number(e.target.value))}>
                {SPEEDS.map((s) => (
                  <option key={s} value={s}>
                    {s} ms de modelo por segundo
                  </option>
                ))}
              </select>
            </label>
            <label className="na-sim__scrub">
              Cursor (ms)
              <input
                type="range"
                min={0}
                max={result.time[result.time.length - 1]}
                step={0.05}
                value={cursor ?? 0}
                onChange={(e) => onCursor(Number(e.target.value))}
              />
              <output>{cursor !== null ? cursor.toFixed(2) : '—'}</output>
            </label>
            {reducedMotion && (
              <span className="na-muted">
                Movimiento reducido: la reproducción solo avanza si la inicias.
              </span>
            )}
          </div>
          {mapping && (
            <ColorScaleLegend
              title="Mapeo en el visor 3D"
              domain={mapping.domain}
              units={mapping.units}
              description={mapping.legend.es}
              value={cursorValue}
            />
          )}
          <div className="na-sim__charts">
            <TimeSeriesChart
              title="Potencial de membrana"
              time={result.time}
              timeUnits="ms"
              yLabel="V (mV)"
              yDomain={[-90, 60]}
              cursor={cursor}
              onCursorChange={onCursor}
              series={[{ id: 'v', label: 'V', units: 'mV', values: v.v!.values, color: '#4cc9f0' }]}
            />
            <TimeSeriesChart
              title="Corrientes de membrana"
              time={result.time}
              timeUnits="ms"
              yLabel="I (µA/cm²)"
              cursor={cursor}
              onCursorChange={onCursor}
              series={[
                {
                  id: 'i_na',
                  label: 'I_Na',
                  units: 'µA/cm²',
                  values: v.i_na!.values,
                  color: '#f72585',
                },
                {
                  id: 'i_k',
                  label: 'I_K',
                  units: 'µA/cm²',
                  values: v.i_k!.values,
                  color: '#ffb703',
                },
                {
                  id: 'i_l',
                  label: 'I_L',
                  units: 'µA/cm²',
                  values: v.i_l!.values,
                  color: '#8d99ae',
                },
                {
                  id: 'i_ext',
                  label: 'I_ext',
                  units: 'µA/cm²',
                  values: v.i_ext!.values,
                  color: '#06d6a0',
                  dashed: true,
                },
              ]}
            />
            <TimeSeriesChart
              title="Variables de compuerta"
              time={result.time}
              timeUnits="ms"
              yLabel="probabilidad (adim.)"
              yDomain={[0, 1]}
              cursor={cursor}
              onCursorChange={onCursor}
              series={[
                { id: 'm', label: 'm', units: '1', values: v.m!.values, color: '#f72585' },
                {
                  id: 'h',
                  label: 'h',
                  units: '1',
                  values: v.h!.values,
                  color: '#c8b6ff',
                  dashed: true,
                },
                { id: 'n', label: 'n', units: '1', values: v.n!.values, color: '#ffb703' },
              ]}
            />
          </div>
        </>
      )}
      <ModelCard spec={spec} />
    </section>
  );
}
