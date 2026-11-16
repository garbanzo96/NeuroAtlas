import * as THREE from 'three';

export interface MeshMeta {
  c: [number, number, number];
  mn: [number, number, number];
  mx: [number, number, number];
  t: number;
  g?: string;
}

/** Ficha de una estructura (textos de ontoterrorist/neuroanatomia, CC BY-SA 4.0). */
export interface Structure {
  n: string;
  la?: string;
  g: string;
  s?: string;
  ba?: string;
  a?: string;
  d?: string;
  f?: string[];
  c?: string;
  cl?: string;
}

export type PathPoint =
  string | [number, number, number] | { en: string; f: [number, number, number] };

export interface Pathway {
  id: string;
  g: string;
  n: string;
  sub?: string;
  res?: string;
  solidos?: string[];
  tramos: { n: string; col: string; pts: PathPoint[] }[];
  pasos: { t: string; d: string; en: PathPoint }[];
  clin?: string;
}

/** Circuito con signo (datos de autor, `circuits.json`, ADR-0012). */
export interface CircuitNode {
  id: string;
  n: string;
  at: PathPoint;
  basal?: number;
  marker?: boolean;
}
export interface CircuitEdge {
  from: string;
  to: string;
  sign: 'exc' | 'inh' | 'mod' | 'horm';
  nt?: string;
  delay: number;
  w?: number;
  via?: PathPoint[];
  modulates?: { edges: number[]; gain: number };
}
export interface Scenario {
  id: string;
  n: string;
  d: string;
  stim: { node: string; at: number; amp: number; dur: number }[];
  lesions?: string[];
}
export interface Circuit {
  id: string;
  g: string;
  n: string;
  sub?: string;
  res?: string;
  nature: 'observacion' | 'modelo' | 'hipotesis';
  species?: string;
  nodes: CircuitNode[];
  edges: CircuitEdge[];
  scenarios: Scenario[];
  steps?: { t: string; d: string; focus: string }[];
  model?: string;
  micro?: string;
  refs?: string[];
}

/** Capa de lectura: asigna clase o valor a cada clave Allen (con `_L`/`_R` si es asimétrica). */
export interface Overlay {
  id: string;
  n: string;
  kind: 'categorical' | 'scalar';
  classes?: { id: string; n: string; col: string; d?: string }[];
  values: Record<string, number | Record<string, number>>;
  source: { cite: string; license: string; url?: string; method: string };
  note?: string;
}

export interface AtlasData {
  meshes: Record<'brain' | 'body' | 'nerves', Record<string, MeshMeta>>;
  structures: Record<string, Structure>;
  pathways: { groups: [string, string][]; pathways: Pathway[] };
  taxonomy: {
    regions: Record<string, [string, string]>;
    systems: Record<string, [string, string]>;
  };
}

export const assetUrl = (path: string) => `${import.meta.env.BASE_URL}atlas/${path}`;

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(assetUrl(path));
  if (!res.ok) throw new Error(`No se pudo cargar ${path} (${res.status})`);
  return (await res.json()) as T;
}

export async function loadAtlasData(): Promise<AtlasData> {
  const [meshes, structures, pathways, taxonomy] = await Promise.all([
    getJson<AtlasData['meshes']>('meshes.json'),
    getJson<AtlasData['structures']>('structures.json'),
    getJson<AtlasData['pathways']>('pathways.json'),
    getJson<AtlasData['taxonomy']>('taxonomy.json'),
  ]);
  return { meshes, structures, pathways, taxonomy };
}

/** `putamen_L` → `putamen`. */
export const baseKey = (meshName: string) => meshName.replace(/_[LR]$/, '');
export const sideOf = (meshName: string) =>
  meshName.endsWith('_L') ? 'izquierdo' : meshName.endsWith('_R') ? 'derecho' : '';

export function findMesh(data: AtlasData, name: string): MeshMeta | undefined {
  return data.meshes.brain[name] ?? data.meshes.body[name] ?? data.meshes.nerves[name];
}

/** Resuelve un punto de vía: centroide de malla, fracción de su caja o coordenada directa (cm). */
export function resolvePoint(data: AtlasData, p: PathPoint): THREE.Vector3 | null {
  if (Array.isArray(p)) return new THREE.Vector3(...p);
  if (typeof p === 'string') {
    const m = findMesh(data, p);
    return m ? new THREE.Vector3(...m.c) : null;
  }
  const m = findMesh(data, p.en);
  if (!m) return null;
  return new THREE.Vector3(
    m.mn[0] + p.f[0] * (m.mx[0] - m.mn[0]),
    m.mn[1] + p.f[1] * (m.mx[1] - m.mn[1]),
    m.mn[2] + p.f[2] * (m.mx[2] - m.mn[2]),
  );
}
