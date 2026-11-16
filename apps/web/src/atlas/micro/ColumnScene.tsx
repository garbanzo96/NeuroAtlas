import { useMemo, useRef } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { dynamics } from '@neuroatlas/simulation';
import * as THREE from 'three';
import { approach } from '../holo';
import { useAtlas, type PartInfo } from '../store';
import { handlers, random, useHolo, useParts, useReducedMotion, type Point } from './geom2';

const parts: Record<string, PartInfo> = {
  layer1: {
    title: 'Capa I · molecular',
    body: 'La capa molecular contiene relativamente pocos somas neuronales y abundantes prolongaciones. En ella terminan dendritas apicales de neuronas situadas más profundamente y convergen distintas aferencias. Su composición y espesor varían entre áreas y especies. La lámina mostrada es un esquema didáctico: los puntos, las distancias y los árboles no representan una reconstrucción histológica ni permiten contar células reales. La actividad visual ilustra un modelo de red puntual, no una medición de esta capa.',
  },
  layer23: {
    title: 'Capas II/III',
    body: 'Las capas supragranulares contienen neuronas piramidales e interneuronas, junto con conexiones locales y proyecciones hacia otras regiones corticales. Sus dendritas y axones pueden atravesar varias capas. Las proporciones celulares dependen del área y de la especie, por lo que esta escena solo sugiere su organización general. El flujo de luz representa una secuencia didáctica de un microcircuito propuesto, no una ruta única obligatoria ni una medición de actividad.',
  },
  layer4: {
    title: 'Capa IV · granular',
    body: 'La capa granular recibe aferencias talamocorticales importantes en muchas áreas sensoriales y contiene neuronas estrelladas y otras clases celulares. Su desarrollo varía considerablemente entre regiones de la corteza; algunas presentan una capa IV poco definida. Aquí la densidad de puntos es ilustrativa y no constituye una estimación cuantitativa. La entrada ascendente representa una aferencia de manera esquemática, sin describir todos sus destinos ni la diversidad de circuitos talámicos.',
  },
  layer5: {
    title: 'Capa V',
    body: 'La capa V incluye neuronas piramidales de diversos tamaños, algunas de las cuales proyectan hacia estructuras subcorticales. Sus dendritas apicales pueden extenderse hacia las capas superficiales, mientras sus conexiones locales participan en circuitos recurrentes. La escena exagera el tamaño de algunas células para hacerlas distinguibles. Es un esquema didáctico y no una muestra histológica a escala; la composición de la capa cambia según el área cortical y la especie.',
  },
  layer6: {
    title: 'Capa VI',
    body: 'La capa VI contiene poblaciones heterogéneas de neuronas, incluidas células corticotalámicas. Estas pueden influir en circuitos del tálamo mediante conexiones directas y circuitos interpuestos. La flecha de retorno en la variante de microcircuito resume una propuesta de organización y no expresa por sí sola el signo ni la fuerza de una conexión. Esta representación es didáctica: sus dimensiones, cantidad de células y trayectorias no son datos anatómicos medidos.',
  },
  pyramidal: {
    title: 'Neurona piramidal',
    model: 'izhikevich',
    body: 'Las neuronas piramidales son una clase diversa de neuronas excitadoras corticales, reconocibles por su soma y sus dendritas apicales y basales. Muchas usan glutamato y establecen conexiones locales o de proyección. Su morfología y patrón de disparo varían entre capas y áreas. Las formas triangulares y las ramas de esta escena son un esquema didáctico, no una reconstrucción individual. El modelo relacionado reproduce patrones de disparo de manera fenomenológica, sin reconstruir la geometría celular.',
  },
  interneuron: {
    title: 'Interneurona inhibidora',
    model: 'izhikevich',
    body: 'Las interneuronas corticales forman poblaciones diversas, frecuentemente GABAérgicas, que regulan la actividad de otros elementos del circuito. Entre sus tipos se describen células en cesta, de candelabro y de Martinotti, con arborizaciones y destinos sinápticos distintos. Las esferas violetas agrupan esas diferencias en una sola señal visual y no indican una clasificación anatómica individual. El modelo de disparo relacionado es fenomenológico y no representa toda la diversidad de estas células.',
  },
  thalamus: {
    title: 'Aferencia talámica',
    body: 'Las proyecciones talamocorticales transportan señales desde núcleos del tálamo hacia la corteza. En numerosas áreas sensoriales terminan de manera destacada en la capa IV, aunque sus destinos dependen del núcleo y del área cortical. El haz ascendente es una simplificación didáctica: no muestra la trayectoria tridimensional real ni todas las ramificaciones. Su animación indica una entrada posible al circuito y no implica que cada pulso produzca una respuesta cortical determinada.',
  },
  column: {
    title: 'Columna y minicolumna',
    model: 'network',
    body: 'La organización en columnas es una forma de describir regularidades verticales de conectividad y respuesta en ciertas áreas de la corteza. Las definiciones de columna y minicolumna, su extensión y su generalidad varían entre estudios y regiones. Este bloque no delimita una unidad anatómica universal: es un esquema didáctico de capas y conexiones posibles. La red simulada contiene neuronas puntuales idealizadas y no pretende reconstruir el conectoma de una columna cortical real.',
  },
};
const layers = [
  { key: 'layer1', label: 'I', y: 3.35, h: 0.65 },
  { key: 'layer23', label: 'II/III', y: 2.2, h: 1.65 },
  { key: 'layer4', label: 'IV', y: 0.75, h: 1.15 },
  { key: 'layer5', label: 'V', y: -0.65, h: 1.65 },
  { key: 'layer6', label: 'VI', y: -2.15, h: 1.35 },
  { key: 'column', label: 'SB', y: -3.35, h: 1 },
];
function Slab({ layer, index }: { layer: (typeof layers)[number]; index: number }) {
  const { material, hot } = useHolo(layer.key, '#3a86ff', 0.035 + index * 0.006, 0.22);
  const anchor: Point = [0, layer.y, 0];
  return (
    <group>
      <mesh
        position={anchor}
        material={material}
        {...handlers(layer.key, parts[layer.key]!.title, anchor, hot)}
      >
        <boxGeometry args={[4, layer.h, 3.4]} />
      </mesh>
      <Html position={[2.5, layer.y, 0]} center>
        <span className="na-scene-tag">{layer.label}</span>
      </Html>
    </group>
  );
}
function Cells() {
  const variant = useAtlas((s) => s.variant);
  const reduced = useReducedMotion();
  const mesh = useRef<THREE.InstancedMesh>(null);
  const hot = useRef(false);
  const data = useMemo(() => {
    const rand = random(54);
    const points: { p: Point; inhibitory: boolean; size: number }[] = [];
    [3, 26, 35, 20, 18].forEach((count, layer) => {
      const l = layers[layer]!;
      for (let i = 0; i < count; i++)
        points.push({
          p: [(rand() - 0.5) * 3.6, l.y + (rand() - 0.5) * l.h * 0.8, (rand() - 0.5) * 3],
          inhibitory: false,
          size: layer === 3 ? 0.13 : 0.085,
        });
    });
    const ids = Array.from({ length: points.length }, (_, i) => i);
    for (let i = ids.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [ids[i], ids[j]] = [ids[j]!, ids[i]!];
    }
    return points.map((p, i) => ({ ...p, networkId: ids[i]!, inhibitory: ids[i]! >= 80 }));
  }, []);
  const network = useMemo(
    () => dynamics.simulateNetwork({ ne: 80, ni: 22, tMax: 1200, seed: 54 }),
    [],
  );
  const wc = useMemo(
    () =>
      dynamics.simulateWilsonCowan(dynamics.WC_OSCILLATORY, {
        tMax: 100,
        dt: 0.05,
        E0: 0.1,
        I0: 0.1,
      }),
    [],
  );
  const kura = useMemo(
    () => dynamics.simulateKuramoto({ n: 102, K: 4, tMax: 12, dt: 0.05, seed: 54 }),
    [],
  );
  const obj = useMemo(() => new THREE.Object3D(), []);
  const color = useMemo(() => new THREE.Color(), []);
  useFrame(({ clock }) => {
    if (!mesh.current) return;
    const time = reduced ? 0 : clock.elapsedTime;
    const ms = (time * 120) % 1200;
    const active = new Set<number>();
    for (let i = 0; i < network.spikeTimes.length; i++)
      if (Math.abs(network.spikeTimes[i]! - ms) < 28) active.add(network.spikeIds[i]!);
    const wi = Math.floor((time * 50) % wc.E.length);
    const ki = Math.floor((time * 10) % kura.r.length);
    const sync = kura.r[ki]!;
    data.forEach((cell, i) => {
      let pulse = active.has(cell.networkId) ? 2.5 : 0.65;
      if (variant === 'oscilacion') pulse = 0.5 + (cell.inhibitory ? wc.I[wi]! : wc.E[wi]!) * 5;
      if (variant === 'red')
        pulse = 0.6 + Math.max(0, Math.sin(time * 4 + i * (1 - sync))) ** 12 * 2;
      obj.position.set(...cell.p);
      obj.scale.setScalar(cell.size * (1 + (pulse - 0.6) * 0.3));
      obj.updateMatrix();
      mesh.current!.setMatrixAt(i, obj.matrix);
      color.set(cell.inhibitory ? '#c49bff' : '#86d6ff').multiplyScalar(pulse);
      mesh.current!.setColorAt(i, color);
    });
    mesh.current.instanceMatrix.needsUpdate = true;
    if (mesh.current.instanceColor) mesh.current.instanceColor.needsUpdate = true;
  });
  return (
    <instancedMesh
      ref={mesh}
      args={[undefined, undefined, data.length]}
      onPointerOver={(e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation();
        const cell = data[e.instanceId ?? 0]!;
        const key = cell.inhibitory ? 'interneuron' : 'pyramidal';
        hot.current = true;
        useAtlas.getState().setHover({
          key,
          title: parts[key]!.title,
          subtitle: 'Esquema didáctico',
          anchor: cell.p,
        });
      }}
      onPointerOut={() => {
        hot.current = false;
        useAtlas.getState().setHover(null);
      }}
      onClick={(e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation();
        useAtlas
          .getState()
          .select(data[e.instanceId ?? 0]!.inhibitory ? 'interneuron' : 'pyramidal');
      }}
    >
      <icosahedronGeometry args={[1, 0]} />
      <meshBasicMaterial
        transparent
        opacity={0.85}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </instancedMesh>
  );
}
function Feature({ id, position, size }: { id: string; position: Point; size: Point }) {
  const { material, hot } = useHolo(id, id === 'interneuron' ? '#c49bff' : '#86d6ff', 0.12, 0.7);
  return (
    <mesh
      position={position}
      scale={size}
      material={material}
      {...handlers(id, parts[id]!.title, position, hot)}
    >
      {id === 'pyramidal' ? (
        <coneGeometry args={[1, 2, 3]} />
      ) : (
        <sphereGeometry args={[1, 16, 12]} />
      )}
    </mesh>
  );
}
function Dendrites() {
  const geometry = useMemo(() => {
    const vertices: number[] = [];
    [-1.4, -0.8, 0, 0.8, 1.4].forEach((x, i) => {
      const base = i % 2 ? -0.8 : 1.4;
      vertices.push(x, base, 0, x, 3.4, 0, x, 3.1, 0, x - 0.35, 3.6, 0, x, 2.6, 0, x + 0.3, 3.2, 0);
    });
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    return g;
  }, []);
  return (
    <lineSegments geometry={geometry}>
      <lineBasicMaterial
        color="#7ab6ff"
        transparent
        opacity={0.45}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </lineSegments>
  );
}
function Flow() {
  const variant = useAtlas((s) => s.variant);
  const reduced = useReducedMotion();
  const ref = useRef<THREE.Group>(null);
  const alpha = useRef(0);
  useFrame(({ clock }, dt) => {
    if (!ref.current) return;
    alpha.current = approach(alpha.current, variant === 'microcircuito' ? 1 : 0.15, dt, 3);
    ref.current.scale.setScalar(0.8 + alpha.current * 0.2);
    ref.current.children.forEach((c, i) => {
      const m = (c as THREE.Mesh).material as THREE.MeshBasicMaterial;
      m.opacity =
        alpha.current *
        (reduced ? 0.5 : 0.3 + 0.7 * Math.max(0, Math.sin(clock.elapsedTime * 2 - i)));
    });
  });
  return (
    <group ref={ref}>
      {[-2.8, -1.4, 0, 1.4, 2.8].map((y) => (
        <mesh key={y} position={[1.55, y, 0]}>
          <coneGeometry args={[0.13, 0.35, 8]} />
          <meshBasicMaterial
            color="#d8f4ff"
            transparent
            opacity={0}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  );
}
function OrderTag() {
  const node = useRef<HTMLSpanElement>(null);
  const reduced = useReducedMotion();
  const data = useMemo(
    () => dynamics.simulateKuramoto({ n: 102, K: 4, tMax: 12, dt: 0.05, seed: 54 }),
    [],
  );
  useFrame(({ clock }) => {
    if (node.current)
      node.current.textContent = `Sincronía r = ${data.r[Math.floor((reduced ? 0 : clock.elapsedTime * 10) % data.r.length)]!.toFixed(2)}`;
  });
  return (
    <Html position={[0, 4.4, 0]} center>
      <span ref={node} className="na-scene-tag" />
    </Html>
  );
}
export default function ColumnScene() {
  useParts(parts);
  const variant = useAtlas((s) => s.variant);
  return (
    <group>
      {layers.map((l, i) => (
        <Slab key={l.key} layer={l} index={i} />
      ))}
      <Cells />
      <Html position={[0, 4.3, 0]} center>
        <span className="na-scene-tag">Columna cortical · esquema</span>
      </Html>
      <Dendrites />
      <Feature id="pyramidal" position={[-1, -0.8, 1.4]} size={[0.25, 0.35, 0.2]} />
      <Feature id="interneuron" position={[1, 1.8, 1.4]} size={[0.2, 0.2, 0.2]} />
      <Feature id="thalamus" position={[0, -3.3, 1.5]} size={[0.25, 0.65, 0.2]} />
      <Flow />
      {variant === 'red' && <OrderTag />}
    </group>
  );
}
