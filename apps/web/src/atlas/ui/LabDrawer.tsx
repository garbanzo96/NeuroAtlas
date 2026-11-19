import { useEffect, useState } from 'react';
import { Lab } from '../lab/Lab';
import { useAtlas } from '../store';
import { loadLevels } from './InfoSheet';

/** Cajón inferior con los simuladores del nivel actual. */
export function LabDrawer({ initial, onClose }: { initial: string; onClose(): void }) {
  const [closing, setClosing] = useState(false);
  useEffect(() => {
    if (!closing) return;
    const timeout = window.setTimeout(onClose, 240);
    return () => window.clearTimeout(timeout);
  }, [closing, onClose]);
  const level = useAtlas((s) => s.level);
  const [models, setModels] = useState<string[]>([initial]);
  useEffect(() => {
    void loadLevels().then((docs) => {
      const m = docs.find((d) => d.id === level)?.models ?? [];
      setModels(m.length ? m : ['hh', 'izhikevich']);
    });
  }, [level]);
  return (
    <section className="na-lab-drawer" data-closing={closing || undefined} aria-label="Laboratorio">
      <header>
        <p className="na-kicker">Laboratorio · {models.length} modelos para este nivel</p>
        <button
          type="button"
          className="na-sheet__close"
          onClick={() => setClosing(true)}
          aria-label="Cerrar laboratorio"
        >
          ×
        </button>
      </header>
      <div className="na-lab-drawer__body">
        <Lab
          key={models.join()}
          models={models}
          initial={models.includes(initial) ? initial : models[0]}
        />
      </div>
    </section>
  );
}
