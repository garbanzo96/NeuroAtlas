import type { SchematicLink, SchematicNode } from '@neuroatlas/schemas';
import { OrbitControls } from '@react-three/drei';
import { Canvas, type ThreeEvent, useFrame, useThree } from '@react-three/fiber';
import { type MutableRefObject, useEffect, useMemo, useRef } from 'react';
import { CatmullRomCurve3, Quaternion, Vector3 } from 'three';
import { endDirection, itemsForLayer, type ViewerLayer } from './geometry';

export type CameraCommand = 'reset' | 'zoomIn' | 'zoomOut' | 'rotateLeft' | 'rotateRight';

export interface SchematicSceneProps {
  /** Texto accesible que describe la escena (el visor es un complemento de la lista HTML). */
  ariaLabel: string;
  layers: readonly ViewerLayer[];
  /** colorGroup → color, según la leyenda declarada en la escena. */
  legendColors: Readonly<Record<string, string>>;
  /** nodeId → color, para mapeos explícitos de variables (p. ej. V_m). */
  nodeColorOverrides?: Readonly<Record<string, string>>;
  selectedEntityIds: readonly string[];
  hoveredEntityId: string | null;
  onSelectEntity: (entityId: string | null) => void;
  onHoverEntity: (entityId: string | null) => void;
  /** Rótulo por defecto de una entidad (el de la ficha). */
  labelFor: (entityId: string) => string;
  showLabels: boolean;
  reducedMotion: boolean;
  camera?: { position: [number, number, number]; target: [number, number, number] };
  /** Orden de cámara; `nonce` cambia en cada pulsación. */
  cameraCommand?: { command: CameraCommand; nonce: number } | null;
}

const DEFAULT_COLOR = '#9aa5b1';
const DEFAULT_CAMERA = {
  position: [0, 4, 10] as [number, number, number],
  target: [0, 0, 0] as [number, number, number],
};

interface ItemStyle {
  color: string;
  opacity: number;
  emissive: number;
}

function styleFor(
  entityId: string | undefined,
  baseColor: string,
  layerOpacity: number,
  selected: ReadonlySet<string>,
  hovered: string | null,
): ItemStyle {
  const isSelected = entityId !== undefined && selected.has(entityId);
  const isHovered = entityId !== undefined && entityId === hovered;
  // Foco + contexto: con una selección activa, lo no seleccionado se atenúa (no desaparece).
  const dim = selected.size > 0 && !isSelected ? 0.45 : 1;
  return {
    color: baseColor,
    opacity: Math.max(0.05, layerOpacity * dim),
    emissive: isSelected ? 0.55 : isHovered ? 0.3 : 0.06,
  };
}

function NodeGeometry({ shape }: { shape: SchematicNode['shape'] }) {
  switch (shape) {
    case 'sphere':
      return <sphereGeometry args={[0.5, 32, 16]} />;
    case 'box':
      return <boxGeometry args={[1, 1, 1]} />;
    case 'cylinder':
      return <cylinderGeometry args={[0.5, 0.5, 1, 32]} />;
    case 'cone':
      return <coneGeometry args={[0.5, 1, 32]} />;
    case 'capsule':
      return <capsuleGeometry args={[0.25, 0.5, 8, 16]} />;
  }
}

interface InteractionProps {
  selectable: boolean;
  entityId: string | undefined;
  onSelectEntity: (id: string | null) => void;
  onHoverEntity: (id: string | null) => void;
}

function interactionHandlers({
  selectable,
  entityId,
  onSelectEntity,
  onHoverEntity,
}: InteractionProps) {
  if (!selectable || !entityId) return {};
  return {
    onClick: (e: ThreeEvent<MouseEvent>) => {
      e.stopPropagation();
      onSelectEntity(entityId);
    },
    onPointerOver: (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation();
      onHoverEntity(entityId);
      document.body.style.cursor = 'pointer';
    },
    onPointerOut: () => {
      onHoverEntity(null);
      document.body.style.cursor = '';
    },
  };
}

function Node({
  node,
  style,
  interaction,
}: {
  node: SchematicNode;
  style: ItemStyle;
  interaction: ReturnType<typeof interactionHandlers>;
}) {
  const transparent = style.opacity < 1;
  return (
    <mesh
      position={node.position}
      rotation={node.rotation ?? [0, 0, 0]}
      scale={node.size}
      {...interaction}
    >
      <NodeGeometry shape={node.shape} />
      <meshStandardMaterial
        color={style.color}
        emissive={style.color}
        emissiveIntensity={style.emissive}
        transparent={transparent}
        opacity={style.opacity}
        depthWrite={!transparent}
        roughness={0.45}
        metalness={0.1}
      />
    </mesh>
  );
}

function Link({
  link,
  style,
  interaction,
}: {
  link: SchematicLink;
  style: ItemStyle;
  interaction: ReturnType<typeof interactionHandlers>;
}) {
  const curve = useMemo(
    () => new CatmullRomCurve3(link.points.map((p) => new Vector3(p[0], p[1], p[2]))),
    [link.points],
  );
  const arrow = useMemo(() => {
    if (!link.arrow) return null;
    const dir = new Vector3(...endDirection(link.points));
    const quaternion = new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), dir);
    const tip = link.points[link.points.length - 1]!;
    return { position: tip as [number, number, number], quaternion };
  }, [link.arrow, link.points]);
  const transparent = style.opacity < 1;
  const material = (
    <meshStandardMaterial
      color={style.color}
      emissive={style.color}
      emissiveIntensity={style.emissive + (link.style === 'projection' ? 0.15 : 0)}
      transparent={transparent}
      opacity={style.opacity}
      depthWrite={!transparent}
      roughness={0.5}
    />
  );
  return (
    <group>
      <mesh {...interaction}>
        <tubeGeometry
          args={[curve, Math.max(24, link.points.length * 16), link.radius, 10, false]}
        />
        {material}
      </mesh>
      {arrow && (
        <mesh position={arrow.position} quaternion={arrow.quaternion} {...interaction}>
          <coneGeometry args={[link.radius * 2.6, link.radius * 7, 16]} />
          {material}
        </mesh>
      )}
    </group>
  );
}

interface LabelSpec {
  key: string;
  text: string;
  position: [number, number, number];
  emphasis: boolean;
}

/**
 * Proyecta los anclajes 3D de los rótulos a la capa HTML superpuesta en cada frame.
 * Control de densidad: los rótulos que se solaparían se ocultan, dando prioridad a los
 * seleccionados/señalados. Los rótulos ocultos siguen disponibles en la lista HTML.
 */
function LabelProjector({
  labels,
  elements,
}: {
  labels: readonly LabelSpec[];
  elements: MutableRefObject<Map<string, HTMLSpanElement>>;
}) {
  const invalidate = useThree((s) => s.invalidate);
  const v = useMemo(() => new Vector3(), []);
  useEffect(() => {
    invalidate();
  }, [labels, invalidate]);
  useFrame(({ camera, size }) => {
    const placed: Array<[number, number, number, number]> = [];
    const ordered = [...labels].sort((a, b) => Number(b.emphasis) - Number(a.emphasis));
    for (const label of ordered) {
      const el = elements.current.get(label.key);
      if (!el) continue;
      v.set(label.position[0], label.position[1], label.position[2]).project(camera);
      const inView = v.z > -1 && v.z < 1 && Math.abs(v.x) <= 1.05 && Math.abs(v.y) <= 1.05;
      const x = ((v.x + 1) / 2) * size.width;
      const y = ((1 - v.y) / 2) * size.height;
      const w = el.offsetWidth;
      const h = el.offsetHeight;
      const rect: [number, number, number, number] = [x - w / 2, y - h / 2, x + w / 2, y + h / 2];
      const overlaps = placed.some(
        (p) => rect[0] < p[2] && rect[2] > p[0] && rect[1] < p[3] && rect[3] > p[1],
      );
      if (!inView || overlaps) {
        el.style.visibility = 'hidden';
        continue;
      }
      placed.push(rect);
      el.style.visibility = 'visible';
      el.style.transform = `translate(${rect[0].toFixed(1)}px, ${rect[1].toFixed(1)}px)`;
    }
  });
  return null;
}

function CameraRig({
  camera,
  command,
}: {
  camera: { position: [number, number, number]; target: [number, number, number] };
  command: SchematicSceneProps['cameraCommand'];
}) {
  // Selectores separados: un selector que devuelve un objeto nuevo provoca renders en bucle.
  const cam = useThree((s) => s.camera);
  const controls = useThree((s) => s.controls) as unknown as {
    target: Vector3;
    update: () => void;
  } | null;
  const invalidate = useThree((s) => s.invalidate);
  const lastNonce = useRef<number | null>(null);
  // Clave estable: el encuadre solo se reinicia cuando cambian los valores, no la referencia.
  const cameraKey = JSON.stringify(camera);

  // Encuadre inicial de cada escena.
  useEffect(() => {
    const { position, target } = JSON.parse(cameraKey) as typeof camera;
    cam.position.set(...position);
    controls?.target.set(...target);
    controls?.update();
    invalidate();
  }, [cam, controls, cameraKey, invalidate]);

  useEffect(() => {
    if (!command || command.nonce === lastNonce.current || !controls) return;
    lastNonce.current = command.nonce;
    const target = controls.target;
    const offset = cam.position.clone().sub(target);
    switch (command.command) {
      case 'reset':
        cam.position.set(...camera.position);
        target.set(...camera.target);
        break;
      case 'zoomIn':
        cam.position.copy(target.clone().add(offset.multiplyScalar(0.8)));
        break;
      case 'zoomOut':
        cam.position.copy(target.clone().add(offset.multiplyScalar(1.25)));
        break;
      case 'rotateLeft':
      case 'rotateRight': {
        const angle = (command.command === 'rotateLeft' ? 1 : -1) * (Math.PI / 12);
        offset.applyAxisAngle(new Vector3(0, 1, 0), angle);
        cam.position.copy(target.clone().add(offset));
        break;
      }
    }
    controls.update();
    invalidate();
  }, [command, cam, controls, camera, invalidate]);

  return null;
}

/**
 * Visor 3D de geometría esquemática. Recibe capas ya resueltas y colores declarados;
 * no conoce afirmaciones, fuentes ni contextos (eso vive en la aplicación).
 */
export default function SchematicScene(props: SchematicSceneProps) {
  const {
    layers,
    legendColors,
    nodeColorOverrides = {},
    selectedEntityIds,
    hoveredEntityId,
    onSelectEntity,
    onHoverEntity,
    labelFor,
    showLabels,
    reducedMotion,
    ariaLabel,
  } = props;
  const camera = props.camera ?? DEFAULT_CAMERA;
  const selected = useMemo(() => new Set(selectedEntityIds), [selectedEntityIds]);
  const labelElements = useRef(new Map<string, HTMLSpanElement>());

  // Rótulos: nodos con rótulo propio (según labelMode) y trazos con rótulo propio bajo foco.
  const labels = useMemo<LabelSpec[]>(() => {
    if (!showLabels) return [];
    const out: LabelSpec[] = [];
    for (const layer of layers) {
      if (!layer.visible) continue;
      const { nodes, links } = itemsForLayer(layer);
      for (const node of nodes) {
        const focused = selected.has(node.entityId) || hoveredEntityId === node.entityId;
        if (!node.label || (node.labelMode === 'focus' && !focused)) continue;
        const off = node.labelOffset ?? [0, node.size[1] / 2 + 0.25, 0];
        out.push({
          key: `${layer.id}/${node.id}`,
          text: node.label.es ?? labelFor(node.entityId),
          position: [
            node.position[0] + off[0],
            node.position[1] + off[1],
            node.position[2] + off[2],
          ],
          emphasis: focused,
        });
      }
      for (const link of links) {
        const focused =
          link.entityId !== undefined &&
          (selected.has(link.entityId) || hoveredEntityId === link.entityId);
        if (!link.label || !focused) continue;
        const mid = link.points[Math.floor(link.points.length / 2)]!;
        out.push({
          key: `${layer.id}/${link.id}`,
          text: link.label.es,
          position: [mid[0], mid[1] + 0.25, mid[2]],
          emphasis: true,
        });
      }
    }
    return out;
  }, [layers, showLabels, selected, hoveredEntityId, labelFor]);

  return (
    <div className="na-canvas" role="img" aria-label={ariaLabel}>
      <Canvas
        frameloop="demand"
        dpr={[1, 2]}
        camera={{ position: camera.position, fov: 45, near: 0.1, far: 200 }}
        onPointerMissed={() => onSelectEntity(null)}
        gl={{ antialias: true, preserveDrawingBuffer: true }}
      >
        <color attach="background" args={['#0b1020']} />
        <ambientLight intensity={0.55} />
        <directionalLight position={[5, 10, 7]} intensity={1.1} />
        <directionalLight position={[-6, -4, -5]} intensity={0.35} />
        {layers
          .filter((l) => l.visible)
          .map((layer) => {
            const { nodes, links } = itemsForLayer(layer);
            const selectable = new Set(layer.selectableEntityIds);
            return (
              <group key={layer.id} name={layer.id}>
                {nodes.map((node) => {
                  const base =
                    nodeColorOverrides[node.id] ??
                    (node.colorGroup ? legendColors[node.colorGroup] : undefined) ??
                    DEFAULT_COLOR;
                  const style = styleFor(
                    node.entityId,
                    base,
                    layer.opacity,
                    selected,
                    hoveredEntityId,
                  );
                  return (
                    <Node
                      key={node.id}
                      node={node}
                      style={style}
                      interaction={interactionHandlers({
                        selectable: selectable.has(node.entityId),
                        entityId: node.entityId,
                        onSelectEntity,
                        onHoverEntity,
                      })}
                    />
                  );
                })}
                {links.map((link) => {
                  const base =
                    (link.colorGroup ? legendColors[link.colorGroup] : undefined) ?? DEFAULT_COLOR;
                  const style = styleFor(
                    link.entityId,
                    base,
                    layer.opacity,
                    selected,
                    hoveredEntityId,
                  );
                  return (
                    <Link
                      key={link.id}
                      link={link}
                      style={style}
                      interaction={interactionHandlers({
                        selectable: link.entityId !== undefined && selectable.has(link.entityId),
                        entityId: link.entityId,
                        onSelectEntity,
                        onHoverEntity,
                      })}
                    />
                  );
                })}
              </group>
            );
          })}
        <OrbitControls makeDefault enableDamping={!reducedMotion} />
        <CameraRig camera={camera} command={props.cameraCommand ?? null} />
        <LabelProjector labels={labels} elements={labelElements} />
      </Canvas>
      <div className="na-label-layer" aria-hidden="true">
        {labels.map((label) => (
          <span
            key={label.key}
            ref={(el) => {
              if (el) labelElements.current.set(label.key, el);
              else labelElements.current.delete(label.key);
            }}
            className={`na-3d-label${label.emphasis ? ' na-3d-label--emphasis' : ''}`}
          >
            {label.text}
          </span>
        ))}
      </div>
    </div>
  );
}
