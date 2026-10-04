import { KnowledgeBase } from '@neuroatlas/knowledge';
import { useEffect, useState } from 'react';
import { EntityList } from './components/EntityList';
import { EvidencePanel } from './components/EvidencePanel';
import { Header } from './components/Header';
import { LayerPanel } from './components/LayerPanel';
import { LessonPanel } from './components/LessonPanel';
import { MobileTabs } from './components/MobileTabs';
import { ScaleNavigator } from './components/ScaleNavigator';
import { ShortcutsDialog } from './components/ShortcutsDialog';
import { SimulationPanel } from './components/SimulationPanel';
import { Viewer } from './components/Viewer';
import { loadRelease } from './data/pack-loader';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useAppStore } from './state/store';
import { decodeUrlState, encodeUrlState } from './state/url';

type LoadState = { status: 'loading' } | { status: 'ready' } | { status: 'error'; message: string };

function prefersReducedMotion(): boolean {
  return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Mantiene la URL sincronizada con escena, selección, capas, lección y protocolo. */
function useUrlSync() {
  useEffect(
    () =>
      useAppStore.subscribe((state) => {
        if (!state.kb || !state.selection) return;
        const scene = state.kb.scene(state.selection.sceneId);
        const query = encodeUrlState({
          release: state.kb.release.id,
          selection: state.selection,
          lesson: state.lesson,
          simulation: scene?.simulation ? state.protocol : null,
        });
        const url = `${location.pathname}?${query}`;
        if (url === `${location.pathname}${location.search}`) return;
        try {
          history.replaceState(null, '', url);
        } catch {
          // Marcos restringidos (p. ej. vistas previas incrustadas) pueden prohibirlo: el estado sigue en memoria.
        }
      }),
    [],
  );
}

export function App() {
  const [load, setLoad] = useState<LoadState>({ status: 'loading' });
  const initialize = useAppStore((s) => s.initialize);
  const selection = useAppStore((s) => s.selection);
  const kb = useAppStore((s) => s.kb);
  const mobileTab = useAppStore((s) => s.mobileTab);
  const lesson = useAppStore((s) => s.lesson);

  useEffect(() => {
    let cancelled = false;
    loadRelease()
      .then(({ pack, assetPaths }) => {
        if (cancelled) return;
        const knowledge = new KnowledgeBase(pack);
        const decoded = decodeUrlState(knowledge, location.search);
        initialize({
          kb: knowledge,
          assetPaths,
          selection: decoded.selection,
          lesson: decoded.lesson,
          protocol: decoded.simulation,
          warnings: decoded.warnings,
          reducedMotion: prefersReducedMotion(),
        });
        setLoad({ status: 'ready' });
      })
      .catch((error: unknown) => {
        if (!cancelled)
          setLoad({
            status: 'error',
            message: error instanceof Error ? error.message : String(error),
          });
      });
    return () => {
      cancelled = true;
    };
  }, [initialize]);

  useUrlSync();
  useKeyboardShortcuts();

  if (load.status === 'loading') {
    return (
      <div className="na-splash" role="status">
        Cargando el paquete de conocimiento…
      </div>
    );
  }
  if (load.status === 'error' || !kb || !selection) {
    return (
      <div className="na-splash na-splash--error" role="alert">
        <h1>No se pudo cargar NeuroAtlas</h1>
        <p>{load.status === 'error' ? load.message : 'Estado inicial incompleto.'}</p>
      </div>
    );
  }

  const scene = kb.scene(selection.sceneId)!;
  return (
    <div className="na-app" data-mobile-tab={mobileTab}>
      <a className="na-skip" href="#na-info">
        Saltar a la ficha científica
      </a>
      <Header />
      <MobileTabs />
      <nav className="na-explore" aria-label="Niveles, capas y estructuras" data-region="explore">
        <ScaleNavigator />
        <LayerPanel />
        <EntityList />
      </nav>
      <main className="na-stage" data-region="viewer">
        <Viewer />
      </main>
      <section className="na-bottom" aria-label="Lección y experimentos" data-region="panel">
        {lesson && <LessonPanel />}
        {scene.simulation ? (
          <SimulationPanel key={scene.sceneId} />
        ) : (
          !lesson && (
            <p className="na-muted na-bottom__empty">
              Esta escena no tiene experimento asociado. Inicia el recorrido guiado o ve a la escena
              de excitabilidad para ejecutar una simulación.
            </p>
          )
        )}
      </section>
      <aside
        id="na-info"
        className="na-info"
        aria-label="Ficha científica"
        data-region="info"
        tabIndex={-1}
      >
        <EvidencePanel />
      </aside>
      <ShortcutsDialog />
    </div>
  );
}
