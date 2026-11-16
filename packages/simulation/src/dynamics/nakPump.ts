/** Ciclo Post–Albers: Post et al. (1969), Journal of Biological Chemistry; Albers (1967), Annual Review of Biochemistry. Tiempo en segundos; esquema de estados, no cinética molecular medida. */
export const NAK_PUMP_STATES = [
  {
    id: 'e1_na',
    label: 'Unión de sodio citosólico',
    naBound: 3,
    kBound: 0,
    side: 'cyt',
    phosphorylated: false,
    description: 'E1 une tres iones de sodio del citosol.',
  },
  {
    id: 'e1p_na',
    label: 'Sodio ocluido',
    naBound: 3,
    kBound: 0,
    side: 'occluded',
    phosphorylated: true,
    description: 'La fosforilación ocluye el sodio.',
  },
  {
    id: 'e2p',
    label: 'Liberación de sodio',
    naBound: 0,
    kBound: 0,
    side: 'ext',
    phosphorylated: true,
    description: 'Se liberan tres iones de sodio al exterior.',
  },
  {
    id: 'e2p_k',
    label: 'Unión de potasio externo',
    naBound: 0,
    kBound: 2,
    side: 'ext',
    phosphorylated: true,
    description: 'Se unen dos iones de potasio externos.',
  },
  {
    id: 'e2_k',
    label: 'Potasio ocluido',
    naBound: 0,
    kBound: 2,
    side: 'occluded',
    phosphorylated: false,
    description: 'La desfosforilación ocluye el potasio.',
  },
  {
    id: 'e1',
    label: 'Liberación de potasio',
    naBound: 0,
    kBound: 0,
    side: 'cyt',
    phosphorylated: false,
    description: 'Se liberan dos iones de potasio al citosol.',
  },
] as const;
export const NAK_PUMP_STOICHIOMETRY = {
  naOut: 3,
  kIn: 2,
  atp: 1,
  netPositiveChargeOut: 1,
} as const;
export function pumpPhase(tSeconds: number, cyclesPerSecond: number) {
  const total = Math.max(0, tSeconds * cyclesPerSecond),
    cycles = Math.floor(total),
    phase = (total - cycles) * 6;
  return {
    stateIndex: Math.min(5, Math.floor(phase)),
    progress: phase - Math.floor(phase),
    cycles,
  };
}
