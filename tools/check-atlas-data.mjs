// Valida los datos de autor del atlas (ADR-0012): circuitos, capas de lectura y recorridos.
// Un archivo ausente se omite; uno presente debe ser coherente con mallas, vías y niveles.
import { existsSync, readFileSync } from 'node:fs';
import { URL } from 'node:url';
import process from 'node:process';
import console from 'node:console';

const dir = new URL('../apps/web/public/atlas/', import.meta.url);
const load = (f) =>
  existsSync(new URL(f, dir)) ? JSON.parse(readFileSync(new URL(f, dir), 'utf8')) : null;
const errors = [];
const fail = (path, msg) => errors.push(`${path}: ${msg}`);
const text = (o, k, path) => {
  if (typeof o?.[k] !== 'string' || !o[k].trim()) fail(`${path}.${k}`, 'debe ser texto no vacío');
};
const only = (o, keys, path) => {
  for (const k of Object.keys(o ?? {}))
    if (!keys.includes(k)) fail(`${path}.${k}`, 'clave desconocida');
};
const DRAFT = 'borrador — sin revisión experta';

const meshes = load('meshes.json');
const meshNames = new Set(Object.values(meshes).flatMap((g) => Object.keys(g)));
const pathways = new Set(load('pathways.json').pathways.map((p) => p.id));
const levels = new Set([
  'sistema',
  'encefalo',
  'areas',
  'circuito',
  'neurona',
  'sinapsis',
  'molecula',
]);

const point = (p, path) => {
  if (Array.isArray(p))
    return p.length === 3 && p.every(Number.isFinite)
      ? undefined
      : fail(path, 'coordenada inválida');
  const name = typeof p === 'string' ? p : p?.en;
  if (!meshNames.has(name)) fail(path, `malla inexistente «${name}»`);
};
const header = (file, doc) => {
  if (doc.status !== DRAFT) fail(`${file}.status`, `debe ser «${DRAFT}»`);
};

const circuits = load('circuits.json');
const circuitIds = new Set();
if (circuits) {
  header('circuits', circuits);
  for (const [i, c] of (circuits.circuits ?? []).entries()) {
    const at = `circuits[${c.id ?? i}]`;
    only(
      c,
      [
        'id',
        'g',
        'n',
        'sub',
        'res',
        'nature',
        'species',
        'nodes',
        'edges',
        'scenarios',
        'steps',
        'model',
        'micro',
        'refs',
      ],
      at,
    );
    for (const k of ['id', 'g', 'n']) text(c, k, at);
    if (!['observacion', 'modelo', 'hipotesis'].includes(c.nature))
      fail(`${at}.nature`, 'valor inválido');
    circuitIds.add(c.id);
    const nodes = new Set((c.nodes ?? []).map((n) => n.id));
    for (const n of c.nodes ?? []) {
      text(n, 'n', `${at}.nodes.${n.id}`);
      point(n.at, `${at}.nodes.${n.id}.at`);
    }
    for (const [j, e] of (c.edges ?? []).entries()) {
      const ep = `${at}.edges[${j}]`;
      if (!nodes.has(e.from) || !nodes.has(e.to)) fail(ep, `nodo inexistente ${e.from}→${e.to}`);
      if (!['exc', 'inh', 'mod', 'horm'].includes(e.sign)) fail(`${ep}.sign`, 'valor inválido');
      if (!(e.delay >= 0)) fail(`${ep}.delay`, 'debe ser ≥ 0');
      for (const [k, p] of (e.via ?? []).entries()) point(p, `${ep}.via[${k}]`);
      for (const m of e.modulates?.edges ?? [])
        if (!c.edges[m]) fail(`${ep}.modulates`, `arista ${m} inexistente`);
    }
    if (!c.scenarios?.length) fail(`${at}.scenarios`, 'al menos un escenario');
    for (const s of c.scenarios ?? []) {
      text(s, 'n', `${at}.scenarios.${s.id}`);
      text(s, 'd', `${at}.scenarios.${s.id}`);
      for (const st of s.stim ?? [])
        if (!nodes.has(st.node))
          fail(`${at}.scenarios.${s.id}`, `estímulo a nodo inexistente ${st.node}`);
      for (const l of s.lesions ?? [])
        if (!nodes.has(l)) fail(`${at}.scenarios.${s.id}`, `lesión de nodo inexistente ${l}`);
    }
  }
}

const overlays = load('overlays.json');
if (overlays) {
  header('overlays', overlays);
  for (const o of overlays.overlays ?? []) {
    const at = `overlays[${o.id}]`;
    text(o, 'n', at);
    for (const k of ['cite', 'license', 'method']) text(o.source, k, `${at}.source`);
    for (const [key, v] of Object.entries(o.values ?? {})) {
      if (!meshNames.has(key) && !meshNames.has(`${key}_L`))
        fail(`${at}.values`, `clave inexistente «${key}»`);
      // categórica: el valor es el índice de la clase
      if (o.kind === 'categorical' && !(Number.isInteger(v) && o.classes?.[v]))
        fail(`${at}.values.${key}`, `clase inexistente ${v}`);
    }
  }
}

const tours = load('tours.json');
if (tours) {
  header('tours', tours);
  for (const t of tours.tours ?? []) {
    const at = `tours[${t.id}]`;
    text(t, 'n', at);
    if (!t.steps?.length) fail(`${at}.steps`, 'al menos un paso');
    for (const [i, s] of (t.steps ?? []).entries()) {
      const sp = `${at}.steps[${i}]`;
      text(s, 't', sp);
      text(s, 'd', sp);
      const v = s.view ?? {};
      if (v.level && !levels.has(v.level)) fail(`${sp}.view.level`, `nivel inexistente ${v.level}`);
      if (v.select && !meshNames.has(v.select))
        fail(`${sp}.view.select`, `malla inexistente ${v.select}`);
      if (v.pathway && !pathways.has(v.pathway))
        fail(`${sp}.view.pathway`, `vía inexistente ${v.pathway}`);
      if (v.circuit && !circuitIds.has(v.circuit))
        fail(`${sp}.view.circuit`, `circuito inexistente ${v.circuit}`);
    }
  }
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log('atlas: datos de autor coherentes');
