// Importa el curso local de ontoterrorist/neuroanatomia (CC BY-SA 4.0), sin descargar datos.
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { URL, pathToFileURL } from 'node:url';
import process from 'node:process';
import console from 'node:console';

const source = process.argv[2];
if (!source) throw new Error('Uso: node tools/import-onto-course.mjs /ruta/al/clon');
const get = async (file) => import(pathToFileURL(resolve(source, 'data', file)).href);
const [{ SEMESTRE_1 }, { SEMESTRE_2 }, { PREGUNTAS, CASOS }] = await Promise.all([
  get('curso-1.js'),
  get('curso-2.js'),
  get('preguntas.js'),
]);
const dir = new URL('../apps/web/public/atlas/', import.meta.url);
const load = (f) => JSON.parse(readFileSync(new URL(f, dir), 'utf8'));
const meshes = new Set(Object.values(load('meshes.json')).flatMap((g) => Object.keys(g)));
const paths = new Set(load('pathways.json').pathways.map((p) => p.id));
const missing = [];
const micro = {
  'c:corteza': { level: 'circuito', variant: 'columna' },
  'n:neurona': { level: 'neurona', variant: 'piramidal' },
  's:glu': { level: 'sinapsis', variant: 'quimica' },
  's:gaba': { level: 'sinapsis', variant: 'inhibitoria' },
  's:ach': { level: 'sinapsis', variant: 'quimica' },
  's:da': { level: 'sinapsis', variant: 'quimica' },
};
// Vistas con nombre del curso original → equivalente en el atlas.
const named = {
  cuerpo: { level: 'sistema' },
  neuroeje: { level: 'sistema', layers: { piel: false, medula: true, nervios: true } },
  vasos: { level: 'encefalo', layers: { arterias: true } },
  interior: { level: 'encefalo', peel: 3 },
  encefalo: { level: 'encefalo' },
  cabeza: { level: 'encefalo' },
};
function view(action, location) {
  const [kind, id, extra] = action.split(':');
  let v;
  if (kind === 'e') {
    // estructura bilateral sin lado: se muestra la izquierda (el par contralateral se resalta igual al buscar)
    const candidate = [id, `${id}_L`, `${id}_R`].find((x) => meshes.has(x));
    if (candidate) v = { select: candidate };
  } else if (kind === 'v' && paths.has(id)) v = { pathway: id };
  else if (kind === 'vista') v = named[id];
  else if (kind === 'm') v = micro[`${id}:${extra}`];
  if (!v) missing.push(`${location}: ${action}`);
  return v ?? {};
}
// Un parser estricto del subconjunto de etiquetas observado en el clon; falla ante etiquetas nuevas.
function parse(html) {
  const root = { tag: 'root', children: [] },
    stack = [root];
  for (const token of html.match(/<[^>]*>|[^<]+/g) ?? []) {
    if (!token.startsWith('<')) {
      stack.at(-1).children.push(token);
      continue;
    }
    const m = token.match(/^<\/?([a-z0-9]+)(?:\s[^>]*)?>$/i);
    if (!m) throw new Error(`Etiqueta inválida: ${token}`);
    const tag = m[1];
    if (
      ![
        'p',
        'h3',
        'h4',
        'strong',
        'em',
        'sub',
        'ul',
        'ol',
        'li',
        'table',
        'tr',
        'th',
        'td',
        'div',
        'button',
      ].includes(tag)
    )
      throw new Error(`Etiqueta desconocida: ${tag}`);
    if (token.startsWith('</')) {
      if (stack.length === 1 || stack.pop().tag !== tag)
        throw new Error(`Cierre inesperado: ${token}`);
    } else {
      const node = { tag, attrs: token, children: [] };
      stack.at(-1).children.push(node);
      stack.push(node);
    }
  }
  if (stack.length !== 1) throw new Error('Etiquetas sin cerrar');
  return root.children;
}
const clean = (s) =>
  s
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '‹')
    .replace(/&gt;/g, '›')
    .replace(/\s+/g, ' ');
function inline(nodes, location, marks = []) {
  return nodes.flatMap((n) => {
    if (typeof n === 'string')
      return n.trim() ? [{ text: clean(n), ...(marks.length ? { marks } : {}) }] : [];
    if (n.tag === 'button') {
      const action = n.attrs.match(/data-a="([^"]+)"/)?.[1];
      if (!action) throw new Error('Botón sin destino');
      return [
        {
          type: 'action',
          text: clean(n.children.join('')).replace(/^◈\s*/, ''),
          source: action,
          view: view(action, location),
        },
      ];
    }
    if (n.tag === 'strong' || n.tag === 'em')
      return inline(n.children, location, [...marks, n.tag === 'strong' ? 'bold' : 'italic']);
    if (n.tag === 'sub') return inline(n.children, location, marks);
    throw new Error(`Elemento en línea inesperado: ${n.tag}`);
  });
}
function blocks(nodes, location) {
  return nodes.flatMap((n) => {
    if (typeof n === 'string') {
      if (n.trim()) throw new Error(`Texto suelto: ${n}`);
      return [];
    }
    if (n.tag === 'p' || n.tag === 'h3') {
      const parts = inline(n.children, location),
        result = [];
      let text = [];
      const flush = () => {
        if (text.some((x) => x.text.trim())) result.push({ type: n.tag === 'p' ? 'p' : 'h', text });
        text = [];
      };
      for (const part of parts) {
        if (part.type === 'action') {
          flush();
          result.push(part);
        } else text.push(part);
      }
      flush();
      return result;
    }
    if (n.tag === 'ul' || n.tag === 'ol')
      return [
        {
          type: 'ul',
          ordered: n.tag === 'ol',
          items: n.children.filter((x) => x.tag === 'li').map((x) => inline(x.children, location)),
        },
      ];
    if (n.tag === 'table')
      return [
        {
          type: 'table',
          rows: n.children
            .filter((x) => x.tag === 'tr')
            .map((row) =>
              row.children
                .filter((x) => x.tag === 'th' || x.tag === 'td')
                .map((cell) => inline(cell.children, location)),
            ),
        },
      ];
    if (n.tag === 'div') {
      const title = n.children.find((x) => x.tag === 'h4');
      return [
        {
          type: n.attrs.includes('clin') ? 'clinical' : 'key',
          title: inline(title.children, location),
          blocks: blocks(
            n.children.filter((x) => x !== title),
            location,
          ),
        },
      ];
    }
    throw new Error(`Bloque inesperado: ${n.tag}`);
  });
}
const semesters = [SEMESTRE_1, SEMESTRE_2].map((s) => ({
  n: s.n,
  sub: s.sub,
  units: s.unidades.map(({ id, n, baj, obj, rel, html }) => ({
    id,
    n,
    baj,
    obj,
    rel,
    blocks: blocks(parse(html), id),
  })),
}));
const questions = PREGUNTAS.map(([unit, q, options, why], i) => ({
  id: `q${String(i + 1).padStart(3, '0')}`,
  unit,
  q,
  options,
  answer: 0,
  why,
}));
const cases = CASOS.map(([unit, q, options, why, action], i) => ({
  id: `c${String(i + 1).padStart(3, '0')}`,
  unit,
  q,
  options,
  answer: 0,
  why,
  view: view(action, `caso ${i + 1}`),
}));
const status = 'borrador — sin revisión experta';
for (const [file, data] of [
  ['course.json', { status, semesters }],
  ['quiz.json', { status, questions, cases }],
])
  writeFileSync(new URL(file, dir), JSON.stringify(data));
console.log(
  `${semesters.flatMap((s) => s.units).length} unidades, ${questions.length} preguntas, ${cases.length} casos`,
);
console.log(`Acciones sin destino (${missing.length}):\n${missing.join('\n')}`);
