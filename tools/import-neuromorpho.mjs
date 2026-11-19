import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { URL } from 'node:url';

const root = new URL('./reference/neuromorpho/', import.meta.url);
const dest = new URL('../apps/web/public/atlas/neurons/', import.meta.url);
const meta = JSON.parse(readFileSync(new URL('meta.json', root), 'utf8'));
const names = {
  'piramidal-l23': ['Piramidal de capas 2–3', 'Corteza'],
  'piramidal-l5': ['Piramidal de capa 5', 'Corteza'],
  'estrellada-espinosa': ['Estrellada espinosa', 'Corteza'],
  'cesta-pv': ['Célula en cesta PV', 'Corteza'],
  candelabro: ['Célula en candelabro', 'Corteza'],
  martinotti: ['Célula de Martinotti', 'Corteza'],
  'bipolar-vip': ['Bipolar VIP', 'Corteza'],
  purkinje: ['Célula de Purkinje', 'Cerebelo'],
  'granulo-cerebelo': ['Célula granular del cerebelo', 'Cerebelo'],
  'golgi-cerebelo': ['Célula de Golgi', 'Cerebelo'],
  'piramidal-ca1': ['Piramidal de CA1', 'Hipocampo'],
  'piramidal-ca3': ['Piramidal de CA3', 'Hipocampo'],
  'granulo-giro-dentado': ['Granular del giro dentado', 'Hipocampo'],
  'espinosa-mediana': ['Espinosa mediana', 'Ganglios basales'],
  motoneurona: ['Motoneurona', 'Médula'],
  'ganglionar-retina': ['Ganglionar de retina', 'Retina y bulbo'],
  mitral: ['Célula mitral', 'Retina y bulbo'],
  astrocito: ['Astrocito', 'Glía'],
  microglia: ['Microglía', 'Glía'],
};
const species = { human: 'Humano', mouse: 'Ratón', rat: 'Rata', cat: 'Gato' };
const regions = {
  neocortex: 'neocorteza',
  'layer 2-3': 'capas 2–3',
  'layer 5': 'capa 5',
  'layer 4': 'capa 4',
  'layer 6': 'capa 6',
  'anterior cingulate': 'cíngulo anterior',
  occipital: 'occipital',
  parietal: 'parietal',
  frontal: 'frontal',
  motor: 'motora',
  'primary visual': 'visual primaria',
  superficial: 'superficial',
  cerebellum: 'cerebelo',
  'cerebellar cortex': 'corteza cerebelosa',
  'Purkinje layer': 'capa de Purkinje',
  'stratum granulare': 'estrato granular',
  dorsal: 'dorsal',
  left: 'izquierda',
  vermis: 'vermis',
  hippocampus: 'hipocampo',
  CA1: 'CA1',
  CA3: 'CA3',
  'dentate gyrus': 'giro dentado',
  'granule layer': 'capa granular',
  outer: 'externa',
  'basal ganglia': 'ganglios basales',
  striatum: 'estriado',
  'spinal cord': 'médula espinal',
  cervical: 'cervical',
  C3: 'C3',
  'RCA motor nucleus': 'núcleo motor RCA',
  'ventral horn': 'asta ventral',
  retina: 'retina',
  'main olfactory bulb': 'bulbo olfatorio principal',
  'external plexiform layer': 'capa plexiforme externa',
  deep: 'profunda',
  'stratum radiatum': 'estrato radiado',
};
const q = (n) => Math.round(n * 10) / 10;
mkdirSync(dest, { recursive: true });
const index = [];
for (const [id, m] of Object.entries(meta)) {
  const nodes = readFileSync(new URL(`${id}.swc`, root), 'utf8')
    .split(/\r?\n/)
    .filter((s) => s.trim() && !s.trim().startsWith('#'))
    .map((s) => {
      const [id, type, x, y, z, radius, parent] = s.trim().split(/\s+/).map(Number);
      return { id, type, p: [x, y, z], radius, parent, children: [], distance: 0, order: 0 };
    });
  const byId = new Map(nodes.map((n) => [n.id, n]));
  for (const n of nodes) byId.get(n.parent)?.children.push(n);
  const soma = nodes.find((n) => n.type === 1) ?? nodes[0];
  const dist = (a, b) => Math.hypot(...a.p.map((v, i) => v - b.p[i]));
  const roots = nodes.filter((n) => !byId.has(n.parent));
  const visit = (n) => {
    for (const c of n.children) {
      c.distance = n.distance + dist(n, c);
      c.order = n.order + (n.children.length > 1 ? 1 : 0);
      visit(c);
    }
  };
  for (const n of roots) visit(n);
  const keep = new Set(roots);
  function simplify(path, start, end) {
    if (end <= start + 1) return;
    const a = path[start].p,
      b = path[end].p,
      ab = b.map((v, i) => v - a[i]);
    const den = ab.reduce((s, v) => s + v * v, 0);
    let best = 0,
      at = -1;
    for (let i = start + 1; i < end; i++) {
      const p = path[i].p;
      const t = den
        ? Math.max(0, Math.min(1, p.reduce((s, v, j) => s + (v - a[j]) * ab[j], 0) / den))
        : 0;
      const d = Math.hypot(...p.map((v, j) => v - a[j] - t * ab[j]));
      if (d > best) {
        best = d;
        at = i;
      }
    }
    if (best > 0.6) {
      keep.add(path[at]);
      simplify(path, start, at);
      simplify(path, at, end);
    }
  }
  for (const n of nodes)
    if (
      n.children.length !== 1 ||
      !byId.has(n.parent) ||
      n.type === 1 ||
      byId.get(n.parent)?.type !== n.type
    ) {
      keep.add(n);
      for (const child of n.children) {
        const path = [n, child];
        let cur = child;
        while (cur.children.length === 1 && cur.type !== 1 && cur.children[0].type === cur.type) {
          cur = cur.children[0];
          path.push(cur);
        }
        keep.add(cur);
        simplify(path, 0, path.length - 1);
      }
    }
  const selected = nodes.filter((n) => keep.has(n));
  const indices = new Map(selected.map((n, i) => [n.id, i]));
  const points = [];
  for (const n of selected) {
    let p = byId.get(n.parent);
    while (p && !indices.has(p.id)) p = byId.get(p.parent);
    points.push(
      ...n.p.map((v, i) => q(v - soma.p[i])),
      q(n.radius),
      n.type,
      p ? indices.get(p.id) : -1,
      q(n.distance),
      n.order,
    );
  }
  const length = nodes.reduce(
    (sum, n) => sum + (byId.has(n.parent) ? dist(n, byId.get(n.parent)) : 0),
    0,
  );
  const [name, group] = names[id];
  index.push({
    id,
    name,
    group,
    species: species[m.species] ?? m.species,
    region: m.brain_region.map((r) => regions[r] ?? r).join(' · '),
    integrity: m.physical_Integrity,
    hasAxon: nodes.some((n) => n.type === 2),
    length: q(length),
    branches: nodes.filter((n) => n.children.length > 1).length,
    doi: m.reference_doi,
    pmid: m.reference_pmid,
    url: m.page,
    nature: 'data',
    description: `Reconstrucción de ${name.toLowerCase()} procedente de ${m.brain_region.map((r) => regions[r] ?? r).join(', ')}. La forma corresponde a esta célula registrada.`,
    status: 'borrador — sin revisión experta',
  });
  writeFileSync(new URL(`${id}.json`, dest), JSON.stringify({ points }));
}
writeFileSync(new URL('index.json', dest), JSON.stringify({ neurons: index }));
