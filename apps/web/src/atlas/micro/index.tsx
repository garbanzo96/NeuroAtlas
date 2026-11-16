import type { CameraControls } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import { type ComponentType, Suspense, lazy, useEffect } from 'react';
import type { LevelId } from '../levels';

/**
 * Contrato de escena micro: un componente R3F sin props, centrado en el origen, que cabe en una esfera
 * de radio ~10 unidades y declara su encuadre inicial en `MICRO_VIEWS`.
 */
const SCENES: Partial<Record<LevelId, ComponentType>> = {
  circuito: lazy(() => import('./ColumnScene')),
  neurona: lazy(() => import('./NeuronScene')),
  sinapsis: lazy(() => import('./SynapseScene')),
  molecula: lazy(() => import('./MembraneScene')),
};

export const MICRO_VIEWS: Partial<
  Record<LevelId, { pos: [number, number, number]; target: [number, number, number] }>
> = {
  circuito: { pos: [9, 4, 16], target: [-0.5, 0, 0] },
  neurona: { pos: [0, 2, 26], target: [0, 0, 0] },
  sinapsis: { pos: [5, 3, 17], target: [0, 0.8, 0] },
  molecula: { pos: [12, 6, 16], target: [0, 0, 0] },
};

export const hasMicroScene = (level: LevelId) => !!SCENES[level];

export function MicroScenes({ level }: { level: LevelId }) {
  const controls = useThree((s) => s.controls) as unknown as CameraControls | null;
  useEffect(() => {
    const v = MICRO_VIEWS[level];
    if (!controls || !v) return;
    void controls.setLookAt(
      ...(v.pos.map((x) => x * 2.2) as [number, number, number]),
      ...v.target,
      false,
    );
    void controls.setLookAt(...v.pos, ...v.target, true);
  }, [controls, level]);
  const Scene = SCENES[level];
  return Scene ? (
    <Suspense fallback={null}>
      <Scene key={level} />
    </Suspense>
  ) : null;
}
