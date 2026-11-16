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

// Curso importado: valida estructura, marcas y vistas sin aceptar HTML.
const variants = {
  circuito: ['columna', 'microcircuito', 'oscilacion', 'red'],
  neurona: [
    'piramidal',
    'purkinje',
    'estrellada',
    'cesta',
    'motoneurona',
    'bipolar',
    'pseudounipolar',
  ],
  sinapsis: ['quimica', 'inhibitoria', 'electrica', 'plasticidad'],
  molecula: ['bomba', 'canales', 'reposo'],
};
const validateView = (v, path) => {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return fail(path, 'vista inválida');
  only(
    v,
    [
      'level',
      'select',
      'overlay',
      'overlaySolo',
      'layers',
      'peel',
      'pathway',
      'pathwayStep',
      'circuit',
      'scenario',
      'lesions',
      'variant',
      'lab',
      'camera',
    ],
    path,
  );
  if (v.level && !levels.has(v.level)) fail(path, `nivel inexistente ${v.level}`);
  if (v.select && !meshNames.has(v.select)) fail(path, `malla inexistente ${v.select}`);
  if (v.pathway && !pathways.has(v.pathway)) fail(path, `vía inexistente ${v.pathway}`);
  if (v.variant && !variants[v.level]?.includes(v.variant))
    fail(path, `variante inexistente ${v.variant}`);
};
const noHtml = (value, path) => {
  if (typeof value === 'string' && /[<>]/.test(value)) fail(path, 'contiene HTML o ángulos');
  else if (Array.isArray(value)) value.forEach((v, i) => noHtml(v, `${path}[${i}]`));
  else if (value && typeof value === 'object')
    for (const [k, v] of Object.entries(value)) noHtml(v, `${path}.${k}`);
};
const inline = (items, path) => {
  if (!Array.isArray(items) || !items.length) return fail(path, 'texto en línea vacío');
  items.forEach((item, i) => {
    const p = `${path}[${i}]`;
    if (item.type === 'action') return action(item, p);
    only(item, ['text', 'marks'], p);
    text(item, 'text', p);
    if (
      item.marks &&
      (!Array.isArray(item.marks) || item.marks.some((m) => !['bold', 'italic'].includes(m)))
    )
      fail(p, 'marca inválida');
  });
};
const action = (a, path) => {
  only(a, ['type', 'text', 'source', 'view'], path);
  text(a, 'text', path);
  text(a, 'source', path);
  validateView(a.view, `${path}.view`);
};
const blocks = (items, path) => {
  if (!Array.isArray(items) || !items.length) return fail(path, 'bloques vacíos');
  items.forEach((b, i) => {
    const p = `${path}[${i}]`;
    if (b.type === 'action') return action(b, p);
    if (b.type === 'p' || b.type === 'h') {
      only(b, ['type', 'text'], p);
      inline(b.text, `${p}.text`);
    } else if (b.type === 'ul') {
      only(b, ['type', 'ordered', 'items'], p);
      if (typeof b.ordered !== 'boolean' || !Array.isArray(b.items) || !b.items.length)
        fail(p, 'lista inválida');
      else b.items.forEach((item, j) => inline(item, `${p}.items[${j}]`));
    } else if (b.type === 'table') {
      only(b, ['type', 'rows'], p);
      if (!Array.isArray(b.rows) || !b.rows.length) fail(p, 'tabla vacía');
      else
        b.rows.forEach((row, j) => {
          if (!Array.isArray(row) || !row.length) return fail(p, 'fila vacía');
          row.forEach((cell, k) => {
            if (!Array.isArray(cell)) fail(p, 'celda inválida');
            else if (cell.length) inline(cell, `${p}.rows[${j}][${k}]`);
          });
        });
    } else if (b.type === 'key' || b.type === 'clinical') {
      only(b, ['type', 'title', 'blocks'], p);
      inline(b.title, `${p}.title`);
      blocks(b.blocks, `${p}.blocks`);
    } else fail(p, 'tipo de bloque inválido');
  });
};
const course = load('course.json');
const unitIds = new Set();
if (course) {
  header('course', course);
  only(course, ['status', 'semesters'], 'course');
  noHtml(course, 'course');
  if (!Array.isArray(course.semesters) || !course.semesters.length)
    fail('course.semesters', 'vacío');
  for (const [i, semester] of (course.semesters ?? []).entries()) {
    const p = `course.semesters[${i}]`;
    only(semester, ['n', 'sub', 'units'], p);
    text(semester, 'n', p);
    text(semester, 'sub', p);
    if (!Array.isArray(semester.units) || !semester.units.length) fail(p, 'unidades vacías');
    for (const u of semester.units ?? []) {
      const up = `${p}.${u.id}`;
      only(u, ['id', 'n', 'baj', 'obj', 'rel', 'blocks'], up);
      for (const k of ['id', 'n', 'baj']) text(u, k, up);
      if (unitIds.has(u.id)) fail(up, 'id duplicado');
      unitIds.add(u.id);
      for (const k of ['obj', 'rel'])
        if (!Array.isArray(u[k]) || u[k].some((v) => typeof v !== 'string' || !v.trim()))
          fail(`${up}.${k}`, 'lista inválida');
      blocks(u.blocks, `${up}.blocks`);
    }
  }
}
const quiz = load('quiz.json');
if (quiz) {
  header('quiz', quiz);
  only(quiz, ['status', 'questions', 'cases'], 'quiz');
  noHtml(quiz, 'quiz');
  const ids = new Set();
  for (const kind of ['questions', 'cases']) {
    if (!Array.isArray(quiz[kind]) || !quiz[kind].length) {
      fail(`quiz.${kind}`, 'vacío');
      continue;
    }
    for (const q of quiz[kind]) {
      const p = `quiz.${kind}.${q.id}`;
      only(
        q,
        ['id', 'unit', 'q', 'options', 'answer', 'why', ...(kind === 'cases' ? ['view'] : [])],
        p,
      );
      for (const k of ['id', 'unit', 'q', 'why']) text(q, k, p);
      if (ids.has(q.id)) fail(p, 'id duplicado');
      ids.add(q.id);
      if (!unitIds.has(q.unit)) fail(p, `unidad inexistente ${q.unit}`);
      if (
        !Array.isArray(q.options) ||
        q.options.length !== 4 ||
        q.options.some((v) => typeof v !== 'string' || !v.trim())
      )
        fail(p, 'se requieren cuatro opciones');
      if (q.answer !== 0) fail(p, 'respuesta correcta debe ser índice 0');
      if (kind === 'cases') {
        validateView(q.view, `${p}.view`);
      }
    }
  }
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log('atlas: datos de autor coherentes');
