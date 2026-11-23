import { baseKey, type AtlasData, type Pathway } from '../data';
import { shuffle } from './engine';

export interface StructureQuestion {
  id: string;
  name: string;
  mesh: string;
  options: string[];
}
export function structureQuestions(data: AtlasData, seed: number): StructureQuestion[] {
  const meshes = Object.keys(data.meshes.brain);
  const entries = Object.entries(data.structures).flatMap(([id, structure]) => {
    const mesh = meshes.find((m) => baseKey(m) === id);
    return mesh ? [{ id, structure, mesh }] : [];
  });
  return entries.flatMap(({ id, structure, mesh }, i) => {
    const alternatives = [
      ...new Set(
        entries
          .filter(
            (e) => e.id !== id && e.structure.g === structure.g && e.structure.n !== structure.n,
          )
          .map((e) => e.structure.n),
      ),
    ];
    if (alternatives.length < 3) return [];
    return [
      {
        id,
        name: structure.n,
        mesh,
        options: shuffle(
          [structure.n, ...shuffle(alternatives, seed + i).slice(0, 3)],
          seed + i + 1,
        ),
      },
    ];
  });
}
export function pathwayQuestions(pathways: Pathway[]): Pathway[] {
  return pathways.filter(
    (p) => p.pasos.length >= 2 && new Set(p.pasos.map((s) => s.t)).size === p.pasos.length,
  );
}
export const sameStructure = (a: string, b: string) => baseKey(a) === baseKey(b);
