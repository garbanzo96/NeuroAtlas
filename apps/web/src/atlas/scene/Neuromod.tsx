import { Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { type AtlasData, baseKey, resolvePoint } from '../data';
import { useAtlas } from '../store';

const vertex = `varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`;
// El mismo revelado y pulso longitudinal de Pathways, sin cabeza puntual en la diana.
const fragment = `uniform vec3 uColor; uniform float uTime; uniform float uLen; uniform float uReveal; uniform float uReduced; varying vec2 vUv;
void main(){float s=vUv.x; float h=fract(s*uLen/9.-uTime*.9); float pulse=smoothstep(0.,.05,h)*(1.-smoothstep(.05,.5,h)); float edge=1.-smoothstep(uReveal-.04,uReveal,s); float a=(.3+(1.-uReduced)*pulse*1.6)*edge; gl_FragColor=vec4(uColor*a,a);}`;

export function Neuromod({ data }: { data: AtlasData }) {
  const active = useAtlas((s) => (s.overlay === 'neurotransmisores' ? s.overlaySolo : null));
  const mode = data.authorOverlays
    .find((o) => o.id === 'neurotransmisores')
    ?.modes?.find((m) => m.id === active);
  const reduced = useMemo(() => matchMedia('(prefers-reduced-motion: reduce)').matches, []);
  const start = useRef(0);
  const origins = useRef<(THREE.Sprite | null)[]>([]);
  const targets = useRef<(THREE.Sprite | null)[]>([]);
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 128;
    const ctx = canvas.getContext('2d')!;
    const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, 'rgba(255,255,255,0.8)');
    g.addColorStop(0.2, 'rgba(255,255,255,0.35)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(canvas);
  }, []);
  useEffect(() => () => texture.dispose(), [texture]);
  const scene = useMemo(() => {
    if (!mode) return null;
    const pathway = data.pathways.pathways.find((p) => p.id === mode.pathway);
    const segments = mode.tramos.flatMap((i) => (pathway?.tramos[i] ? [pathway.tramos[i]!] : []));
    const originPoints = segments.map((s) => s.pts[0]!).concat(mode.origin ? [mode.origin.at] : []);
    const unique = new Map(originPoints.map((p) => [JSON.stringify(p), p]));
    const sources = [...unique.values()].flatMap((p) => {
      const point = resolvePoint(data, p);
      const mesh = typeof p === 'string' ? p : Array.isArray(p) ? null : p.en;
      const n =
        (mode.origin && p === mode.origin.at ? mode.origin.n : null) ??
        (mesh ? data.structures[baseKey(mesh)]?.n : null) ??
        'Origen';
      return point ? [{ point, n, marker: typeof p !== 'string' || !!mode.origin }] : [];
    });
    const targetPoints = mode.targets.flatMap((p) => {
      const point = resolvePoint(data, p);
      if (!point || !sources.length) return [];
      const distance = Math.min(...sources.map((s) => s.point.distanceTo(point)));
      return [{ point, delay: Math.min(1.8, (distance / 10) * 1.8) }];
    });
    const paths = segments.map((s) =>
      s.pts.map((p) => resolvePoint(data, p)).filter((p): p is THREE.Vector3 => !!p),
    );
    // Las ramas adicionales son conexiones didácticas, no tractografía.
    for (const target of targetPoints) {
      if (paths.some((p) => (p[p.length - 1]?.distanceTo(target.point) ?? Infinity) < 0.01))
        continue;
      const source = sources.reduce((best, candidate) =>
        candidate.point.distanceToSquared(target.point) < best.point.distanceToSquared(target.point)
          ? candidate
          : best,
      );
      paths.push([source.point, target.point]);
    }
    const strands = paths.slice(0, 24).flatMap((points) => {
      if (points.length < 2) return [];
      const curve = new THREE.CatmullRomCurve3(points, false, 'centripetal');
      const length = curve.getLength();
      const geometry = new THREE.TubeGeometry(curve, 64, 0.075, 8, false);
      const material = new THREE.ShaderMaterial({
        vertexShader: vertex,
        fragmentShader: fragment,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: {
          uColor: { value: new THREE.Color(mode.col) },
          uTime: { value: 0 },
          uLen: { value: length },
          uReveal: { value: 0 },
          uReduced: { value: reduced ? 1 : 0 },
        },
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.renderOrder = 5;
      return [mesh];
    });
    return { sources, targetPoints, strands };
  }, [data, mode, reduced]);
  useEffect(() => {
    start.current = performance.now();
    return () =>
      scene?.strands.forEach((s) => {
        s.geometry.dispose();
        s.material.dispose();
      });
  }, [scene]);
  useFrame(({ clock }) => {
    if (!scene) return;
    const age = (performance.now() - start.current) / 1000;
    for (const strand of scene.strands) {
      strand.material.uniforms.uTime!.value = clock.elapsedTime;
      strand.material.uniforms.uReveal!.value = reduced ? 1.05 : Math.min(1.05, (age / 1.8) * 1.05);
    }
    origins.current.forEach((sprite) => {
      if (!sprite) return;
      sprite.scale.setScalar(reduced ? 0.9 : 0.9 + 0.12 * Math.sin(age * 2.5));
    });
    targets.current.forEach((sprite, i) => {
      if (!sprite) return;
      const t = (age - scene.targetPoints[i]!.delay + 5.4) % 5.4;
      const fog = reduced
        ? 0.5
        : age < scene.targetPoints[i]!.delay
          ? 0
          : t < 0.6
            ? t / 0.6
            : t < 2.1
              ? 1
              : Math.max(0, 1 - (t - 2.1) / 2.5);
      (sprite.material as THREE.SpriteMaterial).opacity = fog * 0.5;
    });
  });
  if (!scene || !mode) return null;
  return (
    <group>
      {scene.strands.map((s, i) => (
        <primitive key={i} object={s} />
      ))}
      {scene.sources.map((s, i) => (
        <group key={i} position={s.point}>
          <mesh>
            <sphereGeometry args={[0.12, 16, 16]} />
            <meshBasicMaterial color={mode.col} toneMapped={false} />
          </mesh>
          <sprite
            ref={(sprite) => {
              origins.current[i] = sprite;
            }}
          >
            <spriteMaterial
              map={texture}
              color={mode.col}
              transparent
              opacity={0.85}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </sprite>
          {
            <Html position={[0.2, 0.2, 0]} zIndexRange={[5, 0]} style={{ pointerEvents: 'none' }}>
              <span className="na-ambient na-circuit__node-label">
                {s.n}
                {s.marker ? ' · posición esquemática' : ''}
              </span>
            </Html>
          }
        </group>
      ))}
      {scene.targetPoints.map((t, i) => (
        <sprite
          key={i}
          position={t.point}
          scale={2.4}
          ref={(sprite) => {
            targets.current[i] = sprite;
          }}
        >
          <spriteMaterial
            map={texture}
            color={mode.col}
            transparent
            opacity={0}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </sprite>
      ))}
    </group>
  );
}
