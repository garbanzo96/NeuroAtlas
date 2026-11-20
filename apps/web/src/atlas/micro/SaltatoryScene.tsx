import { Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useRef, useState } from 'react';
import type * as THREE from 'three';
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
  const currents = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!pulses.current) return;
    const t = reduced ? phase / 4 : (clock.elapsedTime % 6) / 6;
    if (currents.current) {
      currents.current.children.forEach((child, i) => {
        child.position.x = -6 + ((t * 12 + i * 0.65) % 12);
      });
    }
    pulses.current.children.forEach((child, i) => {
      child.position.x = i === 0 ? -6 + Math.min(3, Math.floor(t * 5)) * 4 : -6 + t * 12;
    });
  });
  return (
    <group>
      {reduced && (
        <Html zIndexRange={[5, 0]} position={[-6, 5, 0]} className="na-scene-tag">
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
      <group ref={currents}>
        {Array.from({ length: 18 }, (_, i) => (
          <mesh key={i} position={[-6 + i * 0.65, 1.5, 0.48]}>
            <boxGeometry args={[0.3, 0.035, 0.035]} />
            <meshBasicMaterial color="#5ee6ff" transparent opacity={0.7} />
          </mesh>
        ))}
      </group>
      <group ref={pulses}>
        {[1.5, -2.5].map((y) => (
          <mesh key={y} position={[-6, y, 0]} rotation={[0, Math.PI / 2, 0]}>
            <torusGeometry args={[0.55, 0.07, 8, 32]} />
            <meshBasicMaterial color="#a8efff" />
          </mesh>
        ))}
      </group>
      <Html zIndexRange={[5, 0]} position={[-6, 3.8, 0]} className="na-scene-tag">
        Axón mielinizado · conducción saltatoria · llega primero
      </Html>
      <Html zIndexRange={[5, 0]} position={[-2, 2.2, 0]} className="na-scene-tag">
        Nodo de Ranvier
      </Html>
      <Html zIndexRange={[5, 0]} position={[-6, -4, 0]} className="na-scene-tag">
        Axón amielínico · conducción continua, más lenta
      </Html>
      <Html zIndexRange={[5, 0]} position={[-6, -5, 0]} className="na-scene-tag">
        Esquema · tiempos y distancias ilustrativos
      </Html>
    </group>
  );
}
