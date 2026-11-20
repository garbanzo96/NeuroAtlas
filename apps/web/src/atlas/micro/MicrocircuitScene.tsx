import { Html, type CameraControls } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { dynamics } from '@neuroatlas/simulation';
import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { assetUrl, loadMicrocircuits, type Microcircuit } from '../data';
import { useAtlas } from '../store';
import { useReducedMotion } from './geom2';

type GeometryMap = Record<string, THREE.BufferGeometry>;
function morphologyGeometry(points: number[]) {
  const bounds = new THREE.Box3();
  for (let i = 0; i < points.length; i += 8)
    bounds.expandByPoint(new THREE.Vector3(points[i], points[i + 1], points[i + 2]));
  const somaIndex =
    Array.from({ length: points.length / 8 }, (_, i) => i).find((i) => points[i * 8 + 4] === 1) ??
    0;
  const center = new THREE.Vector3(
    points[somaIndex * 8],
    points[somaIndex * 8 + 1],
    points[somaIndex * 8 + 2],
  );
  const size = bounds.getSize(new THREE.Vector3());
  const scale = 2.8 / Math.max(size.x, size.y, size.z, 1);
  const positions: number[] = [];
  const distances: number[] = [];
  const types: number[] = [];
  const add = (i: number) => {
    distances.push(points[i * 8 + 6]!);
    types.push(points[i * 8 + 4]!);
    positions.push(
      (points[i * 8]! - center.x) * scale,
      (points[i * 8 + 1]! - center.y) * scale,
      (points[i * 8 + 2]! - center.z) * scale,
    );
  };
  for (let i = 0; i < points.length / 8; i++) {
    const parent = points[i * 8 + 5]!;
    if (parent >= 0 && points[i * 8 + 4] !== 1) {
      add(parent);
      add(i);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('pathDistance', new THREE.Float32BufferAttribute(distances, 1));
  geometry.setAttribute('branchType', new THREE.Float32BufferAttribute(types, 1));
  return geometry;
}

function Signal({
  edge,
  from,
  to,
  pulses,
  start,
}: {
  edge: Microcircuit['edges'][number];
  from: [number, number, number];
  to: [number, number, number];
  pulses: { t0: number; t1: number }[];
  start: React.RefObject<number>;
}) {
  const marker = useRef<THREE.Group>(null);
  const reduced = useReducedMotion();
  const curve = useMemo(() => {
    const a = new THREE.Vector3(...from),
      b = new THREE.Vector3(...to);
    const middle = a
      .clone()
      .add(b)
      .multiplyScalar(0.5)
      .add(new THREE.Vector3(0, 0, 1.2));
    if (a.distanceTo(b) < 0.01)
      return new THREE.QuadraticBezierCurve3(
        a,
        a.clone().add(new THREE.Vector3(2, 2, 0)),
        a.clone().add(new THREE.Vector3(0.1, 0, 0)),
      );
    return new THREE.QuadraticBezierCurve3(a, middle, b);
  }, [from, to]);
  const geometry = useMemo(() => {
    const points = curve.getPoints(32);
    return new THREE.BufferGeometry().setFromPoints(
      points.flatMap((p, i) => (i ? [points[i - 1]!, p] : [])),
    );
  }, [curve]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  useFrame(({ clock }) => {
    if (marker.current) {
      const time = clock.elapsedTime - start.current;
      const pulse = pulses.find((p) => time >= p.t0 && time <= p.t1);
      marker.current.visible = !!pulse && !reduced;
      if (pulse) {
        const phase = (time - pulse.t0) / (pulse.t1 - pulse.t0);
        marker.current.children.forEach((child, i) => {
          child.visible = phase >= i * 0.035;
          child.position.copy(curve.getPoint(Math.max(0, phase - i * 0.035)));
        });
      }
    }
  });
  const color = edge.sign === 'exc' ? '#7dffb2' : '#ff5c8a';
  return (
    <>
      <lineSegments geometry={geometry}>
        <lineBasicMaterial color={color} transparent opacity={0.32} />
      </lineSegments>
      <group ref={marker}>
        {[0, 1, 2].map((i) => (
          <mesh key={i}>
            {edge.sign === 'exc' ? (
              <sphereGeometry args={[0.17 - i * 0.035, 8, 6]} />
            ) : (
              <boxGeometry args={[0.22, 0.075, 0.075]} />
            )}
            <meshBasicMaterial color={edge.sign === 'exc' && i === 0 ? '#effff7' : color} />
          </mesh>
        ))}
      </group>
      <mesh position={curve.getPoint(0.96)}>
        {edge.sign === 'exc' ? (
          <coneGeometry args={[0.1, 0.22, 6]} />
        ) : (
          <boxGeometry args={[0.3, 0.045, 0.045]} />
        )}
        <meshBasicMaterial color={color} transparent opacity={0.7} />
      </mesh>
    </>
  );
}

function Morphology({ geometry }: { geometry: THREE.BufferGeometry }) {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: { wave: { value: -100 }, uActive: { value: 0 } },
        vertexShader: `attribute float pathDistance; attribute float branchType; varying float d; varying float kind; void main(){d=pathDistance;kind=branchType;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
        fragmentShader: `uniform float wave; uniform float uActive; varying float d; varying float kind; void main(){float pulse=uActive*exp(-abs(wave-d)/35.)*step(1.5,kind)*step(kind,2.5); vec3 col=vec3(.2,.55,.85)*.33+vec3(.8,.95,1.)*pulse;gl_FragColor=vec4(col,.33+pulse);}`,
      }),
    [],
  );
  useEffect(() => () => material.dispose(), [material]);
  return <lineSegments name="morphology" geometry={geometry} material={material} />;
}

function Circuit({ circuit }: { circuit: Microcircuit }) {
  const [geometries, setGeometries] = useState<GeometryMap>({});
  const run = useAtlas((s) => s.circuitRun);
  const reduced = useReducedMotion();
  const group = useRef<THREE.Group>(null);
  const labels = useRef<(HTMLSpanElement | null)[]>([]);
  const anchors = useRef<(THREE.Group | null)[]>([]);
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const controls = useThree((s) => s.controls) as unknown as CameraControls | null;
  const size = useThree((s) => s.size);
  const sheet = useAtlas((s) => s.sheet);
  const labelPoint = useMemo(() => new THREE.Vector3(), []);
  useEffect(() => {
    const controller = new AbortController();
    let owned: GeometryMap = {};
    const ids = [...new Set(circuit.cells.flatMap((c) => (c.morphology ? [c.morphology] : [])))];
    void Promise.all(
      ids.map(async (id) => {
        const response = await fetch(assetUrl(`neurons/${id}.json`), { signal: controller.signal });
        if (!response.ok) throw new Error(`Morfología no disponible: ${id}`);
        const data = (await response.json()) as { points: number[] };
        return [id, morphologyGeometry(data.points)] as const;
      }),
    )
      .then((entries) => {
        owned = Object.fromEntries(entries);
        if (controller.signal.aborted) Object.values(owned).forEach((g) => g.dispose());
        else setGeometries(owned);
      })
      .catch((e: unknown) => {
        if (!controller.signal.aborted) console.error(e);
      });
    return () => {
      controller.abort();
      Object.values(owned).forEach((g) => g.dispose());
    };
  }, [circuit]);
  // Fit the transformed morphology bounds, including the second reference copy.
  useEffect(() => {
    if (!controls || Object.keys(geometries).length === 0) return;
    const bounds = new THREE.Box3();
    for (const cell of circuit.cells) {
      const geometry = cell.morphology && geometries[cell.morphology];
      if (geometry) {
        geometry.computeBoundingBox();
        const transform = new THREE.Matrix4().compose(
          new THREE.Vector3(...cell.position),
          new THREE.Quaternion().setFromEuler(new THREE.Euler(...cell.rotation)),
          new THREE.Vector3().setScalar(cell.scale),
        );
        bounds.union(geometry.boundingBox!.clone().applyMatrix4(transform));
        const copy = new THREE.Matrix4().compose(
          new THREE.Vector3(0.7, -0.2, -0.6),
          new THREE.Quaternion().setFromEuler(new THREE.Euler(0.05, 0.3, 0.08)),
          new THREE.Vector3().setScalar(0.82),
        );
        bounds.union(geometry.boundingBox!.clone().applyMatrix4(transform.clone().multiply(copy)));
      } else {
        bounds.expandByPoint(new THREE.Vector3(...cell.position));
      }
    }
    const sphere = bounds.getBoundingSphere(new THREE.Sphere());
    const radius = sphere.radius * 1.15;
    const panel = sheet && size.width > 900 ? Math.min(420, size.width * 0.4) : 0;
    const aspect = (size.width - panel) / size.height;
    const vertical = THREE.MathUtils.degToRad(camera.fov / 2);
    const horizontal = Math.atan(Math.tan(vertical) * aspect);
    const distance = radius / Math.sin(Math.min(vertical, horizontal));
    // Looking to the right places the circuit at the centre of the unobstructed viewport.
    const offset = (panel / size.width) * distance * Math.tan(vertical) * camera.aspect;
    const target = sphere.center.clone().add(new THREE.Vector3(offset, 0, 0));
    void controls.setLookAt(
      target.x,
      target.y,
      target.z + distance,
      target.x,
      target.y,
      target.z,
      !reduced,
    );
  }, [camera, circuit, controls, geometries, reduced, sheet, size]);
  const scenario = circuit.scenarios.find((s) => s.id === run?.scenario);
  const result = useMemo(
    () =>
      dynamics.simulateSignedGraph(
        { nodes: circuit.cells.map((c) => ({ id: c.id, basal: 0.15 })), edges: circuit.edges },
        { stim: scenario?.stim ?? [], lesions: run?.lesions ?? [] },
        { dt: 0.05, T: 8, tau: 0.35 },
      ),
    [circuit, scenario, run],
  );
  const start = useRef(0);
  useEffect(() => {
    start.current = -1;
  }, [run]);
  useFrame(({ clock }) => {
    if (!group.current) return;
    const boxes = anchors.current
      .flatMap((anchor, i) => {
        if (!anchor) return [];
        anchor.getWorldPosition(labelPoint).project(camera);
        const el = labels.current[i];
        return [
          {
            i,
            x: (labelPoint.x * 0.5 + 0.5) * size.width,
            y: (-labelPoint.y * 0.5 + 0.5) * size.height,
            w: el?.offsetWidth ?? 0,
            dy: 0,
          },
        ];
      })
      .sort((a, b) => a.y - b.y);
    boxes.forEach((box, k) => {
      for (const other of boxes.slice(0, k)) {
        if (
          Math.abs(box.x - other.x) < (box.w + other.w) / 2 + 6 &&
          box.y + box.dy < other.y + other.dy + 15
        )
          box.dy = other.y + other.dy + 15 - box.y;
      }
      const el = labels.current[box.i];
      if (el) el.style.transform = box.dy ? `translateY(${Math.round(box.dy)}px)` : '';
    });
    if (start.current < 0) start.current = clock.elapsedTime;
    const index = Math.min(
      result.t.length - 1,
      Math.floor((clock.elapsedTime - start.current) / 0.05),
    );
    group.current.children.forEach((child, i) => {
      const soma = child.getObjectByName('soma') as THREE.Mesh | undefined;
      if (soma) {
        const material = soma.material as THREE.MeshBasicMaterial;
        const rate = result.activity[i]?.[index] ?? 0;
        const time = clock.elapsedTime - start.current;
        const phase = (time * (0.35 + rate * 1.5)) % 1;
        const incoming = scenario
          ? result.pulses.filter(
              (p) =>
                circuit.edges[p.edge]?.to === circuit.cells[i]?.id &&
                time >= p.t1 &&
                time < p.t1 + 0.2,
            )
          : [];
        const firing =
          scenario &&
          result.pulses.some(
            (p) =>
              circuit.edges[p.edge]?.from === circuit.cells[i]?.id &&
              time >= p.t0 &&
              time < p.t0 + 0.16,
          );
        const excitation = incoming.some((p) => circuit.edges[p.edge]?.sign === 'exc');
        const inhibition = incoming.some((p) => circuit.edges[p.edge]?.sign === 'inh');
        material.opacity = reduced
          ? 0.35
          : inhibition
            ? 0.08
            : excitation || firing
              ? 1
              : 0.2 + rate * 0.35 + (scenario && phase < 0.14 ? rate * 0.6 : 0);
        const morph = child.getObjectByName('morphology') as THREE.LineSegments | undefined;
        if (morph) {
          const shader = morph.material as THREE.ShaderMaterial;
          shader.uniforms.wave!.value = phase * 3000;
          shader.uniforms.uActive!.value = reduced || !scenario ? 0 : rate;
        }
      }
    });
  });
  const cells = new Map(circuit.cells.map((c) => [c.id, c]));
  return (
    <>
      {circuit.layers.map((layer, i) => {
        const height = 10 / circuit.layers.length;
        const y = 5 - i * height;
        return (
          <group key={layer} position={[0, y, -2]}>
            <mesh position={[0, -height / 2, 0]}>
              <planeGeometry args={[14, height]} />
              <meshBasicMaterial color="#65baff" transparent opacity={0.014} depthWrite={false} />
            </mesh>
            <mesh>
              <planeGeometry args={[14, 0.025]} />
              <meshBasicMaterial color="#65baff" transparent opacity={0.32} depthWrite={false} />
            </mesh>
            <group position={[-7, 0, 0]} ref={(el) => void (anchors.current[i] = el)}>
              <Html zIndexRange={[5, 0]} pointerEvents="none" className="na-scene-tag">
                <span ref={(el) => void (labels.current[i] = el)}>{layer}</span>
              </Html>
            </group>
          </group>
        );
      })}
      <group ref={group}>
        {circuit.cells.map((cell, i) => (
          <group key={cell.id} position={cell.position} rotation={cell.rotation} scale={cell.scale}>
            {cell.morphology && geometries[cell.morphology] ? (
              <>
                <Morphology geometry={geometries[cell.morphology]!} />
                <group position={[0.7, -0.2, -0.6]} rotation={[0.05, 0.3, 0.08]} scale={0.82}>
                  <Morphology geometry={geometries[cell.morphology]!} />
                </group>
              </>
            ) : (
              <mesh>
                <sphereGeometry args={[0.18, 12, 8]} />
                <meshBasicMaterial color="#65baff" transparent opacity={0.25} />
              </mesh>
            )}
            <mesh name="soma">
              <sphereGeometry args={[0.13, 12, 8]} />
              <meshBasicMaterial
                color="#bcecff"
                transparent
                opacity={0.45}
                blending={THREE.AdditiveBlending}
                depthWrite={false}
              />
            </mesh>
            <group
              position={[0, -0.35, 0]}
              ref={(el) => void (anchors.current[circuit.layers.length + i] = el)}
            >
              <Html center zIndexRange={[5, 0]} pointerEvents="none" className="na-scene-tag">
                <span ref={(el) => void (labels.current[circuit.layers.length + i] = el)}>
                  {cell.name}
                  {cell.schematic ? ' · esquema' : ''}
                </span>
              </Html>
            </group>
          </group>
        ))}
      </group>
      {circuit.edges.map((edge, i) => (
        <Signal
          key={i}
          edge={edge}
          from={cells.get(edge.from)!.position}
          to={cells.get(edge.to)!.position}
          pulses={scenario ? result.pulses.filter((p) => p.edge === i) : []}
          start={start}
        />
      ))}
    </>
  );
}

export default function MicrocircuitScene() {
  const variant = useAtlas((s) => s.variant);
  const [circuits, setCircuits] = useState<Microcircuit[]>([]);
  useEffect(() => {
    void loadMicrocircuits().then(setCircuits);
  }, []);
  const circuit = circuits.find((c) => c.id === variant);
  return circuit ? <Circuit key={circuit.id} circuit={circuit} /> : null;
}
