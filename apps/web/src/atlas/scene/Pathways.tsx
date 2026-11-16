import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { type AtlasData, type Pathway, resolvePoint } from '../data';
import { useAtlas } from '../store';

export type Direction = 'aferente' | 'eferente' | 'modulador';

export const DIRECTION_COLOR: Record<Direction, string> = {
  aferente: '#5ee6ff',
  eferente: '#ffb057',
  modulador: '#c49bff',
};

const EFF =
  /motoneurona|motor|eferent|descend|corticoespinal|corticobulbar|parasimp|simp[aá]tic|preganglionar|posganglionar/i;
const AFF =
  /sensitiv|aferent|receptor|ganglio de la ra[ií]z|primera neurona|segunda neurona|tercera neurona|ascend|lemnisco|espinotal|retina|coclear|olfat|gustativ|propiocep/i;

export function directionOf(pathway: Pathway, tramoName: string): Direction {
  if (EFF.test(tramoName)) return 'eferente';
  if (AFF.test(tramoName)) return 'aferente';
  if (pathway.g === 'motor') return 'eferente';
  if (pathway.g === 'somato' || pathway.g === 'sentidos') return 'aferente';
  return 'modulador';
}

const vertexShader = `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`;
const fragmentShader = `
  uniform vec3 uColor; uniform float uTime; uniform float uLen; uniform float uReveal; uniform float uFade;
  varying vec2 vUv;
  void main(){
    float s = vUv.x;
    float head = fract(s * uLen / 9.0 - uTime * 0.9);
    float pulse = smoothstep(0.0, 0.05, head) * (1.0 - smoothstep(0.05, 0.5, head));
    float edge = 1.0 - smoothstep(uReveal - 0.04, uReveal, s);
    float a = (0.28 + pulse * 1.6) * edge * uFade;
    gl_FragColor = vec4(uColor * a, a);
  }`;

interface Strand {
  mesh: THREE.Mesh<THREE.TubeGeometry, THREE.ShaderMaterial>;
}

function buildStrands(data: AtlasData, pathway: Pathway): Strand[] {
  return pathway.tramos.flatMap((tramo) => {
    const pts = tramo.pts.map((p) => resolvePoint(data, p)).filter((p): p is THREE.Vector3 => !!p);
    if (pts.length < 2) return [];
    const curve = new THREE.CatmullRomCurve3(pts, false, 'centripetal');
    const len = curve.getLength();
    const geo = new THREE.TubeGeometry(curve, Math.max(32, Math.round(len * 3)), 0.12, 8, false);
    const mat = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uColor: { value: new THREE.Color(DIRECTION_COLOR[directionOf(pathway, tramo.n)]) },
        uTime: { value: 0 },
        uLen: { value: len },
        uReveal: { value: 0 },
        uFade: { value: 1 },
      },
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.renderOrder = 5;
    return [{ mesh }];
  });
}

export function Pathways({ data }: { data: AtlasData }) {
  const id = useAtlas((s) => s.pathway);
  const step = useAtlas((s) => s.pathwayStep);
  const pathway = data.pathways.pathways.find((p) => p.id === id) ?? null;
  const strands = useMemo(() => (pathway ? buildStrands(data, pathway) : []), [data, pathway]);
  const startedAt = useRef(0);
  const marker = useRef<THREE.Mesh>(null);

  useEffect(() => {
    startedAt.current = performance.now();
    return () => strands.forEach((s) => (s.mesh.geometry.dispose(), s.mesh.material.dispose()));
  }, [strands]);

  const stepPoint = useMemo(() => {
    const p = pathway?.pasos[step]?.en;
    return p ? resolvePoint(data, p) : null;
  }, [data, pathway, step]);

  useFrame(({ clock }) => {
    const age = (performance.now() - startedAt.current) / 1000;
    strands.forEach((s, i) => {
      const u = s.mesh.material.uniforms;
      u.uTime!.value = clock.elapsedTime;
      // cada tramo se dibuja después del anterior: se lee el orden de la conducción
      u.uReveal!.value = THREE.MathUtils.clamp((age - i * 0.55) / 1.1, 0, 1) * 1.05;
    });
    if (marker.current && stepPoint) {
      marker.current.position.lerp(stepPoint, 0.12);
      marker.current.scale.setScalar(0.55 + 0.12 * Math.sin(clock.elapsedTime * 4));
    }
  });

  if (!pathway) return null;
  return (
    <group>
      {strands.map((s, i) => (
        <primitive key={i} object={s.mesh} />
      ))}
      {stepPoint && (
        <mesh ref={marker} position={stepPoint} renderOrder={6}>
          <sphereGeometry args={[1, 24, 24]} />
          <meshBasicMaterial
            color="#e8f7ff"
            transparent
            opacity={0.9}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      )}
    </group>
  );
}

/** Caja que encuadra una vía completa. */
export function pathwayBox(data: AtlasData, pathway: Pathway): THREE.Box3 {
  const box = new THREE.Box3();
  for (const t of pathway.tramos)
    for (const p of t.pts) {
      const v = resolvePoint(data, p);
      if (v) box.expandByPoint(v);
    }
  return box;
}
