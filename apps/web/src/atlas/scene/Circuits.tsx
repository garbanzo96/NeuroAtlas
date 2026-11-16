import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { dynamics } from '@neuroatlas/simulation';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { type AtlasData, resolvePoint } from '../data';
import { approach } from '../holo';
import { useAtlas } from '../store';

export const playback = {
  time: 0,
  duration: 16,
  playing: true,
  speed: 1,
  arrivals: [] as { time: number; sign: 'exc' | 'inh' | 'mod' | 'horm' }[],
};
const colors = { exc: '#7dffb2', inh: '#ff5c8a', mod: '#c49bff', horm: '#ffd79a' };
const vertex = `uniform float uMod; varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position+normal*uMod*.07,1.);}`;
const fragment = `uniform vec3 uColor; uniform float uHead; uniform float uSign; uniform float uStrength; uniform float uLesion; uniform float uMod; uniform float uReduced; varying vec2 vUv;
void main(){ float d=uHead-vUv.x; float trail=step(0.,d)*exp(-d*12.); float head=exp(-pow(d*55.,2.));
float dash=step(0.,d)*step(d,.16)*step(.4,fract(d*19.)); float shape=uSign<.5?trail*1.5+head*2.5:uSign<1.5?dash*2.4:exp(-pow(d*5.,2.))*.9;
float light=(uLesion>.5?.15*step(.5,fract(vUv.x*35.)):.15)+(uReduced>.5?1.:shape)*uStrength+uMod*.25; vec3 color=uColor*light; if(uSign<.5 && uReduced<.5) color+=vec3(head*uStrength*1.6); gl_FragColor=vec4(color,light); }`;

export function Circuits({ data }: { data: AtlasData }) {
  const id = useAtlas((s) => s.circuit);
  const run = useAtlas((s) => s.circuitRun);
  const circuit = data.circuits.find((c) => c.id === id);
  const reduced = useMemo(() => matchMedia('(prefers-reduced-motion: reduce)').matches, []);
  const nodes = useMemo(
    () => circuit?.nodes.map((n) => resolvePoint(data, n.at)) ?? [],
    [data, circuit],
  );
  const strands = useMemo(
    () =>
      circuit?.edges.map((e, i) => {
        const a = circuit.nodes.findIndex((n) => n.id === e.from);
        const b = circuit.nodes.findIndex((n) => n.id === e.to);
        const start = nodes[a],
          end = nodes[b];
        if (!start || !end) return null;
        const middle = e.via?.slice(1, -1).map((p) => resolvePoint(data, p)) ?? [];
        if (!middle.length) {
          const offset = new THREE.Vector3()
            .subVectors(end, start)
            .cross(new THREE.Vector3(0, 0, 1))
            .normalize()
            .multiplyScalar(0.35 + (i % 3) * 0.15);
          middle.push(start.clone().add(end).multiplyScalar(0.5).add(offset));
        }
        const points = [start, ...middle, end];
        const valid = points.filter((p): p is THREE.Vector3 => !!p);
        if (valid.length < 2) return null;
        const curve = new THREE.CatmullRomCurve3(valid, false, 'centripetal');
        const geometry = new THREE.TubeGeometry(
          curve,
          64,
          e.sign === 'mod' ? 0.055 : 0.035,
          6,
          false,
        );
        const material = new THREE.ShaderMaterial({
          vertexShader: vertex,
          fragmentShader: fragment,
          transparent: true,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
          uniforms: {
            uColor: { value: new THREE.Color(colors[e.sign]) },
            uHead: { value: -1 },
            uSign: { value: e.sign === 'exc' ? 0 : e.sign === 'inh' ? 1 : 2 },
            uStrength: { value: 0 },
            uLesion: { value: 0 },
            uMod: { value: 0 },
            uReduced: { value: reduced ? 1 : 0 },
          },
        });
        return new THREE.Mesh(geometry, material);
      }) ?? [],
    [data, circuit, nodes, reduced],
  );
  useEffect(
    () => () => {
      strands.forEach((s) => {
        s?.geometry.dispose();
        s?.material.dispose();
      });
    },
    [strands],
  );
  const result = useMemo(() => {
    if (!circuit || !run) return null;
    const scenario = run.scenario.startsWith('node:')
      ? {
          stim: [{ node: run.scenario.slice(5), at: 1, amp: 0.9, dur: 4 }],
          lesions: [] as string[],
        }
      : circuit.scenarios.find((s) => s.id === run.scenario);
    if (!scenario) return null;
    return dynamics.simulateSignedGraph(
      circuit,
      { ...scenario, lesions: [...(scenario.lesions ?? []), ...run.lesions] },
      { dt: 0.05, T: playback.duration, tau: 0.5 },
    );
  }, [circuit, run]);
  useEffect(() => {
    playback.time = 0;
    playback.playing = true;
    playback.arrivals = result
      ? result.pulses
          .filter((p) => p.t1 <= playback.duration)
          .map((p) => ({ time: p.t1, sign: circuit!.edges[p.edge]!.sign }))
          .sort((a, b) => a.time - b.time)
      : [];
  }, [result, circuit]);
  const refs = useRef<(THREE.Mesh | null)[]>([]);
  const halos = useRef<(THREE.Sprite | null)[]>([]);
  const discs = useRef<(THREE.Mesh | null)[]>([]);
  const injured = useMemo(
    () =>
      new Set([
        ...(run?.lesions ?? []),
        ...(circuit?.scenarios.find((s) => s.id === run?.scenario)?.lesions ?? []),
      ]),
    [run, circuit],
  );
  const haloTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 64;
    const ctx = canvas.getContext('2d')!;
    const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, 'rgba(255,255,255,0.7)');
    gradient.addColorStop(0.3, 'rgba(255,255,255,0.2)');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(canvas);
  }, []);
  useEffect(() => () => haloTexture.dispose(), [haloTexture]);
  useFrame((_, dt) => {
    if (!circuit) return;
    if (result && playback.playing)
      playback.time = Math.min(playback.duration, playback.time + dt * playback.speed);
    if (playback.time >= playback.duration) playback.playing = false;
    const index = Math.min(result ? result.t.length - 1 : 0, Math.floor(playback.time / 0.05));
    refs.current.forEach((mesh, i) => {
      if (!mesh) return;
      const a = result?.activity[i]?.[index] ?? circuit.nodes[i]?.basal ?? 0;
      let flash = false,
        inhibition = false;
      if (result)
        for (const p of result.pulses) {
          const edge = circuit.edges[p.edge];
          if (
            edge?.to === circuit.nodes[i]?.id &&
            playback.time >= p.t1 &&
            playback.time < p.t1 + 0.15
          ) {
            flash = true;
            inhibition = edge?.sign === 'inh';
          }
        }
      const lesion = injured.has(circuit.nodes[i]!.id);
      const target = lesion ? 0.12 : 0.2 + a * 0.7 + (flash && !inhibition ? 0.55 : 0);
      const mat = mesh.material as THREE.MeshBasicMaterial;
      const light = reduced
        ? target
        : approach(mat.color.b, target, dt, target > mat.color.b ? 14 : 3);
      mat.color.setRGB(light * 0.65, light * (lesion ? 0.75 : 0.9), light);
      const halo = halos.current[i];
      if (halo) {
        halo.scale.setScalar(lesion ? 0.5 : 0.65 + a * 0.55 + (flash ? 0.25 : 0));
        (halo.material as THREE.SpriteMaterial).opacity = lesion ? 0.1 : 0.22 + a * 0.28;
      }
      if (discs.current[i]) discs.current[i]!.visible = !reduced && flash && inhibition;
    });
    strands.forEach((mesh, i) => {
      if (!mesh) return;
      let pulse: NonNullable<typeof result>['pulses'][number] | undefined;
      if (result)
        for (const p of result.pulses) {
          if (p.edge === i && playback.time >= p.t0 && playback.time <= p.t1) {
            pulse = p;
            break;
          }
        }
      const edge = circuit.edges[i]!;
      mesh.material.uniforms.uLesion!.value =
        injured.has(edge.from) || injured.has(edge.to) ? 1 : 0;
      let modulation = 0;
      if (result)
        for (const p of result.pulses) {
          if (
            circuit.edges[p.edge]?.modulates?.edges.includes(i) &&
            playback.time >= p.t0 &&
            playback.time <= p.t1
          )
            modulation = Math.max(modulation, p.strength);
        }
      mesh.material.uniforms.uMod!.value = modulation;
      mesh.material.uniforms.uHead!.value =
        pulse && !reduced ? (playback.time - pulse.t0) / (pulse.t1 - pulse.t0) : -1;
      mesh.material.uniforms.uStrength!.value = pulse ? pulse.strength : 0;
    });
  });
  if (!circuit) return null;
  return (
    <group>
      {strands.map((s, i) => s && <primitive key={i} object={s} />)}
      {nodes.map(
        (p, i) =>
          p && (
            <group key={circuit.nodes[i]!.id} position={p}>
              <mesh
                ref={(m) => {
                  refs.current[i] = m;
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  useAtlas.getState().runCircuit(`node:${circuit.nodes[i]!.id}`, run?.lesions);
                }}
                renderOrder={6}
              >
                <sphereGeometry args={[0.15, 16, 16]} />
                <meshBasicMaterial
                  color="#a9e9ff"
                  transparent
                  blending={THREE.AdditiveBlending}
                  depthWrite={false}
                />
              </mesh>
              <sprite
                ref={(m) => {
                  halos.current[i] = m;
                }}
              >
                <spriteMaterial
                  map={haloTexture}
                  color="#78cfff"
                  transparent
                  blending={THREE.AdditiveBlending}
                  depthWrite={false}
                />
              </sprite>
              <mesh
                ref={(m) => {
                  discs.current[i] = m;
                }}
                visible={false}
              >
                <circleGeometry args={[0.32, 24]} />
                <meshBasicMaterial
                  color="#ff5c8a"
                  transparent
                  opacity={0.7}
                  side={THREE.DoubleSide}
                  depthWrite={false}
                />
              </mesh>
              <Html
                position={[0.25, 0.22, 0]}
                zIndexRange={[5, 0]}
                style={{ pointerEvents: 'none' }}
              >
                <span className="na-ambient na-circuit__node-label">{circuit.nodes[i]!.n}</span>
              </Html>
              <mesh
                onClick={(e) => {
                  e.stopPropagation();
                  useAtlas.getState().runCircuit(`node:${circuit.nodes[i]!.id}`, run?.lesions);
                }}
              >
                <ringGeometry args={[0.25, 0.28, 32]} />
                <meshBasicMaterial
                  color="#8fcfff"
                  transparent
                  opacity={injured.has(circuit.nodes[i]!.id) ? 0 : 0.4}
                  side={THREE.DoubleSide}
                  depthWrite={false}
                />
              </mesh>
              {injured.has(circuit.nodes[i]!.id) &&
                Array.from({ length: 8 }, (_, j) => (
                  <mesh key={j}>
                    <ringGeometry args={[0.25, 0.28, 4, 1, (j * Math.PI) / 4, Math.PI / 8]} />
                    <meshBasicMaterial
                      color="#6b80a5"
                      transparent
                      opacity={0.65}
                      side={THREE.DoubleSide}
                      depthWrite={false}
                    />
                  </mesh>
                ))}
            </group>
          ),
      )}
    </group>
  );
}
