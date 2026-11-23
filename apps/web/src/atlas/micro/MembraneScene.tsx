import { read } from '../signals';
import { Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { dynamics } from '@neuroatlas/simulation';
import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { approach, holoMaterial } from '../holo';
import { useAtlas, type PartInfo } from '../store';
import { random, reducedMotion } from './geom';
import SaltatoryScene from './SaltatoryScene';

const parts: Record<string, PartInfo> = {
  bicapa: {
    title: 'Bicapa lipídica',
    body: 'La membrana celular contiene una bicapa de lípidos con cabezas hidrofílicas orientadas hacia los medios acuosos y colas hidrofóbicas hacia el interior. Sus proteínas permiten funciones como el transporte y la señalización. La composición y movilidad de sus componentes varían entre células y regiones. Este parche es una representación esquemática: el tamaño, número de moléculas y ondulación no están a escala molecular exacta.',
  },
  bomba: {
    title: 'Na⁺/K⁺-ATPasa',
    model: 'nak-pump',
    body: 'La bomba sodio-potasio utiliza energía de la hidrólisis de ATP para transportar tres iones de sodio hacia el exterior y dos de potasio hacia el citosol por ciclo. Sus cambios conformacionales alternan el acceso a ambos lados de la membrana. El ciclo mostrado sigue un esquema de estados, no una cinética molecular medida. La forma de la proteína y las distancias son representaciones didácticas sin escala molecular exacta.',
  },
  nav: {
    title: 'Canal de Na⁺ dependiente de voltaje',
    model: 'hh',
    body: 'Los canales de sodio dependientes de voltaje pueden abrirse en respuesta a cambios del potencial de membrana y después inactivarse. La entrada de sodio contribuye a la fase ascendente del potencial de acción en muchas neuronas. Existen diversos tipos de canal con propiedades distintas. El destello y el transporte de iones aquí son esquemáticos y no describen una proteína individual ni su cinética exacta.',
  },
  kv: {
    title: 'Canal de K⁺ dependiente de voltaje',
    model: 'hh',
    body: 'Los canales de potasio dependientes de voltaje participan en la repolarización de muchas membranas excitables. Tras su apertura, el flujo de potasio depende del potencial y de su gradiente electroquímico. Hay numerosas familias con tiempos y propiedades diferentes. Esta escena presenta una secuencia didáctica simplificada y no pretende representar la estructura molecular exacta ni todas las corrientes presentes en una neurona.',
  },
  fuga: {
    title: 'Canal de fuga de K⁺',
    model: 'nernst',
    body: 'Algunos canales de potasio contribuyen a una permeabilidad de fondo incluso cerca del reposo. Esa permeabilidad ayuda a relacionar el potencial de membrana con el gradiente de potasio, aunque el potencial real depende también de otros iones y transportadores. El canal de esta escena es un símbolo didáctico: no representa una familia molecular específica ni determina por sí solo el voltaje de reposo.',
  },
  na: {
    title: 'Sodio · Na⁺',
    model: 'nernst',
    body: 'En concentraciones típicas aproximadas de mamífero hay más sodio fuera de la célula que dentro. Su potencial de equilibrio se calcula a partir de la razón entre concentraciones y la temperatura; el flujo real también depende del voltaje y de la permeabilidad. Las partículas mostradas son una muestra visual esquemática y sus cantidades no representan concentraciones absolutas ni una escala molecular exacta.',
  },
  k: {
    title: 'Potasio · K⁺',
    model: 'nernst',
    body: 'En concentraciones típicas aproximadas de mamífero hay más potasio en el citosol que en el medio extracelular. El potencial de equilibrio indica el voltaje en que se compensan las fuerzas eléctrica y química para ese ion en condiciones ideales. Las partículas visibles son una muestra esquemática: su número y movimiento no reproducen concentraciones absolutas ni trayectorias moleculares medidas.',
  },
};
function Interactive({
  id,
  anchor,
  children,
}: {
  id: string;
  anchor: [number, number, number];
  children: React.ReactNode;
}) {
  const group = useRef<THREE.Group>(null);
  const hovered = useRef(false);
  useFrame((_, dt) => {
    if (group.current)
      group.current.scale.setScalar(
        approach(group.current.scale.x, hovered.current ? 1.08 : 1, dt),
      );
  });
  return (
    <group
      ref={group}
      onPointerOver={(e) => {
        e.stopPropagation();
        hovered.current = true;
        useAtlas
          .getState()
          .setHover({ key: id, title: parts[id]!.title, subtitle: 'Esquema molecular', anchor });
      }}
      onPointerOut={() => {
        hovered.current = false;
        useAtlas.getState().setHover(null);
      }}
      onClick={(e) => {
        e.stopPropagation();
        useAtlas.getState().select(id);
      }}
    >
      {children}
    </group>
  );
}
function instancedHolo(color: string, fill: number, rim: number) {
  const material = holoMaterial({ color, fill, rim });
  material.vertexShader = material.vertexShader
    .replace(
      'modelMatrix * vec4(position, 1.0)',
      'modelMatrix * instanceMatrix * vec4(position, 1.0)',
    )
    .replace('mat3(modelMatrix) * normal', 'mat3(modelMatrix * instanceMatrix) * normal');
  return material;
}
function Lipids() {
  const headMaterial = useMemo(() => instancedHolo('#a7d9ff', 0.08, 0.23), []);
  const tailMaterial = useMemo(() => instancedHolo('#3a86ff', 0.015, 0.14), []);
  useEffect(
    () => () => {
      headMaterial.dispose();
      tailMaterial.dispose();
    },
    [headMaterial, tailMaterial],
  );
  const initialized = useRef(false);
  const heads = useRef<THREE.InstancedMesh>(null);
  const tails = useRef<THREE.InstancedMesh>(null);
  const obj = useMemo(() => new THREE.Object3D(), []);
  const tailGeometry = useMemo(
    () =>
      new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3([
          new THREE.Vector3(0, -0.4, 0),
          new THREE.Vector3(0.055, -0.15, 0),
          new THREE.Vector3(-0.045, 0.15, 0),
          new THREE.Vector3(0, 0.4, 0),
        ]),
        12,
        0.025,
        5,
        false,
      ),
    [],
  );
  useEffect(() => () => tailGeometry.dispose(), [tailGeometry]);
  useFrame(() => {
    if (!heads.current || !tails.current || initialized.current) return;
    initialized.current = true;
    const time = 0;
    let i = 0;
    for (let xi = 0; xi < 40; xi++)
      for (let zi = 0; zi < 24; zi++) {
        const jitter = Math.sin(xi * 127.1 + zi * 311.7);
        const x = (xi - 19.5) * 0.4 + jitter * 0.07;
        const z = (zi - 11.5) * 0.4 + Math.cos(xi * 83.3 + zi * 41.1) * 0.07;
        const edge = Math.max(Math.abs(x) / 8, Math.abs(z) / 5);
        const fade = THREE.MathUtils.smoothstep(1 - edge, 0, 0.22);
        const hole = [-4, 0, 4, 7].some((cx) => Math.hypot(x - cx, z) < (cx === 0 ? 1.3 : 1.65));
        for (const side of [-1, 1]) {
          const wave = Math.sin(x * 0.5 + z * 0.4 + time) * 0.035;
          obj.position.set(x, side * 1.1 + wave, z);
          obj.rotation.set(0, 0, 0);
          obj.scale.setScalar(hole ? 0.0001 : fade);
          obj.updateMatrix();
          heads.current!.setMatrixAt(i, obj.matrix);
          for (const offset of [-1, 1]) {
            obj.position.set(x + offset * 0.09, side * 0.55 + wave, z);
            obj.rotation.z = offset * (0.08 + 0.05 * Math.sin(jitter + time));
            obj.scale.set(hole ? 0.0001 : fade, 1.25 * fade, fade);
            obj.updateMatrix();
            tails.current!.setMatrixAt(i * 2 + (offset > 0 ? 1 : 0), obj.matrix);
          }
          i++;
        }
      }
    if (heads.current) heads.current.instanceMatrix.needsUpdate = true;
    if (tails.current) tails.current.instanceMatrix.needsUpdate = true;
  });
  return (
    <Interactive id="bicapa" anchor={[-5, 0, 0]}>
      <instancedMesh ref={heads} args={[undefined, undefined, 1920]}>
        <sphereGeometry args={[0.18, 16, 12]} />
        <primitive object={headMaterial} attach="material" />
      </instancedMesh>
      <instancedMesh ref={tails} args={[tailGeometry, undefined, 3840]}>
        <primitive object={tailMaterial} attach="material" />
      </instancedMesh>
    </Interactive>
  );
}
function Ions({ id, color }: { id: 'na' | 'k'; color: string }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const points = useMemo(() => {
    const rng = random(id === 'na' ? 12 : 42);
    return Array.from({ length: 50 }, (_, i) => ({
      x: (rng() - 0.5) * 17,
      z: (rng() - 0.5) * 8,
      y: (i < 39 ? (id === 'na' ? 1 : -1) : id === 'na' ? -1 : 1) * (1.5 + rng() * 1.2),
      phase: rng() * 6,
    }));
  }, [id]);
  const obj = useMemo(() => new THREE.Object3D(), []);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = reducedMotion() ? 0 : clock.elapsedTime * 0.35;
    points.forEach((p, i) => {
      obj.position.set(
        p.x + Math.sin(t + p.phase) * 0.08,
        p.y + Math.sin(t * 0.7 + p.phase) * 0.06,
        p.z + Math.cos(t + p.phase) * 0.08,
      );
      obj.updateMatrix();
      ref.current!.setMatrixAt(i, obj.matrix);
    });
    ref.current.instanceMatrix.needsUpdate = true;
  });
  return (
    <Interactive id={id} anchor={id === 'na' ? [5, 3, 0] : [5, -3, 0]}>
      <instancedMesh ref={ref} args={[undefined, undefined, points.length]}>
        <sphereGeometry args={[0.052, 10, 8]} />
        <meshBasicMaterial color={color} />
      </instancedMesh>
    </Interactive>
  );
}
function Channel({
  id,
  x,
  color,
  active,
  phase,
  manual,
}: {
  phase: number;
  manual: boolean;
  active: boolean;
  id: 'nav' | 'kv' | 'fuga';
  x: number;
  color: string;
}) {
  const material = useMemo(() => holoMaterial({ color, fill: 0.04, rim: 0.5 }), [color]);
  useEffect(() => () => material.dispose(), [material]);
  const ions = useRef<THREE.InstancedMesh>(null);
  const ionObject = useMemo(() => new THREE.Object3D(), []);
  const flow = useRef(0);
  const stateLabel = useRef<HTMLSpanElement>(null);
  const loop = useMemo(
    () =>
      new THREE.Line(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: '#7ab6ff' })),
    [],
  );
  useEffect(
    () => () => {
      loop.geometry.dispose();
      loop.material.dispose();
    },
    [loop],
  );
  const sensors = useRef<THREE.Group>(null);
  const ball = useRef<THREE.Mesh>(null);
  const lumen = useRef<THREE.MeshBasicMaterial>(null);
  useFrame(({ clock }, dt) => {
    const fixed = reducedMotion() || manual;
    const t = fixed ? [0.05, 0.34, 0.52, 0.65, 0.8][phase]! : (clock.elapsedTime % 6) / 6;
    const bell = (center: number, width: number) => Math.max(0, 1 - Math.abs(t - center) / width);
    const m = fixed ? bell(0.28, 0.22) : read('hh.m', bell(0.28, 0.22));
    const h = fixed ? 1 - bell(0.43, 0.23) : read('hh.h', 1 - bell(0.43, 0.23));
    const n = fixed ? bell(0.52, 0.3) : read('hh.n', bell(0.52, 0.3));
    const activation = id === 'nav' ? m : n;
    const open = id === 'nav' ? m ** 3 * h : id === 'kv' ? n ** 4 : 0;
    if (sensors.current) sensors.current.position.y = active ? activation * 0.6 : 0;
    const ballX = active ? 1.1 * h : 1.1;
    if (ball.current) ball.current.position.x = ballX;
    if (id === 'nav') {
      const curve = new THREE.QuadraticBezierCurve3(
        new THREE.Vector3(1.35, -1.2, 0),
        new THREE.Vector3(0.7, -2.1, 0.3),
        new THREE.Vector3(ballX, -1.25, 0),
      );
      loop.geometry.setFromPoints(curve.getPoints(20));
    }
    if (stateLabel.current)
      stateLabel.current.textContent = !active
        ? 'cerrado'
        : id === 'nav' && h < 0.35
          ? 'inactivado'
          : open > 0.04
            ? 'abierto'
            : 'cerrado';
    if (ions.current) {
      if (!reducedMotion()) flow.current += dt * open * 2;
      for (let i = 0; i < 4; i++) {
        const progress = (flow.current + i / 4) % 1;
        ionObject.position.set(0, (id === 'nav' ? 1 : -1) * (1.8 - progress * 3.6), 0);
        ionObject.scale.setScalar(active && open > 0.04 ? 1 : 0.0001);
        ionObject.updateMatrix();
        ions.current.setMatrixAt(i, ionObject.matrix);
      }
      ions.current.instanceMatrix.needsUpdate = true;
    }
    if (lumen.current) lumen.current.opacity = 0.08 + (active ? open * 0.7 : 0);
    material.uniforms.uHover.value = active ? open * 0.5 : 0;
  });
  const domains = id === 'fuga' ? 2 : 4;
  return (
    <Interactive id={id} anchor={[x, 0, 0]}>
      <group position={[x, 0, 0]}>
        {Array.from({ length: domains }, (_, domain) => {
          const angle = (domain * Math.PI * 2) / domains;
          return (
            <group key={domain} rotation={[0, angle, 0]}>
              {Array.from({ length: 6 }, (_, helix) => {
                const a = (helix * Math.PI * 2) / 6;
                return helix === 3 ? null : (
                  <mesh
                    key={helix}
                    position={[1.1 + Math.cos(a) * 0.38, 0, Math.sin(a) * 0.38]}
                    rotation={[0.06 * Math.sin(a), 0, 0.06 * Math.cos(a)]}
                    material={material}
                  >
                    <capsuleGeometry args={[0.2, 2.8, 4, 8]} />
                  </mesh>
                );
              })}
            </group>
          );
        })}
        <group ref={sensors}>
          {Array.from({ length: domains }, (_, i) => {
            const a = (i * Math.PI * 2) / domains;
            return (
              <mesh key={i} position={[Math.cos(a) * 1.5, 0, Math.sin(a) * 1.5]}>
                <capsuleGeometry args={[0.2, 2.8, 4, 8]} />
                <meshBasicMaterial
                  color="#7fdcff"
                  transparent
                  opacity={0.32}
                  blending={THREE.AdditiveBlending}
                  depthWrite={false}
                />
              </mesh>
            );
          })}
        </group>
        <mesh rotation={[Math.PI / 2, 0, 0]} material={material}>
          <torusGeometry args={[0.32, 0.07, 8, 32]} />
        </mesh>
        {id !== 'fuga' && (
          <Html center zIndexRange={[5, 0]} position={[0, 3.2, 0]} className="na-ap-protein-label">
            <span>{id === 'nav' ? 'Nav' : 'Kv'}</span>
            <span ref={stateLabel}>cerrado</span>
          </Html>
        )}
        <mesh>
          <cylinderGeometry args={[0.22, 0.22, 2.8, 16, 1, true]} />
          <meshBasicMaterial
            ref={lumen}
            color="#a8efff"
            transparent
            opacity={0.08}
            depthWrite={false}
            side={THREE.DoubleSide}
          />
        </mesh>
        {id === 'nav' && (
          <>
            <primitive object={loop} />
            <mesh ref={ball} position={[1.1, -1.25, 0]} material={material}>
              <sphereGeometry args={[0.28, 16, 12]} />
            </mesh>
          </>
        )}
        {id !== 'fuga' && (
          <instancedMesh ref={ions} args={[undefined, undefined, 4]}>
            <sphereGeometry args={[0.07, 10, 8]} />
            <meshBasicMaterial color={id === 'nav' ? '#ffb057' : '#5ee6ff'} />
          </instancedMesh>
        )}
      </group>
    </Interactive>
  );
}
function Pump({ channels }: { channels: boolean }) {
  const top = useRef<THREE.Group>(null);
  const label = useRef<HTMLSpanElement>(null);
  const ions = useRef<THREE.InstancedMesh>(null);
  const phosphate = useRef<THREE.Mesh>(null);
  const obj = useMemo(() => new THREE.Object3D(), []);
  const material = useMemo(() => holoMaterial({ color: '#86d6ff', fill: 0.04, rim: 0.5 }), []);
  useEffect(() => () => material.dispose(), [material]);
  const pumpTime = useRef(0),
    pumpRate = useRef(0.1);
  useFrame(({ clock }, dt) => {
    const rate = read('pump.rate', NaN);
    pumpRate.current = approach(pumpRate.current, Number.isNaN(rate) ? 0.1 : rate, dt, 4);
    if (!reducedMotion()) pumpTime.current += dt * pumpRate.current;
    const t = reducedMotion() ? 0 : clock.elapsedTime;
    const phase = dynamics.pumpPhase(pumpTime.current, 1);
    const state = dynamics.NAK_PUMP_STATES[phase.stateIndex]!;
    if (label.current) label.current.textContent = state.label;
    if (phosphate.current) phosphate.current.visible = state.phosphorylated;
    if (top.current) top.current.rotation.z = state.side === 'ext' ? 0.25 : 0;
    material.uniforms.uTime.value = t;
    if (ions.current) {
      for (let i = 0; i < 5; i++) {
        const na = i < 3;
        const active = na ? phase.stateIndex <= 2 : phase.stateIndex >= 3;
        const step = na ? phase.stateIndex : phase.stateIndex - 3;
        const y = (na ? -1 : 1) * (2 - Math.min(2, Math.max(0, step + phase.progress)) * 2);
        obj.position.set(((i % 3) - 1) * 0.3, y, 0.8);
        obj.scale.setScalar(active ? 1 : 0.001);
        obj.updateMatrix();
        ions.current.setMatrixAt(i, obj.matrix);
        ions.current.setColorAt(i, new THREE.Color(na ? '#ffb057' : '#5ee6ff'));
      }
      ions.current.instanceMatrix.needsUpdate = true;
      if (ions.current.instanceColor) ions.current.instanceColor.needsUpdate = true;
    }
  });
  return (
    <Interactive id="bomba" anchor={[0, 0, 0]}>
      <group ref={top}>
        {Array.from({ length: 10 }, (_, i) => {
          const angle = (i * Math.PI * 2) / 10;
          return (
            <mesh
              key={i}
              position={[Math.cos(angle) * 0.65, 0, Math.sin(angle) * 0.55]}
              rotation={[0.05 * Math.sin(angle), 0, 0.05 * Math.cos(angle)]}
              material={material}
            >
              <capsuleGeometry args={[0.17, 2.5, 4, 8]} />
            </mesh>
          );
        })}
        <mesh position={[0, -1.45, 0]} scale={[0.8, 0.55, 0.55]} material={material}>
          <sphereGeometry args={[1, 24, 16]} />
        </mesh>
      </group>
      <mesh position={[1.15, 0.35, 0]} material={material}>
        <capsuleGeometry args={[0.24, 1.9, 4, 8]} />
      </mesh>
      <mesh ref={phosphate} position={[0.85, 0.25, 0.7]}>
        <sphereGeometry args={[0.2, 10, 8]} />
        <meshBasicMaterial color="#ffe08a" />
      </mesh>
      <instancedMesh ref={ions} args={[undefined, undefined, 5]}>
        <sphereGeometry args={[0.13, 16, 12]} />
        <meshBasicMaterial />
      </instancedMesh>
      <Html center zIndexRange={[5, 0]} position={[0, 3.2, 0]} className="na-ap-protein-label">
        <span>Bomba Na⁺/K⁺</span>
        <span ref={label}>{channels ? 'ciclo de transporte' : 'Unión de sodio citosólico'}</span>
      </Html>
    </Interactive>
  );
}
function MembranePatch() {
  const variant = useAtlas((s) => s.variant) ?? 'bomba';
  const group = useRef<THREE.Group>(null);
  const [phase, setPhase] = useState(0);
  const [manual, setManual] = useState(false);
  const panelPortal = useRef(document.body);
  const cursor = useRef<SVGLineElement>(null);
  const trace = useRef<SVGPolylineElement>(null);
  const traceLabel = useRef<HTMLSpanElement>(null);
  const history = useRef<number[]>([]);
  const sampleAt = useRef(0);

  const pulse = useRef<THREE.MeshBasicMaterial>(null);
  useEffect(() => {
    useAtlas.getState().setParts(parts);
    return () => useAtlas.getState().setParts({});
  }, []);
  useFrame(({ clock }, dt) => {
    if (cursor.current) {
      const t =
        reducedMotion() || manual
          ? [0.05, 0.34, 0.52, 0.65, 0.8][phase]!
          : (clock.elapsedTime % 6) / 6;
      const voltage = read('hh.V', NaN);
      const live = Number.isFinite(voltage) && !manual && !reducedMotion();
      if (traceLabel.current)
        traceLabel.current.textContent = live
          ? '· señal del laboratorio'
          : '· ciclo ilustrativo de 6 s';
      if (trace.current) {
        if (live && clock.elapsedTime - sampleAt.current > 0.08) {
          sampleAt.current = clock.elapsedTime;
          history.current.push(voltage);
          if (history.current.length > 100) history.current.shift();
          trace.current.setAttribute(
            'points',
            history.current
              .map(
                (v, i) => `${30 + i * 2},${Math.max(8, Math.min(58, 58 - ((v + 80) * 50) / 120))}`,
              )
              .join(' '),
          );
        } else if (!live) {
          history.current.length = 0;
          trace.current.setAttribute(
            'points',
            '30,52 75,52 90,50 105,10 115,22 135,50 155,58 180,52 230,52',
          );
        }
      }
      const x = live ? 30 + Math.max(0, history.current.length - 1) * 2 : 30 + t * 200;
      cursor.current.setAttribute('x1', String(x));
      cursor.current.setAttribute('x2', String(x));
      const current = t < 0.27 ? 0 : t < 0.42 ? 1 : t < 0.58 ? 2 : t < 0.73 ? 3 : 4;
      if (!manual && !reducedMotion() && current !== phase) setPhase(current);
    }
    if (pulse.current) {
      const t = reducedMotion() ? 0 : clock.elapsedTime % 4;
      pulse.current.opacity =
        variant === 'canales' ? Math.max(0, 0.18 * (1 - Math.abs(t - 1.2))) : 0;
      pulse.current.color.set(t < 1.2 ? '#ffb057' : '#5ee6ff');
    }
    if (group.current) group.current.scale.setScalar(approach(group.current.scale.x, 1, dt, 4));
  });
  const c = dynamics.TYPICAL_MAMMALIAN_CONC;
  return (
    <group ref={group} rotation={[-0.34, 0, 0]}>
      <Lipids />
      <mesh visible={false} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[18, 18]} />
        <meshBasicMaterial
          ref={pulse}
          transparent
          opacity={0}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>
      <Pump channels={variant === 'canales'} />
      <Channel
        phase={phase}
        manual={manual}
        active={variant === 'canales'}
        id="nav"
        x={-4}
        color="#7ab6ff"
      />
      <Channel
        phase={phase}
        manual={manual}
        active={variant === 'canales'}
        id="kv"
        x={4}
        color="#5ca4ff"
      />
      <Channel
        phase={phase}
        manual={manual}
        active={variant === 'canales'}
        id="fuga"
        x={7}
        color="#86d6ff"
      />
      {variant === 'canales' && (
        <Html portal={panelPortal} wrapperClass="na-ap-screen" zIndexRange={[20, 20]}>
          <section className="na-ap-panel" aria-label="Potencial de acción esquemático">
            <div className="na-ap-legend">
              <span>● Na⁺</span> · <span>● K⁺</span>
            </div>
            <div className="na-ap-heading">
              Potencial de acción <span ref={traceLabel}>· ciclo ilustrativo de 6 s</span>
            </div>
            <svg
              viewBox="0 0 240 70"
              role="img"
              aria-label="Voltaje aproximado entre menos 80 y más 40 milivoltios"
            >
              <text x="0" y="12">
                +40
              </text>
              <text x="0" y="60">
                −80
              </text>
              <text x="0" y="36">
                mV
              </text>
              <path d="M30 8V58H230" fill="none" stroke="currentColor" opacity=".4" />
              <polyline
                ref={trace}
                points="30,52 75,52 90,50 105,10 115,22 135,50 155,58 180,52 230,52"
                fill="none"
                stroke="#75caff"
                strokeWidth="1.5"
              />
              <line ref={cursor} x1="30" x2="30" y1="8" y2="58" stroke="#fff" />
            </svg>
            <div className="na-ap-caption">Voltaje aproximado · esquema</div>
            <div className="na-ap-phases" aria-label="Fases del potencial de acción">
              {[
                'Reposo',
                'Despolarización',
                'Repolarización',
                'Hiperpolarización',
                'Refractario',
              ].map((name, i) => (
                <button
                  key={name}
                  type="button"
                  aria-pressed={phase === i}
                  onClick={() => {
                    setPhase(i);
                    setManual(true);
                  }}
                >
                  {name}
                </button>
              ))}
            </div>
          </section>
        </Html>
      )}
      <Ions id="na" color="#ffb057" />
      <Ions id="k" color="#5ee6ff" />
      <Html zIndexRange={[5, 0]} position={[-7.5, 4.6, 0]} className="na-scene-tag">
        Medio extracelular
      </Html>
      <Html zIndexRange={[5, 0]} position={[-7.5, -3.4, 0]} className="na-scene-tag">
        Citosol
      </Html>
      <Html zIndexRange={[5, 0]} position={[-8, -5.5, 0]} className="na-scene-tag">
        Esquema · borrador sin revisión experta
        {variant === 'reposo' &&
          ` · Eₖ ${dynamics.nernst(1, c.K.out, c.K.in).toFixed(0)} mV · Eₙₐ ${dynamics.nernst(1, c.Na.out, c.Na.in).toFixed(0)} mV`}
      </Html>
    </group>
  );
}

export default function MembraneScene() {
  const variant = useAtlas((s) => s.variant);
  return variant === 'saltatoria' ? <SaltatoryScene /> : <MembranePatch />;
}
