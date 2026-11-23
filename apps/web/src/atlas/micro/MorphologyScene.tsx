import { Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { assetUrl } from '../data';
import { read } from '../signals';
import { useReducedMotion } from './geom2';

interface Morphology {
  points: number[];
}

function Cell({ data, excitable }: { data: Morphology; excitable: boolean }) {
  const group = useRef<THREE.Group>(null);
  const reduced = useReducedMotion();
  const clock = useRef({ start: -10, previous: -100, lastDemo: -10 });
  const { geometry, material, soma, scale } = useMemo(() => {
    const p = data.points;
    const bounds = new THREE.Box3();
    for (let i = 0; i < p.length; i += 8)
      bounds.expandByPoint(new THREE.Vector3(p[i], p[i + 1], p[i + 2]));
    const center = bounds.getCenter(new THREE.Vector3());
    const size = bounds.getSize(new THREE.Vector3());
    const scale = 15 / Math.max(size.x, size.y, size.z, 1);
    const positions: number[] = [],
      normals: number[] = [],
      distances: number[] = [],
      types: number[] = [];
    const point = (i: number) =>
      new THREE.Vector3(p[i * 8], p[i * 8 + 1], p[i * 8 + 2]).sub(center).multiplyScalar(scale);
    for (let i = 0; i < p.length / 8; i++) {
      const parent = p[i * 8 + 5]!;
      if (parent < 0 || p[i * 8 + 4] === 1) continue;
      const a = point(parent),
        b = point(i),
        axis = b.clone().sub(a);
      if (axis.lengthSq() < 1e-12) continue;
      axis.normalize();
      const u = new THREE.Vector3()
        .crossVectors(
          axis,
          Math.abs(axis.y) < 0.9 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(1, 0, 0),
        )
        .normalize();
      const v = new THREE.Vector3().crossVectors(axis, u).normalize();
      const r0 = Math.max(p[parent * 8 + 3]! * scale, 0.012),
        r1 = Math.max(p[i * 8 + 3]! * scale, 0.012);
      const add = (end: number, angle: number) => {
        const normal = u
          .clone()
          .multiplyScalar(Math.cos(angle))
          .addScaledVector(v, Math.sin(angle));
        const pos = (end ? b : a).clone().addScaledVector(normal, end ? r1 : r0);
        positions.push(pos.x, pos.y, pos.z);
        normals.push(normal.x, normal.y, normal.z);
        distances.push(p[(end ? i : parent) * 8 + 6]!);
        types.push(p[i * 8 + 4]!);
      };
      for (let j = 0; j < 6; j++) {
        const x = (j * Math.PI) / 3,
          y = ((j + 1) * Math.PI) / 3;
        add(0, x);
        add(1, x);
        add(1, y);
        add(0, x);
        add(1, y);
        add(0, y);
      }
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    geometry.setAttribute('pathDistance', new THREE.Float32BufferAttribute(distances, 1));
    geometry.setAttribute('branchType', new THREE.Float32BufferAttribute(types, 1));
    const material = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      uniforms: { wave: { value: -100 }, uActive: { value: 0 } },
      vertexShader: `attribute float pathDistance; attribute float branchType; varying float d; varying float kind; varying vec3 n; varying vec3 eye; void main(){d=pathDistance;kind=branchType;vec4 w=modelMatrix*vec4(position,1.);n=normalize(mat3(modelMatrix)*normal);eye=cameraPosition-w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}`,
      fragmentShader: `uniform float wave; uniform float uActive; varying float d; varying float kind; varying vec3 n; varying vec3 eye; void main(){float rim=pow(1.-abs(dot(normalize(n),normalize(eye))),2.); bool ax=kind>1.5&&kind<2.5; vec3 col=ax?vec3(1.,.58,.22):(kind>3.5&&kind<4.5?vec3(.35,.8,1.):vec3(.12,.5,.85)); float speed=ax?1.:.48; float x=wave*speed-d; float pulse=uActive*exp(-abs(x)/(ax?24.:40.))*step(0.,x+8.)*(ax?1.8:.8)*exp(-d/3000.); float a=.16+.5*rim+pulse; gl_FragColor=vec4(col*a+vec3(pulse*.55),a);}`,
    });
    const si = Math.max(
      0,
      Array.from({ length: p.length / 8 }, (_, i) => i).find((i) => p[i * 8 + 4] === 1) ?? 0,
    );
    return { geometry, material, soma: point(si), scale };
  }, [data]);
  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
    },
    [geometry, material],
  );
  useFrame(({ clock: c }, dt) => {
    const t = c.elapsedTime,
      voltage = read('hh.V', NaN);
    if (!reduced && group.current) group.current.rotation.y += dt * 0.05;
    if (
      !reduced &&
      ((Number.isFinite(voltage) && clock.current.previous < 0 && voltage >= 0) ||
        (!Number.isFinite(voltage) && t - clock.current.lastDemo >= 1.5))
    ) {
      clock.current.start = t;
      clock.current.lastDemo = t;
    }
    clock.current.previous = voltage;
    material.uniforms.wave!.value = (t - clock.current.start) * 800;
    material.uniforms.uActive!.value = reduced || !excitable ? 0 : 1;
  });
  return (
    <>
      <group ref={group}>
        <mesh geometry={geometry} material={material} />
        <mesh position={soma}>
          <sphereGeometry args={[Math.max(data.points[3]! * scale, 0.09), 16, 12]} />
          <meshBasicMaterial
            color="#579ccc"
            transparent
            opacity={0.4}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      </group>
      <mesh position={[-6 + 50 * scale, -7.4, 0]}>
        <boxGeometry args={[100 * scale, 0.025, 0.025]} />
        <meshBasicMaterial color="#a9dcff" />
      </mesh>
      <Html position={[-6, -7.7, 0]} className="na-scene-tag" zIndexRange={[5, 0]}>
        <span className="na-nocaps">100 µm</span>
        {excitable && (
          <>
            <br />
            Propagación didáctica (model_prediction), no simulada en esta morfología
          </>
        )}
      </Html>
    </>
  );
}

export function MorphologyScene({ id }: { id: string }) {
  const [data, setData] = useState<Morphology | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    void fetch(assetUrl(`neurons/${id}.json`), { signal: controller.signal })
      .then((r) => {
        if (!r.ok) throw new Error('Morfología no disponible');
        return r.json() as Promise<Morphology>;
      })
      .then(setData)
      .catch((e: unknown) => {
        if (!controller.signal.aborted) console.error(e);
      });
    return () => controller.abort();
  }, [id]);
  return data ? <Cell data={data} excitable={!['astrocito', 'microglia'].includes(id)} /> : null;
}
