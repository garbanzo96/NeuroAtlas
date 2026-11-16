import { assetUrl } from '../data';
import { LEVELS, type LevelId, levelIndex } from '../levels';
import { useAtlas } from '../store';

export function goToLevel(level: LevelId) {
  const s = useAtlas.getState();
  const target = LEVELS.find((l) => l.id === level)!;
  const from = LEVELS.find((l) => l.id === s.level)!;
  s.setPathway(null);
  if (target.scene === 'anatomy') {
    if (from.scene !== 'anatomy') s.setLevel(level);
    if (level === 'areas' && s.selected) s.command({ type: 'mesh', name: s.selected });
    else s.command({ type: 'level', level });
  } else {
    s.setLevel(level);
    s.setSheet('level');
  }
}

/** Escalera de niveles de organización: indica dónde está la cámara y permite subir o bajar. */
export function ScaleRail() {
  const level = useAtlas((s) => s.level);
  const idx = levelIndex(level);
  return (
    <nav className="na-rail" aria-label="Niveles de organización">
      <div className="na-rail__track" aria-hidden="true">
        <div className="na-rail__beam" style={{ '--i': idx } as React.CSSProperties} />
      </div>
      <ol>
        {LEVELS.map((l, i) => (
          <li key={l.id}>
            <button
              type="button"
              className="na-rail__step"
              aria-current={l.id === level ? 'step' : undefined}
              onClick={() => goToLevel(l.id)}
              title={`${l.name} · ${l.space} · tecla ${i + 1}`}
            >
              <span className="na-rail__dot" />
              <img
                className="na-rail__icon"
                src={assetUrl(`img/nivel-${l.id}.webp`)}
                alt=""
                loading="lazy"
                decoding="async"
              />
              <span className="na-rail__text">
                <span className="na-rail__name">{l.name}</span>
                <span className="na-rail__scale">
                  {l.space} <span aria-hidden="true">·</span> {l.time}
                </span>
              </span>
            </button>
          </li>
        ))}
      </ol>
      <button
        type="button"
        className="na-rail__sheet"
        onClick={() => useAtlas.getState().setSheet('level')}
      >
        Lámina del nivel
      </button>
    </nav>
  );
}
