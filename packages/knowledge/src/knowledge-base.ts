import type {
  Asset,
  Claim,
  Context,
  Entity,
  KnowledgePack,
  Lesson,
  ModelSpecification,
  Relation,
  Representation,
  SceneLayer,
  SceneManifest,
  Source,
} from '@neuroatlas/schemas';
import { normalizeText } from './text';

export interface ResolvedLayer {
  layer: SceneLayer;
  representation: Representation | undefined;
  asset: Asset | undefined;
  /** true si el asset existe y puede mostrarse. */
  available: boolean;
}

export type SceneAvailability = 'available' | 'partially_blocked' | 'blocked';

export interface EntityRelations {
  outgoing: Relation[];
  incoming: Relation[];
}

export interface ContextDifference {
  aspect: 'species' | 'kind' | 'atlas' | 'modality' | 'preparation' | 'developmentalStage';
  from: string;
  to: string;
}

function indexById<T>(items: readonly T[], key: (item: T) => string): Map<string, T> {
  const map = new Map<string, T>();
  for (const item of items) map.set(key(item), item);
  return map;
}

export function describeSpecies(context: Context): string {
  const s = context.species;
  switch (s.scope) {
    case 'species':
      return s.scientificName;
    case 'general':
      return `general: ${s.description}`;
    case 'pending_decision':
      return `pendiente (${s.decision})`;
    case 'not_applicable':
      return 'no aplica';
  }
}

/**
 * Índice de solo lectura sobre un paquete de conocimiento. No valida: para eso
 * existe `validateKnowledge`. Todas las consultas son puras y deterministas.
 */
export class KnowledgeBase {
  readonly pack: KnowledgePack;
  private readonly sources: Map<string, Source>;
  private readonly contexts: Map<string, Context>;
  private readonly entities: Map<string, Entity>;
  private readonly relations: Map<string, Relation>;
  private readonly claims: Map<string, Claim>;
  private readonly assets: Map<string, Asset>;
  private readonly representations: Map<string, Representation>;
  private readonly scenes: Map<string, SceneManifest>;
  private readonly lessons: Map<string, Lesson>;
  private readonly models: Map<string, ModelSpecification>;
  private readonly searchIndex: Array<{ entity: Entity; terms: string[] }>;

  constructor(pack: KnowledgePack) {
    this.pack = pack;
    this.sources = indexById(pack.sources, (x) => x.id);
    this.contexts = indexById(pack.contexts, (x) => x.id);
    this.entities = indexById(pack.entities, (x) => x.id);
    this.relations = indexById(pack.relations, (x) => x.id);
    this.claims = indexById(pack.claims, (x) => x.id);
    this.assets = indexById(pack.assets, (x) => x.id);
    this.representations = indexById(pack.representations, (x) => x.id);
    this.scenes = indexById(pack.scenes, (x) => x.sceneId);
    this.lessons = indexById(pack.lessons, (x) => x.lessonId);
    this.models = indexById(pack.models, (x) => x.id);
    this.searchIndex = pack.entities.map((entity) => ({
      entity,
      terms: [
        entity.label.es,
        entity.label.en ?? '',
        ...entity.synonyms.map((s) => s.text),
        entity.id,
      ]
        .filter(Boolean)
        .map(normalizeText),
    }));
  }

  get release() {
    return this.pack.release;
  }

  source(id: string) {
    return this.sources.get(id);
  }
  context(id: string) {
    return this.contexts.get(id);
  }
  entity(id: string) {
    return this.entities.get(id);
  }
  relation(id: string) {
    return this.relations.get(id);
  }
  claim(id: string) {
    return this.claims.get(id);
  }
  asset(id: string) {
    return this.assets.get(id);
  }
  representation(id: string) {
    return this.representations.get(id);
  }
  scene(id: string) {
    return this.scenes.get(id);
  }
  lesson(id: string) {
    return this.lessons.get(id);
  }
  model(id: string) {
    return this.models.get(id);
  }

  /** Afirmaciones cuyo sujeto u objeto es la entidad. */
  claimsAboutEntity(entityId: string): Claim[] {
    return this.pack.claims.filter(
      (c) =>
        c.subjectIds.includes(entityId) || (c.object.type === 'entity' && c.object.id === entityId),
    );
  }

  relationsOfEntity(entityId: string): EntityRelations {
    return {
      outgoing: this.pack.relations.filter((r) => r.subjectId === entityId),
      incoming: this.pack.relations.filter((r) => r.objectId === entityId),
    };
  }

  resolveLayers(sceneId: string): ResolvedLayer[] {
    const scene = this.scene(sceneId);
    if (!scene) return [];
    return scene.layers.map((layer) => {
      const representation = this.representation(layer.representationId);
      const asset = representation ? this.asset(representation.assetId) : undefined;
      return {
        layer,
        representation,
        asset,
        available: asset?.status === 'available',
      };
    });
  }

  sceneAvailability(sceneId: string): SceneAvailability {
    const layers = this.resolveLayers(sceneId);
    const available = layers.filter((l) => l.available).length;
    if (available === layers.length) return 'available';
    return available === 0 ? 'blocked' : 'partially_blocked';
  }

  /** Entidades seleccionables en una escena (unión de capas, sin duplicados, en orden). */
  sceneEntities(sceneId: string): Entity[] {
    const seen = new Set<string>();
    const out: Entity[] = [];
    for (const { layer } of this.resolveLayers(sceneId)) {
      for (const id of layer.entityIds) {
        if (seen.has(id)) continue;
        seen.add(id);
        const entity = this.entity(id);
        if (entity) out.push(entity);
      }
    }
    return out;
  }

  scenesContainingEntity(entityId: string): SceneManifest[] {
    return this.pack.scenes.filter((s) => s.layers.some((l) => l.entityIds.includes(entityId)));
  }

  /** Búsqueda insensible a mayúsculas y acentos: exacta > prefijo > contiene. */
  searchEntities(query: string, limit = 20): Entity[] {
    const q = normalizeText(query);
    if (!q) return [];
    const scored: Array<{ entity: Entity; score: number }> = [];
    for (const { entity, terms } of this.searchIndex) {
      let score = 0;
      for (const term of terms) {
        if (term === q) score = Math.max(score, 3);
        else if (term.startsWith(q)) score = Math.max(score, 2);
        else if (term.includes(q)) score = Math.max(score, 1);
      }
      if (score > 0) scored.push({ entity, score });
    }
    scored.sort((a, b) => b.score - a.score || a.entity.label.es.localeCompare(b.entity.label.es));
    return scored.slice(0, limit).map((s) => s.entity);
  }

  /** Diferencias entre dos contextos, para rotular transiciones. */
  contextDifferences(fromId: string, toId: string): ContextDifference[] {
    const a = this.context(fromId);
    const b = this.context(toId);
    if (!a || !b || a.id === b.id) return [];
    const diffs: ContextDifference[] = [];
    const push = (aspect: ContextDifference['aspect'], from: string, to: string) => {
      if (from !== to) diffs.push({ aspect, from, to });
    };
    push('species', describeSpecies(a), describeSpecies(b));
    push('kind', a.kind, b.kind);
    push(
      'atlas',
      a.atlas ? `${a.atlas.name} ${a.atlas.version}` : '—',
      b.atlas ? `${b.atlas.name} ${b.atlas.version}` : '—',
    );
    push('modality', a.modality, b.modality);
    push('preparation', a.preparation, b.preparation);
    push('developmentalStage', a.developmentalStage, b.developmentalStage);
    return diffs;
  }
}
