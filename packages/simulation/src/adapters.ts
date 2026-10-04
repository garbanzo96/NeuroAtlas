import type {
  ModelSpecification,
  SimulationAdapter,
  SimulationChunk,
  SimulationInput,
} from '@neuroatlas/schemas';
import { AbortError, integrate, validateInput } from './runner';

// ---------------------------------------------------------------------------
// Protocolo de mensajes con el Worker
// ---------------------------------------------------------------------------

export type WorkerRequest =
  | { type: 'run'; runId: string; spec: ModelSpecification; input: SimulationInput }
  | { type: 'cancel'; runId: string };

export type WorkerResponse =
  | { type: 'chunk'; chunk: SimulationChunk }
  | { type: 'error'; runId: string; message: string }
  | { type: 'cancelled'; runId: string };

/** Interfaz mínima de un Worker (o de su ámbito global), para no depender del DOM. */
export interface MessagePortLike {
  postMessage(message: unknown): void;
  addEventListener(type: 'message', listener: (event: { data: unknown }) => void): void;
  removeEventListener(type: 'message', listener: (event: { data: unknown }) => void): void;
}

const yieldToEventLoop = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

/**
 * Lógica del lado Worker: ejecuta la simulación por chunks y cede el control entre
 * ellos para poder recibir cancelaciones. Se instala desde el archivo de entrada del Worker.
 */
export function serveSimulations(scope: MessagePortLike): void {
  const cancelled = new Set<string>();
  scope.addEventListener('message', (event) => {
    const msg = event.data as WorkerRequest;
    if (msg.type === 'cancel') {
      cancelled.add(msg.runId);
      return;
    }
    if (msg.type !== 'run') return;
    void (async () => {
      try {
        for (const chunk of integrate(msg.spec, msg.input, { runId: msg.runId })) {
          if (cancelled.has(msg.runId)) {
            cancelled.delete(msg.runId);
            scope.postMessage({ type: 'cancelled', runId: msg.runId } satisfies WorkerResponse);
            return;
          }
          scope.postMessage({ type: 'chunk', chunk } satisfies WorkerResponse);
          await yieldToEventLoop();
        }
      } catch (error) {
        scope.postMessage({
          type: 'error',
          runId: msg.runId,
          message: error instanceof Error ? error.message : String(error),
        } satisfies WorkerResponse);
      }
    })();
  });
}

let runCounter = 0;
function newRunId(modelId: string): string {
  runCounter += 1;
  return `${modelId}#${Date.now().toString(36)}-${runCounter}`;
}

/** Adaptador que ejecuta en el hilo actual (pruebas, entornos sin Worker). */
export function createInProcessAdapter(spec: ModelSpecification): SimulationAdapter {
  return {
    modelId: spec.id,
    modelVersion: spec.version,
    describe: async () => spec,
    validate: (input) => validateInput(spec, input),
    async *run(input, signal) {
      const runId = newRunId(spec.id);
      for (const chunk of integrate(spec, input, { runId, signal })) {
        if (signal.aborted) throw new AbortError();
        yield chunk;
        await yieldToEventLoop();
      }
    },
  };
}

/** Adaptador que delega la integración en un Worker dedicado. */
export function createWorkerAdapter(
  spec: ModelSpecification,
  worker: MessagePortLike,
): SimulationAdapter {
  return {
    modelId: spec.id,
    modelVersion: spec.version,
    describe: async () => spec,
    validate: (input) => validateInput(spec, input),
    run(input, signal) {
      const runId = newRunId(spec.id);
      const queue: WorkerResponse[] = [];
      let wake: (() => void) | null = null;
      const listener = (event: { data: unknown }) => {
        const msg = event.data as WorkerResponse;
        const id = msg.type === 'chunk' ? msg.chunk.runId : msg.runId;
        if (id !== runId) return;
        queue.push(msg);
        wake?.();
      };
      const onAbort = () => {
        worker.postMessage({ type: 'cancel', runId } satisfies WorkerRequest);
        queue.push({ type: 'cancelled', runId });
        wake?.();
      };
      return {
        async *[Symbol.asyncIterator]() {
          worker.addEventListener('message', listener);
          signal.addEventListener('abort', onAbort, { once: true });
          worker.postMessage({ type: 'run', runId, spec, input } satisfies WorkerRequest);
          try {
            while (true) {
              while (queue.length === 0) await new Promise<void>((r) => (wake = r));
              wake = null;
              const msg = queue.shift()!;
              if (msg.type === 'cancelled') throw new AbortError();
              if (msg.type === 'error') throw new Error(msg.message);
              yield msg.chunk;
              if (msg.chunk.done) return;
            }
          } finally {
            worker.removeEventListener('message', listener);
            signal.removeEventListener('abort', onAbort);
          }
        },
      };
    },
  };
}
