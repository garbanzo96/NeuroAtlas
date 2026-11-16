import { useMemo, useRef } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { dynamics } from '@neuroatlas/simulation';
import * as THREE from 'three';
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
    body: 'La organización en columnas es una forma de describir regularidades verticales de conectividad y respuesta en ciertas áreas de la corteza. Las definiciones de columna y minicolumna, su extensión y su generalidad varían entre estudios y regiones. Los grosores representan de forma esquemática una corteza sensorial típica, con capa IV desarrollada. Este bloque no delimita una unidad anatómica universal: es un esquema didáctico de capas y conexiones posibles. La red simulada contiene neuronas puntuales idealizadas y no pretende reconstruir el conectoma de una columna cortical real.',
  },
};
const layers = [
  { key: 'layer1', label: 'I · molecular', y: 3.55, h: 0.5 },
  { key: 'layer23', label: 'II/III · piramidal externa', y: 2.35, h: 1.9 },
  { key: 'layer4', label: 'IV · granular interna', y: 0.7, h: 1.4 },
  { key: 'layer5', label: 'V · piramidal interna', y: -0.75, h: 1.5 },
  { key: 'layer6', label: 'VI · multiforme', y: -2.2, h: 1.4 },
  { key: 'column', label: 'Sustancia blanca', y: -3.45, h: 1.1 },
];
function Slab({ layer }: { layer: (typeof layers)[number] }) {
  const { material, hot } = useHolo(layer.key, '#478bda', 0.015, 0.16);
  const anchor: Point = [0, layer.y, 0];
  return (
    <group>
      <mesh
        position={anchor}
        material={material}
        {...handlers(layer.key, parts[layer.key]!.title, anchor, hot)}
      >
        <boxGeometry args={[3.8, layer.h, 2.8]} />
      </mesh>
      <lineSegments position={anchor}>
        <edgesGeometry args={[new THREE.BoxGeometry(3.8, layer.h, 2.8)]} />
        <lineBasicMaterial color="#78b9ff" transparent opacity={0.28} />
      </lineSegments>
      <Html zIndexRange={[5, 0]} position={[-2.45, layer.y, 0]} center>
        <span className="na-scene-tag" style={{ whiteSpace: 'nowrap' }}>
          {layer.label}
        </span>
      </Html>
    </group>
  );
}
type Cell = { p: Point; inhibitory: boolean; star: boolean; size: number; networkId: number };
function Cells() {
  const variant = useAtlas((s) => s.variant);
  const reduced = useReducedMotion();
  const bodies = useRef<(THREE.InstancedMesh | null)[]>([]);
  const flashes = useRef<THREE.InstancedMesh>(null);
  const data = useMemo(() => {
    const rand = random(54);
    const cells: Cell[] = [];
    [5, 115, 110, 90, 80].forEach((count, li) => {
      const l = layers[li]!;
      for (let i = 0; i < count; i++) {
        const inhibitory = rand() < 0.2;
        cells.push({
          p: [(rand() - 0.5) * 3.45, l.y + (rand() - 0.5) * l.h * 0.85, (rand() - 0.5) * 2.45],
          inhibitory,
          star: li === 2,
          size: li === 3 ? 0.075 : 0.052,
          networkId: inhibitory ? 80 + Math.floor(rand() * 22) : Math.floor(rand() * 80),
        });
      }
    });
    return cells;
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
  const obj = useMemo(() => new THREE.Object3D(), []);
  const color = useMemo(() => new THREE.Color(), []);
  const dendrites = useMemo(() => {
    const v: number[] = [];
    data.forEach((c) => {
      if (!c.inhibitory && !c.star && c.p[1] < 3.1) {
        const [x, y, z] = c.p;
        v.push(x, y, z, x, 3.55, z, x, 3.3, z, x - 0.13, 3.65, z);
      }
    });
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(v, 3));
    return g;
  }, [data]);
  useFrame(({ clock }) => {
    if (!bodies.current[0] || !bodies.current[1] || !bodies.current[2] || !flashes.current) return;
    const t = reduced ? 0 : clock.elapsedTime;
    const ms = (t * 120) % 1200;
    const active = new Set<number>();
    for (let i = 0; i < network.spikeTimes.length; i++)
      if (Math.abs(network.spikeTimes[i]! - ms) < 3.6) active.add(network.spikeIds[i]!);
    data.forEach((c, i) => {
      obj.position.set(...c.p);
      obj.rotation.set(0, 0, 0);
      obj.scale.set(c.size, c.size * (c.inhibitory || c.star ? 1 : 1.6), c.size);
      obj.updateMatrix();
      const kind = c.inhibitory ? 2 : c.star ? 1 : 0;
      bodies.current.forEach((mesh, k) => {
        if (!mesh) return;
        if (k !== kind) {
          obj.scale.setScalar(0.0001);
          obj.updateMatrix();
        }
        mesh.setMatrixAt(i, obj.matrix);
        obj.scale.set(c.size, c.size * (c.inhibitory || c.star ? 1 : 1.6), c.size);
        obj.updateMatrix();
      });
      const wi = Math.floor((t * 50) % wc.E.length);
      const activity = c.inhibitory ? wc.I[wi]! : wc.E[wi]!;
      const on =
        !reduced &&
        (variant === 'oscilacion'
          ? Math.sin(t * 5 + i * 0.37) > 1 - activity * 0.15
          : active.has(c.networkId) || (variant === 'red' && Math.sin(t * 3 + i * 0.07) > 0.995));
      obj.scale.setScalar(on ? c.size * 2.3 : 0.0001);
      obj.updateMatrix();
      flashes.current!.setMatrixAt(i, obj.matrix);
      color.set(c.inhibitory ? '#c49bff' : '#a4efff');
      flashes.current!.setColorAt(i, color);
    });
    bodies.current.forEach((mesh) => {
      if (mesh) mesh.instanceMatrix.needsUpdate = true;
    });
    flashes.current.instanceMatrix.needsUpdate = true;
    if (flashes.current.instanceColor) flashes.current.instanceColor.needsUpdate = true;
  });
  return (
    <group>
      <lineSegments geometry={dendrites}>
        <lineBasicMaterial color="#70b6f0" transparent opacity={0.16} />
      </lineSegments>
      {[0, 1, 2].map((kind) => (
        <instancedMesh
          key={kind}
          ref={(el) => {
            bodies.current[kind] = el;
          }}
          args={[undefined, undefined, data.length]}
          onPointerOver={(e: ThreeEvent<PointerEvent>) => {
            e.stopPropagation();
            const c = data[e.instanceId ?? 0]!;
            const key = c.inhibitory ? 'interneuron' : 'pyramidal';
            useAtlas.getState().setHover({
              key,
              title: parts[key]!.title,
              subtitle: 'Esquema didáctico',
              anchor: c.p,
            });
          }}
          onPointerOut={() => useAtlas.getState().setHover(null)}
          onClick={(e: ThreeEvent<MouseEvent>) => {
            e.stopPropagation();
            useAtlas
              .getState()
              .select(data[e.instanceId ?? 0]!.inhibitory ? 'interneuron' : 'pyramidal');
          }}
        >
          {kind === 0 ? (
            <tetrahedronGeometry args={[1, 0]} />
          ) : kind === 1 ? (
            <octahedronGeometry args={[1, 0]} />
          ) : (
            <sphereGeometry args={[1, 10, 8]} />
          )}
          <meshBasicMaterial
            color={kind === 2 ? '#b69ada' : '#78b5d8'}
            transparent
            opacity={0.38}
            depthWrite={false}
          />
        </instancedMesh>
      ))}
      <instancedMesh ref={flashes} args={[undefined, undefined, data.length]}>
        <sphereGeometry args={[1, 8, 6]} />
        <meshBasicMaterial
          transparent
          opacity={0.85}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </instancedMesh>
    </group>
  );
}
function Connections() {
  const variant = useAtlas((s) => s.variant);
  const reduced = useReducedMotion();
  const pulse = useRef<THREE.Mesh>(null);
  const curves = useMemo(
    () => [
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(-0.7, -3.8, 0.6),
        new THREE.Vector3(-0.8, -1, 0.6),
        new THREE.Vector3(-0.5, 0.7, 0.6),
      ]),
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(-0.5, 0.7, 0.6),
        new THREE.Vector3(0.1, 1.1, 0.7),
        new THREE.Vector3(0.5, 2.3, 0.6),
      ]),
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(0.5, 2.3, 0.6),
        new THREE.Vector3(1, 1, 0.7),
        new THREE.Vector3(0.6, -0.8, 0.6),
      ]),
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(0.6, -0.8, 0.6),
        new THREE.Vector3(0.1, -1.5, 0.7),
        new THREE.Vector3(0.3, -2.4, 0.6),
      ]),
    ],
    [],
  );
  useFrame(({ clock }) => {
    if (pulse.current) {
      const t = reduced ? 0 : clock.elapsedTime;
      const index = variant === 'microcircuito' ? Math.floor(t / 0.8) % 4 : 0;
      pulse.current.position.copy(curves[index]!.getPoint((t % 0.8) / 0.8));
    }
  });
  return (
    <group>
      {curves.map(
        (curve, i) =>
          (i === 0 || variant === 'microcircuito') && (
            <group key={i}>
              <mesh>
                <tubeGeometry args={[curve, 32, 0.018, 6, false]} />
                <meshBasicMaterial color="#73cfff" transparent opacity={i === 0 ? 0.4 : 0.55} />
              </mesh>
              {i > 0 && (
                <mesh
                  position={curve.getPoint(0.9)}
                  quaternion={new THREE.Quaternion().setFromUnitVectors(
                    new THREE.Vector3(0, 1, 0),
                    curve.getTangent(0.9).normalize(),
                  )}
                >
                  <coneGeometry args={[0.08, 0.22, 8]} />
                  <meshBasicMaterial color="#a7eaff" />
                </mesh>
              )}
            </group>
          ),
      )}
      {[-0.5, 0, 0.5].map((x) => (
        <mesh key={x}>
          <tubeGeometry
            args={[
              new THREE.CatmullRomCurve3([
                new THREE.Vector3(-0.5, 0.7, 0.6),
                new THREE.Vector3(x, 1, 0.4),
                new THREE.Vector3(x, 1.2, 0.1),
              ]),
              12,
              0.012,
              5,
              false,
            ]}
          />
          <meshBasicMaterial color="#70baff" transparent opacity={0.35} />
        </mesh>
      ))}
      <mesh ref={pulse}>
        <sphereGeometry args={[0.09, 12, 8]} />
        <meshBasicMaterial color="#c9f9ff" />
      </mesh>
    </group>
  );
}
function OrderTag() {
  const node = useRef<HTMLSpanElement>(null);
  const bar = useRef<HTMLSpanElement>(null);
  const reduced = useReducedMotion();
  const data = useMemo(
    () => dynamics.simulateKuramoto({ n: 102, K: 4, tMax: 12, dt: 0.05, seed: 54 }),
    [],
  );
  useFrame(({ clock }) => {
    const r = data.r[Math.floor((reduced ? 0 : clock.elapsedTime * 10) % data.r.length)]!;
    if (node.current) node.current.textContent = `Sincronía r(t) = ${r.toFixed(2)}`;
    if (bar.current) bar.current.style.width = `${r * 100}%`;
  });
  return (
    <Html zIndexRange={[5, 0]} position={[0, 4.45, 0]} center>
      <div className="na-scene-tag">
        <span ref={node} />
        <div style={{ width: 100, height: 3, background: '#24405c', marginTop: 4 }}>
          <span ref={bar} style={{ display: 'block', height: '100%', background: '#8ddfff' }} />
        </div>
      </div>
    </Html>
  );
}
export default function ColumnScene() {
  useParts(parts);
  const variant = useAtlas((s) => s.variant);
  return (
    <group>
      {layers.map((l) => (
        <Slab key={l.key} layer={l} />
      ))}
      <Cells />
      <Connections />
      <Html zIndexRange={[5, 0]} position={[0, 4.3, 0]} center>
        <span className="na-scene-tag">Columna cortical · esquema</span>
      </Html>
      {variant === 'red' && <OrderTag />}
    </group>
  );
}
