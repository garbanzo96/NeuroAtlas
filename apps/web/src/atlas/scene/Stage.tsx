import { Bvh, CameraControls, Sparkles } from '@react-three/drei';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Bloom, EffectComposer, Vignette } from '@react-three/postprocessing';
import { Suspense, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import type { AtlasData } from '../data';
import { LEVELS, levelForDistance } from '../levels';
import { useAtlas } from '../store';
import { Anatomy, type HoverIndex } from './Anatomy';
import { MicroScenes } from '../micro';
import { Pathways } from './Pathways';

/** Fondo: azul marino que cae a negro, dibujado en pantalla completa (el bloom necesita un fondo propio). */
function Backdrop() {
  const mat = useRef(
    new THREE.ShaderMaterial({
      depthTest: false,
      depthWrite: false,
      vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.9999, 1.0); }`,
      fragmentShader: `varying vec2 vUv;
        void main(){
          vec2 p = vUv - vec2(0.5, 0.62);
          float r = length(p * vec2(1.25, 1.0));
          vec3 navy = vec3(0.020, 0.055, 0.135);
          vec3 deep = vec3(0.004, 0.010, 0.030);
          vec3 col = mix(navy, deep, smoothstep(0.0, 0.85, r));
          col = mix(col, vec3(0.0), smoothstep(0.35, 1.0, 1.0 - vUv.y) * 0.55);
          gl_FragColor = vec4(col, 1.0);
        }`,
    }),
  );
  return (
    <mesh frustumCulled={false} renderOrder={-10} material={mat.current}>
      <planeGeometry args={[2, 2]} />
    </mesh>
  );
}

type V3 = [number, number, number];
const VIEWS: Record<'sistema' | 'encefalo' | 'areas', { pos: V3; target: V3 }> = {
  sistema: { pos: [120, -25, 200], target: [0, -62, 0] },
  encefalo: { pos: [30, 9, 27], target: [0, 0, 0] },
  areas: { pos: [14, 5, 12.5], target: [0, -0.5, 0] },
};

function CameraRig({ index }: { index: HoverIndex | null }) {
  const ref = useRef<CameraControls>(null);
  const camera = useAtlas((s) => s.camera);
  const intro = useRef(false);

  useEffect(() => {
    const c = ref.current;
    if (!c || intro.current) return;
    intro.current = true;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    void c.setLookAt(...VIEWS.sistema.pos, ...VIEWS.sistema.target, false);
    if (!reduced) {
      c.smoothTime = 1.1;
      setTimeout(() => {
        void c.setLookAt(...VIEWS.encefalo.pos, ...VIEWS.encefalo.target, true);
        setTimeout(() => (c.smoothTime = 0.45), 2200);
      }, 500);
    } else void c.setLookAt(...VIEWS.encefalo.pos, ...VIEWS.encefalo.target, false);
  }, []);

  useEffect(() => {
    const c = ref.current;
    if (!c || !camera) return;
    const cmd = camera.command;
    if (cmd.type === 'home')
      void c.setLookAt(...VIEWS.encefalo.pos, ...VIEWS.encefalo.target, true);
    if (cmd.type === 'level') {
      const v = VIEWS[cmd.level as keyof typeof VIEWS];
      if (v) void c.setLookAt(...v.pos, ...v.target, true);
    }
    const box =
      cmd.type === 'box'
        ? new THREE.Box3(new THREE.Vector3(...cmd.min), new THREE.Vector3(...cmd.max))
        : cmd.type === 'mesh'
          ? index?.boxes.get(cmd.name)
          : undefined;
    if (box) {
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3()).length();
      const dir = c.camera.position.clone().sub(c.getTarget(new THREE.Vector3())).normalize();
      const dist = THREE.MathUtils.clamp(size * 1.9, 7, cmd.type === 'box' ? 260 : 24);
      const pos = center.clone().addScaledVector(dir, dist);
      void c.setLookAt(pos.x, pos.y, pos.z, center.x, center.y, center.z, true);
    }
  }, [camera, index]);

  // El nivel anatómico se deduce de la distancia: acercarse o alejarse cambia de nivel.
  useFrame(() => {
    const c = ref.current;
    const s = useAtlas.getState();
    if (!c || LEVELS.find((l) => l.id === s.level)?.scene !== 'anatomy') return;
    const lvl = levelForDistance(c.distance);
    if (lvl !== s.level) s.setLevel(lvl);
  });

  return (
    <CameraControls
      ref={ref}
      makeDefault
      minDistance={2.5}
      maxDistance={320}
      dollyToCursor
      smoothTime={0.45}
      draggingSmoothTime={0.12}
    />
  );
}

/** Proyecta el ancla del hover a pantalla y la escribe en variables CSS (sin re-render de React). */
function LabelTracker() {
  const { camera, size } = useThree();
  const cur = useRef({ x: 0, y: 0, init: false });
  const v = useRef(new THREE.Vector3());
  useFrame((_, dt) => {
    const el = document.getElementById('na-hover');
    const hover = useAtlas.getState().hover;
    if (!el || !hover) {
      cur.current.init = false;
      return;
    }
    v.current.set(...hover.anchor).project(camera);
    const tx = (v.current.x * 0.5 + 0.5) * size.width;
    const ty = (-v.current.y * 0.5 + 0.5) * size.height;
    const c = cur.current;
    if (!c.init) Object.assign(c, { x: tx, y: ty, init: true });
    const k = 1 - Math.exp(-dt * 16);
    c.x += (tx - c.x) * k;
    c.y += (ty - c.y) * k;
    el.style.setProperty('--x', `${c.x.toFixed(1)}px`);
    el.style.setProperty('--y', `${c.y.toFixed(1)}px`);
  });
  return null;
}

export function Stage({ data }: { data: AtlasData }) {
  const [index, setIndex] = useState<HoverIndex | null>(null);
  const select = useAtlas((s) => s.select);
  const level = useAtlas((s) => s.level);
  const micro = LEVELS.find((l) => l.id === level)?.scene === 'micro';
  return (
    <Canvas
      className="na-canvas"
      dpr={[1, 2]}
      camera={{ fov: 32, near: 0.1, far: 2000, position: [120, -25, 200] }}
      gl={{ antialias: false, powerPreference: 'high-performance' }}
      onPointerMissed={() => select(null)}
    >
      <Backdrop />
      <Sparkles
        count={260}
        scale={[260, 260, 260]}
        size={1.4}
        speed={0.15}
        opacity={0.35}
        color="#7fb6ff"
      />
      <group visible={!micro}>
        <Suspense fallback={null}>
          <Bvh firstHitOnly={false}>
            <Anatomy data={data} onIndex={setIndex} />
          </Bvh>
          <Pathways data={data} />
        </Suspense>
      </group>
      {micro && <MicroScenes level={level} />}
      <CameraRig index={index} />
      <LabelTracker />
      <EffectComposer multisampling={4}>
        <Bloom
          mipmapBlur
          intensity={0.95}
          luminanceThreshold={0.08}
          luminanceSmoothing={0.3}
          radius={0.72}
        />
        <Vignette eskil={false} offset={0.25} darkness={0.7} />
      </EffectComposer>
    </Canvas>
  );
}
