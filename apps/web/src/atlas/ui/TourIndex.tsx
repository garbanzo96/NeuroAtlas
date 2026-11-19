import { assetUrl } from '../data';
import type { AtlasView } from '../view';

export interface Tour {
  id: string;
  n: string;
  sub: string;
  cover?: string;
  units: string[];
  steps: { t: string; d: string; view: AtlasView; run?: 'pathway' | 'circuit' }[];
}

export function TourIndex({
  tours,
  onStart,
  onCourse,
  onClose,
}: {
  tours: Tour[];
  onStart(tour: Tour): void;
  onCourse(): void;
  onClose(): void;
}) {
  return (
    <section className="na-learn" aria-label="Recorridos y curso">
      <header>
        <p className="na-kicker">Aprender en el atlas</p>
        <h2>Recorridos guiados</h2>
        <p>Viaja entre escalas para seguir una idea paso a paso.</p>
        <button className="na-sheet__close" onClick={onClose} aria-label="Cerrar">
          ×
        </button>
      </header>
      <div className="na-tour-list">
        {tours.map((t) => (
          <button key={t.id} onClick={() => onStart(t)}>
            <img
              src={assetUrl(t.cover ?? 'img/nivel-encefalo.webp')}
              alt=""
              loading="lazy"
              width={72}
              height={72}
            />
            <span>
              <strong>{t.n}</strong>
              <small>{t.sub}</small>
              <small>{t.steps.length} pasos →</small>
            </span>
          </button>
        ))}
      </div>
      <button className="na-course-link" onClick={onCourse}>
        Explorar el curso completo <span>34 unidades →</span>
      </button>
      <p className="na-learn__draft">Borrador · sin revisión experta</p>
    </section>
  );
}
