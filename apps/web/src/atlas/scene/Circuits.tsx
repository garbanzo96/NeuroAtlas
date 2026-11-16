import { useFrame } from '@react-three/fiber';
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
  arrivals: [] as number[],
};
const colors = { exc: '#7dffb2', inh: '#ff5c8a', mod: '#c49bff', horm: '#ffd79a' };
const vertex = `varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`;
const fragment = `uniform vec3 uColor; uniform float uHead; uniform float uSign; uniform float uStrength; varying vec2 vUv;
void main(){ float d=uHead-vUv.x; float trail=step(0.,d)*exp(-d*12.); float head=exp(-pow(d*55.,2.));
float dash=step(.5,fract(vUv.x*30.)); float shape=uSign<.5?trail*1.5+head*2.5:uSign<1.5?trail*dash*2.4:exp(-pow(d*5.,2.))*.9;
float light=.14+shape*uStrength; vec3 color=uColor*light; if(uSign<.5) color+=vec3(head*uStrength*1.6); gl_FragColor=vec4(color,light); }`;

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
      circuit?.edges.map((e) => {
        const a = circuit.nodes.findIndex((n) => n.id === e.from);
        const b = circuit.nodes.findIndex((n) => n.id === e.to);
        const points = e.via?.map((p) => resolvePoint(data, p)) ?? [nodes[a], nodes[b]];
        const valid = points.filter((p): p is THREE.Vector3 => !!p);
        if (valid.length < 2) return null;
        const curve = new THREE.CatmullRomCurve3(valid, false, 'centripetal');
        const geometry = new THREE.TubeGeometry(
          curve,
          64,
          e.sign === 'mod' ? 0.14 : 0.075,
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
          },
        });
        return new THREE.Mesh(geometry, material);
      }) ?? [],
    [data, circuit, nodes],
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
      ? [...new Set(result.pulses.map((p) => p.t1).filter((t) => t <= playback.duration))].sort(
          (a, b) => a - b,
        )
      : [];
  }, [result]);
  const refs = useRef<(THREE.Mesh | null)[]>([]);
  useFrame((_, dt) => {
    if (!circuit) return;
    if (result && playback.playing)
      playback.time = Math.min(playback.duration, playback.time + dt * playback.speed);
    if (playback.time >= playback.duration) playback.playing = false;
    const index = Math.min(result ? result.t.length - 1 : 0, Math.floor(playback.time / 0.05));
    refs.current.forEach((mesh, i) => {
      if (!mesh) return;
      const a = result?.activity[i]?.[index] ?? circuit.nodes[i]?.basal ?? 0;
      const arrivals =
        result?.pulses.filter(
          (p) =>
            circuit.edges[p.edge]?.to === circuit.nodes[i]?.id &&
            playback.time >= p.t1 &&
            playback.time < p.t1 + 0.15,
        ) ?? [];
      const scenario = circuit.scenarios.find((s) => s.id === run?.scenario);
      const injured = [...(run?.lesions ?? []), ...(scenario?.lesions ?? [])].includes(
        circuit.nodes[i]!.id,
      );
      const target = injured ? 0.12 : 0.18 + a * 1.4 + (arrivals.length ? 1.3 : 0);
      const mat = mesh.material as THREE.MeshBasicMaterial;
      mat.color.setScalar(approach(mat.color.r, target, dt, target > mat.color.r ? 14 : 3));
    });
    strands.forEach((mesh, i) => {
      if (!mesh) return;
      const pulse = result?.pulses.find(
        (p) => p.edge === i && playback.time >= p.t0 && playback.time <= p.t1,
      );
      mesh.material.uniforms.uHead!.value =
        pulse && !reduced ? (playback.time - pulse.t0) / (pulse.t1 - pulse.t0) : -1;
      mesh.material.uniforms.uStrength!.value = pulse && !reduced ? pulse.strength : 0;
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
                <sphereGeometry args={[0.22, 16, 16]} />
                <meshBasicMaterial
                  color="#a9e9ff"
                  transparent
                  blending={THREE.AdditiveBlending}
                  depthWrite={false}
                />
              </mesh>
              <mesh>
                <sphereGeometry args={[0.4, 16, 16]} />
                <meshBasicMaterial
                  color="#72b9ff"
                  wireframe
                  transparent
                  opacity={0.25}
                  depthWrite={false}
                />
              </mesh>
            </group>
          ),
      )}
    </group>
  );
}
