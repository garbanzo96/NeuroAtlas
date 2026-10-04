import { type KeyboardEvent, type PointerEvent, useId, useMemo, useRef } from 'react';
import { extent, linearScale, minMaxDecimate, nearestIndex, niceTicks } from './scales';

export interface Series {
  id: string;
  label: string;
  units: string;
  values: readonly number[];
  color: string;
  dashed?: boolean;
}

export interface TimeSeriesChartProps {
  title: string;
  time: readonly number[];
  timeUnits: string;
  series: readonly Series[];
  yLabel: string;
  yDomain?: [number, number];
  /** Instante marcado (en las unidades de `time`). */
  cursor?: number | null;
  onCursorChange?: (t: number) => void;
  height?: number;
}

const WIDTH = 640;
const MARGIN = { top: 12, right: 16, bottom: 34, left: 56 };

/**
 * Gráfico de líneas SVG accesible: ejes con unidades, leyenda textual, cursor manipulable
 * con puntero o teclado (←/→, Shift para pasos largos) y resumen numérico para lectores de pantalla.
 */
export function TimeSeriesChart({
  title,
  time,
  timeUnits,
  series,
  yLabel,
  yDomain,
  cursor,
  onCursorChange,
  height = 200,
}: TimeSeriesChartProps) {
  const titleId = useId();
  const svgRef = useRef<SVGSVGElement>(null);
  const innerW = WIDTH - MARGIN.left - MARGIN.right;
  const innerH = height - MARGIN.top - MARGIN.bottom;

  const xDomain = useMemo<[number, number]>(
    () => (time.length ? [time[0]!, time[time.length - 1]!] : [0, 1]),
    [time],
  );
  const yDom = useMemo<[number, number]>(() => {
    if (yDomain) return yDomain;
    const all = series.flatMap((s) => extent(s.values));
    const [lo, hi] = extent(all);
    const pad = (hi - lo) * 0.08 || 1;
    return [lo - pad, hi + pad];
  }, [series, yDomain]);

  const x = linearScale(xDomain, [0, innerW]);
  const y = linearScale(yDom, [innerH, 0]);

  const paths = useMemo(
    () =>
      series.map((s) => {
        const d = minMaxDecimate(time, s.values, 600);
        let path = '';
        for (let i = 0; i < d.x.length; i++) {
          path += `${i === 0 ? 'M' : 'L'}${x(d.x[i]!).toFixed(1)},${y(d.y[i]!).toFixed(1)}`;
        }
        return { s, path };
      }),
    // x/y dependen de dominios ya incluidos
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [series, time, xDomain[0], xDomain[1], yDom[0], yDom[1], innerW, innerH],
  );

  const xTicks = niceTicks(xDomain[0], xDomain[1], 6);
  const yTicks = niceTicks(yDom[0], yDom[1], 4);

  const cursorIndex = cursor != null ? nearestIndex(time, cursor) : -1;
  const cursorX = cursorIndex >= 0 ? x(time[cursorIndex]!) : null;

  const setFromPointer = (event: PointerEvent<SVGSVGElement>) => {
    if (!onCursorChange || !svgRef.current || time.length === 0) return;
    const rect = svgRef.current.getBoundingClientRect();
    const px = ((event.clientX - rect.left) / rect.width) * WIDTH - MARGIN.left;
    const t = xDomain[0] + (Math.min(Math.max(px, 0), innerW) / innerW) * (xDomain[1] - xDomain[0]);
    onCursorChange(time[nearestIndex(time, t)]!);
  };

  const onKeyDown = (event: KeyboardEvent<SVGSVGElement>) => {
    if (!onCursorChange || time.length === 0) return;
    const step = (xDomain[1] - xDomain[0]) / (event.shiftKey ? 20 : 200);
    const current = cursor ?? xDomain[0];
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      event.preventDefault();
      const t = current + (event.key === 'ArrowRight' ? step : -step);
      onCursorChange(time[nearestIndex(time, Math.min(Math.max(t, xDomain[0]), xDomain[1]))]!);
    }
  };

  const summary = series
    .map((s) => {
      const [lo, hi] = extent(s.values);
      return `${s.label}: mínimo ${lo.toFixed(2)} ${s.units}, máximo ${hi.toFixed(2)} ${s.units}`;
    })
    .join('; ');

  return (
    <figure className="na-chart">
      <figcaption id={titleId} className="na-chart__title">
        {title}
      </figcaption>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${WIDTH} ${height}`}
        role="img"
        aria-labelledby={titleId}
        aria-describedby={`${titleId}-desc`}
        tabIndex={onCursorChange ? 0 : -1}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          setFromPointer(e);
        }}
        onPointerMove={(e) => {
          if (e.buttons === 1) setFromPointer(e);
        }}
        onKeyDown={onKeyDown}
        className="na-chart__svg"
      >
        <desc id={`${titleId}-desc`}>
          {`Eje horizontal: tiempo (${timeUnits}). Eje vertical: ${yLabel}. ${summary}. ${
            onCursorChange ? 'Usa las flechas izquierda y derecha para mover el cursor.' : ''
          }`}
        </desc>
        <g transform={`translate(${MARGIN.left},${MARGIN.top})`}>
          {yTicks.map((t) => (
            <g key={`y${t}`} transform={`translate(0,${y(t)})`}>
              <line x2={innerW} className="na-chart__grid" />
              <text x={-6} dy="0.32em" textAnchor="end" className="na-chart__tick">
                {t}
              </text>
            </g>
          ))}
          {xTicks.map((t) => (
            <g key={`x${t}`} transform={`translate(${x(t)},${innerH})`}>
              <line y2={5} className="na-chart__axis" />
              <text y={18} textAnchor="middle" className="na-chart__tick">
                {t}
              </text>
            </g>
          ))}
          <line y1={innerH} y2={innerH} x2={innerW} className="na-chart__axis" />
          <text x={innerW / 2} y={innerH + 31} textAnchor="middle" className="na-chart__label">
            {`tiempo (${timeUnits})`}
          </text>
          <text
            transform={`translate(${-44},${innerH / 2}) rotate(-90)`}
            textAnchor="middle"
            className="na-chart__label"
          >
            {yLabel}
          </text>
          {paths.map(({ s, path }) => (
            <path
              key={s.id}
              d={path}
              fill="none"
              stroke={s.color}
              strokeWidth={1.6}
              strokeDasharray={s.dashed ? '5 3' : undefined}
              vectorEffect="non-scaling-stroke"
            />
          ))}
          {cursorX !== null && (
            <line x1={cursorX} x2={cursorX} y2={innerH} className="na-chart__cursor" />
          )}
        </g>
      </svg>
      <ul className="na-chart__legend">
        {series.map((s) => (
          <li key={s.id}>
            <span
              className={`na-swatch${s.dashed ? ' na-swatch--dashed' : ''}`}
              style={{ background: s.dashed ? undefined : s.color, borderColor: s.color }}
              aria-hidden="true"
            />
            {s.label} ({s.units})
            {cursorIndex >= 0 && s.values[cursorIndex] !== undefined && (
              <span className="na-chart__value"> = {s.values[cursorIndex]!.toFixed(2)}</span>
            )}
          </li>
        ))}
      </ul>
    </figure>
  );
}
