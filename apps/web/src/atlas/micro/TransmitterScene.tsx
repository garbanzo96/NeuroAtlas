import { Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import * as THREE from 'three';
import { assetUrl, type Transmitter } from '../data';
import { holoMaterial } from '../holo';
import { random, useReducedMotion } from './geom2';

const labels = ['Síntesis', 'Empaquetado', 'Liberación', 'Receptor', 'Término', 'Fármacos'];
let selected = 'glutamato';
let step = 0;
let catalog: Transmitter[] = [];
const listeners = new Set<() => void>();
let snapshot = { selected, step };
function update(next: Partial<typeof snapshot>) {
  selected = next.selected ?? selected;
  step = Math.max(0, Math.min(5, next.step ?? step));
  snapshot = { selected, step };
  const url = new URL(window.location.href);
  url.searchParams.set('transmisor', selected);
  url.searchParams.set('etapa_nt', String(step + 1));
  history.replaceState(history.state, '', url);
  listeners.forEach((fn) => fn());
}
function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}
function useTransmitterState() {
  return useSyncExternalStore(subscribe, () => snapshot);
}
function useTransmitters() {
  const [data, setData] = useState<Transmitter[]>([]);
  useEffect(() => {
    let active = true;
    void fetch(assetUrl('transmitters.json'))
      .then((r) => {
        if (!r.ok) throw new Error('No se pudieron cargar los transmisores');
        return r.json() as Promise<{ transmitters: Transmitter[] }>;
      })
      .then((doc) => {
        if (!active) return;
        catalog = doc.transmitters;
        setData(doc.transmitters);
        const q = new URLSearchParams(window.location.search);
        const id = q.get('transmisor');
        const value = Number(q.get('etapa_nt'));
        update({
          selected: doc.transmitters.some((t) => t.id === id) ? id! : 'glutamato',
          step: Number.isInteger(value) && value >= 1 && value <= 6 ? value - 1 : 0,
        });
      })
      .catch(() => {
        if (active) setData([]);
      });
    return () => {
      active = false;
    };
  }, []);
  return data;
}

export function TransmitterControls() {
  const data = useTransmitters();
  const state = useTransmitterState();
  const [playing, setPlaying] = useState(false);
  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(() => update({ step: (snapshot.step + 1) % 6 }), 4000);
    return () => window.clearInterval(timer);
  }, [playing]);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLElement && /INPUT|SELECT|TEXTAREA/.test(event.target.tagName))
        return;
      if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
        event.preventDefault();
        update({ step: snapshot.step + (event.key === 'ArrowRight' ? 1 : -1) });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  const transmitter = data.find((t) => t.id === state.selected);
  return (
    <section className="na-transmitter" aria-label="Ciclo del neurotransmisor">
      <label>
        Neurotransmisor{' '}
        <select value={state.selected} onChange={(e) => update({ selected: e.target.value })}>
          {data.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </label>
      <div className="na-transmitter__steps" aria-label="Pasos del ciclo">
        {labels.map((label, i) => (
          <button
            type="button"
            key={label}
            aria-current={state.step === i ? 'step' : undefined}
            onClick={() => update({ step: i })}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="na-transmitter__navigation">
        <button
          type="button"
          onClick={() => update({ step: state.step - 1 })}
          disabled={state.step === 0}
        >
          Anterior
        </button>
        <button type="button" onClick={() => setPlaying(!playing)}>
          {playing ? 'Pausar' : 'Reproducir'}
        </button>
        <button
          type="button"
          onClick={() => update({ step: state.step + 1 })}
          disabled={state.step === 5}
        >
          Siguiente
        </button>
      </div>
      <p aria-live="polite">
        <strong>{labels[state.step]}.</strong> {transmitter?.steps[state.step] ?? 'Cargando datos…'}
      </p>
      <p className="na-muted">Esquema didáctico · borrador sin revisión experta</p>
    </section>
  );
}

export default function TransmitterScene() {
  const state = useTransmitterState();
  const reduced = useReducedMotion();
  const particles = useRef<THREE.InstancedMesh>(null);
  const pore = useRef<THREE.Mesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const positions = useMemo(() => {
    const rand = random(705);
    return Array.from({ length: 72 }, () => [
      (rand() - 0.5) * 2.6,
      (rand() - 0.5) * 0.6,
      (rand() - 0.5) * 1.3,
      rand() * 6,
    ]);
  }, []);
  const membrane = useMemo(() => {
    const geometry = new THREE.SphereGeometry(1, 48, 32);
    const vertices = geometry.getAttribute('position');
    for (let i = 0; i < vertices.count; i++) {
      const x = vertices.getX(i),
        y = vertices.getY(i),
        z = vertices.getZ(i);
      const ripple = 1 + 0.035 * Math.sin(x * 8 + y * 4) * Math.sin(z * 7 - y * 3);
      vertices.setXYZ(i, x * ripple, y * ripple, z * ripple);
    }
    geometry.computeVertexNormals();
    return geometry;
  }, []);
  const shell = useMemo(() => holoMaterial({ color: '#65b9ff', fill: 0.025, rim: 0.55 }), []);
  const vesicle = useMemo(() => holoMaterial({ color: '#9bdcff', fill: 0.035, rim: 0.7 }), []);
  useEffect(
    () => () => {
      shell.dispose();
      vesicle.dispose();
      membrane.dispose();
    },
    [shell, vesicle, membrane],
  );
  useFrame(({ clock }) => {
    if (!particles.current) return;
    const time = reduced ? 0 : clock.elapsedTime;
    if (pore.current) {
      const opening = reduced ? 1 : 0.65 + 0.35 * (0.5 + 0.5 * Math.sin(time * 2));
      pore.current.scale.setScalar(opening);
    }
    positions.forEach((p, i) => {
      const show = state.step >= 2;
      const uptake = state.step === 4 && !reduced ? (time * 0.18 + i * 0.037) % 1 : 0;
      const target = p[0]! < 0 ? -1.45 : 1.45;
      dummy.position.set(
        p[0]! * (1 - uptake) +
          target * uptake +
          Math.sin(time * 0.7 + p[3]!) * (reduced ? 0 : 0.08),
        p[1]! * (1 - uptake) + 0.7 * uptake + Math.cos(time * 0.8 + p[3]!) * (reduced ? 0 : 0.06),
        p[2]!,
      );
      dummy.scale.setScalar(show ? 0.035 : 0.0001);
      dummy.updateMatrix();
      particles.current!.setMatrixAt(i, dummy.matrix);
    });
    particles.current.instanceMatrix.needsUpdate = true;
  });
  const ionotropic = ['glutamato', 'gaba', 'glicina', 'acetilcolina', 'serotonina'].includes(
    state.selected,
  );
  const color = catalog.find((t) => t.id === state.selected)?.color ?? '#c49bff';
  return (
    <group>
      <mesh position={[0, 2.2, 0]} scale={[2.3, 1.65, 1.3]} material={shell} geometry={membrane} />
      <mesh position={[0, 4.15, 0]} scale={[0.42, 1.1, 0.42]} material={shell}>
        <cylinderGeometry args={[1, 1, 1, 32]} />
      </mesh>
      <mesh position={[0.65, 2.45, -0.25]} scale={[0.75, 0.25, 0.3]} material={vesicle}>
        <sphereGeometry args={[1, 32, 20]} />
      </mesh>
      {Array.from({ length: 5 }, (_, i) => (
        <mesh key={i} position={[0.25 + i * 0.2, 2.45, 0.03]} rotation={[0, 0, 0.3]}>
          <torusGeometry args={[0.13, 0.018, 6, 24, Math.PI]} />
          <meshBasicMaterial color="#8ad4ff" transparent opacity={0.55} />
        </mesh>
      ))}
      {Array.from({ length: 24 }, (_, i) => {
        const a = i * 2.4;
        const r = 0.3 + (i % 4) * 0.36;
        return (
          <group key={i} position={[Math.cos(a) * r, 1.25 + (i % 5) * 0.3, Math.sin(a) * r * 0.5]}>
            <mesh material={vesicle}>
              <sphereGeometry args={[0.14, 18, 12]} />
            </mesh>
            {state.step >= 1 && (
              <mesh>
                <sphereGeometry args={[0.055, 10, 8]} />
                <meshBasicMaterial color={color} />
              </mesh>
            )}
          </group>
        );
      })}
      <mesh position={[0, -0.95, 0]} scale={[2.1, 0.72, 1.2]} material={shell}>
        <sphereGeometry args={[1, 48, 24]} />
      </mesh>
      {[-0.9, -0.3, 0.3, 0.9].map((x, i) => (
        <group key={x} position={[x, -0.25, 0.35]}>
          {Array.from(
            {
              length:
                ionotropic && (i % 2 === 0 || state.selected === 'glicina')
                  ? state.selected === 'glutamato'
                    ? 4
                    : 5
                  : 7,
            },
            (_, j) => {
              const count =
                ionotropic && (i % 2 === 0 || state.selected === 'glicina')
                  ? state.selected === 'glutamato'
                    ? 4
                    : 5
                  : 7;
              return (
                <mesh
                  key={j}
                  position={[
                    Math.cos((j * Math.PI * 2) / count) * 0.105,
                    0,
                    Math.sin((j * Math.PI * 2) / count) * 0.105,
                  ]}
                >
                  <capsuleGeometry args={[0.045, 0.28, 4, 8]} />
                  <meshBasicMaterial
                    color={state.step === 3 || state.step === 5 ? '#d7faff' : '#65b9ff'}
                    transparent
                    opacity={i % 2 ? 0.65 : 0.8}
                  />
                </mesh>
              );
            },
          )}
        </group>
      ))}
      {[-1.45, 1.45].map((x) => (
        <group key={x} position={[x, 0.7, 0.45]}>
          {[-0.07, 0.07].map((dx) => (
            <mesh key={dx} position={[dx, 0, 0]}>
              <capsuleGeometry args={[0.055, 0.25, 4, 8]} />
              <meshBasicMaterial color={state.step >= 4 ? '#eaffff' : '#76bfff'} />
            </mesh>
          ))}
        </group>
      ))}
      {state.selected === 'acetilcolina' && (
        <mesh position={[1.2, 0.05, 0.65]} scale={[0.18, 0.12, 0.12]} material={vesicle}>
          <sphereGeometry args={[1, 16, 12]} />
        </mesh>
      )}
      <instancedMesh ref={particles} args={[undefined, undefined, 72]}>
        <sphereGeometry args={[1, 8, 6]} />
        <meshBasicMaterial color={color} />
      </instancedMesh>
      {state.step === 2 && (
        <mesh ref={pore} position={[0, 0.65, 0.65]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.22, 0.035, 8, 32]} />
          <meshBasicMaterial color="#eaffff" />
        </mesh>
      )}
      {state.selected === 'glutamato' && (
        <mesh position={[2.1, 0.1, -0.4]} scale={[0.55, 1.5, 0.75]} material={shell}>
          <sphereGeometry args={[1, 32, 20]} />
        </mesh>
      )}
      <Html position={[2.5, 1, 0]} center>
        <span className="na-scene-tag">{labels[state.step]} · esquema</span>
      </Html>
    </group>
  );
}
