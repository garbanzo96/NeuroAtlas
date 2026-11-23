import { Suspense, lazy, useEffect, useRef, useState } from 'react';
import { assetUrl, loadAtlasData } from './data';
import { LEVELS, levelIndex } from './levels';
import { useAtlas, type CameraCommand } from './store';
import { applyView, currentView, queryToView, viewToQuery, viewUrl } from './view';
import { TourIndex, type Tour } from './ui/TourIndex';
import { TourPlayer } from './ui/TourPlayer';
import { QuizPanel } from './quiz/QuizPanel';
import { CourseReader, type Course } from './ui/CourseReader';
import { ShareButton } from './ui/ShareButton';
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
  const tourState = useAtlas((s) => s.tour);
  const quiz = useAtlas((s) => s.quiz);
  const [tours, setTours] = useState<Tour[]>([]);
  const [course, setCourse] = useState<Course | null>(null);
  const [learn, setLearn] = useState<'index' | 'course' | null>(null);
  const [exploring, setExploring] = useState(false);
  const [credits, setCredits] = useState(false);
  const cameraPose = useRef<(() => CameraCommand | null) | null>(null);
  const labRef = useRef<string | null>(null);
  useEffect(() => {
    labRef.current = lab;
  }, [lab]);

  useEffect(() => {
    const exam = new URLSearchParams(location.search).get('examen');
    if (exam) useAtlas.getState().setQuiz({ mode: 'examen', target: exam });
    let unsubscribe = () => {};
    let timer: number | undefined;
    let cancelled = false;
    Promise.all([
      fetch(assetUrl('tours.json')).then((r) => {
        if (!r.ok) throw new Error('No se pudieron cargar los recorridos');
        return r.json() as Promise<{ tours: Tour[] }>;
      }),
      fetch(assetUrl('course.json')).then((r) => {
        if (!r.ok) throw new Error('No se pudo cargar el curso');
        return r.json() as Promise<Course>;
      }),
    ])
      .then(([t, c]) => {
        if (cancelled) return;
        setTours(t.tours);
        setCourse(c);
        const q = new URLSearchParams(location.search);
        const tour = t.tours.find((item) => item.id === q.get('recorrido'));
        const step = Number(q.get('etapa')) - 1;
        if (tour)
          useAtlas.getState().setTour({
            id: tour.id,
            step: Number.isInteger(step) && step >= 0 && step < tour.steps.length ? step : 0,
          });
      })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : String(e)));
    loadAtlasData()
      .then((d) => {
        if (cancelled) return;
        useAtlas.getState().setData(d);
        applyView(queryToView(window.location.search));
        let previous = viewToQuery({ ...currentView(), lab: labRef.current });
        unsubscribe = useAtlas.subscribe(() => {
          const next = viewToQuery({ ...currentView(), lab: labRef.current });
          if (next === previous) return;
          previous = next;
          window.clearTimeout(timer);
          timer = window.setTimeout(
            () =>
              history.replaceState(
                history.state,
                '',
                viewUrl({ ...currentView(), lab: labRef.current }),
              ),
            300,
          );
        });
      })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : String(e)));
    const onLab = (e: Event) => setLab((e as CustomEvent<string>).detail ?? 'hh');
    window.addEventListener('na:lab', onLab);
    return () => {
      cancelled = true;
      unsubscribe();
      window.clearTimeout(timer);
      window.removeEventListener('na:lab', onLab);
    };
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
          <Stage data={data} cameraPose={cameraPose} />
        </Suspense>
      ) : (
        <div className="na-boot" style={bootStyle}>
          Cargando el atlas…
        </div>
      )}
      <Warp />
      {quiz?.mode !== 'localizar' && <HoverLabel />}
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
            aria-pressed={!!learn || !!tourState}
            onClick={() => {
              if (tourState) {
                useAtlas.getState().setTour(null);
                const url = new URL(location.href);
                url.searchParams.delete('recorrido');
                url.searchParams.delete('etapa');
                history.replaceState(history.state, '', url);
                setExploring(false);
              }
              setLearn(learn ? null : 'index');
            }}
          >
            Aprender
          </button>
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
          {data && <ShareButton cameraPose={cameraPose} lab={lab} />}
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
      {data && !tourState && <PathwayPanel open={vias} onClose={() => setVias(false)} />}
      {(!tourState || exploring) && <InfoSheet />}
      {data && learn === 'index' && (
        <TourIndex
          tours={tours}
          onClose={() => setLearn(null)}
          onCourse={() => setLearn('course')}
          onQuiz={() => {
            setLearn(null);
            useAtlas.getState().setTour(null);
            useAtlas.getState().setQuiz({ mode: 'menu' });
          }}
          onStart={(tour) => {
            setLearn(null);
            useAtlas.getState().setTour({ id: tour.id, step: 0 });
          }}
        />
      )}
      {data && learn === 'course' && course && (
        <CourseReader
          course={course}
          onClose={() => setLearn(null)}
          onBack={() => setLearn('index')}
        />
      )}
      {data && tourState && tours.find((t) => t.id === tourState.id) && (
        <TourPlayer
          tour={tours.find((t) => t.id === tourState.id)!}
          exploring={exploring}
          onExplore={setExploring}
        />
      )}
      {data && quiz && <QuizPanel data={data} course={course} />}
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
