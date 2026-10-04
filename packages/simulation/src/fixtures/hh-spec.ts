import { ModelSpecification, type SimulationInput } from '@neuroatlas/schemas';

/**
 * Ficha mínima para pruebas del paquete de simulación. La ficha real vive en
 * content/models/ y se prueba contra la misma referencia en @neuroatlas/data-pipeline.
 */
export function makeHHTestSpec(): ModelSpecification {
  const param = (id: string, value: number, units: string, adjustable = false) => ({
    id,
    symbol: id,
    value,
    units,
    description: { es: id },
    sourceId: 'src.test',
    locator: 'pending',
    locatorVerified: false,
    adjustable,
    ...(adjustable ? { range: [0, 500] as [number, number] } : {}),
  });
  return ModelSpecification.parse({
    id: 'model.test_hh',
    version: 1,
    name: { es: 'HH de prueba' },
    formalism: 'conductance_based',
    implementation: 'hh_classic_v1',
    contextId: 'ctx.test',
    description: { es: 'prueba' },
    conventions: { es: 'prueba' },
    equations: [{ id: 'v', latex: 'C dV/dt = ...', description: { es: 'prueba' } }],
    stateVariables: [
      { id: 'v', symbol: 'V', units: 'mV', description: { es: 'V' }, initialValue: -65 },
      { id: 'm', symbol: 'm', units: '1', description: { es: 'm' }, initialValue: 0.05 },
      { id: 'h', symbol: 'h', units: '1', description: { es: 'h' }, initialValue: 0.6 },
      { id: 'n', symbol: 'n', units: '1', description: { es: 'n' }, initialValue: 0.32 },
    ],
    parameters: [
      param('c_m', 1, 'uF/cm^2'),
      param('g_na', 120, 'mS/cm^2', true),
      param('g_k', 36, 'mS/cm^2', true),
      param('g_l', 0.3, 'mS/cm^2'),
      param('e_na', 50, 'mV'),
      param('e_k', -77, 'mV'),
      param('e_l', -54.387, 'mV'),
      param('temperature', 6.3, 'degC'),
    ],
    inputs: [
      {
        id: 'amplitude',
        units: 'uA/cm^2',
        description: { es: 'a' },
        range: [-20, 150],
        default: 10,
      },
    ],
    observables: [
      { id: 'v', units: 'mV', description: { es: 'v' } },
      { id: 'm', units: '1', description: { es: 'm' } },
      { id: 'h', units: '1', description: { es: 'h' } },
      { id: 'n', units: '1', description: { es: 'n' } },
      { id: 'i_na', units: 'uA/cm^2', description: { es: 'i_na' } },
      { id: 'i_k', units: 'uA/cm^2', description: { es: 'i_k' } },
      { id: 'i_l', units: 'uA/cm^2', description: { es: 'i_l' } },
      { id: 'i_ext', units: 'uA/cm^2', description: { es: 'i_ext' } },
    ],
    solver: { method: 'rk4', defaultDt: 0.01, maxDt: 0.05, dtUnits: 'ms', notes: { es: 'prueba' } },
    assumptions: [{ es: 'prueba' }],
    validity: { es: 'prueba' },
    limitations: [{ es: 'prueba' }],
    sourceIds: ['src.test'],
    status: 'draft',
    provenance: { author: 't', extractor: 'humano:t', createdOn: '2026-10-04', method: 't' },
  });
}

export function stepInput(
  amplitude: number,
  start: number,
  duration: number,
  total: number,
  dt = 0.01,
  solver: 'rk4' | 'euler' = 'rk4',
): SimulationInput {
  return {
    modelId: 'model.test_hh',
    modelVersion: 1,
    protocol:
      amplitude === 0
        ? { kind: 'none' }
        : {
            kind: 'current_step',
            amplitude,
            amplitudeUnits: 'uA/cm^2',
            start,
            duration,
            timeUnits: 'ms',
          },
    duration: total,
    dt,
    timeUnits: 'ms',
    sampleEvery: 1,
    solver,
    initialConditions: 'rest',
    parameterOverrides: {},
    seed: null,
  };
}
