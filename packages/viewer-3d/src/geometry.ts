import type { SchematicGeometry, SchematicLink, SchematicNode } from '@neuroatlas/schemas';

/** Capa ya resuelta por la aplicación: qué dibujar y cómo, sin conocer evidencia ni contexto. */
export interface ViewerLayer {
  id: string;
  geometry: SchematicGeometry;
  /** Grupos de la geometría a dibujar (vacío = todos). */
  groups: readonly string[];
  visible: boolean;
  opacity: number;
  /** Entidades que se pueden seleccionar desde esta capa. */
  selectableEntityIds: readonly string[];
}

export interface LayerItems {
  nodes: SchematicNode[];
  links: SchematicLink[];
}

export function itemsForLayer(layer: ViewerLayer): LayerItems {
  const inGroup = (g: string) => layer.groups.length === 0 || layer.groups.includes(g);
  return {
    nodes: layer.geometry.nodes.filter((n) => inGroup(n.group)),
    links: layer.geometry.links.filter((l) => inGroup(l.group)),
  };
}

/** Dirección unitaria del último tramo de una polilínea (para orientar flechas). */
export function endDirection(
  points: ReadonlyArray<readonly [number, number, number]>,
): [number, number, number] {
  const a = points[points.length - 2]!;
  const b = points[points.length - 1]!;
  const d: [number, number, number] = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
  const len = Math.hypot(...d) || 1;
  return [d[0] / len, d[1] / len, d[2] / len];
}

/** Centro de la caja que envuelve todos los elementos visibles (para encuadrar la cámara). */
export function boundsCenter(layers: readonly ViewerLayer[]): [number, number, number] {
  const pts: Array<readonly [number, number, number]> = [];
  for (const layer of layers) {
    if (!layer.visible) continue;
    const { nodes, links } = itemsForLayer(layer);
    nodes.forEach((n) => pts.push(n.position));
    links.forEach((l) => l.points.forEach((p) => pts.push(p)));
  }
  if (pts.length === 0) return [0, 0, 0];
  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];
  for (const p of pts)
    for (let i = 0; i < 3; i++) {
      min[i] = Math.min(min[i]!, p[i]!);
      max[i] = Math.max(max[i]!, p[i]!);
    }
  return [0, 1, 2].map((i) => (min[i]! + max[i]!) / 2) as [number, number, number];
}

export function isWebGL2Available(): boolean {
  try {
    if (typeof document === 'undefined') return false;
    const canvas = document.createElement('canvas');
    return Boolean(canvas.getContext('webgl2'));
  } catch {
    return false;
  }
}
