import type { ModelSpecification, SimulationAdapter, SimulationInput } from '@neuroatlas/schemas';
import {
  type MessagePortLike,
  type SimulationResult,
  createInProcessAdapter,
  createWorkerAdapter,
  detectSpikes,
  mergeChunks,
} from '@neuroatlas/simulation';
import type { SimulationChunk } from '@neuroatlas/schemas';
import { create } from 'zustand';

type Status = 'idle' | 'running' | 'done' | 'cancelled' | 'error';

interface SimulationState {
  status: Status;
  error: string | null;
  input: SimulationInput | null;
  result: SimulationResult | null;
  spikes: number[];
  elapsedMs: number | null;
  /** Dónde se ejecutó: Worker dedicado o hilo principal (respaldo). */
  backend: 'worker' | 'main-thread' | null;
  run(spec: ModelSpecification, input: SimulationInput): Promise<void>;
  cancel(): void;
}

let worker: Worker | null = null;
let workerFailed = false;
let controller: AbortController | null = null;

function getAdapter(spec: ModelSpecification): {
  adapter: SimulationAdapter;
  backend: 'worker' | 'main-thread';
} {
  if (!workerFailed && typeof Worker !== 'undefined') {
    try {
      worker ??= new Worker(new URL('./simulation.worker.ts', import.meta.url), { type: 'module' });
      return {
        adapter: createWorkerAdapter(spec, worker as unknown as MessagePortLike),
        backend: 'worker',
      };
    } catch {
      workerFailed = true;
    }
  }
  return { adapter: createInProcessAdapter(spec), backend: 'main-thread' };
}

export const useSimulationStore = create<SimulationState>((set) => ({
  status: 'idle',
  error: null,
  input: null,
  result: null,
  spikes: [],
  elapsedMs: null,
  backend: null,

  async run(spec, input) {
    controller?.abort();
    const local = new AbortController();
    controller = local;
    const { adapter, backend } = getAdapter(spec);
    const check = adapter.validate(input);
    if (!check.ok) {
      set({ status: 'error', error: check.errors.join(' '), input, backend });
      return;
    }
    set({ status: 'running', error: null, input, backend });
    const started = performance.now();
    const chunks: SimulationChunk[] = [];
    try {
      for await (const chunk of adapter.run(input, local.signal)) {
        chunks.push(chunk);
      }
      const result = mergeChunks(chunks);
      set({
        status: 'done',
        result,
        spikes: detectSpikes(result.time, result.variables.v?.values ?? []),
        elapsedMs: performance.now() - started,
      });
    } catch (error) {
      if (local.signal.aborted || (error instanceof Error && error.name === 'AbortError')) {
        if (controller === local) set({ status: 'cancelled' });
      } else {
        set({ status: 'error', error: error instanceof Error ? error.message : String(error) });
      }
    }
  },

  cancel() {
    controller?.abort();
  },
}));
