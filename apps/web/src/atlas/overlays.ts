import { Color } from 'three';
import { type AtlasData, type Overlay, baseKey } from './data';

const palette = [
  '#ff8a2f',
  '#ffc23d',
  '#2fe08a',
  '#ff4f6d',
  '#b06bff',
  '#3d8bff',
  '#e8f04a',
  '#5ee6ff',
];
const tint = (color: string) =>
  `#${new Color(color).lerp(new Color('#73c5ff'), 0.08).getHexString()}`;
const source = {
  cite: 'ontoterrorist/neuroanatomia',
  license: 'CC BY-SA 4.0',
  method: 'Asignación directa desde las fichas de estructuras',
};
const note =
  'Borrador sin revisión experta. Asignación por giro; no reemplaza un atlas volumétrico.';

type Class = NonNullable<Overlay['classes']>[number];
function make(
  id: string,
  n: string,
  classes: Class[],
  entries: [string, string | undefined][],
  warning = false,
): Overlay {
  const valid = new Set(classes.map((c) => c.id));
  return {
    id,
    n,
    kind: 'categorical',
    classes,
    values: Object.fromEntries(
      entries.filter(([, c]) => c && valid.has(c)).map(([k, c]) => [k, { [c!]: 1 }]),
    ),
    source,
    note: warning ? note : 'Borrador sin revisión experta.',
  };
}

export function builtinOverlays(data: AtlasData): Overlay[] {
  const structures = Object.entries(data.structures);
  const regions = Object.entries(data.taxonomy.regions)
    .filter(([id]) => id.startsWith('ctx.'))
    .map(([id, [col, n]]) => ({ id, n, col: tint(col) }));
  regions.push({ id: 'profundo', n: 'Regiones profundas', col: '#2b4f86' });
  const lobe = (g: string) => (g.startsWith('ctx.') ? g : 'profundo');
  const divisions = [
    'Telencéfalo',
    'Diencéfalo',
    'Mesencéfalo',
    'Metencéfalo',
    'Mielencéfalo',
    'Médula espinal',
  ].map((n, i) => ({
    id: ['tel', 'di', 'mes', 'met', 'miel', 'medula'][i]!,
    n,
    col: tint(palette[i]!),
  }));
  const division = (g: string) =>
    g.startsWith('di.')
      ? 'di'
      : g === 'mes'
        ? 'mes'
        : g === 'pon' || g === 'cb'
          ? 'met'
          : g === 'bul'
            ? 'miel'
            : g.startsWith('medula.')
              ? 'medula'
              : /^(ctx\.|hipocampo|amigdala|gb|pb|sb)/.test(g)
                ? 'tel'
                : undefined;
  const systems = Object.entries(data.taxonomy.systems).map(([id, [, n]], i) => ({
    id,
    n,
    col: tint(palette[i % 8]!),
  }));
  const territories = [
    'aca',
    'acm',
    'acp',
    'coroidea',
    'lenticulo',
    'perf',
    'sca',
    'basilar',
    'aica',
    'vert',
    'pica',
    'espinal',
  ].map((id, i) => ({
    id,
    n:
      (
        {
          aca: 'ACA',
          acm: 'ACM',
          acp: 'ACP',
          sca: 'Arteria cerebelosa superior',
          aica: 'AICA',
          pica: 'PICA',
        } as Record<string, string>
      )[id] ?? id[0]!.toUpperCase() + id.slice(1),
    col: tint(palette[i % 8]!),
  }));
  const cerebellum = ['Vermis', 'Paravermis', 'Hemisferio lateral'].map((n, i) => ({
    id: ['vermis', 'paravermis', 'lateral'][i]!,
    n,
    col: tint(palette[i]!),
  }));
  const cerebellarKeys: Record<string, string> = {
    cerebellar_vermis: 'vermis',
    paravermis_of_cerebellum: 'paravermis',
    lateral_hemisphere_of_cerebellum: 'lateral',
  };
  return [
    ...(data.authorOverlays ?? []).map((o) => ({
      ...o,
      classes: o.modes?.map(({ id, n, col }) => ({ id, n, col })),
      values: Object.fromEntries(
        (o.modes ?? [])
          .flatMap((mode) => mode.targets.map((key) => [key, key] as const))
          .map(([key]) => [
            key,
            Object.fromEntries(
              (o.modes ?? []).filter((m) => m.targets.includes(key)).map((m) => [m.id, 1]),
            ),
          ]),
      ),
    })),
    make(
      'lobulos',
      'Lóbulos y regiones',
      regions,
      structures.map(([k, s]) => [k, lobe(s.g)]),
    ),
    make(
      'divisiones',
      'Divisiones embrionarias',
      divisions,
      structures.map(([k, s]) => [k, division(s.g)]),
    ),
    make(
      'sistemas',
      'Sistemas funcionales',
      systems,
      structures.map(([k, s]) => [k, s.s]),
    ),
    make(
      'brodmann',
      'Brodmann',
      regions,
      structures.map(([k, s]) => [k, s.ba ? lobe(s.g) : undefined]),
      true,
    ),
    make(
      'territorios',
      'Territorios vasculares',
      territories,
      structures.map(([k, s]) => [k, s.a]),
      true,
    ),
    make(
      'cerebelo',
      'Cerebelo funcional',
      cerebellum,
      structures.map(([k]) => [k, cerebellarKeys[k]]),
    ),
  ];
}

export function overlayStyle(
  overlay: Overlay,
  solo: string | null,
  key: string,
): { color: string; w: number } | null {
  const value = overlay.values[key] ?? overlay.values[baseKey(key)];
  if (!value || typeof value === 'number') return null;
  const entry = Object.entries(value).sort((a, b) => b[1] - a[1])[0];
  const cls = overlay.classes?.find((c) => c.id === (solo && value[solo] ? solo : entry?.[0]));
  return cls ? { color: cls.col, w: solo ? (value[solo] ?? 0) : (entry?.[1] ?? 0) } : null;
}
