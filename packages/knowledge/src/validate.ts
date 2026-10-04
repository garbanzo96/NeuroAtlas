import type {
  Claim,
  ClaimKind,
  Context,
  DisplayLabel,
  Entity,
  KnowledgePack,
  SchematicGeometry,
  Source,
} from '@neuroatlas/schemas';

export type Severity = 'error' | 'warning' | 'info';

export interface Issue {
  severity: Severity;
  code: string;
  /** ID del registro afectado. */
  id: string;
  message: string;
}

export interface ValidateOptions {
  /** Geometrías esquemáticas cargadas (assetId → contenido) para validar capas y mapeos. */
  geometries?: ReadonlyMap<string, SchematicGeometry>;
}

/** Etiquetas visibles admitidas para cada tipo epistémico. */
const LABELS_BY_KIND: Record<ClaimKind, DisplayLabel[]> = {
  observation: ['observation'],
  association: ['observation'],
  causal_intervention: ['observation'],
  inference: ['inference', 'educational_schematic'],
  model_prediction: ['model'],
  didactic_bridge: ['educational_schematic'],
};

const ADVANCED_STATUS = new Set(['reviewed', 'published']);

function hasExpertApproval(reviews: Claim['reviews']): boolean {
  return reviews.some(
    (r) =>
      r.kind === 'human_expert' &&
      (r.outcome === 'approved' || r.outcome === 'approved_with_changes'),
  );
}

function speciesKey(context: Context | undefined): string | null {
  if (!context) return null;
  return context.species.scope === 'species' ? context.species.scientificName : null;
}

function entitySpecies(entity: Entity | undefined): string | null {
  if (!entity) return null;
  return entity.taxonScope.kind === 'species' ? entity.taxonScope.scientificName : null;
}

/**
 * Valida integridad referencial y reglas epistémicas del plan:
 * procedencia, separación de contextos/especies, estados de revisión y derechos.
 * Devuelve incidencias; quien llama decide si los errores bloquean.
 */
export function validateKnowledge(pack: KnowledgePack, options: ValidateOptions = {}): Issue[] {
  const issues: Issue[] = [];
  const add = (severity: Severity, code: string, id: string, message: string) =>
    issues.push({ severity, code, id, message });

  // --- IDs únicos -----------------------------------------------------------
  const allIds = new Map<string, string>();
  const register = (collection: string, id: string) => {
    const prev = allIds.get(id);
    if (prev) add('error', 'ID_DUPLICATE', id, `ID duplicado (${prev} y ${collection}).`);
    else allIds.set(id, collection);
  };
  pack.sources.forEach((x) => register('sources', x.id));
  pack.contexts.forEach((x) => register('contexts', x.id));
  pack.entities.forEach((x) => register('entities', x.id));
  pack.relations.forEach((x) => register('relations', x.id));
  pack.claims.forEach((x) => register('claims', x.id));
  pack.assets.forEach((x) => register('assets', x.id));
  pack.representations.forEach((x) => register('representations', x.id));
  pack.scenes.forEach((x) => register('scenes', x.sceneId));
  pack.lessons.forEach((x) => register('lessons', x.lessonId));
  pack.models.forEach((x) => register('models', x.id));

  const sources = new Map(pack.sources.map((x) => [x.id, x]));
  const contexts = new Map(pack.contexts.map((x) => [x.id, x]));
  const entities = new Map(pack.entities.map((x) => [x.id, x]));
  const relations = new Map(pack.relations.map((x) => [x.id, x]));
  const claims = new Map(pack.claims.map((x) => [x.id, x]));
  const assets = new Map(pack.assets.map((x) => [x.id, x]));
  const representations = new Map(pack.representations.map((x) => [x.id, x]));
  const scenes = new Map(pack.scenes.map((x) => [x.sceneId, x]));
  const models = new Map(pack.models.map((x) => [x.id, x]));

  const ref = (ok: boolean, ownerId: string, what: string, target: string) => {
    if (!ok)
      add('error', 'REF_MISSING', ownerId, `Referencia rota: ${what} "${target}" no existe.`);
  };
  const anyRef = (ownerId: string, what: string, target: string) =>
    ref(entities.has(target) || models.has(target) || scenes.has(target), ownerId, what, target);

  /**
   * Una entidad de una especie no puede aparecer en un contexto de otra especie, ni en un
   * contexto general/pendiente: para eso existen escenas distintas y correspondencias explícitas.
   */
  const checkEntityContext = (
    ownerId: string,
    context: Context | undefined,
    ids: readonly string[],
    code: string,
  ) => {
    if (!context) return;
    const ctxSpecies = speciesKey(context);
    for (const id of ids) {
      const sp = entitySpecies(entities.get(id));
      if (!sp) continue;
      if (ctxSpecies === null)
        add(
          'error',
          code,
          ownerId,
          `${id} es de ${sp}, pero el contexto ${context.id} no es de una especie concreta.`,
        );
      else if (sp !== ctxSpecies)
        add(
          'error',
          code,
          ownerId,
          `${id} es de ${sp}, pero el contexto ${context.id} es de ${ctxSpecies}.`,
        );
    }
  };

  // --- Fuentes --------------------------------------------------------------
  for (const s of pack.sources) checkSource(s, add);

  // --- Entidades ------------------------------------------------------------
  for (const e of pack.entities) {
    for (const ext of e.externalRefs) {
      if (ext.verified && !ext.verifiedOn)
        add(
          'error',
          'ENTITY_REF_VERIFIED_WITHOUT_DATE',
          e.id,
          `Referencia ${ext.system}:${ext.id} marcada verificada sin fecha.`,
        );
      if (!ext.verified && ext.verifiedOn)
        add(
          'error',
          'ENTITY_REF_DATE_WITHOUT_VERIFICATION',
          e.id,
          `Referencia ${ext.system}:${ext.id} con fecha pero no verificada.`,
        );
    }
  }

  // --- Afirmaciones ---------------------------------------------------------
  for (const c of pack.claims) {
    ref(contexts.has(c.contextId), c.id, 'contexto', c.contextId);
    c.subjectIds.forEach((sid) => anyRef(c.id, 'sujeto', sid));
    if (c.object.type === 'entity') anyRef(c.id, 'objeto', c.object.id);
    if (c.modelId) ref(models.has(c.modelId), c.id, 'modelo', c.modelId);
    for (const ev of c.evidence) {
      ref(sources.has(ev.sourceId), c.id, 'fuente', ev.sourceId);
      if (ev.locatorVerified && ev.locator.trim().toLowerCase() === 'pending')
        add(
          'error',
          'CLAIM_VERIFIED_PENDING_LOCATOR',
          c.id,
          'Localizador "pending" marcado como verificado.',
        );
    }
    checkEntityContext(
      c.id,
      contexts.get(c.contextId),
      [...c.subjectIds, ...(c.object.type === 'entity' ? [c.object.id] : [])],
      'CLAIM_CONTEXT_MIXING',
    );
    if (c.kind !== 'didactic_bridge' && c.evidence.length === 0)
      add(
        'error',
        'CLAIM_NO_EVIDENCE',
        c.id,
        'Toda afirmación científica necesita al menos una fuente.',
      );
    if (c.kind === 'model_prediction' && !c.modelId)
      add(
        'error',
        'CLAIM_MODEL_REQUIRED',
        c.id,
        'Una afirmación de modelo debe identificar el modelo.',
      );
    if (!LABELS_BY_KIND[c.kind].includes(c.display.label))
      add(
        'error',
        'CLAIM_LABEL_MISMATCH',
        c.id,
        `La etiqueta visible "${c.display.label}" no corresponde al tipo "${c.kind}" (admitidas: ${LABELS_BY_KIND[c.kind].join(', ')}).`,
      );
    if (ADVANCED_STATUS.has(c.status)) {
      if (!hasExpertApproval(c.reviews))
        add(
          'error',
          'CLAIM_STATUS_WITHOUT_EXPERT_REVIEW',
          c.id,
          `Estado "${c.status}" exige revisión aprobada de un especialista humano.`,
        );
      if (c.evidence.some((ev) => !ev.locatorVerified))
        add(
          'error',
          'CLAIM_STATUS_UNVERIFIED_LOCATOR',
          c.id,
          `Estado "${c.status}" exige localizadores verificados.`,
        );
      for (const ev of c.evidence) {
        const src = sources.get(ev.sourceId);
        if (src && src.verification.status !== 'content_inspected')
          add(
            'error',
            'CLAIM_STATUS_SOURCE_NOT_INSPECTED',
            c.id,
            `Estado "${c.status}" exige fuente con contenido inspeccionado (${src.id}: ${src.verification.status}).`,
          );
      }
    }
  }

  // --- Relaciones -----------------------------------------------------------
  for (const r of pack.relations) {
    ref(entities.has(r.subjectId), r.id, 'sujeto', r.subjectId);
    if (r.type === 'implemented_by_model') {
      ref(models.has(r.objectId), r.id, 'modelo', r.objectId);
    } else {
      ref(entities.has(r.objectId), r.id, 'objeto', r.objectId);
    }
    ref(contexts.has(r.contextId), r.id, 'contexto', r.contextId);
    r.claimIds.forEach((cid) => ref(claims.has(cid), r.id, 'afirmación', cid));

    const isConnection = r.type === 'connects_to' || r.type === 'projects_to';
    if (isConnection && !r.connection)
      add(
        'error',
        'RELATION_CONNECTION_REQUIRED',
        r.id,
        'Una conexión debe declarar modalidad, dirección y signo.',
      );
    if (!isConnection && r.connection)
      add(
        'error',
        'RELATION_CONNECTION_UNEXPECTED',
        r.id,
        `El tipo "${r.type}" no admite bloque de conexión.`,
      );
    if (r.type === 'corresponds_to' && !r.correspondence)
      add(
        'error',
        'RELATION_CORRESPONDENCE_REQUIRED',
        r.id,
        'Una correspondencia debe declarar categoría y esquema.',
      );
    if (r.type !== 'corresponds_to' && r.correspondence)
      add(
        'error',
        'RELATION_CORRESPONDENCE_UNEXPECTED',
        r.id,
        `El tipo "${r.type}" no admite bloque de correspondencia.`,
      );
    if (r.connection) {
      const { modality, directed, weight } = r.connection;
      if (
        (modality === 'tractography' || modality === 'functional_connectivity') &&
        directed === true
      )
        add(
          'error',
          'RELATION_DIRECTION_NOT_SUPPORTED_BY_METHOD',
          r.id,
          `La modalidad "${modality}" no establece dirección.`,
        );
      if (weight && modality === 'pending_extraction')
        add(
          'error',
          'RELATION_WEIGHT_WITHOUT_METHOD',
          r.id,
          'Un peso exige una modalidad de medición extraída.',
        );
    }
    if (r.type !== 'corresponds_to') {
      const ctxSpecies = speciesKey(contexts.get(r.contextId));
      const subj = entitySpecies(entities.get(r.subjectId));
      const obj =
        r.type === 'implemented_by_model' ? null : entitySpecies(entities.get(r.objectId));
      if (subj && obj && subj !== obj)
        add(
          'error',
          'RELATION_CONTEXT_MIXING',
          r.id,
          `Relación entre especies distintas (${subj} → ${obj}) sin ser una correspondencia.`,
        );
      for (const sp of [subj, obj]) {
        if (sp && ctxSpecies && sp !== ctxSpecies)
          add(
            'error',
            'RELATION_CONTEXT_MIXING',
            r.id,
            `Entidad de ${sp} en contexto de ${ctxSpecies}.`,
          );
      }
    }
    if (ADVANCED_STATUS.has(r.status)) {
      for (const cid of r.claimIds) {
        const c = claims.get(cid);
        if (c && c.status !== 'published' && c.status !== 'reviewed')
          add(
            'error',
            'RELATION_STATUS_EXCEEDS_CLAIMS',
            r.id,
            `Relación "${r.status}" apoyada en afirmación "${c.status}" (${c.id}).`,
          );
      }
    }
  }

  // --- Assets ---------------------------------------------------------------
  for (const a of pack.assets) {
    a.sourceIds.forEach((sid) => ref(sources.has(sid), a.id, 'fuente', sid));
    if (a.status === 'available' && !a.file)
      add('error', 'ASSET_AVAILABLE_WITHOUT_FILE', a.id, 'Un asset disponible necesita archivo.');
    if (a.status !== 'available') {
      if (a.file)
        add(
          'error',
          'ASSET_BLOCKED_WITH_FILE',
          a.id,
          'Un asset bloqueado no puede distribuirse con archivo.',
        );
      if (!a.blocked)
        add(
          'error',
          'ASSET_BLOCKED_WITHOUT_REASON',
          a.id,
          'Un asset bloqueado debe explicar motivo y paquete de trabajo.',
        );
      a.blocked?.candidateSourceIds.forEach((sid) =>
        ref(sources.has(sid), a.id, 'fuente candidata', sid),
      );
    }
    if (a.origin === 'external' && a.status === 'available') {
      if (a.license.status !== 'verified' || a.license.redistribution !== 'allowed')
        add(
          'error',
          'ASSET_EXTERNAL_LICENSE',
          a.id,
          'Un asset externo solo se distribuye con licencia verificada que permita redistribución.',
        );
      if (!a.license.attribution)
        add(
          'error',
          'ASSET_EXTERNAL_ATTRIBUTION',
          a.id,
          'Un asset externo necesita texto de atribución.',
        );
    }
    if (a.origin === 'project_original' && a.license.status !== 'project_original')
      add(
        'error',
        'ASSET_PROJECT_LICENSE',
        a.id,
        'Un asset propio debe declarar licencia "project_original".',
      );
    if (a.kind === 'schematic_geometry' && a.nature !== 'schematic')
      add(
        'error',
        'ASSET_SCHEMATIC_NATURE',
        a.id,
        'Una geometría esquemática debe tener naturaleza "schematic".',
      );
  }

  // --- Geometrías -----------------------------------------------------------
  for (const [assetId, geometry] of options.geometries ?? []) {
    if (geometry.assetId !== assetId)
      add(
        'error',
        'GEOMETRY_ASSET_MISMATCH',
        assetId,
        `La geometría declara assetId "${geometry.assetId}".`,
      );
    const ids = new Set<string>();
    for (const item of [...geometry.nodes, ...geometry.links]) {
      if (ids.has(item.id))
        add('error', 'GEOMETRY_ID_DUPLICATE', assetId, `ID local duplicado "${item.id}".`);
      ids.add(item.id);
      if (item.entityId) ref(entities.has(item.entityId), assetId, 'entidad', item.entityId);
    }
    for (const link of geometry.links) {
      if (link.relationId)
        ref(relations.has(link.relationId), assetId, 'relación', link.relationId);
    }
  }

  // --- Representaciones -----------------------------------------------------
  for (const rep of pack.representations) {
    ref(contexts.has(rep.contextId), rep.id, 'contexto', rep.contextId);
    ref(assets.has(rep.assetId), rep.id, 'asset', rep.assetId);
  }

  // --- Escenas --------------------------------------------------------------
  for (const scene of pack.scenes) {
    const sid = scene.sceneId;
    const ctx = contexts.get(scene.contextId);
    ref(Boolean(ctx), sid, 'contexto', scene.contextId);
    if (ctx) {
      const schematicCtx = ctx.kind === 'schematic';
      const schematicFrame = scene.coordinateFrame.kind === 'schematic';
      if (ctx.kind === 'anatomical_reference' && schematicFrame)
        add(
          'error',
          'SCENE_FRAME_CONTEXT_MISMATCH',
          sid,
          'Un contexto anatómico requiere marco de coordenadas físico.',
        );
      if (schematicCtx && !schematicFrame)
        add(
          'error',
          'SCENE_FRAME_CONTEXT_MISMATCH',
          sid,
          'Un contexto esquemático requiere marco esquemático.',
        );
    }
    checkEntityContext(
      sid,
      ctx,
      scene.layers.flatMap((l) => l.entityIds),
      'SCENE_CONTEXT_MIXING',
    );
    const legendKeys = new Set(scene.legend.map((l) => l.colorGroup));
    const layerIds = new Set<string>();
    for (const layer of scene.layers) {
      if (layerIds.has(layer.id))
        add('error', 'SCENE_LAYER_DUPLICATE', sid, `Capa duplicada "${layer.id}".`);
      layerIds.add(layer.id);
      layer.entityIds.forEach((eid) => ref(entities.has(eid), sid, 'entidad', eid));
      layer.evidenceClaimIds.forEach((cid) => ref(claims.has(cid), sid, 'afirmación', cid));
      const rep = representations.get(layer.representationId);
      ref(Boolean(rep), sid, 'representación', layer.representationId);
      if (!rep) continue;
      if (rep.contextId !== scene.contextId)
        add(
          'error',
          'SCENE_REPRESENTATION_CONTEXT',
          sid,
          `La capa "${layer.id}" usa una representación de otro contexto (${rep.contextId}). Un cambio de contexto requiere otra escena y una transición.`,
        );
      const asset = assets.get(rep.assetId);
      if (!asset) continue;
      if (
        scene.coordinateFrame.kind === 'schematic' &&
        !['schematic', 'illustration'].includes(asset.nature)
      )
        add(
          'error',
          'SCENE_NATURE_FRAME_MISMATCH',
          sid,
          `Capa "${layer.id}": un marco esquemático no puede mostrar datos "${asset.nature}" como si estuvieran registrados.`,
        );
      if (scene.coordinateFrame.kind === 'physical' && asset.nature === 'schematic')
        add(
          'error',
          'SCENE_NATURE_FRAME_MISMATCH',
          sid,
          `Capa "${layer.id}": un esquema no puede situarse en un marco físico.`,
        );
      if (layer.kind === 'schematic' && asset.nature !== 'schematic')
        add(
          'error',
          'SCENE_LAYER_KIND_MISMATCH',
          sid,
          `Capa "${layer.id}" de tipo schematic con asset "${asset.nature}".`,
        );
      if (asset.status !== 'available')
        add(
          'info',
          'SCENE_LAYER_BLOCKED',
          sid,
          `Capa "${layer.id}" bloqueada (${asset.status}; ${asset.blocked?.workPackage ?? 'sin WP'}).`,
        );

      const geometry = options.geometries?.get(asset.id);
      if (geometry) {
        const groups = new Set(rep.groups);
        const inGroup = (g: string) => groups.size === 0 || groups.has(g);
        const geomEntities = new Set(
          [...geometry.nodes, ...geometry.links]
            .filter((x) => inGroup(x.group) && x.entityId)
            .map((x) => x.entityId as string),
        );
        for (const eid of layer.entityIds) {
          if (!geomEntities.has(eid))
            add(
              'error',
              'SCENE_LAYER_ENTITY_NOT_IN_GEOMETRY',
              sid,
              `Capa "${layer.id}": la entidad ${eid} no aparece en la geometría.`,
            );
        }
        for (const eid of geomEntities) {
          if (!layer.entityIds.includes(eid))
            add(
              'warning',
              'GEOMETRY_ENTITY_NOT_SELECTABLE',
              sid,
              `Capa "${layer.id}": ${eid} se dibuja pero no es seleccionable.`,
            );
        }
        for (const item of [...geometry.nodes, ...geometry.links]) {
          if (inGroup(item.group) && item.colorGroup && !legendKeys.has(item.colorGroup))
            add(
              'error',
              'SCENE_LEGEND_MISSING',
              sid,
              `Capa "${layer.id}": el color "${item.colorGroup}" no está explicado en la leyenda.`,
            );
        }
      }
    }

    if (scene.simulation) {
      ref(models.has(scene.simulation.modelId), sid, 'modelo', scene.simulation.modelId);
      for (const mapping of scene.simulation.visualMappings) {
        const nodeIds = new Set<string>();
        for (const layer of scene.layers) {
          const rep = representations.get(layer.representationId);
          const geometry = rep ? options.geometries?.get(rep.assetId) : undefined;
          geometry?.nodes.forEach((n) => nodeIds.add(n.id));
        }
        const model = models.get(scene.simulation.modelId);
        if (model && !model.observables.some((o) => o.id === mapping.variable))
          add(
            'error',
            'SCENE_MAPPING_VARIABLE',
            sid,
            `Mapeo visual de "${mapping.variable}", que no es observable del modelo.`,
          );
        const observable = model?.observables.find((o) => o.id === mapping.variable);
        if (observable && observable.units !== mapping.units)
          add(
            'error',
            'SCENE_MAPPING_UNITS',
            sid,
            `Mapeo visual en ${mapping.units}; el modelo usa ${observable.units}.`,
          );
        if (options.geometries) {
          for (const nid of mapping.targetNodeIds)
            if (!nodeIds.has(nid))
              add(
                'error',
                'SCENE_MAPPING_NODE',
                sid,
                `Mapeo visual hacia nodo inexistente "${nid}".`,
              );
        }
      }
    }

    for (const t of scene.transitions) {
      const target = scenes.get(t.targetSceneId);
      ref(Boolean(target), sid, 'escena destino', t.targetSceneId);
      const bridge = claims.get(t.bridgeClaimId);
      ref(Boolean(bridge), sid, 'afirmación puente', t.bridgeClaimId);
      if (bridge && bridge.kind !== 'didactic_bridge')
        add(
          'error',
          'TRANSITION_BRIDGE_KIND',
          sid,
          `El puente ${bridge.id} debe ser de tipo didactic_bridge.`,
        );
      if (t.correspondence === 'registered') {
        // Aún no existe una colección de mapeos espaciales: ninguna transición puede declararse registrada.
        add(
          'error',
          'TRANSITION_REGISTERED_UNSUPPORTED',
          sid,
          `Transición a ${t.targetSceneId} declarada "registered" sin mapeo espacial documentado (colección de mapeos aún no implementada).`,
        );
      }
      if (target) {
        const a = contexts.get(scene.contextId);
        const b = contexts.get(target.contextId);
        if (a && b && a.id !== b.id) {
          if (t.contextChanges.length === 0)
            add(
              'error',
              'TRANSITION_CONTEXT_CHANGES_MISSING',
              sid,
              `La transición a ${target.sceneId} cambia de contexto y no lo declara.`,
            );
          const sa = JSON.stringify(a.species);
          const sb = JSON.stringify(b.species);
          if (sa !== sb && !t.contextChanges.includes('species'))
            add(
              'error',
              'TRANSITION_SPECIES_UNDECLARED',
              sid,
              `La transición a ${target.sceneId} cambia especie/alcance taxonómico sin declararlo.`,
            );
          if (
            a.kind !== b.kind &&
            !t.contextChanges.includes('abstraction') &&
            !t.contextChanges.includes('modality')
          )
            add(
              'error',
              'TRANSITION_ABSTRACTION_UNDECLARED',
              sid,
              `La transición a ${target.sceneId} cambia el tipo de contexto (${a.kind} → ${b.kind}) sin declararlo.`,
            );
        }
      }
    }
  }

  // --- Lecciones ------------------------------------------------------------
  for (const lesson of pack.lessons) {
    const lid = lesson.lessonId;
    const stepIds = new Set<string>();
    for (const step of lesson.steps) {
      if (stepIds.has(step.id))
        add('error', 'LESSON_STEP_DUPLICATE', lid, `Paso duplicado "${step.id}".`);
      stepIds.add(step.id);
      const scene = scenes.get(step.sceneId);
      ref(Boolean(scene), lid, 'escena', step.sceneId);
      step.claimIds.forEach((cid) => ref(claims.has(cid), lid, 'afirmación', cid));
      step.focusEntityIds.forEach((eid) => ref(entities.has(eid), lid, 'entidad', eid));
      if (!scene) continue;
      const layerIds = new Set(scene.layers.map((l) => l.id));
      for (const layerId of step.visibleLayerIds ?? [])
        if (!layerIds.has(layerId))
          add(
            'error',
            'LESSON_LAYER_NOT_IN_SCENE',
            lid,
            `Paso "${step.id}": la capa "${layerId}" no existe en ${scene.sceneId}.`,
          );
      const sceneEntities = new Set(scene.layers.flatMap((l) => l.entityIds));
      for (const eid of step.focusEntityIds)
        if (!sceneEntities.has(eid))
          add(
            'warning',
            'LESSON_FOCUS_NOT_IN_SCENE',
            lid,
            `Paso "${step.id}": ${eid} no es seleccionable en ${scene.sceneId}.`,
          );
      if (ADVANCED_STATUS.has(lesson.status)) {
        for (const cid of step.claimIds) {
          const c = claims.get(cid);
          if (c && !ADVANCED_STATUS.has(c.status))
            add(
              'error',
              'LESSON_STATUS_EXCEEDS_CLAIMS',
              lid,
              `Lección "${lesson.status}" usa afirmación "${c.status}" (${c.id}).`,
            );
        }
      }
    }
  }

  // --- Modelos --------------------------------------------------------------
  for (const m of pack.models) {
    ref(contexts.has(m.contextId), m.id, 'contexto', m.contextId);
    m.sourceIds.forEach((sid) => ref(sources.has(sid), m.id, 'fuente', sid));
    m.claimIds.forEach((cid) => ref(claims.has(cid), m.id, 'afirmación', cid));
    const ids = new Set<string>();
    for (const p of m.parameters) {
      ref(sources.has(p.sourceId), m.id, 'fuente de parámetro', p.sourceId);
      if (ids.has(p.id))
        add('error', 'MODEL_PARAMETER_DUPLICATE', m.id, `Parámetro duplicado "${p.id}".`);
      ids.add(p.id);
      if (p.range && (p.value < p.range[0] || p.value > p.range[1]))
        add(
          'error',
          'MODEL_PARAMETER_OUT_OF_RANGE',
          m.id,
          `Parámetro "${p.id}" fuera de su rango declarado.`,
        );
      if (p.locatorVerified && p.locator.trim().toLowerCase() === 'pending')
        add(
          'error',
          'MODEL_VERIFIED_PENDING_LOCATOR',
          m.id,
          `Parámetro "${p.id}": localizador "pending" marcado como verificado.`,
        );
    }
    for (const input of m.inputs)
      if (input.default < input.range[0] || input.default > input.range[1])
        add(
          'error',
          'MODEL_INPUT_DEFAULT_OUT_OF_RANGE',
          m.id,
          `Entrada "${input.id}" con valor por defecto fuera de rango.`,
        );
    if (m.solver.defaultDt > m.solver.maxDt)
      add('error', 'MODEL_DT_EXCEEDS_MAX', m.id, 'defaultDt mayor que maxDt.');
    if (ADVANCED_STATUS.has(m.status)) {
      if (!hasExpertApproval(m.reviews))
        add(
          'error',
          'MODEL_STATUS_WITHOUT_EXPERT_REVIEW',
          m.id,
          `Estado "${m.status}" exige revisión aprobada de un especialista en modelado.`,
        );
      if (m.parameters.some((p) => !p.locatorVerified))
        add(
          'error',
          'MODEL_STATUS_UNVERIFIED_PARAMETERS',
          m.id,
          `Estado "${m.status}" exige localizadores verificados para todos los parámetros.`,
        );
    }
  }

  // --- Canal de publicación -------------------------------------------------
  if (pack.release.channel === 'public') {
    const unpublished = [
      ...pack.claims.filter((c) => c.status !== 'published').map((c) => c.id),
      ...pack.relations.filter((r) => r.status !== 'published').map((r) => r.id),
      ...pack.models.filter((m) => m.status !== 'published').map((m) => m.id),
      ...pack.lessons.filter((l) => l.status !== 'published').map((l) => l.lessonId),
    ];
    for (const id of unpublished)
      add(
        'error',
        'RELEASE_PUBLIC_UNPUBLISHED',
        id,
        'Un release público solo puede contener registros publicados.',
      );
  }

  return issues;
}

function checkSource(
  s: Source,
  add: (severity: Severity, code: string, id: string, message: string) => void,
) {
  if (s.verification.status === 'candidate' && s.verification.verifiedOn)
    add(
      'error',
      'SOURCE_CANDIDATE_WITH_DATE',
      s.id,
      'Una fuente candidata no puede tener fecha de verificación.',
    );
  if (s.verification.status !== 'candidate' && !s.verification.verifiedOn)
    add('error', 'SOURCE_VERIFIED_WITHOUT_DATE', s.id, 'Una verificación necesita fecha.');
  if (!s.license.reviewed && s.license.redistribution !== 'unknown')
    add(
      'error',
      'SOURCE_LICENSE_UNREVIEWED',
      s.id,
      'No declarar condiciones de redistribución sin revisar la licencia.',
    );
  if (s.doi === undefined && s.urls.length === 0)
    add('warning', 'SOURCE_NO_LOCATOR', s.id, 'Fuente sin DOI ni URL.');
}

export function summarizeIssues(issues: readonly Issue[]) {
  return {
    errors: issues.filter((i) => i.severity === 'error').length,
    warnings: issues.filter((i) => i.severity === 'warning').length,
    infos: issues.filter((i) => i.severity === 'info').length,
  };
}
