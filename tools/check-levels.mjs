import { readFileSync } from 'node:fs';
import { URL } from 'node:url';
import process from 'node:process';
import console from 'node:console';

const ids = ['sistema', 'encefalo', 'areas', 'circuito', 'neurona', 'sinapsis', 'molecula'];
const allowedModels = new Set([
  'hh',
  'izhikevich',
  'lif',
  'wilson-cowan',
  'kuramoto',
  'network',
  'tsodyks-markram',
  'stdp',
  'nernst',
  'ghk',
  'nak-pump',
  'axon',
]);
const errors = [];
const fail = (path, message) => errors.push(`${path}: ${message}`);
const nonempty = (value) => typeof value === 'string' && value.trim().length > 0;
const text = (object, key, path) => {
  if (!nonempty(object?.[key])) fail(`${path}.${key}`, 'debe ser texto no vacío');
};
const list = (object, key, path, min, max) => {
  const value = object?.[key];
  if (!Array.isArray(value) || value.length < min || value.length > max) {
    fail(`${path}.${key}`, `debe contener entre ${min} y ${max} elementos`);
    return [];
  }
  return value;
};
let data;
try {
  data = JSON.parse(
    readFileSync(new URL('../apps/web/public/atlas/levels.json', import.meta.url), 'utf8'),
  );
} catch (error) {
  console.error(`No se pudo leer el JSON: ${error.message}`);
  process.exit(1);
}
if (data?.version !== 1) fail('version', 'debe ser 1');
text(data, 'status', 'raíz');
const levels = list(data, 'levels', 'raíz', 7, 7);
levels.forEach((level, index) => {
  const path = `levels[${index}]`;
  if (level?.id !== ids[index]) fail(`${path}.id`, `se esperaba ${ids[index]}`);
  for (const key of ['title', 'kicker', 'space', 'time', 'lead']) text(level, key, path);
  list(level, 'sections', path, 4, 7).forEach((section, i) => {
    for (const key of ['h', 'p']) text(section, key, `${path}.sections[${i}]`);
    if (section?.items !== undefined) {
      list(section, 'items', `${path}.sections[${i}]`, 3, 6).forEach((item, j) => {
        if (!nonempty(item)) fail(`${path}.sections[${i}].items[${j}]`, 'debe ser texto no vacío');
      });
    }
  });
  list(level, 'concepts', path, 6, 12).forEach((concept, i) => {
    for (const key of ['term', 'def']) text(concept, key, `${path}.concepts[${i}]`);
  });
  for (const key of ['readings', 'questions']) {
    list(level, key, path, key === 'questions' ? 3 : 1, key === 'questions' ? 5 : Infinity).forEach(
      (item, i) => {
        if (!nonempty(item)) fail(`${path}.${key}[${i}]`, 'debe ser texto no vacío');
      },
    );
  }
  list(level, 'numbers', path, 3, 6).forEach((number, i) => {
    for (const key of ['label', 'value', 'source']) text(number, key, `${path}.numbers[${i}]`);
  });
  list(level, 'equations', path, 0, Infinity).forEach((equation, i) => {
    for (const key of ['name', 'eq', 'vars', 'note'])
      text(equation, key, `${path}.equations[${i}]`);
  });
  list(level, 'models', path, 0, Infinity).forEach((model, i) => {
    if (!allowedModels.has(model)) fail(`${path}.models[${i}]`, 'modelo no permitido');
  });
  if (['neurona', 'sinapsis', 'molecula'].includes(level?.id)) {
    list(level, 'types', path, level.id === 'neurona' ? 10 : 1, Infinity).forEach((type, i) => {
      for (const key of ['name', 'where', 'traits', 'role']) text(type, key, `${path}.types[${i}]`);
    });
  } else if (level?.types !== undefined) fail(`${path}.types`, 'no corresponde a este nivel');
});
if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log('Láminas válidas: 7 niveles en el orden esperado.');
