import { Html, type CameraControls } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { assetUrl } from '../data';
import { useAtlas } from '../store';
import { useReducedMotion } from './geom2';

type Light = 'oscuro' | 'centro' | 'periferia';
type Point = [number, number, number];
const blue = '#75caff';
const green = '#80ffc0';
const magenta = '#ff659e';
const layers: [string, string, number][] = [
  ['EPR', 'Epitelio pigmentario', 5.3],
  ['SE', 'Segmentos externos', 4.45],
  ['ONL', 'Capa nuclear externa', 3.35],
  ['OPL', 'Capa plexiforme externa', 2.25],
  ['INL', 'Capa nuclear interna', 1.05],
  ['IPL', 'Capa plexiforme interna', -0.3],
  ['GCL', 'Capa ganglionar', -2.55],
  ['FNO', 'Fibras del nervio óptico', -3.55],
];

function Fibre({
  points,
  color = blue,
  radius = 0.035,
  opacity = 0.65,
}: {
  points: Point[];
  color?: string;
  radius?: number;
  opacity?: number;
}) {
  const geometry = useMemo(
    () =>
      new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p))),
        24,
        radius,
        6,
        false,
      ),
    [points, radius],
  );
  useEffect(() => () => geometry.dispose(), [geometry]);
  return (
    <mesh geometry={geometry}>
      <meshBasicMaterial
        color={color}
        transparent
        opacity={opacity}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </mesh>
  );
}

function Soma({
  position,
  scale = [0.18, 0.24, 0.13],
  color = blue,
}: {
  position: Point;
  scale?: Point;
  color?: string;
}) {
  return (
    <mesh position={position} scale={scale}>
      <sphereGeometry args={[1, 16, 12]} />
      <meshBasicMaterial
        color={color}
        transparent
        opacity={0.52}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </mesh>
  );
}

function Photoreceptor({ x, cone, lit }: { x: number; cone: boolean; lit: boolean }) {
  return (
    <group position={[x, 0, 0]}>
      <mesh position={[0, 4.5, 0]} rotation={[0, 0, Math.PI]}>
        {cone ? (
          <coneGeometry args={[0.22, 0.72, 12]} />
        ) : (
          <cylinderGeometry args={[0.085, 0.085, 1.12, 12]} />
        )}
        <meshBasicMaterial
          color={lit ? '#e4faff' : blue}
          transparent
          opacity={lit ? 0.9 : 0.45}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      <Fibre
        points={[
          [0, 4, 0],
          [0, 3.6, 0],
          [0, 2.58, 0],
        ]}
        radius={0.045}
      />
      <Soma position={[0, 3.32, 0]} scale={[0.15, 0.24, 0.12]} />
      <Soma position={[0, 2.52, 0]} scale={cone ? [0.22, 0.1, 0.12] : [0.1, 0.1, 0.1]} />
      {!lit &&
        [-1, 0, 1].map((i) => (
          <Soma
            key={i}
            position={[i * 0.075, 2.5, 0.14]}
            scale={[0.035, 0.035, 0.035]}
            color={green}
          />
        ))}
    </group>
  );
}

function Branches({
  x,
  y,
  width,
  color = blue,
}: {
  x: number;
  y: number;
  width: number;
  color?: string;
}) {
  return (
    <>
      {[-1, 1].map((side) => (
        <group key={side}>
          <Fibre
            color={color}
            radius={0.035}
            points={[
              [x, y, 0],
              [x + side * width * 0.45, y + 0.15, 0],
              [x + side * width, y + 0.12, 0],
            ]}
          />
          {[0.45, 0.7, 0.9].map((n) => (
            <Fibre
              key={n}
              color={color}
              radius={0.016}
              points={[
                [x + side * width * n, y + 0.13, 0],
                [x + side * width * (n + 0.1), y + 0.32, 0],
                [x + side * width * (n + 0.16), y + 0.36, 0],
              ]}
            />
          ))}
        </group>
      ))}
    </>
  );
}

function ReferenceMorphology({ x }: { x: number }) {
  const [points, setPoints] = useState<number[] | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    void fetch(assetUrl('neurons/ganglionar-retina.json'), { signal: controller.signal })
      .then((r) => {
        if (!r.ok) throw new Error('Morfología ganglionar no disponible');
        return r.json() as Promise<{ points: number[] }>;
      })
      .then((data) => setPoints(data.points))
      .catch((error: unknown) => {
        if (!controller.signal.aborted) console.error(error);
      });
    return () => controller.abort();
  }, []);
  const geometry = useMemo(() => {
    if (!points) return null;
    const bounds = new THREE.Box3();
    for (let i = 0; i < points.length; i += 8)
      bounds.expandByPoint(new THREE.Vector3(points[i], points[i + 1], points[i + 2]));
    const center = bounds.getCenter(new THREE.Vector3());
    const size = bounds.getSize(new THREE.Vector3());
    const scale = 1.65 / Math.max(size.x, size.y, size.z, 1);
    const vertices: number[] = [];
    for (let i = 0; i < points.length / 8; i++) {
      const parent = points[i * 8 + 5]!;
      if (parent < 0) continue;
      const a = new THREE.Vector3(
        points[parent * 8],
        points[parent * 8 + 1],
        points[parent * 8 + 2],
      )
        .sub(center)
        .multiplyScalar(scale);
      const b = new THREE.Vector3(points[i * 8], points[i * 8 + 1], points[i * 8 + 2])
        .sub(center)
        .multiplyScalar(scale);
      const axis = b.clone().sub(a);
      if (axis.lengthSq() < 1e-10) continue;
      const u = new THREE.Vector3()
        .crossVectors(axis.normalize(), new THREE.Vector3(0, 0, 1))
        .normalize()
        .multiplyScalar(0.012);
      if (u.lengthSq() === 0) u.set(0.012, 0, 0);
      vertices.push(
        ...a.clone().add(u).toArray(),
        ...a.clone().sub(u).toArray(),
        ...b.clone().add(u).toArray(),
        ...a.clone().sub(u).toArray(),
        ...b.clone().sub(u).toArray(),
        ...b.clone().add(u).toArray(),
      );
    }
    const result = new THREE.BufferGeometry();
    result.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    return result;
  }, [points]);
  useEffect(() => () => geometry?.dispose(), [geometry]);
  return (
    geometry && (
      <mesh position={[x, -2.48, -0.2]} geometry={geometry}>
        <meshBasicMaterial
          color={blue}
          transparent
          opacity={0.3}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    )
  );
}

function Spike({ x, enabled }: { x: number; enabled: boolean }) {
  const ref = useRef<THREE.Mesh>(null);
  const reduced = useReducedMotion();
  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.visible = enabled && !reduced;
      ref.current.position.x = x + ((clock.elapsedTime * 1.5) % 3);
    }
  });
  return (
    <mesh ref={ref} position={[x, -3.25, 0.1]}>
      <sphereGeometry args={[0.09, 12, 8]} />
      <meshBasicMaterial color="#e8fff5" />
    </mesh>
  );
}

export default function RetinaScene() {
  const [light, setLight] = useState<Light>('oscuro');
  const run = useAtlas((s) => s.circuitRun);
  const sheet = useAtlas((s) => s.sheet);
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const controls = useThree((s) => s.controls) as unknown as CameraControls | null;
  const size = useThree((s) => s.size);
  useEffect(() => {
    if (run?.scenario === 'cono') setLight('centro');
  }, [run]);
  useEffect(() => {
    if (!controls) return;
    const left = size.width > 900 ? 225 : 0;
    const right = size.width > 900 && sheet ? Math.min(420, size.width * 0.4) : 0;
    const usable = Math.max(size.width - left - right, 1);
    const vertical = THREE.MathUtils.degToRad(camera.fov / 2);
    const distance = Math.max(
      7.7 / Math.tan(vertical),
      10.2 / ((Math.tan(vertical) * usable) / size.height),
    );
    const offset = ((right - left) / size.width) * distance * Math.tan(vertical) * camera.aspect;
    void controls.setLookAt(offset - 1.1, 0.8, distance, offset - 1.1, 0.8, 0, false);
  }, [camera, controls, sheet, size]);
  const lesions = run?.lesions ?? [];
  const amacrineActive = run?.scenario === 'amacrina' && !lesions.includes('amacrina');
  const on = light === 'centro' && !lesions.includes('cono');
  const off = light === 'periferia' && !lesions.includes('horizontal');
  return (
    <>
      {layers.map(([abbr, name, y], i) => (
        <group key={abbr}>
          <mesh position={[0, y - 0.38, -0.7]}>
            <planeGeometry args={[9.4, i === 5 ? 1.9 : 0.75]} />
            <meshBasicMaterial
              color="#448ec5"
              transparent
              opacity={i % 2 ? 0.035 : 0.07}
              depthWrite={false}
            />
          </mesh>
          <Html position={[-7.4, y, 0]} className="na-ret-layer" zIndexRange={[5, 0]}>
            <span>
              <b>{abbr}</b> {name}
            </span>
          </Html>
        </group>
      ))}
      <Html position={[-7.4, -0.95, 0]} className="na-ret-sublayer" zIndexRange={[5, 0]}>
        OFF
      </Html>
      <Html position={[-7.4, -1.65, 0]} className="na-ret-sublayer" zIndexRange={[5, 0]}>
        ON
      </Html>
      {light !== 'oscuro' && (
        <mesh position={[light === 'centro' ? 0 : -2.85, 0.65, -0.45]}>
          <coneGeometry args={[1.05, 8.7, 32, 1, true]} />
          <meshBasicMaterial
            color="#fff5bc"
            transparent
            opacity={0.1}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      )}
      <Html position={[2.2, 5.55, 0]} className="na-ret-cell" zIndexRange={[5, 0]}>
        Conos y bastones · esquema
      </Html>
      {Array.from({ length: 13 }, (_, i) => {
        const x = (i - 6) * 0.57;
        return (
          <Photoreceptor
            key={i}
            x={x}
            cone={i % 3 === 0}
            lit={
              light !== 'oscuro' &&
              (light === 'centro' ? Math.abs(x) < 0.8 : Math.abs(x + 2.85) < 0.8)
            }
          />
        );
      })}
      <Soma position={[-2.8, 2, 0]} scale={[0.22, 0.13, 0.12]} />
      <Branches x={-2.8} y={2.05} width={1.7} color={magenta} />
      <Branches x={-1.2} y={2.05} width={1.7} color={magenta} />
      <Fibre
        points={[
          [-2.8, 2.05, 0],
          [-2.8, 2.3, 0],
          [-2.85, 2.52, 0],
        ]}
        color={magenta}
      />
      <Fibre
        points={[
          [-1.2, 2.05, 0],
          [-1.15, 2.3, 0],
          [-1.14, 2.52, 0],
        ]}
        color={magenta}
      />
      <Html position={[-3.5, 1.7, 0]} className="na-ret-cell" zIndexRange={[5, 0]}>
        Horizontal · esquema
      </Html>
      {[-1.8, 1.8].map((x, i) => {
        const active = (i === 0 ? on : off) && !lesions.includes(i === 0 ? 'on' : 'off');
        const ganglionActive =
          active && !amacrineActive && !lesions.includes(i === 0 ? 'gon' : 'goff');
        const ganglionColor = amacrineActive
          ? magenta
          : light === 'oscuro'
            ? blue
            : ganglionActive
              ? green
              : magenta;
        const color = light === 'oscuro' ? blue : active ? green : magenta;
        const end = i === 0 ? -1.65 : -0.95;
        return (
          <group key={x}>
            <Fibre
              points={[
                [x, 2.5, 0],
                [x, 1.35, 0],
                [x, end, 0],
              ]}
              color={color}
              radius={0.045}
            />
            <Soma position={[x, 1.05, 0]} color={color} />
            <Branches x={x} y={end} width={0.65} color={color} />
            <ReferenceMorphology x={x} />
            <Soma position={[x, -2.65, 0]} color={ganglionColor} />
            <Fibre
              points={[
                [x, -2.65, 0],
                [x, -3.25, 0],
                [x + 3, -3.25, 0],
              ]}
              color={ganglionColor}
              radius={0.045}
            />
            <Spike x={x} enabled={ganglionActive} />
            <Html position={[x + 0.9, -2.75, 0]} className="na-ret-cell" zIndexRange={[5, 0]}>
              Ganglionar {i === 0 ? 'ON' : 'OFF'}
            </Html>
            <Html position={[x + 0.45, 0.95, 0]} className="na-ret-cell" zIndexRange={[5, 0]}>
              Bipolar {i === 0 ? 'ON' : 'OFF'} · esquema
            </Html>
          </group>
        );
      })}
      <Soma position={[2.8, -0.05, 0]} scale={[0.18, 0.2, 0.12]} />
      <Fibre
        points={[
          [2.8, -0.05, 0],
          [2.8, -0.8, 0],
          [2.6, -1.2, 0],
        ]}
        color={magenta}
      />
      <Branches x={2.6} y={-1.2} width={1.1} color={magenta} />
      <Html position={[3.1, -0.05, 0]} className="na-ret-cell" zIndexRange={[5, 0]}>
        Amacrina · esquema
      </Html>
      <Html center position={[-1.1, 6.65, 0]} className="na-ret-controls" zIndexRange={[6, 0]}>
        <div role="group" aria-label="Posición de la luz">
          {(['oscuro', 'centro', 'periferia'] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              aria-pressed={light === mode}
              onClick={() => setLight(mode)}
            >
              {mode === 'oscuro' ? 'Oscuro' : `Luz ${mode}`}
            </button>
          ))}
        </div>
        <span aria-live="polite">
          {light === 'oscuro'
            ? 'Oscuridad · glutamato en los pedículos'
            : light === 'centro'
              ? 'Centro iluminado · ON excitada, OFF inhibida'
              : 'Periferia iluminada · ON inhibida, OFF excitada'}
        </span>
      </Html>
      <Html position={[-7.4, -4.2, 0]} className="na-ret-note" zIndexRange={[5, 0]}>
        ↑ Luz entra desde el lado ganglionar
        <br />
        Esquema didáctico · borrador — sin revisión experta
      </Html>
    </>
  );
}
