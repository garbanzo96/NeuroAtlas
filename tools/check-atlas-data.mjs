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
const pathwayData = load('pathways.json').pathways;
const pathways = new Set(pathwayData.map((p) => p.id));
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

const neuronIndex = load('neurons/index.json');
if (neuronIndex) {
  const ids = new Set();
  for (const n of neuronIndex.neurons ?? []) {
    for (const key of [
      'id',
      'name',
      'group',
      'species',
      'region',
      'integrity',
      'url',
      'description',
    ])
      text(n, key, `neurons.${n.id}`);
    if (ids.has(n.id)) fail(`neurons.${n.id}`, 'id duplicado');
    ids.add(n.id);
    if (n.status !== DRAFT || n.nature !== 'data')
      fail(`neurons.${n.id}`, 'estado o naturaleza inválida');
    if (!n.doi?.length && !n.pmid?.length) fail(`neurons.${n.id}`, 'falta cita original');
    if (!/^[a-z0-9-]+$/.test(n.id) || !existsSync(new URL(`neurons/${n.id}.json`, dir)))
      fail(`neurons.${n.id}`, 'archivo inexistente');
  }
  if (ids.size !== 19) fail('neurons', 'se esperan 19 células');
}

const microcircuits = load('microcircuits.json');
if (microcircuits) {
  header('microcircuits', microcircuits);
  only(microcircuits, ['status', 'circuits'], 'microcircuits');
  const ids = new Set();
  const morphologyIds = new Set((neuronIndex?.neurons ?? []).map((n) => n.id));
  if (microcircuits.circuits?.length !== 5) fail('microcircuits', 'se esperan cinco circuitos');
  for (const c of microcircuits.circuits ?? []) {
    const at = `microcircuits.${c.id}`;
    only(c, ['id', 'name', 'compute', 'flow', 'layers', 'cells', 'edges', 'scenarios'], at);
    for (const k of ['id', 'name', 'compute', 'flow']) text(c, k, at);
    if (ids.has(c.id)) fail(at, 'id duplicado');
    ids.add(c.id);
    if (
      !Array.isArray(c.layers) ||
      !c.layers.length ||
      c.layers.some((x) => typeof x !== 'string' || !x.trim())
    )
      fail(`${at}.layers`, 'capas inválidas');
    const nodes = new Set();
    for (const cell of c.cells ?? []) {
      const cp = `${at}.cells.${cell.id}`;
      only(cell, ['id', 'name', 'morphology', 'schematic', 'position', 'rotation', 'scale'], cp);
      text(cell, 'id', cp);
      text(cell, 'name', cp);
      if (nodes.has(cell.id)) fail(cp, 'id duplicado');
      nodes.add(cell.id);
      if (
        (!cell.morphology && cell.schematic !== true) ||
        (cell.morphology && !morphologyIds.has(cell.morphology))
      )
        fail(cp, 'morfología o esquema inválido');
      for (const key of ['position', 'rotation'])
        if (
          !Array.isArray(cell[key]) ||
          cell[key].length !== 3 ||
          !cell[key].every(Number.isFinite)
        )
          fail(`${cp}.${key}`, 'vector inválido');
      if (!(cell.scale > 0) || !Number.isFinite(cell.scale)) fail(`${cp}.scale`, 'escala inválida');
    }
    for (const e of c.edges ?? []) {
      if (
        !nodes.has(e.from) ||
        !nodes.has(e.to) ||
        !['exc', 'inh'].includes(e.sign) ||
        !(e.delay > 0) ||
        !(e.w >= 0) ||
        !Number.isFinite(e.w)
      )
        fail(`${at}.edges`, 'arista inválida');
    }
    if (c.scenarios?.length < 2 || c.scenarios?.length > 3)
      fail(`${at}.scenarios`, 'se esperan dos o tres escenarios');
    const scenarios = new Set();
    for (const sc of c.scenarios ?? []) {
      for (const k of ['id', 'name', 'look']) text(sc, k, `${at}.scenarios`);
      if (scenarios.has(sc.id)) fail(`${at}.scenarios`, 'id duplicado');
      scenarios.add(sc.id);
      for (const st of sc.stim ?? [])
        if (
          !nodes.has(st.node) ||
          !Number.isFinite(st.at) ||
          !Number.isFinite(st.amp) ||
          !(st.dur > 0)
        )
          fail(`${at}.scenarios.${sc.id}`, 'estímulo inválido');
    }
  }
}

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
  only(overlays, ['status', 'overlays'], 'overlays');
  for (const o of overlays.overlays ?? []) {
    const at = `overlays[${o.id}]`;
    only(o, ['id', 'n', 'kind', 'source', 'note', 'modes', 'classes', 'values'], at);
    text(o, 'id', at);
    text(o, 'n', at);
    text(o, 'note', at);
    only(o.source, ['cite', 'license', 'method', 'url'], `${at}.source`);
    for (const k of ['cite', 'license', 'method']) text(o.source, k, `${at}.source`);
    const ids = new Set();
    for (const mode of o.modes ?? []) {
      const mp = `${at}.modes.${mode.id}`;
      only(mode, ['id', 'n', 'col', 'pathway', 'tramos', 'targets', 'origin'], mp);
      for (const k of ['id', 'n', 'col', 'pathway']) text(mode, k, mp);
      if (ids.has(mode.id)) fail(mp, 'id duplicado');
      ids.add(mode.id);
      if (!/^#[0-9a-f]{6}$/i.test(mode.col)) fail(`${mp}.col`, 'color inválido');
      const pathway = pathwayData.find((p) => p.id === mode.pathway);
      if (!pathway) fail(mp, `vía inexistente ${mode.pathway}`);
      if (
        !Array.isArray(mode.tramos) ||
        mode.tramos.some((i) => !Number.isInteger(i) || !pathway?.tramos[i])
      )
        fail(`${mp}.tramos`, 'tramo inexistente');
      if (!Array.isArray(mode.targets) || !mode.targets.length)
        fail(`${mp}.targets`, 'dianas vacías');
      for (const [i, target] of (mode.targets ?? []).entries())
        point(target, `${mp}.targets[${i}]`);
      if (mode.origin) {
        only(mode.origin, ['n', 'at', 'marker'], `${mp}.origin`);
        text(mode.origin, 'n', `${mp}.origin`);
        if (mode.origin.marker !== true) fail(`${mp}.origin.marker`, 'debe ser true');
        point(mode.origin.at, `${mp}.origin.at`);
      }
    }
    for (const [key, v] of Object.entries(o.values ?? {})) {
      if (!meshNames.has(key) && !meshNames.has(`${key}_L`))
        fail(`${at}.values`, `clave inexistente «${key}»`);
      // categórica: el valor es el índice de la clase
      if (o.kind === 'categorical' && !(Number.isInteger(v) && o.classes?.[v]))
        fail(`${at}.values.${key}`, `clase inexistente ${v}`);
    }
  }
}

// Curso importado: valida estructura, marcas y vistas sin aceptar HTML.
const variants = {
  circuito: [
    'columna',
    'microcircuito',
    'oscilacion',
    'red',
    'neocortical',
    'cerebelo',
    'hipocampo',
    'medula',
    'retina',
  ],
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
const tours = load('tours.json');
if (tours) {
  header('tours', tours);
  only(tours, ['status', 'tours'], 'tours');
  noHtml(tours, 'tours');
  if (!Array.isArray(tours.tours) || !tours.tours.length) fail('tours.tours', 'vacío');
  const ids = new Set();
  for (const t of tours.tours ?? []) {
    const at = `tours[${t.id}]`;
    only(t, ['id', 'n', 'sub', 'cover', 'units', 'steps'], at);
    for (const k of ['id', 'n', 'sub']) text(t, k, at);
    if (ids.has(t.id)) fail(at, 'id duplicado');
    ids.add(t.id);
    if (
      t.cover &&
      (!t.cover.startsWith('img/') || t.cover.includes('..') || !existsSync(new URL(t.cover, dir)))
    )
      fail(`${at}.cover`, 'imagen inexistente');
    if (!Array.isArray(t.units) || !t.units.length || t.units.some((id) => !unitIds.has(id)))
      fail(`${at}.units`, 'unidades inválidas');
    if (!Array.isArray(t.steps) || !t.steps.length) fail(`${at}.steps`, 'al menos un paso');
    for (const [i, step] of (t.steps ?? []).entries()) {
      const sp = `${at}.steps[${i}]`;
      only(step, ['t', 'd', 'view', 'run'], sp);
      text(step, 't', sp);
      text(step, 'd', sp);
      validateView(step.view, `${sp}.view`);
      if (step.view?.circuit && !circuitIds.has(step.view.circuit))
        fail(sp, 'circuito inexistente');
      if (
        step.view?.scenario &&
        !circuits?.circuits
          .find((c) => c.id === step.view.circuit)
          ?.scenarios.some((sc) => sc.id === step.view.scenario)
      )
        fail(sp, 'escenario inexistente');
      if (step.run && !['pathway', 'circuit'].includes(step.run)) fail(sp, 'animación inválida');
      if (
        (step.run === 'pathway' && !step.view?.pathway) ||
        (step.run === 'circuit' && (!step.view?.circuit || !step.view?.scenario))
      )
        fail(sp, 'animación sin vista compatible');
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
