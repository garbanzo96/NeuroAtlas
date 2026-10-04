import type { ModelSpecification } from '@neuroatlas/schemas';
import { hhClassic } from './hh-classic';
import type { ModelImplementation } from './types';

export const MODEL_IMPLEMENTATIONS: Readonly<Record<string, ModelImplementation>> = {
  [hhClassic.key]: hhClassic,
};

export function getImplementation(key: string): ModelImplementation | undefined {
  return MODEL_IMPLEMENTATIONS[key];
}

/**
 * Comprueba que la ficha del modelo (content/models) y la implementación coinciden en
 * identificadores y unidades. Un desajuste de unidades es un error, nunca una conversión implícita.
 */
export function checkSpecCompatibility(spec: ModelSpecification): string[] {
  const impl = getImplementation(spec.implementation);
  if (!impl) return [`No existe implementación "${spec.implementation}".`];
  const errors: string[] = [];
  const compare = (
    what: string,
    expected: Readonly<Record<string, string>>,
    declared: ReadonlyArray<{ id: string; units: string }>,
    requireAll: boolean,
  ) => {
    const declaredMap = new Map(declared.map((d) => [d.id, d.units]));
    for (const [id, units] of Object.entries(expected)) {
      const got = declaredMap.get(id);
      if (got === undefined) {
        if (requireAll) errors.push(`${what} "${id}" falta en la ficha.`);
      } else if (got !== units) {
        errors.push(`${what} "${id}": la ficha declara ${got}; la implementación usa ${units}.`);
      }
    }
    for (const id of declaredMap.keys()) {
      if (!(id in expected)) errors.push(`${what} "${id}" no existe en la implementación.`);
    }
  };
  compare('Parámetro', impl.parameters, spec.parameters, true);
  compare('Variable de estado', impl.stateVariables, spec.stateVariables, true);
  compare('Observable', impl.observables, spec.observables, false);
  return errors;
}
