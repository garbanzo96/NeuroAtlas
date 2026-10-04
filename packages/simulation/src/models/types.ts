import type { StimulusProtocol } from '@neuroatlas/schemas';

/** Modelo compilado con parámetros concretos: solo matemáticas, sin I/O ni renderizado. */
export interface CompiledModel {
  /** Orden de las variables de estado en los vectores `y`. */
  readonly stateIds: readonly string[];
  /** Estado estacionario sin estímulo. */
  restState(): number[];
  /** Escribe dy/dt en `out`. `iExt` en las unidades del protocolo del modelo. */
  derivatives(t: number, y: ArrayLike<number>, iExt: number, out: number[]): void;
  /** Observables en el instante t (incluye variables de estado y derivadas, p. ej. corrientes). */
  observe(t: number, y: ArrayLike<number>, iExt: number): Record<string, number>;
}

/**
 * Implementación registrada de un modelo. Declara los parámetros, variables y observables
 * que espera con sus unidades exactas; la ficha (ModelSpecification) en content/ debe coincidir.
 */
export interface ModelImplementation {
  readonly key: string;
  readonly parameters: Readonly<Record<string, string>>;
  readonly stateVariables: Readonly<Record<string, string>>;
  readonly observables: Readonly<Record<string, string>>;
  readonly protocols: ReadonlyArray<StimulusProtocol['kind']>;
  create(parameters: Readonly<Record<string, number>>): CompiledModel;
}
