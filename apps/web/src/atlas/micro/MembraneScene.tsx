import { Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { dynamics } from '@neuroatlas/simulation';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { approach, holoMaterial } from '../holo';
import { useAtlas, type PartInfo } from '../store';
import { random, reducedMotion } from './geom';

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
  const headMaterial = useMemo(() => instancedHolo('#5ca4ff', 0.025, 0.3), []);
  const tailMaterial = useMemo(() => instancedHolo('#3a86ff', 0.02, 0.2), []);
  useEffect(
    () => () => {
      headMaterial.dispose();
      tailMaterial.dispose();
    },
    [headMaterial, tailMaterial],
  );
  const heads = useRef<THREE.InstancedMesh>(null);
  const tails = useRef<THREE.InstancedMesh>(null);
  const obj = useMemo(() => new THREE.Object3D(), []);
  useFrame(({ clock }) => {
    if (!heads.current || !tails.current) return;
    const time = reducedMotion() ? 0 : clock.elapsedTime * 0.18;
    let i = 0;
    for (let x = -11; x <= 11; x++)
      for (let z = -11; z <= 11; z++)
        for (const side of [-1, 1]) {
          obj.position.set(x, side * 0.8 + Math.sin(x * 0.35 + z * 0.3 + time) * 0.08, z);
          obj.scale.setScalar(1);
          obj.updateMatrix();
          heads.current?.setMatrixAt(i, obj.matrix);
          obj.position.y = side * 0.36 + Math.sin(x * 0.35 + z * 0.3 + time) * 0.08;
          obj.scale.set(1, 1, 1);
          obj.updateMatrix();
          tails.current?.setMatrixAt(i++, obj.matrix);
        }
    if (heads.current) heads.current.instanceMatrix.needsUpdate = true;
    if (tails.current) tails.current.instanceMatrix.needsUpdate = true;
  });
  return (
    <Interactive id="bicapa" anchor={[-5, 0, 0]}>
      <instancedMesh ref={heads} args={[undefined, undefined, 1058]}>
        <sphereGeometry args={[0.18, 16, 12]} />
        <primitive object={headMaterial} attach="material" />
      </instancedMesh>
      <instancedMesh ref={tails} args={[undefined, undefined, 1058]}>
        <cylinderGeometry args={[0.018, 0.018, 0.8, 12]} />
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
      z: (rng() - 0.5) * 17,
      y: (i < 39 ? (id === 'na' ? 1 : -1) : id === 'na' ? -1 : 1) * (1.5 + rng() * 3),
      phase: rng() * 6,
    }));
  }, [id]);
  const obj = useMemo(() => new THREE.Object3D(), []);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = reducedMotion() ? 0 : clock.elapsedTime * 0.35;
    points.forEach((p, i) => {
      obj.position.set(
        p.x + Math.sin(t + p.phase) * 0.25,
        p.y + Math.sin(t * 0.7 + p.phase) * 0.15,
        p.z + Math.cos(t + p.phase) * 0.25,
      );
      obj.updateMatrix();
      ref.current!.setMatrixAt(i, obj.matrix);
    });
    ref.current.instanceMatrix.needsUpdate = true;
  });
  return (
    <Interactive id={id} anchor={id === 'na' ? [5, 3, 0] : [5, -3, 0]}>
      <instancedMesh ref={ref} args={[undefined, undefined, points.length]}>
        <sphereGeometry args={[0.13, 16, 12]} />
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
}: {
  active: boolean;
  id: 'nav' | 'kv' | 'fuga';
  x: number;
  color: string;
}) {
  const material = useMemo(() => holoMaterial({ color, fill: 0.04, rim: 0.5 }), [color]);
  useEffect(() => () => material.dispose(), [material]);
  const ion = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    const t = reducedMotion() ? 0 : clock.elapsedTime % 4;
    const start = id === 'nav' ? 0.5 : 1.4;
    const progress = (t - start) / 0.8;
    if (ion.current) {
      ion.current.visible = active && id !== 'fuga' && progress >= 0 && progress <= 1;
      ion.current.position.y = (id === 'nav' ? 1 : -1) * (2 - progress * 4);
    }
    material.uniforms.uHover.value = active && progress >= 0 && progress <= 1 ? 0.8 : 0;
  });
  return (
    <Interactive id={id} anchor={[x, 0, 0]}>
      {(id === 'fuga' ? [0, 1] : [0, 1, 2, 3]).map((i) => {
        const count = id === 'fuga' ? 2 : 4;
        const angle = (i * Math.PI * 2) / count;
        return (
          <mesh
            key={i}
            position={[x + Math.cos(angle) * 0.48, 0, Math.sin(angle) * 0.48]}
            material={material}
          >
            <capsuleGeometry args={[0.3, 1.8, 8, 16]} />
          </mesh>
        );
      })}
      <mesh ref={ion} position={[x, 2, 0]}>
        <sphereGeometry args={[0.13, 16, 12]} />
        <meshBasicMaterial color={id === 'nav' ? '#ffb057' : '#5ee6ff'} />
      </mesh>
    </Interactive>
  );
}
function Pump() {
  const top = useRef<THREE.Mesh>(null);
  const bottom = useRef<THREE.Mesh>(null);
  const label = useRef<HTMLDivElement>(null);
  const ions = useRef<THREE.InstancedMesh>(null);
  const phosphate = useRef<THREE.Mesh>(null);
  const obj = useMemo(() => new THREE.Object3D(), []);
  const material = useMemo(() => holoMaterial({ color: '#86d6ff', fill: 0.04, rim: 0.5 }), []);
  useEffect(() => () => material.dispose(), [material]);
  useFrame(({ clock }) => {
    const t = reducedMotion() ? 0 : clock.elapsedTime;
    const phase = dynamics.pumpPhase(t, 0.1);
    const state = dynamics.NAK_PUMP_STATES[phase.stateIndex]!;
    if (label.current) label.current.textContent = state.label;
    if (phosphate.current) phosphate.current.visible = state.phosphorylated;
    if (top.current) top.current.rotation.z = state.side === 'ext' ? 0.25 : 0;
    if (bottom.current) bottom.current.rotation.z = state.side === 'cyt' ? -0.25 : 0;
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
      <mesh ref={top} position={[0, 0, 0]} scale={[0.65, 1.3, 0.55]} material={material}>
        <sphereGeometry args={[1, 32, 24]} />
      </mesh>
      <mesh ref={bottom} position={[0, -1.5, 0]} scale={[1.15, 0.8, 0.8]} material={material}>
        <sphereGeometry args={[1, 32, 24]} />
      </mesh>
      <mesh ref={phosphate} position={[0.85, 0.25, 0.7]}>
        <sphereGeometry args={[0.2, 10, 8]} />
        <meshBasicMaterial color="#ffe08a" />
      </mesh>
      <instancedMesh ref={ions} args={[undefined, undefined, 5]}>
        <sphereGeometry args={[0.13, 16, 12]} />
        <meshBasicMaterial />
      </instancedMesh>
      <Html zIndexRange={[5, 0]} position={[1.3, 1.7, 0]} className="na-scene-tag">
        <div ref={label}>Unión de sodio citosólico</div>
      </Html>
    </Interactive>
  );
}
export default function MembraneScene() {
  const variant = useAtlas((s) => s.variant) ?? 'bomba';
  const group = useRef<THREE.Group>(null);
  const pulse = useRef<THREE.MeshBasicMaterial>(null);
  useEffect(() => {
    useAtlas.getState().setParts(parts);
    return () => useAtlas.getState().setParts({});
  }, []);
  useFrame(({ clock }, dt) => {
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
    <group ref={group}>
      <Lipids />
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
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
      <Pump />
      <Channel active={variant === 'canales'} id="nav" x={-4} color="#7ab6ff" />
      <Channel active={variant === 'canales'} id="kv" x={4} color="#5ca4ff" />
      <Channel active={variant === 'canales'} id="fuga" x={7} color="#86d6ff" />
      <Ions id="na" color="#ffb057" />
      <Ions id="k" color="#5ee6ff" />
      <Html zIndexRange={[5, 0]} position={[5, 4.5, 0]} className="na-scene-tag">
        <span style={{ color: '#ffb057' }}>● Na⁺</span> ·{' '}
        <span style={{ color: '#5ee6ff' }}>● K⁺</span>
      </Html>
      <Html zIndexRange={[5, 0]} position={[-8, 4.5, 0]} className="na-scene-tag">
        Medio extracelular
      </Html>
      <Html zIndexRange={[5, 0]} position={[-8, -4.5, 0]} className="na-scene-tag">
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
