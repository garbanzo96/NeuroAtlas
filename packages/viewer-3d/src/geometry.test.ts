import { SchematicGeometry } from '@neuroatlas/schemas';
import { describe, expect, it } from 'vitest';
import { boundsCenter, endDirection, itemsForLayer, type ViewerLayer } from './geometry';

const geometry = SchematicGeometry.parse({
  schemaVersion: '1',
  assetId: 'asset.test',
  frame: { units: 'arbitrary', axes: 'x' },
  disclaimer: { es: 'Esquema' },
  nodes: [
    {
      id: 'a',
      entityId: 'ent.a',
      shape: 'sphere',
      position: [-2, 0, 0],
      size: [1, 1, 1],
      group: 'g1',
    },
    { id: 'b', entityId: 'ent.b', shape: 'box', position: [2, 0, 0], size: [1, 1, 1], group: 'g2' },
  ],
  links: [
    {
      id: 'l',
      style: 'projection',
      points: [
        [0, 0, 0],
        [0, 4, 0],
      ],
      group: 'g2',
    },
  ],
});

const layer = (groups: string[], visible = true): ViewerLayer => ({
  id: 'x',
  geometry,
  groups,
  visible,
  opacity: 1,
  selectableEntityIds: [],
});

describe('geometría del visor 3D', () => {
  it('filtra elementos por grupo', () => {
    expect(itemsForLayer(layer(['g1'])).nodes.map((n) => n.id)).toEqual(['a']);
    expect(itemsForLayer(layer(['g2'])).links.map((l) => l.id)).toEqual(['l']);
    expect(itemsForLayer(layer([])).nodes).toHaveLength(2);
  });

  it('orienta flechas según el último tramo', () => {
    expect(
      endDirection([
        [0, 0, 0],
        [0, 2, 0],
      ]),
    ).toEqual([0, 1, 0]);
  });

  it('centra la cámara solo en capas visibles', () => {
    expect(boundsCenter([layer([])])).toEqual([0, 2, 0]);
    expect(boundsCenter([layer(['g1'])])).toEqual([-2, 0, 0]);
    expect(boundsCenter([layer([], false)])).toEqual([0, 0, 0]);
  });
});
