import { Html } from '@react-three/drei';
import { useMemo } from 'react';
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
  const hasPanel = useAtlas((s) => !!s.pathway || !!s.circuit);

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
  return (
    <>
      {items.map((it) => (
        <Html key={it.key} position={it.pos} center zIndexRange={[5, 0]} pointerEvents="none">
          <span className="na-ambient">{it.name}</span>
        </Html>
      ))}
    </>
  );
}
