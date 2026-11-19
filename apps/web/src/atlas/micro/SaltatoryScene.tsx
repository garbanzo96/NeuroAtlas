import { Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { useHolo, useParts, useReducedMotion } from './geom2';

const parts = {
  nodo: {
    title: 'Nodo de Ranvier',
    body: 'Los nodos son interrupciones de la mielina donde se concentran canales iónicos. La señal se regenera en estos puntos. Esta representación es esquemática y no muestra distancias ni velocidades medidas.',
  },
};

export default function SaltatoryScene() {
  useParts(parts);
  const reduced = useReducedMotion();
  const [phase, setPhase] = useState(0);
  const { material } = useHolo('nodo', '#65baff', 0.04, 0.55);
  const pulses = useRef<THREE.Group>(null);
  const arcs = useMemo(
    () =>
      [-4, 0, 4].map(
        (x) =>
          new THREE.QuadraticBezierCurve3(
            new THREE.Vector3(x - 1.8, 1.5, 0),
            new THREE.Vector3(x, 2.8, 0),
            new THREE.Vector3(x + 1.8, 1.5, 0),
          ),
      ),
    [],
  );
  useFrame(({ clock }) => {
    if (!pulses.current) return;
    const t = reduced ? phase / 4 : (clock.elapsedTime % 6) / 6;
    pulses.current.children.forEach((child, i) => {
      child.position.x = i === 0 ? -6 + Math.floor(t * 4) * 4 : -6 + t * 12;
    });
  });
  return (
    <group>
      {reduced && (
        <Html position={[-6, 5, 0]} className="na-scene-tag">
          <label>
            Avance{' '}
            <select value={phase} onChange={(e) => setPhase(Number(e.target.value))}>
              {[0, 1, 2, 3].map((i) => (
                <option value={i} key={i}>
                  Nodo {i + 1}
                </option>
              ))}
            </select>
          </label>
        </Html>
      )}
      {[1.5, -2.5].map((y) => (
        <mesh key={y} position={[0, y, 0]} rotation={[0, 0, Math.PI / 2]} material={material}>
          <cylinderGeometry args={[0.42, 0.42, 14, 32]} />
        </mesh>
      ))}
      {[-4, 0, 4].map((x) => (
        <group key={x} position={[x, 1.5, 0]} rotation={[0, 0, Math.PI / 2]}>
          {[0.7, 0.85, 1].map((r) => (
            <mesh key={r} material={material}>
              <cylinderGeometry args={[r, r, 3.2, 32, 1, true]} />
            </mesh>
          ))}
        </group>
      ))}
      {[-6, -2, 2, 6].map((x) => (
        <group key={x} position={[x, 1.5, 0]}>
          {Array.from({ length: 8 }, (_, i) => (
            <mesh
              key={i}
              position={[0, Math.cos((i * Math.PI) / 4) * 0.5, Math.sin((i * Math.PI) / 4) * 0.5]}
              material={material}
            >
              <sphereGeometry args={[0.13, 8, 6]} />
            </mesh>
          ))}
        </group>
      ))}
      {arcs.map((curve, i) => (
        <mesh key={i}>
          <tubeGeometry args={[curve, 24, 0.025, 6, false]} />
          <meshBasicMaterial color="#5ee6ff" transparent opacity={0.35} />
        </mesh>
      ))}
      <group ref={pulses}>
        {[1.5, -2.5].map((y) => (
          <mesh key={y} position={[-6, y, 0]}>
            <sphereGeometry args={[0.35, 16, 12]} />
            <meshBasicMaterial color="#a8efff" />
          </mesh>
        ))}
      </group>
      <Html position={[-6, 3.8, 0]} className="na-scene-tag">
        Axón mielinizado · conducción saltatoria
      </Html>
      <Html position={[-2, 2.2, 0]} className="na-scene-tag">
        Nodo de Ranvier
      </Html>
      <Html position={[-6, -4, 0]} className="na-scene-tag">
        Axón amielínico · conducción continua, más lenta
      </Html>
      <Html position={[-6, -5, 0]} className="na-scene-tag">
        Esquema · tiempos y distancias ilustrativos
      </Html>
    </group>
  );
}
