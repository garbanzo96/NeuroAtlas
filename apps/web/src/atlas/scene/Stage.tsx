import { Bvh, CameraControls, PerformanceMonitor, Sparkles } from '@react-three/drei';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Bloom, EffectComposer, Vignette } from '@react-three/postprocessing';
import { Suspense, useEffect, useRef, useState, type RefObject } from 'react';
import * as THREE from 'three';
import { type AtlasData, baseKey, resolvePoint } from '../data';
import { LEVELS, levelForDistance, levelIndex } from '../levels';
import { goToLevel } from '../ui/ScaleRail';
import { useAtlas, type CameraCommand } from '../store';
import { AmbientLabels } from './AmbientLabels';
import { Anatomy, type HoverIndex } from './Anatomy';
import { MicroScenes } from '../micro';
import { Pathways } from './Pathways';
import { Circuits } from './Circuits';
import { Neuromod } from './Neuromod';

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
  sistema: { pos: [150, -40, 290], target: [0, -74, 0] },
  encefalo: { pos: [30, 9, 27], target: [0, 0, 0] },
  areas: { pos: [14, 5, 12.5], target: [0, -0.5, 0] },
};

/** Presión acumulada de la rueda en el tope del zoom: al llenarse, se cruza al nivel vecino. */
const DIVE_THRESHOLD = 700;

function diveTarget(data: AtlasData, dir: 1 | -1) {
  const s = useAtlas.getState();
  const i = levelIndex(s.level);
  if (dir === -1) return i > 0 ? LEVELS[i - 1]!.id : null;
  if (s.level === 'areas') {
    const key = s.hover?.key ?? s.selected;
    const g = key ? data.structures[baseKey(key)]?.g : undefined;
    return g?.startsWith('ctx') ? 'circuito' : 'neurona';
  }
  return i < LEVELS.length - 1 ? LEVELS[i + 1]!.id : null;
}

function CameraRig({
  index,
  data,
  cameraPose,
}: {
  index: HoverIndex | null;
  data: AtlasData;
  cameraPose: RefObject<(() => CameraCommand | null) | null>;
}) {
  const ref = useRef<CameraControls>(null);
  const camera = useAtlas((s) => s.camera);
  const pathway = useAtlas((s) => s.pathway);
  const step = useAtlas((s) => s.pathwayStep);
  const level = useAtlas((s) => s.level);
  const gl = useThree((s) => s.gl);
  const micro = LEVELS.find((l) => l.id === level)?.scene === 'micro';

  useEffect(() => {
    cameraPose.current = () => {
      const c = ref.current;
      if (!c) return null;
      // getPosition excluye el desplazamiento focal del panel (camera.position lo incluye y al restaurar se
      // aplicaría dos veces); con `true` devuelve el destino aunque la cámara esté en vuelo
      const pos = c.getPosition(new THREE.Vector3(), true);
      const target = c.getTarget(new THREE.Vector3(), true);
      return { type: 'pose', pos: [pos.x, pos.y, pos.z], target: [target.x, target.y, target.z] };
    };
    return () => {
      cameraPose.current = null;
    };
  }, [cameraPose]);

  // Con un panel lateral abierto, el centro de interés se corre a la izquierda para no quedar debajo.
  const panelOpen = useAtlas((s) => !!s.sheet || !!s.pathway);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const wide = window.innerWidth > 900;
    void c.setFocalOffset(panelOpen && wide ? Math.min(c.distance, 30) * 0.075 : 0, 0, 0, true);
  }, [panelOpen, camera]);

  // La cámara acompaña el recorrido de una vía, paso a paso.
  const lastStep = useRef<string | null>(null);
  useEffect(() => {
    const c = ref.current;
    const key = `${pathway}:${step}`;
    const prev = lastStep.current;
    lastStep.current = key;
    if (!c || !pathway || !prev?.startsWith(`${pathway}:`)) return;
    const p = data.pathways.pathways.find((x) => x.id === pathway)?.pasos[step]?.en;
    const v = p ? resolvePoint(data, p) : null;
    if (v) void c.moveTo(v.x, v.y, v.z, true);
  }, [data, pathway, step]);

  // Zoom semántico: insistir con la rueda en el tope del zoom cruza de nivel.
  useEffect(() => {
    const el = gl.domElement;
    let pressure = 0;
    let dir: 1 | -1 = 1;
    let decay = 0;
    let cooldownUntil = 0;
    const gauge = () => document.getElementById('na-dive');
    const onWheel = (e: WheelEvent) => {
      const c = ref.current;
      if (!c || performance.now() < cooldownUntil) return;
      const d = e.deltaY < 0 ? 1 : -1;
      const atMin = c.distance <= c.minDistance * 1.12;
      const atMax = c.distance >= c.maxDistance * 0.9;
      const s = useAtlas.getState();
      const isMicro = LEVELS.find((l) => l.id === s.level)?.scene === 'micro';
      const pushing = (d === 1 && atMin) || (d === -1 && isMicro && atMax);
      const target = pushing ? diveTarget(data, d) : null;
      const g = gauge();
      if (!target || d !== dir) {
        pressure = 0;
        dir = d;
      }
      if (!target) {
        g?.removeAttribute('data-on');
        return;
      }
      pressure += Math.min(Math.abs(e.deltaY), 120);
      if (g) {
        g.setAttribute('data-on', '');
        g.style.setProperty('--p', String(Math.min(1, pressure / DIVE_THRESHOLD)));
        g.style.setProperty('--x', `${e.clientX}px`);
        g.style.setProperty('--y', `${e.clientY}px`);
        const label = g.querySelector('span');
        if (label)
          label.textContent = `${d === 1 ? 'Entrar a' : 'Subir a'} ${LEVELS.find((l) => l.id === target)!.name}`;
      }
      clearTimeout(decay);
      decay = window.setTimeout(() => {
        pressure = 0;
        g?.removeAttribute('data-on');
      }, 700);
      if (pressure >= DIVE_THRESHOLD) {
        pressure = 0;
        cooldownUntil = performance.now() + 1800;
        g?.removeAttribute('data-on');
        goToLevel(target);
      }
    };
    el.addEventListener('wheel', onWheel, { passive: true });
    return () => el.removeEventListener('wheel', onWheel);
  }, [gl, data]);
  const intro = useRef(false);

  useEffect(() => {
    const c = ref.current;
    if (!c || intro.current) return;
    intro.current = true;
    const pending = useAtlas.getState().camera?.command;
    // un vuelo a estructura parte del encéfalo; otras órdenes (nivel, pose) fijan su propia vista
    if (pending && pending.type !== 'mesh') return;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    // con una vista en la URL la intro no pasa por «sistema»: en equipos lentos ese nivel pisaba al pedido
    if (reduced || pending || /[?&](n|e|cam|via|circ)=/.test(location.search)) {
      void c.setLookAt(...VIEWS.encefalo.pos, ...VIEWS.encefalo.target, false);
      return;
    }
    void c.setLookAt(...VIEWS.sistema.pos, ...VIEWS.sistema.target, false);
    c.smoothTime = 1.1;
    setTimeout(() => {
      void c.setLookAt(...VIEWS.encefalo.pos, ...VIEWS.encefalo.target, true);
      setTimeout(() => (c.smoothTime = 0.45), 2200);
    }, 500);
  }, []);

  const appliedPose = useRef<number | null>(null);
  useEffect(() => {
    const c = ref.current;
    if (!c || !camera) return;
    const cmd = camera.command;
    if (cmd.type === 'pose' && appliedPose.current === camera.nonce) return;
    const smooth = !matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (cmd.type === 'pose') appliedPose.current = camera.nonce;
    if (cmd.type === 'home')
      void c.setLookAt(...VIEWS.encefalo.pos, ...VIEWS.encefalo.target, smooth);
    if (cmd.type === 'pose') void c.setLookAt(...cmd.pos, ...cmd.target, false);
    if (cmd.type === 'level') {
      const v = VIEWS[cmd.level as keyof typeof VIEWS];
      if (v) void c.setLookAt(...v.pos, ...v.target, smooth);
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
      // una estructura de la corteza se mira desde afuera; si no, la cámara atraviesa el cerebro
      const out = center.clone().sub(new THREE.Vector3(...VIEWS.encefalo.target));
      if (cmd.type === 'mesh' && out.length() > 2)
        dir.multiplyScalar(0.35).add(out.normalize()).normalize();
      const dist =
        cmd.type === 'box'
          ? THREE.MathUtils.clamp(size * 2.4, 12, 280)
          : THREE.MathUtils.clamp(size * 3, 14, 25);
      const pos = center.clone().addScaledVector(dir, dist);
      void c.setLookAt(pos.x, pos.y, pos.z, center.x, center.y, center.z, smooth);
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
      minDistance={micro ? 5 : 2.5}
      maxDistance={micro ? 70 : 420}
      dollyToCursor
      smoothTime={0.45}
      draggingSmoothTime={0.12}
    />
  );
}

/** En pantallas verticales abre el campo visual para conservar el ancho de encuadre del escritorio. */
function FovRig() {
  const { camera, size } = useThree();
  useEffect(() => {
    const cam = camera as THREE.PerspectiveCamera;
    const aspect = size.width / size.height;
    const base = THREE.MathUtils.degToRad(32);
    cam.fov =
      aspect >= 0.75
        ? 32
        : THREE.MathUtils.radToDeg(2 * Math.atan((Math.tan(base / 2) * 0.75) / aspect));
    cam.updateProjectionMatrix();
  }, [camera, size]);
  return null;
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

export function Stage({
  data,
  cameraPose,
}: {
  data: AtlasData;
  cameraPose: RefObject<(() => CameraCommand | null) | null>;
}) {
  const [index, setIndex] = useState<HoverIndex | null>(null);
  const [dpr, setDpr] = useState(Math.min(2, window.devicePixelRatio || 1));
  const select = useAtlas((s) => s.select);
  const level = useAtlas((s) => s.level);
  const micro = LEVELS.find((l) => l.id === level)?.scene === 'micro';
  return (
    <Canvas
      className="na-canvas"
      dpr={dpr}
      camera={{ fov: 32, near: 0.1, far: 2000, position: [150, -40, 290] }}
      gl={{ antialias: false, powerPreference: 'high-performance' }}
      onPointerMissed={() => select(null)}
    >
      {/* baja la resolución si los fps caen, la sube si sobra margen */}
      <PerformanceMonitor
        onDecline={() => setDpr((d) => Math.max(0.75, d - 0.25))}
        onIncline={() =>
          setDpr((d) => Math.min(Math.min(2, window.devicePixelRatio || 1), d + 0.25))
        }
      />
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
          <Circuits data={data} />
          <Neuromod data={data} />
          {!micro && <AmbientLabels data={data} />}
        </Suspense>
      </group>
      {micro && <MicroScenes level={level} />}
      <CameraRig index={index} data={data} cameraPose={cameraPose} />
      <LabelTracker />
      <FovRig />
      <EffectComposer multisampling={4}>
        <Bloom
          mipmapBlur
          intensity={0.95}
          luminanceThreshold={0.12}
          luminanceSmoothing={0.3}
          radius={0.72}
        />
        <Vignette eskil={false} offset={0.25} darkness={0.7} />
      </EffectComposer>
    </Canvas>
  );
}
