import { type MobileTab, useAppStore } from '../state/store';

const TABS: Array<{ id: MobileTab; label: string }> = [
  { id: 'explore', label: 'Explorar' },
  { id: 'viewer', label: 'Visor' },
  { id: 'info', label: 'Ficha' },
  { id: 'panel', label: 'Lección / experimento' },
];

/** Pestañas para pantallas estrechas; la selección se conserva entre pestañas. */
export function MobileTabs() {
  const tab = useAppStore((s) => s.mobileTab);
  const setTab = useAppStore((s) => s.setMobileTab);
  return (
    <div className="na-tabs" role="tablist" aria-label="Secciones">
      {TABS.map((t) => (
        <button
          key={t.id}
          type="button"
          role="tab"
          aria-selected={tab === t.id}
          className={tab === t.id ? 'is-active' : undefined}
          onClick={() => setTab(t.id)}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
