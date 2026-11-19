import { Html } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { type AtlasData, baseKey, findMesh } from '../data';
import { useAtlas } from '../store';

/** Mallas del cuerpo que orientan a escala de sistema nervioso. */
const BODY_LANDMARKS: [string, string][] = [
  ['me_T6', 'Médula espinal'],
  ['plexo_braquial_L', 'Plexo braquial'],
  ['n_mediano_L', 'Nervio mediano'],
  ['n_ciatico_L', 'Nervio ciático'],
  ['n_femoral_L', 'Nervio femoral'],
  ['tronco_simpatico_L', 'Tronco simpático'],
  ['n_vago_L', 'Nervio vago'],
];

/**
 * Rótulos tenues de orientación: lóbulos del hemisferio izquierdo a escala de encéfalo y grandes
 * estructuras a escala de sistema. No capturan el puntero; el hover sigue siendo el rótulo principal.
 */
export function AmbientLabels({ data }: { data: AtlasData }) {
  const level = useAtlas((s) => s.level);
  const overlay = useAtlas((s) => s.overlay);
  const hasPanel = useAtlas(
    (s) => !!s.pathway || !!s.circuit || (s.overlay === 'neurotransmisores' && !!s.overlaySolo),
  );

  const lobes = useMemo(() => {
    const acc = new Map<string, THREE.Vector3[]>();
    for (const [name, meta] of Object.entries(data.meshes.brain)) {
      if (!name.endsWith('_L')) continue;
      const g = data.structures[baseKey(name)]?.g;
      if (!g || !(g.startsWith('ctx.') || g === 'cb' || g === 'pon' || g === 'mes' || g === 'bul'))
        continue;
      if (g === 'ctx.olf' || g === 'ctx.insula') continue;
      // los lóbulos se rotulan hacia fuera: centroides empujados lateralmente
      if (!acc.has(g)) acc.set(g, []);
      acc.get(g)!.push(new THREE.Vector3(...meta.c));
    }
    return [...acc].map(([g, cs]) => {
      const p = cs.reduce((a, b) => a.add(b), new THREE.Vector3()).divideScalar(cs.length);
      p.x = Math.max(p.x * 1.6, p.x + 2.2);
      return { key: g, name: data.taxonomy.regions[g]?.[1] ?? g, pos: p };
    });
  }, [data]);

  const landmarks = useMemo(
    () =>
      BODY_LANDMARKS.flatMap(([mesh, name]) => {
        const m = findMesh(data, mesh);
        return m ? [{ key: mesh, name, pos: new THREE.Vector3(...m.c) }] : [];
      }),
    [data],
  );

  const areas = useMemo(
    () =>
      Object.entries(data.meshes.brain).flatMap(([name, meta]) => {
        const ba = data.structures[baseKey(name)]?.ba;
        return ba ? [{ key: name, name: `BA ${ba}`, pos: new THREE.Vector3(...meta.c) }] : [];
      }),
    [data],
  );
  const items =
    level === 'areas' && overlay === 'brodmann'
      ? areas
      : level === 'encefalo' && !hasPanel
        ? lobes
        : level === 'sistema' && !hasPanel
          ? landmarks
          : [];
  const spans = useRef<(HTMLSpanElement | null)[]>([]);
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  const tmp = useMemo(() => new THREE.Vector3(), []);
  // despeje en pantalla: los rótulos cuyos cuadros se tocan bajan lo justo para no pisarse
  useFrame(() => {
    const boxes = items.map((it, i) => {
      tmp.copy(it.pos).project(camera);
      const w = it.name.length * 8.6;
      return {
        i,
        x: (tmp.x * 0.5 + 0.5) * size.width,
        y: (-tmp.y * 0.5 + 0.5) * size.height,
        w,
        dy: 0,
      };
    });
    boxes.sort((a, b) => a.y - b.y);
    boxes.forEach((b, k) => {
      for (const o of boxes.slice(0, k)) {
        const yo = o.y + o.dy;
        if (Math.abs(b.x - o.x) < (b.w + o.w) / 2 + 6 && b.y + b.dy < yo + 15) b.dy = yo + 15 - b.y;
      }
      const el = spans.current[b.i];
      const t = b.dy ? `translateY(${Math.round(b.dy)}px)` : '';
      if (el && el.style.transform !== t) el.style.transform = t;
    });
  });
  return (
    <>
      {items.map((it, i) => (
        <Html key={it.key} position={it.pos} center zIndexRange={[5, 0]} pointerEvents="none">
          <span className="na-ambient" ref={(el) => void (spans.current[i] = el)}>
            {it.name}
          </span>
        </Html>
      ))}
    </>
  );
}
