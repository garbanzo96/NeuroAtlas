import { Suspense, lazy, useEffect, useRef, useState } from 'react';
import { assetUrl, loadAtlasData } from './data';
import { LEVELS, levelIndex } from './levels';
import { useAtlas } from './store';
import { Credits } from './ui/Credits';
import { Dock } from './ui/Dock';
import { HoverLabel } from './ui/HoverLabel';
import { InfoSheet } from './ui/InfoSheet';
import { MicroBar } from './ui/MicroBar';
import { OverlayBar } from './ui/OverlayBar';
import { PathwayPanel } from './ui/PathwayPanel';
import { ScaleRail, goToLevel } from './ui/ScaleRail';
import { Search } from './ui/Search';
import './atlas.css';

const Stage = lazy(() => import('./scene/Stage').then((m) => ({ default: m.Stage })));
const LabDrawer = lazy(() => import('./ui/LabDrawer').then((m) => ({ default: m.LabDrawer })));

const bootStyle = { backgroundImage: `url("${assetUrl('img/bg-carga.webp')}")` };

function LevelToast() {
  const level = useAtlas((s) => s.level);
  const l = LEVELS.find((x) => x.id === level)!;
  return (
    <div className="na-toast" key={level} aria-live="polite">
      <img
        className="na-toast__icon"
        src={assetUrl(`img/nivel-${level}.webp`)}
        alt=""
        loading="lazy"
        decoding="async"
      />
      <span className="na-toast__label">
        <span className="na-toast__n">{l.name}</span>
        <span className="na-toast__s">{l.space}</span>
      </span>
    </div>
  );
}

/** Destello de transición al cruzar entre escalas (zoom semántico o riel). */
function Warp() {
  const [w, setW] = useState<{ n: number; dir: number }>({ n: 0, dir: 1 });
  const level = useAtlas((s) => s.level);
  const family = LEVELS.find((l) => l.id === level)!.scene;
  const prev = useRef({ family, i: levelIndex(level) });
  useEffect(() => {
    const i = levelIndex(level);
    if (prev.current.family !== family)
      setW((x) => ({ n: x.n + 1, dir: i > prev.current.i ? 1 : -1 }));
    prev.current = { family, i };
  }, [family, level]);
  if (!w.n || matchMedia('(prefers-reduced-motion: reduce)').matches) return null;
  return (
    <div className="na-warp" key={w.n} data-dir={w.dir > 0 ? 'in' : 'out'} aria-hidden="true" />
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
        } else if (s.circuit) s.setCircuit(null);
        else if (s.pathway) s.setPathway(null);
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
  const circuit = useAtlas((s) => s.circuit);
  const [error, setError] = useState<string | null>(null);
  const [vias, setVias] = useState(false);
  const [lab, setLab] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);
  const [credits, setCredits] = useState(false);

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
      <div className="na-atlas na-boot" style={bootStyle} role="alert">
        <p>No se pudo cargar el atlas: {error}</p>
      </div>
    );

  const micro = LEVELS.find((l) => l.id === level)?.scene === 'micro';
  return (
    <div className="na-atlas" data-level={level} onPointerDown={() => setTouched(true)}>
      {data ? (
        <Suspense
          fallback={
            <div className="na-boot" style={bootStyle}>
              Encendiendo el atlas…
            </div>
          }
        >
          <Stage data={data} />
        </Suspense>
      ) : (
        <div className="na-boot" style={bootStyle}>
          Cargando el atlas…
        </div>
      )}
      <Warp />
      <HoverLabel />
      <div id="na-dive" className="na-dive" aria-hidden="true">
        <svg viewBox="0 0 44 44">
          <circle cx="22" cy="22" r="19" pathLength="1" />
        </svg>
        <span />
      </div>
      <header className="na-top">
        <a className="na-brand" href="./" aria-label="NeuroAtlas, inicio">
          <span className="na-brand__mark" aria-hidden="true" />
          Neuro<em>Atlas</em>
        </a>
        {data && <Search />}
        <nav className="na-actions" aria-label="Herramientas">
          <button
            type="button"
            aria-pressed={vias || !!pathway || !!circuit}
            onClick={() => setVias((v) => !v)}
          >
            Vías
          </button>
          <button
            type="button"
            aria-pressed={!!lab}
            onClick={() => setLab((l) => (l ? null : 'hh'))}
          >
            Laboratorio
          </button>
          <button type="button" onClick={() => setCredits(true)}>
            Créditos
          </button>
          <a href="?unidad" className="na-actions__link">
            Unidad curada
          </a>
        </nav>
      </header>
      <ScaleRail />
      <LevelToast />
      {data && !micro && (
        <>
          <Dock />
          <OverlayBar />
        </>
      )}
      {micro && <MicroBar />}
      {data && <PathwayPanel open={vias} onClose={() => setVias(false)} />}
      <InfoSheet />
      {credits && <Credits onClose={() => setCredits(false)} />}
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
