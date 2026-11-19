import { useEffect } from 'react';
import { useAtlas } from '../store';
import { applyView } from '../view';
import type { Tour } from './TourIndex';

export function TourPlayer({
  tour,
  exploring,
  onExplore,
}: {
  tour: Tour;
  exploring: boolean;
  onExplore(value: boolean): void;
}) {
  const active = useAtlas((s) => s.tour);

  const step = active?.step ?? 0;
  const current = tour.steps[step];
  useEffect(() => {
    if (!current) return;
    applyView({
      select: null,
      overlay: null,
      pathway: null,
      circuit: null,
      variant: null,
      ...current.view,
    });
    useAtlas.getState().setSheet(null);
    onExplore(false);
    const url = new URL(window.location.href);
    url.searchParams.set('recorrido', tour.id);
    url.searchParams.set('etapa', String(step + 1));
    history.replaceState(history.state, '', url);
  }, [tour, step, current, onExplore]);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (
        (e.target as HTMLElement)?.closest('input,textarea,select,[contenteditable="true"]') ||
        e.altKey ||
        e.metaKey ||
        e.ctrlKey
      )
        return;
      if (e.key === 'Escape') {
        useAtlas.getState().setTour(null);
        const url = new URL(location.href);
        url.searchParams.delete('recorrido');
        url.searchParams.delete('etapa');
        history.replaceState(history.state, '', url);
      } else if (!exploring && e.key === 'ArrowRight' && step < tour.steps.length - 1)
        useAtlas.getState().setTour({ id: tour.id, step: step + 1 });
      else if (!exploring && e.key === 'ArrowLeft' && step > 0)
        useAtlas.getState().setTour({ id: tour.id, step: step - 1 });
      else return;
      e.preventDefault();
      e.stopImmediatePropagation();
    };
    window.addEventListener('keydown', key, true);
    return () => window.removeEventListener('keydown', key, true);
  }, [exploring, step, tour]);
  if (!current) return null;
  const close = () => {
    useAtlas.getState().setTour(null);
    const url = new URL(location.href);
    url.searchParams.delete('recorrido');
    url.searchParams.delete('etapa');
    history.replaceState(history.state, '', url);
  };
  return (
    <section
      className="na-tour-player"
      data-exploring={exploring || undefined}
      aria-label={'Recorrido: ' + tour.n}
    >
      <button className="na-sheet__close" onClick={close} aria-label="Cerrar recorrido">
        ×
      </button>
      <p className="na-kicker">
        {tour.n} · Paso {step + 1} de {tour.steps.length}
      </p>
      <div
        className="na-tour-progress"
        role="progressbar"
        aria-label="Progreso del recorrido"
        aria-valuemin={1}
        aria-valuemax={tour.steps.length}
        aria-valuenow={step + 1}
      >
        <span style={{ width: ((step + 1) / tour.steps.length) * 100 + '%' }} />
      </div>
      <div className="na-tour-live" aria-live="polite" aria-atomic="true">
        <div key={step} className="na-tour-copy">
          <h2>{current.t}</h2>
          <p>{current.d}</p>
        </div>
      </div>
      {exploring ? (
        <button
          className="na-tour-return"
          onClick={() => {
            applyView({
              select: null,
              overlay: null,
              pathway: null,
              circuit: null,
              variant: null,
              ...current.view,
            });
            useAtlas.getState().setSheet(null);
            onExplore(false);
          }}
        >
          Volver al recorrido
        </button>
      ) : (
        <div className="na-tour-nav">
          <button
            disabled={step === 0}
            onClick={() => useAtlas.getState().setTour({ id: tour.id, step: step - 1 })}
          >
            ← Anterior
          </button>
          <button
            disabled={step === tour.steps.length - 1}
            onClick={() => useAtlas.getState().setTour({ id: tour.id, step: step + 1 })}
          >
            Siguiente →
          </button>
        </div>
      )}
      {!exploring && (
        <button className="na-tour-explore" onClick={() => onExplore(true)}>
          Explorar libremente
        </button>
      )}
      <p className="na-learn__draft">Borrador · sin revisión experta</p>
    </section>
  );
}
