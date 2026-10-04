import { useAppStore } from '../state/store';
import { CONTEXT_KIND, SCALE, SCALE_ORDER } from './labels';

/** Lista de escenas ordenadas por escala espacial, con su contexto y disponibilidad. */
export function ScaleNavigator() {
  const kb = useAppStore((s) => s.kb)!;
  const current = useAppStore((s) => s.selection!.sceneId);
  const goToScene = useAppStore((s) => s.goToScene);
  const scenes = [...kb.pack.scenes].sort(
    (a, b) => SCALE_ORDER.indexOf(a.semanticScale) - SCALE_ORDER.indexOf(b.semanticScale),
  );
  return (
    <section className="na-panel" aria-labelledby="na-scenes-title">
      <h2 id="na-scenes-title">Niveles y escenas</h2>
      <ol className="na-scenes">
        {scenes.map((scene) => {
          const availability = kb.sceneAvailability(scene.sceneId);
          const context = kb.context(scene.contextId);
          return (
            <li key={scene.sceneId}>
              <button
                type="button"
                className={`na-scene-button${scene.sceneId === current ? ' is-current' : ''}`}
                aria-current={scene.sceneId === current ? 'page' : undefined}
                onClick={() => goToScene(scene.sceneId, 'jump')}
              >
                <span className="na-scene-button__scale">{SCALE[scene.semanticScale]}</span>
                <span className="na-scene-button__title">{scene.title.es}</span>
                <span className="na-scene-button__meta">
                  {context ? CONTEXT_KIND[context.kind] : ''}
                  {availability === 'blocked' && (
                    <span className="na-badge na-badge--blocked">bloqueada</span>
                  )}
                  {availability === 'partially_blocked' && (
                    <span className="na-badge na-badge--blocked">parcial</span>
                  )}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
