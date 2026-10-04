import type { SchematicGeometry } from '@neuroatlas/schemas';
import { nearestIndex, divergingColor } from '@neuroatlas/viewer-2d';
import { LazySchematicScene, type ViewerLayer, isWebGL2Available } from '@neuroatlas/viewer-3d';
import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { loadGeometry } from '../data/pack-loader';
import { useSimulationStore } from '../simulation/simulation-store';
import { useAppStore } from '../state/store';
import { BlockedScene } from './BlockedScene';
import { ErrorBoundary } from './ErrorBoundary';
import { CONTEXT_KIND } from './labels';
import { TransitionLinks } from './TransitionLinks';
import { TransitionNotice } from './TransitionNotice';
import { describeSpecies } from '@neuroatlas/knowledge';

const webgl2 = isWebGL2Available();

function useGeometries(assetIds: readonly string[]) {
  const assetPaths = useAppStore((s) => s.assetPaths);
  const [state, setState] = useState<{
    key: string;
    geometries: Map<string, SchematicGeometry>;
    error: string | null;
  }>({
    key: '',
    geometries: new Map(),
    error: null,
  });
  const key = assetIds.join('|');
  useEffect(() => {
    let cancelled = false;
    Promise.all(assetIds.map((id) => loadGeometry(id, assetPaths).then((g) => [id, g] as const)))
      .then((entries) => {
        if (!cancelled) setState({ key, geometries: new Map(entries), error: null });
      })
      .catch((error: unknown) => {
        if (!cancelled)
          setState({
            key,
            geometries: new Map(),
            error: error instanceof Error ? error.message : String(error),
          });
      });
    return () => {
      cancelled = true;
    };
    // assetIds se resume en `key`
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, assetPaths]);
  return { ...state, loading: state.key !== key };
}

export function Viewer() {
  const kb = useAppStore((s) => s.kb)!;
  const selection = useAppStore((s) => s.selection)!;
  const layerOpacity = useAppStore((s) => s.layerOpacity);
  const hovered = useAppStore((s) => s.hoveredEntityId);
  const showLabels = useAppStore((s) => s.showLabels);
  const reducedMotion = useAppStore((s) => s.reducedMotion);
  const cameraCommand = useAppStore((s) => s.cameraCommand);
  const selectEntity = useAppStore((s) => s.selectEntity);
  const setHovered = useAppStore((s) => s.setHovered);
  const sendCameraCommand = useAppStore((s) => s.sendCameraCommand);
  const simResult = useSimulationStore((s) => s.result);

  const scene = kb.scene(selection.sceneId)!;
  const context = kb.context(scene.contextId)!;
  const availability = kb.sceneAvailability(scene.sceneId);
  const resolved = useMemo(() => kb.resolveLayers(scene.sceneId), [kb, scene.sceneId]);
  const assetIds = useMemo(
    () => [
      ...new Set(
        resolved
          .filter((l) => l.available && l.asset?.kind === 'schematic_geometry')
          .map((l) => l.asset!.id),
      ),
    ],
    [resolved],
  );
  const { geometries, error, loading } = useGeometries(assetIds);

  const viewerLayers: ViewerLayer[] = useMemo(
    () =>
      resolved.flatMap(({ layer, representation, asset, available }) => {
        const geometry = asset ? geometries.get(asset.id) : undefined;
        if (!available || !geometry || !representation) return [];
        return [
          {
            id: layer.id,
            geometry,
            groups: representation.groups,
            visible: selection.visibleLayerIds.includes(layer.id),
            opacity: layerOpacity[layer.id] ?? layer.defaultOpacity,
            selectableEntityIds: layer.entityIds,
          },
        ];
      }),
    [resolved, geometries, selection.visibleLayerIds, layerOpacity],
  );

  // Mapeo explícito variable → color (declarado en la escena), en el instante del cursor.
  const cursor = selection.timeCursor?.value ?? null;
  const nodeColorOverrides = useMemo(() => {
    const out: Record<string, string> = {};
    const mappings = scene.simulation?.visualMappings ?? [];
    if (!simResult || mappings.length === 0) return out;
    const index =
      cursor === null ? simResult.time.length - 1 : nearestIndex(simResult.time, cursor);
    for (const mapping of mappings) {
      const value = simResult.variables[mapping.variable]?.values[index];
      if (value === undefined) continue;
      for (const nodeId of mapping.targetNodeIds)
        out[nodeId] = divergingColor(value, mapping.domain);
    }
    return out;
  }, [scene.simulation, simResult, cursor]);

  const labelFor = useCallback((id: string) => kb.entity(id)?.label.es ?? id, [kb]);
  const legendColors = useMemo(
    () => Object.fromEntries(scene.legend.map((l) => [l.colorGroup, l.color])),
    [scene.legend],
  );
  const disclaimers = [...new Set([...geometries.values()].map((g) => g.disclaimer.es))];

  return (
    <div className={`na-viewer${reducedMotion ? '' : ' na-fade'}`} key={scene.sceneId}>
      <div className="na-viewer__header">
        <h2 className="na-viewer__title">{scene.title.es}</h2>
        <p className="na-context-badge" aria-label="Contexto de la escena">
          <span>{CONTEXT_KIND[context.kind]}</span>
          <span>{describeSpecies(context)}</span>
          <span>
            marco:{' '}
            {scene.coordinateFrame.kind === 'schematic'
              ? 'esquemático (sin unidades)'
              : scene.coordinateFrame.units}
          </span>
        </p>
      </div>
      <TransitionNotice />
      <div className="na-viewer__canvas">
        {availability === 'blocked' ? (
          <BlockedScene sceneId={scene.sceneId} />
        ) : !webgl2 ? (
          <div className="na-fallback" role="note">
            <p>
              <strong>WebGL2 no está disponible</strong> en este navegador. Toda la información
              sigue accesible desde la lista de estructuras, la ficha científica y los gráficos.
            </p>
          </div>
        ) : error ? (
          <div className="na-fallback" role="alert">
            {error}
          </div>
        ) : loading ? (
          <div className="na-fallback" role="status">
            Cargando geometría…
          </div>
        ) : (
          <ErrorBoundary
            resetKey={scene.sceneId}
            fallback={(message) => (
              <div className="na-fallback" role="alert">
                <p>
                  <strong>No se pudo iniciar el visor 3D.</strong> La lista de estructuras, la ficha
                  científica y los gráficos siguen disponibles.
                </p>
                <p className="na-muted">Detalle: {message}</p>
              </div>
            )}
          >
            <Suspense
              fallback={
                <div className="na-fallback" role="status">
                  Cargando visor 3D…
                </div>
              }
            >
              <LazySchematicScene
                ariaLabel={`Visor 3D: ${scene.title.es}. ${scene.summary.es} Usa la lista «Estructuras de la escena» como alternativa accesible.`}
                layers={viewerLayers}
                legendColors={legendColors}
                nodeColorOverrides={nodeColorOverrides}
                selectedEntityIds={selection.selectedEntityIds}
                hoveredEntityId={hovered}
                onSelectEntity={selectEntity}
                onHoverEntity={setHovered}
                labelFor={labelFor}
                showLabels={showLabels}
                reducedMotion={reducedMotion}
                camera={scene.camera}
                cameraCommand={cameraCommand}
              />
            </Suspense>
          </ErrorBoundary>
        )}
        {availability !== 'blocked' && webgl2 && (
          <div className="na-camera-controls" role="group" aria-label="Controles de cámara">
            <button
              type="button"
              onClick={() => sendCameraCommand('rotateLeft')}
              aria-label="Girar a la izquierda"
            >
              ⟲
            </button>
            <button
              type="button"
              onClick={() => sendCameraCommand('rotateRight')}
              aria-label="Girar a la derecha"
            >
              ⟳
            </button>
            <button type="button" onClick={() => sendCameraCommand('zoomIn')} aria-label="Acercar">
              +
            </button>
            <button type="button" onClick={() => sendCameraCommand('zoomOut')} aria-label="Alejar">
              −
            </button>
            <button
              type="button"
              onClick={() => sendCameraCommand('reset')}
              aria-label="Restablecer vista"
            >
              ⌂
            </button>
          </div>
        )}
      </div>
      {disclaimers.map((d) => (
        <p key={d} className="na-disclaimer" role="note">
          {d}
        </p>
      ))}
      <TransitionLinks />
    </div>
  );
}
