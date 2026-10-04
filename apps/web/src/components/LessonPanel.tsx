import { progress, stepAt } from '@neuroatlas/lessons';
import { useAppStore } from '../state/store';
import { DISPLAY_LABEL } from './labels';

const TASK_KIND: Record<string, string> = {
  observe: 'Observa',
  locate: 'Localiza',
  manipulate: 'Experimenta',
  explain: 'Explica',
};

/** Recorrido guiado: narrativa didáctica + afirmaciones con fuente + tarea observable. */
export function LessonPanel() {
  const kb = useAppStore((s) => s.kb)!;
  const lessonState = useAppStore((s) => s.lesson)!;
  const sceneId = useAppStore((s) => s.selection!.sceneId);
  const lessonStep = useAppStore((s) => s.lessonStep);
  const exitLesson = useAppStore((s) => s.exitLesson);
  const lesson = kb.lesson(lessonState.lessonId)!;
  const step = stepAt(lesson, lessonState.stepIndex);
  const p = progress(lesson, lessonState.stepIndex);
  const offScene = step.sceneId !== sceneId;

  return (
    <section className="na-lesson" aria-labelledby="na-lesson-title">
      <header className="na-lesson__header">
        <p className="na-muted">
          {lesson.title.es} · paso {p.index + 1} de {p.total}
        </p>
        <h2 id="na-lesson-title">{step.title.es}</h2>
      </header>
      <p>{step.narrative.es}</p>
      {step.task && (
        <p className="na-lesson__task">
          <strong>{TASK_KIND[step.task.kind]}:</strong> {step.task.prompt.es}
        </p>
      )}
      {step.claimIds.length > 0 && (
        <ul className="na-lesson__claims" aria-label="Afirmaciones de este paso">
          {step.claimIds.map((id) => {
            const claim = kb.claim(id);
            if (!claim) return null;
            return (
              <li key={id}>
                <span className={`na-badge na-badge--label-${claim.display.label}`}>
                  {DISPLAY_LABEL[claim.display.label]}
                </span>{' '}
                {claim.proposition.es}
              </li>
            );
          })}
        </ul>
      )}
      {offScene && (
        <p className="na-warning-inline">
          Estás en otra escena.{' '}
          <button type="button" className="na-link" onClick={() => lessonStep(0)}>
            Volver a la escena del paso
          </button>
        </p>
      )}
      <div className="na-lesson__nav">
        <button type="button" onClick={() => lessonStep(-1)} disabled={p.isFirst}>
          ← Anterior <kbd>[</kbd>
        </button>
        <button
          type="button"
          className="na-primary"
          onClick={() => lessonStep(1)}
          disabled={p.isLast}
        >
          Siguiente <kbd>]</kbd> →
        </button>
        <button type="button" onClick={exitLesson}>
          Salir
        </button>
      </div>
    </section>
  );
}
