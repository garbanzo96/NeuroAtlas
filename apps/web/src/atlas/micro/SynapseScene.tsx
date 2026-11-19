import { read } from '../signals';
import { approach } from '../holo';
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { dynamics } from '@neuroatlas/simulation';
import * as THREE from 'three';
import { holoMaterial } from '../holo';
import { useAtlas, type PartInfo } from '../store';
import { handlers, random, useHolo, useParts, useReducedMotion, type Point } from './geom2';

const parts: Record<string, PartInfo> = {
  bouton: {
    title: 'Botón presináptico',
    model: 'hh',
    body: 'El botón presináptico es una terminación axónica que contiene vesículas y maquinaria de liberación. Cuando llega un potencial de acción, la despolarización puede abrir canales de calcio y favorecer la fusión de vesículas en la zona activa. Su tamaño, forma y contenido varían entre sinapsis. Esta escena es un esquema didáctico: el pulso de luz representa la llegada de actividad eléctrica y no reproduce una traza de voltaje ni una reconstrucción microscópica.',
  },
  vesicle: {
    title: 'Vesícula sináptica',
    model: 'tsodyks-markram',
    body: 'Las vesículas sinápticas almacenan neurotransmisores y participan en ciclos de liberación y recuperación de membrana. Algunas se encuentran próximas a la zona activa y pueden estar preparadas para fusionarse tras la entrada de calcio. La disponibilidad y probabilidad de liberación cambian con la actividad. Las esferas y su movimiento son una simplificación didáctica, no una cuenta experimental. El modelo relacionado describe recursos y respuestas relativas, sin representar el detalle molecular de cada vesícula.',
  },
  active: {
    title: 'Zona activa',
    body: 'La zona activa es una región especializada de la membrana presináptica donde se organiza la liberación de neurotransmisor. Proteínas de andamiaje, canales de calcio y vesículas se disponen de manera coordinada, con variación entre tipos de sinapsis. La franja luminosa resume esa organización sin mostrar todas sus moléculas. Su geometría y las distancias están exageradas para facilitar la lectura; el esquema no permite inferir una disposición molecular precisa ni la probabilidad de liberación.',
  },
  calcium: {
    title: 'Canal de calcio',
    model: 'hh',
    body: 'Los canales de calcio dependientes de voltaje se abren durante la despolarización presináptica y permiten la entrada de calcio bajo condiciones fisiológicas habituales. El aumento local de calcio participa en el acoplamiento entre actividad eléctrica y fusión vesicular. Hay distintos tipos de canales y su distribución varía entre terminales. Los puntos rosados representan iones de forma didáctica y no muestran concentraciones, escalas temporales ni trayectorias moleculares medidas en una sinapsis concreta.',
  },
  cleft: {
    title: 'Hendidura sináptica',
    body: 'La hendidura es el espacio extracelular que separa las membranas pre y postsináptica de una sinapsis química. Tras su liberación, las moléculas de neurotransmisor difunden y pueden unirse a receptores o retirarse mediante mecanismos de captura y degradación según el sistema. Su separación se exagera aquí para permitir ver el proceso. Las partículas son símbolos didácticos: su número y movimiento no representan concentraciones ni una simulación de difusión.',
  },
  ampa: {
    title: 'Receptor AMPA',
    model: 'stdp',
    body: 'Los receptores AMPA son receptores ionotrópicos activados por glutamato. Su apertura permite una corriente catiónica que suele contribuir a la respuesta excitadora rápida de la célula postsináptica. La composición de subunidades influye en sus propiedades, incluida la permeabilidad a calcio. En esta escena se enfatiza la entrada de sodio como esquema didáctico; no se muestran todos los flujos iónicos ni se deduce una amplitud sináptica real a partir de los destellos.',
  },
  nmda: {
    title: 'Receptor NMDA',
    model: 'stdp',
    body: 'Los receptores NMDA son receptores ionotrópicos de glutamato cuya activación depende también del voltaje y de coagonistas. A voltajes negativos, el magnesio puede bloquear su canal; la despolarización alivia ese bloqueo. Cuando se abren pueden conducir calcio y otros cationes, vinculando actividad sináptica con señales intracelulares. El símbolo de magnesio y el destello son una representación didáctica; no describen por sí solos las reglas completas de plasticidad ni una medición molecular.',
  },
  gaba: {
    title: 'Receptor GABA_A',
    body: 'Los receptores GABA_A son canales activados por GABA que conducen principalmente aniones, incluidos cloruro y bicarbonato. Su efecto sobre la célula depende de los gradientes iónicos y del estado de la membrana; con frecuencia contribuyen a la inhibición, aunque no en toda condición. La entrada de cloruro mostrada corresponde a un caso ilustrativo. La forma y el número de receptores son esquemáticos y no representan una sinapsis identificada ni una medición de corriente.',
  },
  density: {
    title: 'Densidad postsináptica',
    model: 'stdp',
    body: 'La densidad postsináptica es una organización proteica situada junto a la membrana de muchas sinapsis excitadoras. Agrupa receptores, proteínas de andamiaje y moléculas de señalización que participan en la transmisión y sus cambios dependientes de actividad. Su composición y forma son variables. La banda luminosa es un esquema didáctico y no reproduce su estructura molecular. En la variante inhibitoria se conserva como referencia visual de la membrana, sin atribuirle una composición excitadora.',
  },
  connexon: {
    title: 'Conexón',
    body: 'Un conexón es un conjunto de conexinas que forma un hemicanal en una membrana. Dos hemicanales compatibles de células vecinas pueden formar un canal de unión en hendidura, permitiendo el paso directo de iones y moléculas pequeñas. El acoplamiento eléctrico puede ser bidireccional, aunque algunas uniones muestran rectificación. Los tubos de esta escena son una representación didáctica, sin detalle de subunidades ni escala molecular, y no muestran transmisión mediante vesículas.',
  },
};
function Shape({
  id,
  position,
  size,
  shape = 'sphere',
  color = '#6bb3ff',
}: {
  id: string;
  position: Point;
  size: Point;
  shape?: 'sphere' | 'cylinder';
  color?: string;
}) {
  const { material, hot } = useHolo(id, color, 0.035, 0.42);
  return (
    <mesh
      position={position}
      scale={size}
      material={material}
      {...handlers(id, parts[id]!.title, position, hot)}
    >
      {shape === 'cylinder' ? (
        <cylinderGeometry args={[1, 1, 1, 24]} />
      ) : (
        <sphereGeometry args={[1, 32, 24]} />
      )}
    </mesh>
  );
}
function Chemical({ variant }: { variant: string }) {
  const reduced = useReducedMotion();
  const signal = useRef<THREE.Mesh>(null);
  const cloud = useRef<THREE.InstancedMesh>(null);
  const ions = useRef<THREE.InstancedMesh>(null);
  const fusion = useRef<THREE.Mesh>(null);
  const calcium = useRef<THREE.InstancedMesh>(null);
  const recovery = useRef<THREE.Mesh>(null);
  const receptors = useRef<THREE.Group>(null);
  const receptorHot = useRef(false);
  const randData = useMemo(() => {
    const rand = random(84);
    return Array.from({ length: 90 }, () => ({
      x: (rand() - 0.5) * 2.3,
      z: (rand() - 0.5) * 1.3,
      delay: rand() * 0.2,
    }));
  }, []);
  const vesicles = useMemo(() => {
    const rand = random(71);
    return Array.from({ length: 40 }, (_, i) => ({
      p: [(rand() - 0.5) * 2.7, i < 6 ? 0.73 : 1.0 + rand() * 1.65, (rand() - 0.5) * 1.35] as Point,
    }));
  }, []);
  const vesMat = useMemo(() => holoMaterial({ color: '#8bd8ff', fill: 0.025, rim: 0.48 }), []);
  const obj = useMemo(() => new THREE.Object3D(), []);
  const vesicleMeshes = useRef<(THREE.Mesh | null)[]>([]);
  const reserve = useRef(1);
  useFrame(({ clock }, dt) => {
    const x = read('tm.x', NaN);
    reserve.current = approach(reserve.current, Number.isNaN(x) ? 1 : x, dt, 8);
    vesicleMeshes.current.forEach((mesh, i) => {
      if (mesh)
        mesh.scale.setScalar(approach(mesh.scale.x, i < reserve.current * 40 ? 1 : 0.001, dt, 8));
    });
    const phase = reduced ? 0 : (clock.elapsedTime % 3) / 3;
    if (signal.current) {
      signal.current.position.set(0, 5.1 - Math.min(phase / 0.19, 1) * 2.1, 0);
      signal.current.scale.setScalar(phase < 0.19 ? 0.14 : 0.0001);
    }
    if (fusion.current) {
      fusion.current.scale.set(
        phase > 0.32 && phase < 0.43 ? 0.25 : 0.0001,
        phase > 0.32 && phase < 0.43 ? 0.05 : 0.0001,
        0.25,
      );
    }
    if (calcium.current) {
      for (let i = 0; i < 12; i++) {
        const q = (phase - 0.2 - i * 0.006) / 0.14;
        obj.position.set(
          i % 2 ? 1 : -1,
          0.45 + Math.max(0, Math.min(1, q)) * 0.65,
          0.45 + ((i % 3) - 1) * 0.08,
        );
        obj.scale.setScalar(q > 0 && q < 1 ? 0.045 : 0.0001);
        obj.updateMatrix();
        calcium.current.setMatrixAt(i, obj.matrix);
      }
      calcium.current.instanceMatrix.needsUpdate = true;
    }
    if (recovery.current) {
      const q = (phase - 0.8) / 0.16;
      recovery.current.position.set(1.35, 0.53 + Math.max(0, Math.min(1, q)) * 0.6, 0.4);
      recovery.current.scale.setScalar(q > 0 && q < 1 ? 0.12 : 0.0001);
    }
    if (receptors.current)
      receptors.current.children.forEach((c) => {
        const m = (c as THREE.Mesh).material as THREE.MeshBasicMaterial;
        m.opacity = phase > 0.57 && phase < 0.82 ? 0.85 : 0.22;
      });
    if (cloud.current) {
      randData.forEach((p, i) => {
        const progress = (phase - 0.39 - p.delay) / 0.25;
        obj.position.set(p.x * 0.55, 0.47 - Math.max(0, Math.min(1, progress)) * 0.65, p.z * 0.55);
        obj.scale.setScalar(progress > 0 && progress < 1 ? 0.035 : 0.0001);
        obj.updateMatrix();
        cloud.current!.setMatrixAt(i, obj.matrix);
      });
      cloud.current.instanceMatrix.needsUpdate = true;
    }
    if (ions.current) {
      for (let i = 0; i < 18; i++) {
        const q = (phase - 0.6 - i * 0.006) / 0.22;
        obj.position.set(
          ((i % 6) - 2.5) * 0.3,
          -0.35 - Math.max(0, Math.min(1, q)) * 0.85,
          (Math.floor(i / 6) - 1) * 0.25,
        );
        obj.scale.setScalar(q > 0 && q < 1 ? 0.045 : 0.0001);
        obj.updateMatrix();
        ions.current.setMatrixAt(i, obj.matrix);
      }
      ions.current.instanceMatrix.needsUpdate = true;
    }
  });
  return (
    <group>
      <Shape id="bouton" position={[0, 4.15, 0]} size={[0.22, 1.3, 0.22]} shape="cylinder" />
      <Shape id="bouton" position={[0, 1.95, 0]} size={[2, 1.55, 1.3]} />
      <Shape id="vesicle" position={[0.75, 2.35, -0.35]} size={[0.75, 0.22, 0.25]} />
      {[-0.35, 0, 0.35].map((x) => (
        <mesh key={x} position={[0.75 + x, 2.35, -0.1]} rotation={[0, 0, 0.35]}>
          <torusGeometry args={[0.15, 0.018, 6, 16, Math.PI]} />
          <meshBasicMaterial color="#75bfff" transparent opacity={0.4} />
        </mesh>
      ))}
      {vesicles.map((v, i) => (
        <mesh
          key={i}
          ref={(mesh) => {
            vesicleMeshes.current[i] = mesh;
          }}
          position={v.p}
          material={vesMat}
        >
          <sphereGeometry args={[0.115, 16, 12]} />
        </mesh>
      ))}
      <Shape id="active" position={[0, 0.52, 0]} size={[1.45, 0.09, 0.85]} shape="cylinder" />
      {[-0.9, -0.45, 0, 0.45, 0.9].flatMap((x) =>
        [-0.45, 0, 0.45].map((z) => (
          <mesh key={`${x}-${z}`} position={[x, 0.49, z]}>
            <sphereGeometry args={[0.045, 8, 6]} />
            <meshBasicMaterial color="#6db9e9" transparent opacity={0.5} />
          </mesh>
        )),
      )}
      {[-1, 1].map((x) => (
        <Shape
          key={x}
          id="calcium"
          position={[x, 0.55, 0.45]}
          size={[0.07, 0.2, 0.07]}
          shape="cylinder"
          color="#cf9aff"
        />
      ))}
      <Shape id="cleft" position={[0, 0.18, 0]} size={[1.4, 0.18, 0.8]} shape="cylinder" />
      <Shape id="density" position={[0, -0.22, 0]} size={[1.4, 0.14, 0.8]} shape="cylinder" />
      <Shape id="density" position={[0, -0.95, 0]} size={[1.65, 0.8, 1.1]} />
      <Shape id="density" position={[0, -2.05, 0]} size={[0.32, 0.8, 0.32]} shape="cylinder" />
      <mesh position={[0, -2.95, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.65, 0.65, 5.4, 32]} />
        <primitive object={vesMat} attach="material" />
      </mesh>
      <group ref={receptors}>
        {[-0.9, -0.45, 0, 0.45, 0.9].map((x, i) => (
          <mesh
            key={x}
            position={[x, -0.12, 0.45]}
            {...handlers(
              variant === 'inhibitoria' ? 'gaba' : i % 2 ? 'nmda' : 'ampa',
              parts[variant === 'inhibitoria' ? 'gaba' : i % 2 ? 'nmda' : 'ampa']!.title,
              [x, -0.12, 0.45],
              receptorHot,
            )}
          >
            <cylinderGeometry args={[0.085, 0.085, 0.4, 12]} />
            <meshBasicMaterial
              color={variant === 'inhibitoria' ? '#bc9aff' : i % 2 ? '#91dfff' : '#6d9fff'}
              transparent
              opacity={0.22}
            />
          </mesh>
        ))}
      </group>
      <Html zIndexRange={[5, 0]} position={[0, -0.5, 1.1]} center>
        <span className="na-scene-tag">{variant === 'inhibitoria' ? 'GABA_A' : 'AMPA · NMDA'}</span>
      </Html>
      <mesh ref={signal}>
        <sphereGeometry args={[1, 16, 12]} />
        <meshBasicMaterial color="#d7faff" />
      </mesh>
      <mesh ref={fusion} position={[0, 0.5, 0.5]}>
        <sphereGeometry args={[1, 16, 12]} />
        <meshBasicMaterial color="#eaffff" />
      </mesh>
      <instancedMesh ref={calcium} args={[undefined, undefined, 12]}>
        <sphereGeometry args={[1, 8, 6]} />
        <meshBasicMaterial color="#e8a4ff" />
      </instancedMesh>
      <mesh ref={recovery} material={vesMat}>
        <sphereGeometry args={[1, 16, 12]} />
      </mesh>
      <instancedMesh ref={cloud} args={[undefined, undefined, 90]}>
        <sphereGeometry args={[1, 8, 6]} />
        <meshBasicMaterial color="#d8f8ff" transparent opacity={0.85} />
      </instancedMesh>
      <instancedMesh ref={ions} args={[undefined, undefined, 18]}>
        <sphereGeometry args={[1, 8, 6]} />
        <meshBasicMaterial
          color={variant === 'inhibitoria' ? '#9cf1be' : '#ffb978'}
          transparent
          opacity={0.85}
        />
      </instancedMesh>
    </group>
  );
}
function Electrical() {
  return (
    <group>
      <Shape id="connexon" position={[0, 0.65, 0]} size={[2.3, 0.13, 1.2]} shape="cylinder" />
      <Shape id="connexon" position={[0, -0.65, 0]} size={[2.3, 0.13, 1.2]} shape="cylinder" />
      {[-1, -0.5, 0, 0.5, 1].map((x) => (
        <Shape
          key={x}
          id="connexon"
          position={[x, 0, 0]}
          size={[0.15, 1.2, 0.15]}
          shape="cylinder"
        />
      ))}
    </group>
  );
}
function Bars() {
  const responses = useMemo(
    () =>
      dynamics.tmResponses(
        Array.from({ length: 8 }, (_, i) => i * 50),
        dynamics.TM_PRESETS.depressing,
      ),
    [],
  );
  return (
    <Html zIndexRange={[5, 0]} position={[3, 0, 0]} center>
      <div className="na-scene-tag">
        Respuesta relativa
        <div style={{ display: 'flex', alignItems: 'end', gap: 3, height: 44 }}>
          {responses.map((r, i) => (
            <span
              key={i}
              style={{ display: 'block', width: 7, height: r * 80, background: '#86d6ff' }}
            />
          ))}
        </div>
      </div>
    </Html>
  );
}
export default function SynapseScene() {
  useParts(parts);
  const variant = useAtlas((s) => s.variant) ?? 'quimica';
  return (
    <group>
      {variant === 'electrica' ? <Electrical /> : <Chemical variant={variant} />}{' '}
      {variant === 'plasticidad' && <Bars />}
      <Html zIndexRange={[5, 0]} position={[0, 5.35, 0]} center>
        <span className="na-scene-tag">
          {variant === 'electrica' ? 'Unión en hendidura · esquema' : 'Sinapsis · esquema'}
        </span>
      </Html>
    </group>
  );
}
