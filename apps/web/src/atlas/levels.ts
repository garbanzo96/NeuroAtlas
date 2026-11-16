/** Niveles de organización, de mayor a menor escala espacial. */
export type LevelId =
  'sistema' | 'encefalo' | 'areas' | 'circuito' | 'neurona' | 'sinapsis' | 'molecula';

export interface Level {
  id: LevelId;
  name: string;
  space: string;
  time: string;
  /** Escena 3D: `anatomy` es continua (se pasa de un nivel a otro con el zoom); el resto son escenas propias. */
  scene: 'anatomy' | 'micro';
}

export const LEVELS: readonly Level[] = [
  { id: 'sistema', name: 'Sistema nervioso', space: '1 m', time: 'ms – años', scene: 'anatomy' },
  { id: 'encefalo', name: 'Encéfalo', space: '10 cm', time: '10 ms – s', scene: 'anatomy' },
  { id: 'areas', name: 'Áreas y núcleos', space: '1 cm', time: 'ms – s', scene: 'anatomy' },
  { id: 'circuito', name: 'Columnas y redes', space: '1 mm', time: 'ms – s', scene: 'micro' },
  { id: 'neurona', name: 'Neurona', space: '100 µm', time: '0,1 – 100 ms', scene: 'micro' },
  { id: 'sinapsis', name: 'Sinapsis', space: '1 µm', time: 'ms – h', scene: 'micro' },
  { id: 'molecula', name: 'Membrana y moléculas', space: '10 nm', time: 'µs – ms', scene: 'micro' },
];

export const levelIndex = (id: LevelId) => LEVELS.findIndex((l) => l.id === id);

/** Distancia de cámara (cm) a la que cada nivel anatómico toma el relevo. */
export const ANATOMY_DISTANCE = { sistema: 95, encefalo: 26 } as const;

export function levelForDistance(d: number): LevelId {
  if (d > ANATOMY_DISTANCE.sistema) return 'sistema';
  if (d > ANATOMY_DISTANCE.encefalo) return 'encefalo';
  return 'areas';
}
