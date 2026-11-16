import { Suspense, lazy, useEffect, useState } from 'react';
import { loadAtlasData } from './data';
import { LEVELS, levelIndex } from './levels';
import { useAtlas } from './store';
import { Dock } from './ui/Dock';
import { HoverLabel } from './ui/HoverLabel';
import { InfoSheet } from './ui/InfoSheet';
import { PathwayPanel } from './ui/PathwayPanel';
import { ScaleRail, goToLevel } from './ui/ScaleRail';
import { Search } from './ui/Search';
import './atlas.css';

const Stage = lazy(() => import('./scene/Stage').then((m) => ({ default: m.Stage })));
const LabDrawer = lazy(() => import('./ui/LabDrawer').then((m) => ({ default: m.LabDrawer })));

function LevelToast() {
  const level = useAtlas((s) => s.level);
  const l = LEVELS.find((x) => x.id === level)!;
  return (
    <div className="na-toast" key={level} aria-live="polite">
      <span className="na-toast__n">{l.name}</span>
      <span className="na-toast__s">{l.space}</span>
    </div>
  );
}

function useKeys(toggleVias: () => void) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.closest('input,textarea,select') || e.metaKey || e.ctrlKey)
        return;
      const s = useAtlas.getState();
      const i = levelIndex(s.level);
      if (e.key >= '1' && e.key <= '7') goToLevel(LEVELS[Number(e.key) - 1]!.id);
      else if (e.key === '[' && i > 0) goToLevel(LEVELS[i - 1]!.id);
      else if (e.key === ']' && i < LEVELS.length - 1) goToLevel(LEVELS[i + 1]!.id);
      else if (e.key === 'Escape') {
        if (s.sheet) {
          s.setSheet(null);
          s.select(null);
        } else if (s.pathway) s.setPathway(null);
      } else if (e.key === 'v') toggleVias();
      else if (e.key === 'i') s.setSheet(s.sheet === 'level' ? null : 'level');
      else if (e.key === 'h') s.command({ type: 'home' });
      else return;
      e.preventDefault();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [toggleVias]);
}

export function AtlasApp() {
  const data = useAtlas((s) => s.data);
  const level = useAtlas((s) => s.level);
  const pathway = useAtlas((s) => s.pathway);
  const [error, setError] = useState<string | null>(null);
  const [vias, setVias] = useState(false);
  const [lab, setLab] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    loadAtlasData()
      .then((d) => useAtlas.getState().setData(d))
      .catch((e: unknown) => setError(e instanceof Error ? e.message : String(e)));
    const onLab = (e: Event) => setLab((e as CustomEvent<string>).detail ?? 'hh');
    window.addEventListener('na:lab', onLab);
    return () => window.removeEventListener('na:lab', onLab);
  }, []);
  useKeys(() => setVias((v) => !v));

  if (error)
    return (
      <div className="na-atlas na-boot" role="alert">
        <p>No se pudo cargar el atlas: {error}</p>
      </div>
    );

  const micro = LEVELS.find((l) => l.id === level)?.scene === 'micro';
  return (
    <div className="na-atlas" data-level={level} onPointerDown={() => setTouched(true)}>
      {data ? (
        <Suspense fallback={<div className="na-boot">Encendiendo el atlas…</div>}>
          <Stage data={data} />
        </Suspense>
      ) : (
        <div className="na-boot">Cargando el atlas…</div>
      )}
      <HoverLabel />
      <header className="na-top">
        <a className="na-brand" href="./" aria-label="NeuroAtlas, inicio">
          <span className="na-brand__mark" aria-hidden="true" />
          Neuro<em>Atlas</em>
        </a>
        {data && <Search />}
        <nav className="na-actions" aria-label="Herramientas">
          <button type="button" aria-pressed={vias || !!pathway} onClick={() => setVias((v) => !v)}>
            Vías
          </button>
          <button
            type="button"
            aria-pressed={!!lab}
            onClick={() => setLab((l) => (l ? null : 'hh'))}
          >
            Laboratorio
          </button>
          <a href="?unidad" className="na-actions__link">
            Unidad curada
          </a>
        </nav>
      </header>
      <ScaleRail />
      <LevelToast />
      {data && !micro && <Dock />}
      {data && <PathwayPanel open={vias} onClose={() => setVias(false)} />}
      <InfoSheet />
      {lab && (
        <Suspense fallback={null}>
          <LabDrawer initial={lab} onClose={() => setLab(null)} />
        </Suspense>
      )}
      {!touched && !micro && (
        <p className="na-hint">
          Arrastra para rotar · rueda para acercarte donde apunta el cursor · clic para abrir la
          lámina
        </p>
      )}
    </div>
  );
}
