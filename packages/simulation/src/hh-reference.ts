import type { ModelSpecification, SimulationInput } from '@neuroatlas/schemas';
import reference from './fixtures/hh-neuron-reference.json';
import { detectSpikes, simulate } from './runner';

/**
 * Comparación de una ficha HH contra trazas independientes generadas con NEURON
 * (tools/reference/hh_neuron_reference.py). Se usa en las pruebas de este paquete y
 * en las del contenido real, para que la ficha publicada se compare con la misma referencia.
 */
export interface ReferenceComparison {
  caseName: string;
  restDifference: number;
  spikeCount: { reference: number; model: number };
  maxSpikeTimeDifference: number;
  peakDifference: number;
  rmsVoltageDifference: number;
}

/**
 * Tolerancias con dt = 0.01 ms (RK4). La concordancia observada al generar la referencia
 * (NEURON 9.0.2, usetable_hh = 0) fue ~1e-4 ms en tiempos de espiga y ~1e-4 mV RMS;
 * los márgenes dejan ~50× de holgura sin ocultar errores de transcripción.
 */
export const HH_REFERENCE_TOLERANCES = {
  /** mV */
  rest: 0.001,
  /** ms */
  spikeTime: 0.005,
  /** mV */
  peak: 0.05,
  /** mV, sobre la traza muestreada cada 0.1 ms */
  rms: 0.005,
} as const;

type Case = (typeof reference.cases)[keyof typeof reference.cases];

export function referenceCaseNames(): string[] {
  return Object.keys(reference.cases);
}

export function compareWithReference(
  spec: ModelSpecification,
  caseName: string,
  dt = 0.01,
): ReferenceComparison {
  const ref = (reference.cases as Record<string, Case>)[caseName];
  if (!ref) throw new Error(`Caso de referencia desconocido: ${caseName}`);
  const p = ref.protocol as { kind: string; amplitude?: number; start?: number; duration?: number };
  const input: SimulationInput = {
    modelId: spec.id,
    modelVersion: spec.version,
    protocol:
      p.kind === 'current_step'
        ? {
            kind: 'current_step',
            amplitude: p.amplitude!,
            amplitudeUnits: 'uA/cm^2',
            start: p.start!,
            duration: p.duration!,
            timeUnits: 'ms',
          }
        : { kind: 'none' },
    duration: ref.duration_ms,
    dt,
    timeUnits: 'ms',
    sampleEvery: 1,
    solver: 'rk4',
    initialConditions: 'rest',
    parameterOverrides: {},
    seed: null,
  };
  const result = simulate(spec, input);
  const v = result.variables.v!.values;
  const spikes = detectSpikes(result.time, v);

  const refSpikes = ref.spikeTimes_ms;
  let maxSpikeDiff = 0;
  for (let i = 0; i < Math.min(spikes.length, refSpikes.length); i++)
    maxSpikeDiff = Math.max(maxSpikeDiff, Math.abs(spikes[i]! - refSpikes[i]!));

  // Traza de referencia cada 0.1 ms → índice equivalente en la simulación.
  const stride = Math.round(ref.trace.dt_ms / dt);
  let sq = 0;
  let count = 0;
  for (let i = 0; i < ref.trace.v_mV.length; i++) {
    const simV = v[i * stride];
    if (simV === undefined) break;
    sq += (simV - ref.trace.v_mV[i]!) ** 2;
    count += 1;
  }
  return {
    caseName,
    restDifference: Math.abs(v[0]! - ref.restPotential_mV),
    spikeCount: { reference: refSpikes.length, model: spikes.length },
    maxSpikeTimeDifference: maxSpikeDiff,
    peakDifference: Math.abs(Math.max(...v) - ref.peak_mV),
    rmsVoltageDifference: Math.sqrt(sq / Math.max(count, 1)),
  };
}

export const HH_REFERENCE_PROVENANCE = {
  generator: reference.generator,
  simulator: reference.simulator,
  settings: reference.settings,
};
