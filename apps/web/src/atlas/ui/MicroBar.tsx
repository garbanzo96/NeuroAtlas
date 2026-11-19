import { useEffect, useRef } from 'react';
import { TransmitterControls } from '../micro/TransmitterScene';
import { MICRO_VARIANTS } from '../micro/variants';
import { useAtlas } from '../store';

/** Selector de variantes de la escena micro activa (tipo de neurona, de sinapsis…). */
export function MicroBar() {
  const level = useAtlas((s) => s.level);
  const variant = useAtlas((s) => s.variant);
  const setVariant = useAtlas((s) => s.setVariant);
  const bar = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const container = bar.current;
    const active = container?.querySelector<HTMLElement>('[aria-checked="true"]');
    if (container && active) {
      container.scrollLeft = active.offsetLeft + active.offsetWidth - container.clientWidth + 8;
    }
  }, [level, variant]);
  const list = MICRO_VARIANTS[level];
  if (!list?.length) return null;
  const current = variant ?? list[0]!.id;
  return (
    <>
      <div
        className="na-microbar"
        ref={bar}
        role="radiogroup"
        aria-label="Variantes de la escena"
        key={level}
      >
        {list.map((v) => (
          <button
            key={v.id}
            type="button"
            role="radio"
            aria-checked={v.id === current}
            onClick={() => setVariant(v.id)}
          >
            {v.label}
          </button>
        ))}
      </div>
      {level === 'sinapsis' && current === 'transmisores' && <TransmitterControls />}
    </>
  );
}
