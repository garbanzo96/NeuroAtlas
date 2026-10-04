import { useAppStore } from '../state/store';
import { CONTEXT_CHANGE } from './labels';

/** Transiciones declaradas desde la escena actual, con los cambios de contexto anunciados antes de ir. */
export function TransitionLinks() {
  const kb = useAppStore((s) => s.kb)!;
  const sceneId = useAppStore((s) => s.selection!.sceneId);
  const goToScene = useAppStore((s) => s.goToScene);
  const scene = kb.scene(sceneId)!;
  if (scene.transitions.length === 0) return null;
  return (
    <nav className="na-transitions" aria-label="Continuar a otra escena">
      {scene.transitions.map((t) => {
        const target = kb.scene(t.targetSceneId);
        const blocked = kb.sceneAvailability(t.targetSceneId) === 'blocked';
        return (
          <button
            key={t.targetSceneId}
            type="button"
            onClick={() => goToScene(t.targetSceneId, 'transition')}
          >
            <span className="na-transitions__label">
              {t.label.es} →
              {blocked && <span className="na-badge na-badge--blocked">bloqueada</span>}
            </span>
            <span className="na-transitions__meta">
              {target?.title.es} · cambia:{' '}
              {t.contextChanges.length
                ? t.contextChanges.map((c) => CONTEXT_CHANGE[c]).join(', ')
                : 'nada declarado'}{' '}
              · {t.correspondence === 'conceptual' ? 'puente conceptual' : 'registro espacial'}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
