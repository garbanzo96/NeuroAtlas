/* global process, console */
// Importa mallas y textos del proyecto abierto ontoterrorist/neuroanatomia (código MIT, textos CC BY-SA 4.0,
// mallas Allen HRA CC BY 4.0 y BodyParts3D CC BY-SA 2.1 JP) a apps/web/public/atlas/.
// Uso: node tools/import-onto.mjs <ruta al clon de github.com/ontoterrorist/neuroanatomia>
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const src = resolve(process.argv[2] ?? '');
const out = resolve('apps/web/public/atlas');
mkdirSync(join(out, 'models'), { recursive: true });
const mod = (f) => import(pathToFileURL(join(src, 'data', f)).href);
const json = (f) => JSON.parse(readFileSync(join(src, 'assets', f), 'utf8'));
const write = (f, data) => writeFileSync(join(out, f), JSON.stringify(data));

for (const f of ['encefalo.glb', 'cuerpo.glb', 'nervios.glb'])
  copyFileSync(join(src, 'assets', f), join(out, 'models', f));

const { A } = await mod('estructuras-a.js');
const { B } = await mod('estructuras-b.js');
const { CUERPO } = await mod('cuerpo.js');
const { NERVIOS } = await mod('nervios.js');
const { VIAS, GRUPOS_VIAS } = await mod('vias.js');
const { ARBOL, CAPAS, REGIONES, SISTEMAS } = await mod('grupos.js');
const { PARTES, SINAPSIS, CIRCUITOS } = await mod('micro.js');

// Geometría: id de malla (con lado) → centroide y caja, por archivo.
write('meshes.json', {
  brain: json('encefalo.json'),
  body: json('cuerpo.json'),
  nerves: json('nervios.json'),
});
// Textos por estructura (clave sin lado).
write('structures.json', { ...A, ...B, ...CUERPO, ...NERVIOS });
write('pathways.json', { groups: GRUPOS_VIAS, pathways: VIAS });
write('taxonomy.json', { tree: ARBOL, layers: CAPAS, regions: REGIONES, systems: SISTEMAS });
write('micro.json', { parts: PARTES, synapses: SINAPSIS, circuits: CIRCUITOS });
console.log('ok', Object.keys({ ...A, ...B }).length, 'estructuras ·', VIAS.length, 'vías');
