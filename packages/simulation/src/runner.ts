import type {
  ModelSpecification,
  SimulationChunk,
  SimulationInput,
  StimulusProtocol,
  ValidationResult,
} from '@neuroatlas/schemas';
import { getImplementation } from './models/registry';
import type { CompiledModel } from './models/types';

/** Límites de protección para ejecución en el navegador. */
export const RUN_LIMITS = {
  maxDuration: 2000,
  maxSamples: 200_000,
  maxSteps: 2_000_000,
} as const;

export class AbortError extends Error {
  constructor() {
    super('Simulación cancelada');
    this.name = 'AbortError';
  }
}

/** Valor del estímulo en t (continuo por la derecha). Se usa para muestrear observables. */
function stimulus(protocol: StimulusProtocol, t: number): number {
  if (protocol.kind === 'current_step') {
    return t >= protocol.start && t < protocol.start + protocol.duration ? protocol.amplitude : 0;
  }
  return 0;
}

/**
 * Estímulo constante a trozos durante el intervalo [t, t + dt]. Con los bordes del
 * protocolo alineados a la malla (ver validateInput), el valor en el punto medio es
 * exacto para todo el intervalo; así RK4 conserva su orden en las discontinuidades.
 */
function stimulusOverStep(protocol: StimulusProtocol, t: number, dt: number): number {
  return stimulus(protocol, t + dt / 2);
}

function isMultipleOf(value: number, dt: number): boolean {
  const ratio = value / dt;
  return Math.abs(ratio - Math.round(ratio)) < 1e-6;
}

/** Parámetros efectivos: valores de la ficha más sobrescrituras permitidas. */
export function effectiveParameters(
  spec: ModelSpecification,
  overrides: Readonly<Record<string, number>>,
): Record<string, number> {
  const params: Record<string, number> = {};
  for (const p of spec.parameters) params[p.id] = p.value;
  for (const [id, value] of Object.entries(overrides)) params[id] = value;
  return params;
}

/** Comprueba una entrada contra la ficha del modelo antes de ejecutar. */
export function validateInput(spec: ModelSpecification, input: SimulationInput): ValidationResult {
  const errors: string[] = [];
  const impl = getImplementation(spec.implementation);
  if (!impl) errors.push(`Implementación desconocida: ${spec.implementation}`);
  if (input.modelId !== spec.id) errors.push(`La entrada es para ${input.modelId}, no ${spec.id}.`);
  if (input.modelVersion !== spec.version)
    errors.push(`Versión de modelo ${input.modelVersion} distinta de la ficha (${spec.version}).`);
  if (impl && !impl.protocols.includes(input.protocol.kind))
    errors.push(`Protocolo "${input.protocol.kind}" no soportado por ${impl.key}.`);
  if (input.dt > spec.solver.maxDt)
    errors.push(
      `dt = ${input.dt} ms supera el máximo estable declarado (${spec.solver.maxDt} ms).`,
    );
  if (input.duration > RUN_LIMITS.maxDuration)
    errors.push(`Duración máxima en el navegador: ${RUN_LIMITS.maxDuration} ms.`);
  const steps = Math.round(input.duration / input.dt);
  if (steps > RUN_LIMITS.maxSteps)
    errors.push(`Demasiados pasos (${steps}); aumenta dt o reduce la duración.`);
  if (steps / input.sampleEvery > RUN_LIMITS.maxSamples)
    errors.push('Demasiadas muestras; aumenta sampleEvery.');
  if (input.protocol.kind === 'current_step') {
    if (
      !isMultipleOf(input.protocol.start, input.dt) ||
      !isMultipleOf(input.protocol.duration, input.dt)
    )
      errors.push('El inicio y la duración del estímulo deben ser múltiplos de dt.');
    const amp = spec.inputs.find((i) => i.id === 'amplitude');
    if (amp && (input.protocol.amplitude < amp.range[0] || input.protocol.amplitude > amp.range[1]))
      errors.push(
        `Amplitud fuera del rango didáctico declarado [${amp.range[0]}, ${amp.range[1]}] ${amp.units}.`,
      );
  }
  for (const [id, value] of Object.entries(input.parameterOverrides)) {
    const p = spec.parameters.find((x) => x.id === id);
    if (!p) errors.push(`Parámetro desconocido: ${id}`);
    else if (!p.adjustable) errors.push(`El parámetro ${id} no es ajustable en esta ficha.`);
    else if (p.range && (value < p.range[0] || value > p.range[1]))
      errors.push(`${id} fuera de rango [${p.range[0]}, ${p.range[1]}] ${p.units}.`);
  }
  if (impl && input.solver !== 'rk4' && input.solver !== 'euler')
    errors.push(`Solver no soportado: ${String(input.solver)}`);
  return errors.length ? { ok: false, errors } : { ok: true };
}

function initialState(model: CompiledModel, input: SimulationInput): number[] {
  if (input.initialConditions === 'rest') return model.restState();
  const ic = input.initialConditions;
  return model.stateIds.map((id) => {
    const value = ic[id];
    if (value === undefined) throw new Error(`Falta condición inicial para ${id}`);
    return value;
  });
}

export interface RunOptions {
  runId: string;
  /** Muestras por chunk emitido. */
  chunkSize?: number;
  signal?: AbortSignal;
}

/**
 * Integra el modelo con paso fijo y emite chunks de muestras. Es independiente del
 * renderizado: el tiempo del modelo avanza por `dt`, nunca por el reloj de la pantalla.
 */
export function* integrate(
  spec: ModelSpecification,
  input: SimulationInput,
  options: RunOptions,
): Generator<SimulationChunk> {
  const check = validateInput(spec, input);
  if (!check.ok) throw new Error(check.errors.join('\n'));
  const impl = getImplementation(spec.implementation)!;
  const model = impl.create(effectiveParameters(spec, input.parameterOverrides));
  const units = impl.observables;
  const observableIds = spec.observables.map((o) => o.id);

  const n = model.stateIds.length;
  let y = initialState(model, input);
  const k1 = new Array<number>(n).fill(0);
  const k2 = new Array<number>(n).fill(0);
  const k3 = new Array<number>(n).fill(0);
  const k4 = new Array<number>(n).fill(0);
  const tmp = new Array<number>(n).fill(0);
  const dt = input.dt;
  const steps = Math.round(input.duration / dt);
  const chunkSize = options.chunkSize ?? 1000;

  let index = 0;
  let times: number[] = [];
  let series: Record<string, number[]> = {};
  const resetBuffers = () => {
    times = [];
    series = Object.fromEntries(observableIds.map((id) => [id, [] as number[]]));
  };
  resetBuffers();

  const sample = (t: number) => {
    const obs = model.observe(t, y, stimulus(input.protocol, t));
    times.push(t);
    for (const id of observableIds) series[id]!.push(obs[id]!);
  };
  const makeChunk = (done: boolean): SimulationChunk => ({
    runId: options.runId,
    index: index++,
    time: { units: 'ms', values: times },
    variables: Object.fromEntries(
      observableIds.map((id) => [id, { units: units[id] ?? '?', values: series[id]! }]),
    ),
    done,
  });

  sample(0);
  for (let step = 0; step < steps; step++) {
    if (options.signal?.aborted) throw new AbortError();
    const t = step * dt;
    const iStep = stimulusOverStep(input.protocol, t, dt);
    if (input.solver === 'euler') {
      model.derivatives(t, y, iStep, k1);
      y = y.map((yi, i) => yi + dt * k1[i]!);
    } else {
      model.derivatives(t, y, iStep, k1);
      for (let i = 0; i < n; i++) tmp[i] = y[i]! + (dt / 2) * k1[i]!;
      model.derivatives(t + dt / 2, tmp, iStep, k2);
      for (let i = 0; i < n; i++) tmp[i] = y[i]! + (dt / 2) * k2[i]!;
      model.derivatives(t + dt / 2, tmp, iStep, k3);
      for (let i = 0; i < n; i++) tmp[i] = y[i]! + dt * k3[i]!;
      model.derivatives(t + dt, tmp, iStep, k4);
      y = y.map((yi, i) => yi + (dt / 6) * (k1[i]! + 2 * k2[i]! + 2 * k3[i]! + k4[i]!));
    }
    if (!y.every(Number.isFinite)) throw new Error(`Inestabilidad numérica en t = ${t + dt} ms`);
    if ((step + 1) % input.sampleEvery === 0) {
      sample((step + 1) * dt);
      if (times.length >= chunkSize && step + 1 < steps) {
        yield makeChunk(false);
        resetBuffers();
      }
    }
  }
  yield makeChunk(true);
}

export interface SimulationResult {
  runId: string;
  time: number[];
  variables: Record<string, { units: string; values: number[] }>;
}

/** Une chunks consecutivos en un único resultado. */
export function mergeChunks(chunks: readonly SimulationChunk[]): SimulationResult {
  const first = chunks[0];
  if (!first) throw new Error('Sin chunks');
  const time: number[] = [];
  const variables: SimulationResult['variables'] = {};
  for (const [id, v] of Object.entries(first.variables))
    variables[id] = { units: v.units, values: [] };
  for (const chunk of chunks) {
    time.push(...chunk.time.values);
    for (const [id, v] of Object.entries(chunk.variables)) variables[id]!.values.push(...v.values);
  }
  return { runId: first.runId, time, variables };
}

/** Ejecución síncrona completa (pruebas, exportación, CLI). */
export function simulate(
  spec: ModelSpecification,
  input: SimulationInput,
  runId = 'run',
): SimulationResult {
  return mergeChunks([...integrate(spec, input, { runId })]);
}

/** Cruces ascendentes de un umbral, interpolados linealmente. */
export function detectSpikes(
  time: readonly number[],
  v: readonly number[],
  threshold = 0,
): number[] {
  const out: number[] = [];
  for (let i = 1; i < v.length; i++) {
    const a = v[i - 1]!;
    const b = v[i]!;
    if (a < threshold && b >= threshold) {
      const frac = (threshold - a) / (b - a);
      out.push(time[i - 1]! + frac * (time[i]! - time[i - 1]!));
    }
  }
  return out;
}
