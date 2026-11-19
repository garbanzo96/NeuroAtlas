import { read } from '../signals';
import { Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { approach, holoMaterial } from '../holo';
import { useAtlas, type PartInfo } from '../store';
import { random, reducedMotion, taperedTube } from './geom';

const axonSignals = Array.from({ length: 60 }, (_, i) => `axon.V[${i}]`);

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

type Branch = {
  curve: THREE.CatmullRomCurve3;
  r0: number;
  r1: number;
  depth: number;
  path: THREE.CatmullRomCurve3[];
};
const v = (x: number, y: number, z = 0) => new THREE.Vector3(x, y, z);
function morphology(kind: string) {
  const rng = random(53);
  const branches: Branch[] = [];
  const add = (
    a: THREE.Vector3,
    direction: THREE.Vector3,
    length: number,
    depth: number,
    radius: number,
    planar = false,
    parentPath: THREE.CatmullRomCurve3[] = [],
  ) => {
    const dir = direction.clone().normalize();
    const b = a.clone().addScaledVector(dir, length);
    const mid = a
      .clone()
      .lerp(b, 0.5)
      .add(
        v(
          (rng() - 0.5) * length * 0.1,
          (rng() - 0.5) * length * 0.08,
          planar ? 0 : (rng() - 0.5) * length * 0.12,
        ),
      );
    const curve = new THREE.CatmullRomCurve3([a, mid, b]);
    const path = [...parentPath, curve];
    branches.push({ curve, r0: radius, r1: Math.max(0.025, radius * 0.66), depth, path });
    if (!depth) return;
    for (const sign of [-1, 1]) {
      const angle = sign * (0.44 + rng() * 0.34);
      const next = dir.clone().applyAxisAngle(v(0, 0, 1), angle);
      if (!planar) next.applyAxisAngle(v(0, 1, 0), (rng() - 0.5) * 0.7);
      add(b, next, length * (0.7 + rng() * 0.08), depth - 1, radius * 0.66, planar, path);
    }
  };
  if (kind === 'piramidal') {
    add(v(0, 0.7), v(0, 1), 3.2, 3, 0.3);
    for (const side of [-1, 1]) {
      add(v(0, 2.2), v(side, 0.7, side * 0.15), 1.2, 2, 0.13);
      add(v(side * 0.5, -0.35), v(side, -0.35, side * 0.2), 2, 3, 0.22);
    }
  } else if (kind === 'purkinje') {
    add(v(0, 0.7), v(0, 1), 1.8, 5, 0.28, true);
  } else if (kind === 'pseudounipolar') {
    add(v(0, 0.7), v(0, 1), 1.8, 1, 0.18);
  } else {
    const count = kind === 'bipolar' ? 2 : 7;
    for (let i = 0; i < count; i++) {
      const angle = kind === 'bipolar' ? (i ? Math.PI : 0) : (i * Math.PI * 2) / count;
      add(
        v(Math.sin(angle) * 0.7, Math.cos(angle) * 0.7),
        v(Math.sin(angle), Math.cos(angle), (rng() - 0.5) * 0.3),
        1.8,
        3,
        0.2,
      );
    }
  }
  return branches;
}
function BranchMesh({ branch, material }: { branch: Branch; material: THREE.Material }) {
  const geometry = useMemo(() => taperedTube(branch.curve, branch.r0, branch.r1, 32, 12), [branch]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return <mesh geometry={geometry} material={material} />;
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
  const branches = useMemo(() => morphology(kind), [kind]);
  const spinePoints = useMemo(
    () =>
      branches.flatMap((branch) =>
        Array.from({ length: 5 }, (_, i) => {
          const t = (i + 1) / 6;
          const point = branch.curve.getPointAt(t);
          const tangent = branch.curve.getTangentAt(t);
          const normal = new THREE.Vector3(-tangent.y, tangent.x, 0.4).normalize();
          return point.addScaledVector(normal, branch.r0 * (1 - t) + branch.r1 * t + 0.045);
        }),
      ),
    [branches],
  );
  const signalBranches = useMemo(
    () => branches.filter((b) => b.depth === 0).slice(0, 16),
    [branches],
  );
  const spines = useRef<THREE.InstancedMesh>(null);
  const nodeLights = useRef<THREE.InstancedMesh>(null);
  const spineMaterial = useMemo(() => {
    const m = holoMaterial({ color: '#72b6ef', fill: 0.03, rim: 0.4 });
    m.vertexShader = m.vertexShader
      .replace(
        'modelMatrix * vec4(position, 1.0)',
        'modelMatrix * instanceMatrix * vec4(position, 1.0)',
      )
      .replace('mat3(modelMatrix) * normal', 'mat3(modelMatrix * instanceMatrix) * normal');
    return m;
  }, []);
  useEffect(() => () => spineMaterial.dispose(), [spineMaterial]);
  const somaGeometry = useMemo(() => {
    const geometry = new THREE.IcosahedronGeometry(0.85, 4);
    if (kind === 'piramidal') {
      const positions = geometry.getAttribute('position');
      for (let i = 0; i < positions.count; i++) {
        const y = positions.getY(i);
        const width = 1 - Math.max(0, y / 0.85) * 0.5;
        positions.setX(i, positions.getX(i) * width);
        positions.setZ(i, positions.getZ(i) * width);
      }
      geometry.computeVertexNormals();
    }
    return geometry;
  }, [kind]);
  useEffect(() => () => somaGeometry.dispose(), [somaGeometry]);
  const signal = useRef<THREE.Mesh>(null);
  const history = useRef(new Float32Array(180).fill(-65));
  const historyIndex = useRef(0);
  const glow = useRef(0);
  const epsps = useRef<THREE.InstancedMesh>(null);
  const triggered = useRef<number | null>(null);
  const elapsedTime = useRef(0);
  const object = useMemo(() => new THREE.Object3D(), []);
  const group = useRef<THREE.Group>(null);
  const mat = useMemo(() => holoMaterial({ color: '#5ca4ff', fill: 0.04, rim: 0.5 }), []);
  const backgroundMat = useMemo(
    () => holoMaterial({ color: '#5ca4ff', fill: 0.006, rim: 0.1 }),
    [],
  );
  useEffect(() => () => backgroundMat.dispose(), [backgroundMat]);
  const myelinated = ['piramidal', 'motoneurona', 'pseudounipolar'].includes(kind);
  const spineful = ['piramidal', 'purkinje', 'estrellada'].includes(kind);
  useEffect(() => {
    const obj = new THREE.Object3D();
    if (spines.current)
      spinePoints.forEach((p, i) => {
        obj.position.copy(p);
        obj.scale.setScalar(1);
        obj.updateMatrix();
        spines.current!.setMatrixAt(i, obj.matrix);
      });
    if (spines.current) spines.current.instanceMatrix.needsUpdate = true;
  }, [spinePoints]);
  useEffect(() => () => mat.dispose(), [mat]);
  useFrame((state, dt) => {
    elapsedTime.current = state.clock.elapsedTime;
    if (group.current) group.current.scale.setScalar(approach(group.current.scale.x, 1, dt, 5));
    const voltage = read('hh.V', NaN);
    let cableActive = false,
      cableStrength = 0,
      cablePosition = 0;
    for (let i = 0; i < axonSignals.length; i++) {
      const value = read(axonSignals[i]!, NaN);
      if (!Number.isNaN(value)) {
        cableActive = true;
        const strength = Math.max(0, Math.min(1, (value + 35) / 55));
        if (strength > cableStrength) {
          cableStrength = strength;
          cablePosition = i / (axonSignals.length - 1);
        }
      }
    }
    history.current[historyIndex.current] = voltage;
    historyIndex.current = (historyIndex.current + 1) % history.current.length;
    if (signal.current) {
      const elapsed = state.clock.elapsedTime;
      const t = reducedMotion()
        ? 0
        : ((triggered.current === null ? elapsed : elapsed - triggered.current) % 2.5) / 2.5;
      const autonomousY = -1.2 - (myelinated ? Math.floor(t * 5) / 5 : t) * 5.5;
      if (!Number.isNaN(voltage)) {
        let strongest = 0,
          position = 0;
        for (let i = 0; i < 90; i++) {
          const v = history.current[(historyIndex.current - 1 - i + 180) % 180]!;
          const strength = Number.isFinite(v)
            ? Math.max(0, Math.min(1, (v + 35) / 55)) * (1 - i / 120)
            : 0;
          if (strength > strongest) {
            strongest = strength;
            position = i / 90;
          }
        }
        signal.current.position.y = approach(
          signal.current.position.y,
          -1.2 - position * 5.5,
          dt,
          12,
        );
        signal.current.scale.setScalar(
          approach(signal.current.scale.x, Math.max(0.001, strongest), dt, 12),
        );
      } else if (cableActive) {
        signal.current.position.y = approach(
          signal.current.position.y,
          -1.2 - cablePosition * 5.5,
          dt,
          12,
        );
        signal.current.scale.setScalar(
          approach(signal.current.scale.x, Math.max(0.001, cableStrength), dt, 12),
        );
      } else {
        signal.current.position.y = approach(signal.current.position.y, autonomousY, dt, 5);
        signal.current.scale.setScalar(approach(signal.current.scale.x, 1, dt, 5));
      }
    }
    if (epsps.current) {
      const t = reducedMotion() ? 0 : (state.clock.elapsedTime % 2.5) / 2.5;
      signalBranches.forEach((branch, i) => {
        const p = (t + i / Math.max(1, signalBranches.length)) % 1;
        const progress = p * branch.path.length;
        const segment = Math.min(branch.path.length - 1, Math.floor(progress));
        const curve = branch.path[branch.path.length - 1 - segment]!;
        object.position.copy(curve.getPointAt(1 - (progress - segment)));
        object.scale.setScalar(0.7 + 0.3 * Math.sin(p * Math.PI));
        object.updateMatrix();
        epsps.current!.setMatrixAt(i, object.matrix);
      });
      epsps.current.instanceMatrix.needsUpdate = true;
    }
    const phase = reducedMotion()
      ? 0
      : ((triggered.current === null
          ? state.clock.elapsedTime
          : state.clock.elapsedTime - triggered.current) %
          2.5) /
        2.5;
    const targetGlow = Number.isNaN(voltage)
      ? Math.max(0, 1 - Math.abs(phase - 0.08) * 18) * 0.25
      : Math.max(0, Math.min(1, (voltage + 65) / 100)) * 0.9;
    glow.current = approach(glow.current, targetGlow, dt, 10);
    mat.uniforms.uHover.value = glow.current;
    if (nodeLights.current) {
      for (let i = 0; i < 3; i++) {
        const glow = Math.max(0, 1 - Math.abs(phase - (i + 1) / 5) * 24);
        object.position.set(0, -2.72 - i * 1.05, 0);
        object.scale.setScalar(Math.max(0.001, glow));
        object.updateMatrix();
        nodeLights.current.setMatrixAt(i, object.matrix);
      }
      nodeLights.current.instanceMatrix.needsUpdate = true;
    }
    mat.uniforms.uTime.value = state.clock.elapsedTime;
  });
  return (
    <group ref={group} scale={0.01}>
      {[-1, 1].map((side) => (
        <group key={side} position={[side * 7, -0.4, -6]} scale={0.7}>
          <mesh material={backgroundMat}>
            <sphereGeometry args={[0.8, 24, 16]} />
          </mesh>
          {branches.slice(0, 12).map((branch, i) => (
            <BranchMesh key={i} branch={branch} material={backgroundMat} />
          ))}
        </group>
      ))}
      <Interactive id="dendritas" anchor={[2, 3, 0]}>
        {branches.map((b, i) => (
          <BranchMesh key={i} branch={b} material={mat} />
        ))}
      </Interactive>
      {spineful && (
        <Interactive id="espinas" anchor={[2, 4, 0]}>
          <instancedMesh ref={spines} args={[undefined, undefined, spinePoints.length]}>
            <sphereGeometry args={[0.035, 12, 8]} />
            <primitive object={spineMaterial} attach="material" />
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
          <primitive object={somaGeometry} attach="geometry" />
        </mesh>
      </Interactive>
      {spineful && (
        <instancedMesh ref={epsps} args={[undefined, undefined, signalBranches.length]}>
          <sphereGeometry args={[0.055, 12, 8]} />
          <meshBasicMaterial color="#d8f4ff" />
        </instancedMesh>
      )}
      {kind === 'cesta' &&
        [-1, 1].map((side) => (
          <group key={side} position={[side * 3, -3.8, 0]}>
            <mesh>
              <sphereGeometry args={[0.65, 16, 12]} />
              <primitive object={backgroundMat} attach="material" />
            </mesh>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.8, 0.07, 8, 32]} />
              <primitive object={mat} attach="material" />
            </mesh>
          </group>
        ))}
      <Interactive id="inicial" anchor={[0, -1.2, 0]}>
        <mesh position={[0, -1.2, 0]}>
          <cylinderGeometry args={[0.12, 0.06, 0.8, 16]} />
          <primitive object={mat} attach="material" />
        </mesh>
      </Interactive>
      <Interactive id="axon" anchor={[0, -4, 0]}>
        <mesh position={[0, -4, 0]}>
          <cylinderGeometry args={[0.055, 0.055, 5.2, 16]} />
          <primitive object={mat} attach="material" />
        </mesh>
      </Interactive>
      {myelinated && (
        <>
          <Interactive id="mielina" anchor={[0, -3, 0]}>
            {[0, 1, 2, 3].map((i) => (
              <mesh key={i} position={[0, -2.2 - i * 1.05, 0]}>
                <capsuleGeometry args={[0.14, 0.58, 8, 16]} />
                <primitive object={mat} attach="material" />
              </mesh>
            ))}
          </Interactive>
          <Interactive id="nodo" anchor={[0, -2.72, 0]}>
            {[0, 1, 2].map((i) => (
              <mesh key={i} position={[0, -2.72 - i * 1.05, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[0.09, 0.025, 12, 24]} />
                <primitive object={mat} attach="material" />
              </mesh>
            ))}
          </Interactive>
        </>
      )}
      {myelinated && (
        <instancedMesh ref={nodeLights} args={[undefined, undefined, 3]}>
          <sphereGeometry args={[0.11, 12, 8]} />
          <meshBasicMaterial color="#d8f4ff" />
        </instancedMesh>
      )}
      {[-1, 1].map((side) => (
        <BranchMesh
          key={side}
          material={mat}
          branch={{
            curve: new THREE.CatmullRomCurve3([
              v(0, -4.6),
              v(side * 0.6, -4.9, -0.2),
              v(side * 1.5, -5.6, -0.4),
            ]),
            r0: 0.05,
            r1: 0.025,
            depth: 0,
            path: [],
          }}
        />
      ))}
      <Interactive id="terminal" anchor={[0, -6.8, 0]}>
        <mesh position={[0, -6.8, 0]}>
          <sphereGeometry args={[0.15, 16, 12]} />
          <primitive object={mat} attach="material" />
        </mesh>
      </Interactive>
      <mesh ref={signal}>
        <sphereGeometry args={[0.19, 10, 8]} />
        <meshBasicMaterial color="#d8f4ff" />
      </mesh>
      <Html zIndexRange={[5, 0]} position={[-3, -7.5, 0]} className="na-scene-tag">
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
