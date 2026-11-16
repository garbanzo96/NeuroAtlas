import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { dynamics } from '@neuroatlas/simulation';
import * as THREE from 'three';
import { approach } from '../holo';
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
  color = '#5ca4ff',
  shape = 'sphere',
}: {
  id: string;
  position: Point;
  size: Point;
  color?: string;
  shape?: 'sphere' | 'box';
}) {
  const { material, hot } = useHolo(id, color, 0.08, 0.65);
  return (
    <mesh
      position={position}
      scale={size}
      material={material}
      {...handlers(id, parts[id]!.title, position, hot)}
    >
      {shape === 'box' ? <boxGeometry /> : <sphereGeometry args={[1, 24, 16]} />}
    </mesh>
  );
}
function Particles({ variant }: { variant: string }) {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const reduced = useReducedMotion();
  const hot = useRef(false);
  const data = useMemo(() => {
    const rand = random(84);
    return Array.from({ length: 72 }, (_, i) => ({
      x: (rand() - 0.5) * 3.8,
      y: rand(),
      z: (rand() - 0.5) * 2.6,
      kind: i < 36 ? 0 : i < 48 ? 1 : i < 60 ? 2 : 3,
    }));
  }, []);
  const obj = useMemo(() => new THREE.Object3D(), []);
  const color = useMemo(() => new THREE.Color(), []);
  const responses = useMemo(
    () =>
      dynamics.tmResponses(
        Array.from({ length: 8 }, (_, i) => i * 50),
        dynamics.TM_PRESETS.depressing,
      ),
    [],
  );
  useFrame(({ clock }) => {
    if (!mesh.current) return;
    const time = reduced ? 0 : clock.elapsedTime;
    const phase = (time % 2.4) / 2.4;
    const spike = Math.floor((time / 2.4) % 8);
    const release = variant === 'plasticidad' ? Math.ceil(responses[spike]! * 12) : 5;
    data.forEach((p, i) => {
      let x = p.x,
        y = 1.1 + p.y * 2.4,
        z = p.z,
        scale = 0.12,
        tint = '#7ab6ff';
      if (variant === 'electrica') {
        x = ((i % 6) - 2.5) * 0.55;
        y = (((phase + i / 72) % 1) - 0.5) * 1.5;
        z = ((Math.floor(i / 6) % 4) - 1.5) * 0.5;
        scale = 0.055;
        tint = '#5ee6ff';
      } else if (p.kind === 0) {
        if (i < release && phase > 0.35 && phase < 0.7) {
          y = 0.65 - (phase - 0.35) * 1.7;
          scale = 0.09;
        }
      } else if (p.kind === 1) {
        y = 0.6 + ((p.y + phase) % 1) * 1.1;
        scale = phase > 0.18 && phase < 0.52 ? 0.07 : 0.001;
        tint = '#ff8ad8';
      } else if (p.kind === 2) {
        y = 0.35 - ((p.y + phase) % 1) * 0.8;
        scale = phase > 0.4 && phase < 0.8 ? 0.065 : 0.001;
        tint = '#d8f4ff';
      } else {
        y = -0.5 - ((p.y + phase) % 1) * 1.1;
        scale = phase > 0.6 ? 0.07 : 0.001;
        tint = variant === 'inhibitoria' ? '#8fe3b0' : '#ffb057';
      }
      obj.position.set(x, y, z);
      obj.scale.setScalar(scale);
      obj.updateMatrix();
      mesh.current!.setMatrixAt(i, obj.matrix);
      color.set(tint);
      mesh.current!.setColorAt(i, color);
    });
    mesh.current.instanceMatrix.needsUpdate = true;
    if (mesh.current.instanceColor) mesh.current.instanceColor.needsUpdate = true;
  });
  return (
    <instancedMesh
      ref={mesh}
      args={[undefined, undefined, data.length]}
      {...handlers('vesicle', parts.vesicle!.title, [0, 2, 0], hot)}
    >
      <sphereGeometry args={[1, 8, 6]} />
      <meshBasicMaterial
        transparent
        opacity={0.85}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </instancedMesh>
  );
}
function Transition({ visible, children }: { visible: boolean; children: React.ReactNode }) {
  const ref = useRef<THREE.Group>(null);
  const value = useRef(visible ? 1 : 0);
  useFrame((_, dt) => {
    value.current = approach(value.current, visible ? 1 : 0, dt, 5);
    if (ref.current) {
      ref.current.scale.setScalar(Math.max(0.001, value.current));
      ref.current.visible = value.current > 0.01;
    }
  });
  return <group ref={ref}>{children}</group>;
}
function Signal() {
  const ref = useRef<THREE.Mesh>(null);
  const reduced = useReducedMotion();
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const phase = reduced ? 0 : (clock.elapsedTime % 2.4) / 2.4;
    ref.current.position.set(
      -5 + Math.min(phase / 0.3, 1) * 4,
      4 - Math.min(phase / 0.3, 1) * 1.5,
      0,
    );
    ref.current.scale.setScalar(phase < 0.3 ? 1 : 0.001);
  });
  return (
    <mesh ref={ref}>
      <sphereGeometry args={[0.25, 12, 8]} />
      <meshBasicMaterial
        color="#d8f4ff"
        transparent
        opacity={0.9}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </mesh>
  );
}
function Bars() {
  const refs = useRef<(HTMLSpanElement | null)[]>([]);
  const reduced = useReducedMotion();
  const responses = useMemo(
    () =>
      dynamics.tmResponses(
        Array.from({ length: 8 }, (_, i) => i * 50),
        dynamics.TM_PRESETS.depressing,
      ),
    [],
  );
  useFrame(({ clock }) => {
    const step = reduced ? 8 : Math.floor((clock.elapsedTime / 2.4) % 8) + 1;
    refs.current.forEach((el, i) => {
      if (el) el.style.height = `${i < step ? responses[i]! * 80 : 2}px`;
    });
  });
  return (
    <Html position={[4, 0, 0]} center>
      <div className="na-scene-tag">
        Respuesta relativa
        <div style={{ display: 'flex', alignItems: 'end', gap: 3, height: 44 }}>
          {responses.map((_, i) => (
            <span
              key={i}
              ref={(el) => {
                refs.current[i] = el;
              }}
              style={{ display: 'block', width: 7, background: '#86d6ff' }}
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
  const electrical = variant === 'electrica';
  return (
    <group>
      <Transition visible={!electrical}>
        <Signal />
        <Shape id="bouton" position={[0, 2.2, 0]} size={[3, 2.2, 2.3]} />
        <Shape id="bouton" position={[-3, 4, 0]} size={[2.5, 0.65, 0.65]} />
        <Shape id="active" position={[0, 0.45, 0]} size={[4.1, 0.16, 2.7]} shape="box" />
        <Shape id="cleft" position={[0, 0, 0]} size={[3.8, 0.45, 2.5]} shape="box" />
        <Shape id="density" position={[0, -0.55, 0]} size={[4.1, 0.18, 2.7]} shape="box" />
        <Shape id="density" position={[0, -2, 0]} size={[2.8, 1.4, 2.2]} />
        <Shape id="calcium" position={[-1.6, 0.5, 1]} size={[0.18, 0.4, 0.18]} color="#ff8ad8" />
        <Shape
          id={variant === 'inhibitoria' ? 'gaba' : 'ampa'}
          position={[-1, -0.5, 1]}
          size={[0.25, 0.45, 0.25]}
        />
        <Shape
          id={variant === 'inhibitoria' ? 'gaba' : 'nmda'}
          position={[1, -0.5, 1]}
          size={[0.25, 0.45, 0.25]}
        />
        {variant !== 'inhibitoria' && (
          <Html position={[1, -1.1, 1]} center>
            <span className="na-scene-tag">NMDA · Mg²⁺</span>
          </Html>
        )}
        <Shape id="vesicle" position={[0.8, 2.4, 0]} size={[0.75, 0.35, 0.35]} color="#86d6ff" />
      </Transition>
      <Transition visible={electrical}>
        <Shape id="connexon" position={[0, 0.65, 0]} size={[5, 0.18, 3]} shape="box" />
        <Shape id="connexon" position={[0, -0.65, 0]} size={[5, 0.18, 3]} shape="box" />
        {[-1.5, -0.5, 0.5, 1.5].map((x) => (
          <Shape
            key={x}
            id="connexon"
            position={[x, 0, 0]}
            size={[0.22, 0.7, 0.22]}
            color="#86d6ff"
          />
        ))}
      </Transition>
      <Particles variant={variant} />
      {variant === 'plasticidad' && <Bars />}
      <Html position={[0, 5, 0]} center>
        <span className="na-scene-tag">
          {electrical ? 'Unión en hendidura · esquema' : 'Sinapsis · esquema'}
        </span>
      </Html>
    </group>
  );
}
