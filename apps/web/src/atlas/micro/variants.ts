import type { LevelId } from '../levels';

/** Variantes que ofrece cada escena micro (la escena lee `useAtlas().variant`; null = la primera). */
export const MICRO_VARIANTS: Partial<Record<LevelId, { id: string; label: string }[]>> = {
  circuito: [
    { id: 'columna', label: 'Columna cortical' },
    { id: 'microcircuito', label: 'Microcircuito canónico' },
    { id: 'oscilacion', label: 'Ritmo E/I' },
    { id: 'red', label: 'Red de espigas' },
  ],
  sinapsis: [
    { id: 'quimica', label: 'Sinapsis química glutamatérgica' },
    { id: 'inhibitoria', label: 'GABAérgica' },
    { id: 'electrica', label: 'Sinapsis eléctrica' },
    { id: 'plasticidad', label: 'Plasticidad a corto plazo' },
  ],
};
