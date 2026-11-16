import { useGLTF } from '@react-three/drei';
import { type ThreeEvent, useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { type AtlasData, assetUrl, baseKey, sideOf } from '../data';
import { type HoloLook, type HoloMaterial, approach, holoMaterial } from '../holo';
import type { LevelId } from '../levels';
import { type Hover, type LayerId, isLayerShown, layerOfGroup, useAtlas } from '../store';

/** Intensidades por capa: la superficie externa casi solo con borde; lo profundo, más denso. */
const LOOKS: Record<LayerId, HoloLook> = {
  piel: { color: '#2f6fe0', fill: 0.0, rim: 0.32, power: 3.6 },
  esqueleto: { color: '#3772d6', fill: 0.006, rim: 0.2, power: 2.6 },
  visceras: { color: '#3b6cc8', fill: 0.01, rim: 0.18 },
  arterias: { color: '#6a8cff', fill: 0.05, rim: 0.4 },
  nervios: { color: '#86d6ff', fill: 0.22, rim: 0.65 },
  medula: { color: '#8fcfff', fill: 0.1, rim: 0.6 },
  corteza: { color: '#3a86ff', fill: 0.012, rim: 0.36, power: 2.3 },
  blanca: { color: '#5a96ff', fill: 0.015, rim: 0.22 },
  nucleos: { color: '#7ab6ff', fill: 0.085, rim: 0.55 },
  tronco: { color: '#5ca4ff', fill: 0.05, rim: 0.45 },
  cerebelo: { color: '#4b8dff', fill: 0.025, rim: 0.38 },
  ventriculos: { color: '#6fe0ff', fill: 0.09, rim: 0.5 },
};

/** Capas del cuerpo que se apagan al acercarse al encéfalo. */
const BODY_LAYERS = new Set<LayerId>([
  'piel',
  'esqueleto',
  'visceras',
  'arterias',
  'nervios',
  'medula',
]);

interface Part {
  mesh: THREE.Mesh;
  mat: HoloMaterial;
  layer: LayerId;
  isBrain: boolean;
  keys: Record<'sistema' | 'encefalo' | 'areas', string>;
}

export interface HoverIndex {
  hovers: Map<string, Hover>;
  boxes: Map<string, THREE.Box3>;
}

function buildParts(
  scenes: { root: THREE.Object3D; kind: 'brain' | 'body' | 'nerves' }[],
  data: AtlasData,
): { parts: Part[]; index: HoverIndex } {
  const parts: Part[] = [];
  const hovers = new Map<string, Hover>();
  const boxes = new Map<string, THREE.Box3>();
  const groupCentroids = new Map<string, THREE.Vector3[]>();

  for (const { root, kind } of scenes) {
    root.traverse((o) => {
      if (!(o as THREE.Mesh).isMesh) return;
      const mesh = o as THREE.Mesh;
      const name = mesh.name;
      const meta = data.meshes[kind][name];
      const info = data.structures[baseKey(name)];
      const g = (kind === 'body' ? meta?.g : info?.g) ?? (kind === 'nerves' ? 'raices' : 'gb');
      const layer = layerOfGroup(g);
      if (!mesh.geometry.attributes.normal) mesh.geometry.computeVertexNormals();
      const mat = holoMaterial(LOOKS[layer]);
      mesh.material = mat;
      mesh.renderOrder = kind === 'brain' ? 2 : 1;
      const isBrain = kind === 'brain' || g === 'bp_encefalo';
      const lobeKey = isBrain ? `g:${g}` : name;
      const keys = { sistema: isBrain ? 'g:encefalo' : name, encefalo: lobeKey, areas: name };
      parts.push({ mesh, mat, layer, isBrain, keys });

      const c = meta ? new THREE.Vector3(...meta.c) : new THREE.Vector3();
      const box = meta
        ? new THREE.Box3(new THREE.Vector3(...meta.mn), new THREE.Vector3(...meta.mx))
        : new THREE.Box3().setFromObject(mesh);
      boxes.set(name, box);
      const side = sideOf(name);
      hovers.set(name, {
        key: name,
        title: info?.n ?? name.replace(/_/g, ' '),
        subtitle: [info?.la, side && `hemisferio ${side}`].filter(Boolean).join(' · '),
        anchor: [c.x, c.y, c.z],
      });
      for (const gk of new Set([keys.sistema, keys.encefalo])) {
        if (gk === name) continue;
        if (!groupCentroids.has(gk)) groupCentroids.set(gk, []);
        groupCentroids.get(gk)!.push(c);
        const gb = boxes.get(gk) ?? new THREE.Box3();
        boxes.set(gk, gb.union(box));
      }
    });
  }
  for (const [gk, cs] of groupCentroids) {
    const mean = cs.reduce((a, b) => a.add(b), new THREE.Vector3()).divideScalar(cs.length);
    const g = gk.slice(2);
    const region = data.taxonomy.regions[g]?.[1];
    hovers.set(gk, {
      key: gk,
      title: g === 'encefalo' ? 'Encéfalo' : (region ?? g),
      subtitle: g === 'encefalo' ? 'Sistema nervioso central' : 'Acércate para ver sus áreas',
      anchor: [mean.x, mean.y, mean.z],
    });
  }
  return { parts, index: { hovers, boxes } };
}

const keyForLevel = (p: Part, level: LevelId) =>
  level === 'sistema' ? p.keys.sistema : level === 'encefalo' ? p.keys.encefalo : p.keys.areas;

export function Anatomy({ data, onIndex }: { data: AtlasData; onIndex(i: HoverIndex): void }) {
  const brain = useGLTF(assetUrl('models/encefalo.glb'), false, true);
  const body = useGLTF(assetUrl('models/cuerpo.glb'), false, true);
  const nerves = useGLTF(assetUrl('models/nervios.glb'), false, true);

  const built = useMemo(
    () =>
      buildParts(
        [
          { root: brain.scene, kind: 'brain' },
          { root: body.scene, kind: 'body' },
          { root: nerves.scene, kind: 'nerves' },
        ],
        data,
      ),
    [brain.scene, body.scene, nerves.scene, data],
  );
  const indexSent = useRef(false);
  if (!indexSent.current) {
    indexSent.current = true;
    queueMicrotask(() => onIndex(built.index));
  }

  const hoverKey = useRef<string | null>(null);
  // Resalte sutil del área más cercana al punto que mira la cámara (nivel áreas).
  const focus = useRef<{ part: Part | null; frame: number }>({ part: null, frame: 0 });
  const target = useRef(new THREE.Vector3());
  const anchor = useRef(new THREE.Vector3());

  useFrame(({ camera, controls, clock }, dt) => {
    const s = useAtlas.getState();
    const ctl = controls as unknown as {
      distance?: number;
      getTarget?: (v: THREE.Vector3) => THREE.Vector3;
    } | null;
    if (s.level === 'areas' && ctl?.getTarget && focus.current.frame++ % 6 === 0) {
      ctl.getTarget(target.current);
      let best: Part | null = null;
      let bestD = 2.2 ** 2; // solo si el foco está realmente dentro o junto a la estructura (cm²)
      for (const p of built.parts) {
        if (!p.isBrain || (p.mat.uniforms.uVisible!.value as number) < 0.5) continue;
        const h = built.index.hovers.get(p.mesh.name);
        if (!h) continue;
        const d = anchor.current.set(...h.anchor).distanceToSquared(target.current);
        if (d < bestD) [best, bestD] = [p, d];
      }
      focus.current.part = best;
    } else if (s.level !== 'areas') focus.current.part = null;
    const dist = ctl?.distance ?? camera.position.length();
    const bodyFade = THREE.MathUtils.smoothstep(dist, 28, 80);
    const near = Math.max(0.6, dist * 0.28);
    const t = clock.elapsedTime;
    const hk = s.hover?.key ?? null;
    const sel = s.selected;
    for (const p of built.parts) {
      const u = p.mat.uniforms;
      const shown = isLayerShown(s.layers, s.peel, p.layer);
      const k = keyForLevel(p, s.level);
      const isSel = sel !== null && (p.mesh.name === sel || k === sel);
      let vis = shown ? 1 : 0;
      if (BODY_LAYERS.has(p.layer) && !isSel) {
        const floor = s.pathway
          ? p.layer === 'medula' || p.layer === 'nervios'
            ? 0.55
            : 0.2
          : p.layer === 'medula'
            ? 0.35
            : 0;
        vis *= Math.max(bodyFade, floor);
      }
      u.uVisible!.value = approach(u.uVisible!.value as number, vis, dt, 6);
      u.uHover!.value = approach(
        u.uHover!.value as number,
        hk !== null && k === hk ? 1 : focus.current.part === p ? 0.38 : 0,
        dt,
        hk !== null && k === hk ? 14 : 3,
      );
      u.uSelect!.value = approach(u.uSelect!.value as number, isSel ? 1 : 0, dt, 8);
      u.uDim!.value = approach(
        u.uDim!.value as number,
        sel && !isSel && s.level === 'areas' ? 0.7 : 0,
        dt,
        6,
      );
      u.uNear!.value = isSel ? 0 : near;
      u.uTime!.value = t;
      p.mesh.visible = (u.uVisible!.value as number) > 0.01;
    }
  });

  const pick = (e: ThreeEvent<PointerEvent | MouseEvent>) => {
    const s = useAtlas.getState();
    if (!['sistema', 'encefalo', 'areas'].includes(s.level)) return null;
    for (const hit of e.intersections) {
      const mesh = hit.object as THREE.Mesh;
      const mat = mesh.material as HoloMaterial;
      if (!mat?.uniforms?.uVisible) continue;
      if ((mat.uniforms.uVisible.value as number) < 0.5) continue;
      if (hit.distance < (mat.uniforms.uNear!.value as number) * 1.6) continue;
      const part = built.parts.find((p) => p.mesh === mesh);
      if (part) return keyForLevel(part, s.level);
    }
    return null;
  };

  const onMove = (e: ThreeEvent<PointerEvent>) => {
    if (e.pointerType === 'touch') return;
    const key = pick(e);
    if (key === hoverKey.current) return;
    hoverKey.current = key;
    useAtlas.getState().setHover(key ? (built.index.hovers.get(key) ?? null) : null);
  };
  const onOut = () => {
    hoverKey.current = null;
    useAtlas.getState().setHover(null);
  };
  const onClick = (e: ThreeEvent<MouseEvent>) => {
    if (e.delta > 4) return; // fue un arrastre
    e.stopPropagation();
    const key = pick(e);
    const s = useAtlas.getState();
    if (!key) return;
    if (key === 'g:encefalo') return s.command({ type: 'level', level: 'encefalo' });
    if (key.startsWith('g:')) return s.command({ type: 'mesh', name: key });
    s.select(key);
    s.command({ type: 'mesh', name: key });
  };

  return (
    <group onPointerMove={onMove} onPointerOut={onOut} onClick={onClick}>
      <primitive object={body.scene} />
      <primitive object={nerves.scene} />
      <primitive object={brain.scene} />
    </group>
  );
}
