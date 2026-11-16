import { Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { approach, holoMaterial } from '../holo';
import { useAtlas, type PartInfo } from '../store';
import { random, reducedMotion, taperedTube } from './geom';

const parts: Record<string, PartInfo> = {
  soma: {
    title: 'Soma',
    kicker: 'Cuerpo celular',
    model: 'izhikevich',
    body: 'El soma contiene el núcleo y gran parte de la maquinaria que mantiene viva a la neurona. Recibe señales que llegan por las dendritas y contribuye a integrar sus efectos eléctricos. La forma del cuerpo celular varía entre tipos neuronales y regiones. Este dibujo es una representación esquemática: no reproduce una célula individual ni establece proporciones exactas. El modelo asociado describe patrones de disparo, no la forma ni todos los mecanismos de la célula.',
  },
  dendritas: {
    title: 'Dendritas',
    model: 'lif',
    body: 'Las dendritas son prolongaciones ramificadas que reciben señales de otras células. Su forma y distribución influyen en cómo esas señales llegan al soma; también pueden presentar propiedades eléctricas activas. Su organización varía mucho entre neuronas, desde los árboles planos de Purkinje hasta las ramas radiales de células estrelladas. Aquí se muestran como tubos simplificados y su ramificación es una representación esquemática, no una reconstrucción experimental.',
  },
  espinas: {
    title: 'Espinas dendríticas',
    model: 'stdp',
    body: 'Las espinas son pequeñas protrusiones de muchas dendritas y constituyen sitios frecuentes de sinapsis excitadoras. Su cabeza y su cuello pueden variar de forma y participar en la compartimentación de señales. No todas las neuronas ni todas sus dendritas tienen la misma densidad de espinas. Los puntos de luz mostrados aquí representan entradas de manera esquemática: no son mediciones de actividad ni una distribución anatómica exacta.',
  },
  inicial: {
    title: 'Segmento inicial del axón',
    model: 'hh',
    body: 'El segmento inicial conecta el soma con el axón y concentra canales iónicos que contribuyen al inicio de potenciales de acción en muchas neuronas. Su posición y composición pueden variar según el tipo celular. La señal que aparece aquí ilustra la propagación y no pretende reproducir el umbral, la velocidad ni la distribución molecular de una neurona concreta. La representación y su escala son esquemáticas.',
  },
  axon: {
    title: 'Axón',
    model: 'axon',
    body: 'El axón conduce señales desde la región de inicio hacia otras partes de la célula y sus terminales. Puede ramificarse y alcanzar distancias muy diferentes según la neurona. Algunos axones están mielinizados y otros no; el modelo de cable asociado describe un axón idealizado sin mielina. La longitud, trayectoria y velocidad de la señal en esta escena son esquemáticas y no representan una medición.',
  },
  mielina: {
    title: 'Vaina de mielina',
    body: 'La mielina es una envoltura formada por células gliales alrededor de segmentos de ciertos axones. Su aislamiento modifica la propagación de señales y deja interrupciones llamadas nodos de Ranvier. En el sistema nervioso central la producen oligodendrocitos; en el periférico, células de Schwann. Las vainas de este dibujo son esquemáticas y no muestran todas las capas ni las células gliales que las forman.',
  },
  nodo: {
    title: 'Nodo de Ranvier',
    model: 'axon',
    body: 'Los nodos de Ranvier son interrupciones entre segmentos de mielina donde se concentran canales iónicos. En un axón mielinizado, la señal se regenera en estas regiones y la conducción se describe como saltatoria. El espaciado y la duración de los destellos aquí se escogieron para facilitar la observación, no como valores medidos. El modelo de cable asociado no incluye mielina y representa otro caso idealizado.',
  },
  terminal: {
    title: 'Botón terminal',
    model: 'tsodyks-markram',
    body: 'Los botones terminales son regiones de terminaciones axónicas que pueden formar contactos sinápticos con otras células. Cuando llega un potencial de acción, la entrada de calcio puede desencadenar la liberación de neurotransmisores desde vesículas. La respuesta depende del tipo de sinapsis y de su historia de actividad. Los destellos y botones de esta escena son una representación esquemática, no una visualización de liberación medida.',
  },
};

type Branch = { points: THREE.Vector3[]; radius: number };
const v = (x: number, y: number, z = 0) => new THREE.Vector3(x, y, z);
function morphology(kind: string) {
  const rng = random(53);
  const branches: Branch[] = [];
  const tips: THREE.Vector3[] = [];
  const add = (
    a: THREE.Vector3,
    b: THREE.Vector3,
    depth: number,
    spread: number,
    planar = false,
  ) => {
    const mid = a
      .clone()
      .lerp(b, 0.5)
      .add(v((rng() - 0.5) * 0.3, 0, planar ? 0 : (rng() - 0.5) * 0.4));
    branches.push({ points: [a, mid, b], radius: 0.12 + depth * 0.035 });
    if (!depth) {
      tips.push(b);
      return;
    }
    for (const sign of [-1, 1]) {
      const dir = b.clone().sub(a).multiplyScalar(0.69);
      const angle = sign * (0.35 + rng() * spread);
      const x = dir.x * Math.cos(angle) - dir.y * Math.sin(angle);
      const y = dir.x * Math.sin(angle) + dir.y * Math.cos(angle);
      add(b, b.clone().add(v(x, y, planar ? 0 : (rng() - 0.5) * 0.7)), depth - 1, spread, planar);
    }
  };
  if (kind === 'piramidal') {
    add(v(0, 0.8), v(0, 4.4), 3, 0.5);
    for (const s of [-1, 1]) add(v(s * 0.5, -0.4), v(s * 2.3, -1.7), 2, 0.5);
  } else if (kind === 'purkinje') {
    add(v(0, 0.8), v(0, 2.1), 6, 0.42, true);
  } else if (kind === 'bipolar') {
    add(v(0, 0.8), v(0, 3.5), 2, 0.45);
  } else if (kind === 'pseudounipolar') {
    branches.push({ points: [v(0, 0.7), v(0, 2), v(1.2, 2.4)], radius: 0.15 });
    branches.push({ points: [v(1.2, 2.4), v(-1, 2.5), v(-4, 2.5)], radius: 0.14 });
  } else {
    const count = kind === 'motoneurona' ? 7 : 8;
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2;
      const length = kind === 'estrellada' ? 2 : 2.7;
      add(
        v(Math.cos(a) * 0.7, Math.sin(a) * 0.7),
        v(Math.cos(a) * length, Math.sin(a) * length, rng() - 0.5),
        2,
        0.5,
      );
    }
  }
  return { branches, tips };
}

function BranchMesh({ branch }: { branch: Branch }) {
  const geometry = useMemo(() => taperedTube(branch.points, branch.radius), [branch]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return (
    <mesh geometry={geometry}>
      <meshBasicMaterial
        color="#5ca4ff"
        transparent
        opacity={0.65}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </mesh>
  );
}
function Interactive({
  id,
  anchor,
  children,
  onActivate,
}: {
  onActivate?: () => void;
  id: string;
  anchor: [number, number, number];
  children: React.ReactNode;
}) {
  const group = useRef<THREE.Group>(null);
  const hover = useRef(false);
  useFrame((_, dt) => {
    if (group.current) {
      const s = approach(group.current.scale.x, hover.current ? 1.08 : 1, dt);
      group.current.scale.setScalar(s);
    }
  });
  return (
    <group
      ref={group}
      onPointerOver={(e) => {
        e.stopPropagation();
        hover.current = true;
        useAtlas
          .getState()
          .setHover({ key: id, title: parts[id]!.title, subtitle: 'Esquema neuronal', anchor });
      }}
      onPointerOut={() => {
        hover.current = false;
        useAtlas.getState().setHover(null);
      }}
      onClick={(e) => {
        e.stopPropagation();
        useAtlas.getState().select(id);
        onActivate?.();
      }}
    >
      {children}
    </group>
  );
}
function Cell({ kind }: { kind: string }) {
  const { branches, tips } = useMemo(() => morphology(kind), [kind]);
  const spines = useRef<THREE.InstancedMesh>(null);
  const signal = useRef<THREE.Mesh>(null);
  const epsps = useRef<THREE.InstancedMesh>(null);
  const triggered = useRef<number | null>(null);
  const elapsedTime = useRef(0);
  const object = useMemo(() => new THREE.Object3D(), []);
  const group = useRef<THREE.Group>(null);
  const mat = useMemo(() => holoMaterial({ color: '#5ca4ff', fill: 0.17, rim: 0.85 }), []);
  const myelinated = ['piramidal', 'motoneurona', 'pseudounipolar'].includes(kind);
  const spineful = ['piramidal', 'purkinje', 'estrellada'].includes(kind);
  useEffect(() => {
    const obj = new THREE.Object3D();
    if (spines.current)
      tips.forEach((p, i) => {
        obj.position.copy(p);
        obj.scale.setScalar(1);
        obj.updateMatrix();
        spines.current!.setMatrixAt(i, obj.matrix);
      });
  }, [tips]);
  useEffect(() => () => mat.dispose(), [mat]);
  useFrame((state, dt) => {
    elapsedTime.current = state.clock.elapsedTime;
    if (group.current) group.current.scale.setScalar(approach(group.current.scale.x, 1, dt, 5));
    if (signal.current) {
      const elapsed = state.clock.elapsedTime;
      const t = reducedMotion()
        ? 0
        : ((triggered.current === null ? elapsed : elapsed - triggered.current) % 2.5) / 2.5;
      signal.current.position.y = -1.2 - (myelinated ? Math.floor(t * 5) / 5 : t) * 5.5;
    }
    if (epsps.current) {
      const t = reducedMotion() ? 0 : (state.clock.elapsedTime % 2.5) / 2.5;
      tips.forEach((tip, i) => {
        const p = (t + i / Math.max(1, tips.length)) % 1;
        object.position.copy(tip).multiplyScalar(1 - p);
        object.scale.setScalar(0.7 + 0.3 * Math.sin(p * Math.PI));
        object.updateMatrix();
        epsps.current!.setMatrixAt(i, object.matrix);
      });
      epsps.current.instanceMatrix.needsUpdate = true;
    }
    mat.uniforms.uTime.value = state.clock.elapsedTime;
  });
  return (
    <group ref={group} scale={0.01}>
      <Interactive id="dendritas" anchor={[2, 3, 0]}>
        {branches.map((b, i) => (
          <BranchMesh key={i} branch={b} />
        ))}
      </Interactive>
      {spineful && (
        <Interactive id="espinas" anchor={[2, 4, 0]}>
          <instancedMesh ref={spines} args={[undefined, undefined, tips.length]}>
            <sphereGeometry args={[0.09, 8, 6]} />
            <meshBasicMaterial color="#d8f4ff" />
          </instancedMesh>
        </Interactive>
      )}
      <Interactive
        id="soma"
        anchor={[0, 0, 0]}
        onActivate={() => {
          triggered.current = elapsedTime.current;
        }}
      >
        <mesh material={mat} scale={kind === 'piramidal' ? [1, 1.25, 0.8] : [1, 1, 0.8]}>
          {kind === 'piramidal' ? (
            <coneGeometry args={[1.05, 1.9, 4]} />
          ) : (
            <sphereGeometry args={[0.85, 24, 16]} />
          )}
        </mesh>
      </Interactive>
      {spineful && (
        <instancedMesh ref={epsps} args={[undefined, undefined, tips.length]}>
          <sphereGeometry args={[0.1, 8, 6]} />
          <meshBasicMaterial color="#d8f4ff" />
        </instancedMesh>
      )}
      {kind === 'cesta' &&
        [-1, 1].map((side) => (
          <group key={side} position={[side * 3, -3.8, 0]}>
            <mesh>
              <sphereGeometry args={[0.65, 16, 12]} />
              <meshBasicMaterial color="#3a86ff" transparent opacity={0.2} depthWrite={false} />
            </mesh>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.8, 0.07, 8, 32]} />
              <meshBasicMaterial color="#86d6ff" />
            </mesh>
          </group>
        ))}
      <Interactive id="inicial" anchor={[0, -1.2, 0]}>
        <mesh position={[0, -1.2, 0]}>
          <cylinderGeometry args={[0.12, 0.16, 0.8, 12]} />
          <meshBasicMaterial color="#86d6ff" />
        </mesh>
      </Interactive>
      <Interactive id="axon" anchor={[0, -4, 0]}>
        <mesh position={[0, -4, 0]}>
          <cylinderGeometry args={[0.075, 0.075, 5.2, 10]} />
          <meshBasicMaterial color="#5ca4ff" />
        </mesh>
      </Interactive>
      {myelinated && (
        <>
          <Interactive id="mielina" anchor={[0, -3, 0]}>
            {[0, 1, 2, 3].map((i) => (
              <mesh key={i} position={[0, -2.2 - i * 1.05, 0]}>
                <cylinderGeometry args={[0.22, 0.22, 0.82, 12]} />
                <meshBasicMaterial color="#86d6ff" transparent opacity={0.7} />
              </mesh>
            ))}
          </Interactive>
          <Interactive id="nodo" anchor={[0, -2.72, 0]}>
            {[0, 1, 2].map((i) => (
              <mesh key={i} position={[0, -2.72 - i * 1.05, 0]}>
                <sphereGeometry args={[0.14, 8, 8]} />
                <meshBasicMaterial color="#d8f4ff" />
              </mesh>
            ))}
          </Interactive>
        </>
      )}
      <Interactive id="terminal" anchor={[0, -6.8, 0]}>
        <mesh position={[0, -6.8, 0]}>
          <sphereGeometry args={[0.25, 12, 8]} />
          <meshBasicMaterial color="#86d6ff" />
        </mesh>
      </Interactive>
      <mesh ref={signal}>
        <sphereGeometry args={[0.19, 10, 8]} />
        <meshBasicMaterial color="#d8f4ff" />
      </mesh>
      <Html position={[-3, -7.5, 0]} className="na-scene-tag">
        Esquema neuronal · borrador sin revisión experta
      </Html>
    </group>
  );
}
export default function NeuronScene() {
  const variant = useAtlas((s) => s.variant) ?? 'piramidal';
  useEffect(() => {
    useAtlas.getState().setParts(parts);
    return () => useAtlas.getState().setParts({});
  }, []);
  return <Cell key={variant} kind={variant} />;
}
