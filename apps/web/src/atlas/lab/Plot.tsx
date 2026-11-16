import { useEffect, useRef, useState } from 'react';

type Values = ArrayLike<number>;
export type Series = { name: string; x: Values; y: Values; color?: string };
export function Plot({
  series,
  xLabel,
  yLabel,
  mode = 'line',
}: {
  series: Series[];
  xLabel: string;
  yLabel: string;
  mode?: 'line' | 'points' | 'bars';
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [cursor, setCursor] = useState<{ x: number; y: number } | null>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let frame = 0,
      start = 0;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const draw = (now: number) => {
      if (!start) start = now;
      const width = canvas.clientWidth,
        height = canvas.clientHeight,
        dpr = window.devicePixelRatio || 1;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const style = getComputedStyle(canvas);
      const color = (name: string) => style.getPropertyValue(name).trim();
      const allX = series.flatMap((s) => Array.from(s.x)),
        allY = series.flatMap((s) => Array.from(s.y)).filter(Number.isFinite);
      if (!allX.length || !allY.length) return;
      const xmin = Math.min(...allX);
      let xmax = Math.max(...allX),
        ymin = Math.min(...allY),
        ymax = Math.max(...allY);
      if (xmin === xmax) xmax++;
      if (ymin === ymax) {
        ymin--;
        ymax++;
      }
      const left = 52,
        right = width - 15,
        top = 12,
        bottom = height - 36;
      const px = (x: number) => left + ((x - xmin) / (xmax - xmin)) * (right - left),
        py = (y: number) => bottom - ((y - ymin) / (ymax - ymin)) * (bottom - top);
      ctx.font = '10px monospace';
      ctx.fillStyle = color('--na-fg2');
      ctx.strokeStyle = color('--na-line');
      for (let i = 0; i <= 4; i++) {
        const x = left + (i * (right - left)) / 4,
          y = bottom - (i * (bottom - top)) / 4;
        ctx.beginPath();
        ctx.moveTo(x, top);
        ctx.lineTo(x, bottom);
        ctx.moveTo(left, y);
        ctx.lineTo(right, y);
        ctx.stroke();
        ctx.fillText((xmin + (i * (xmax - xmin)) / 4).toPrecision(3), x - 10, bottom + 13);
        ctx.fillText((ymin + (i * (ymax - ymin)) / 4).toPrecision(3), 2, y + 3);
      }
      ctx.fillText(xLabel, (left + right) / 2, height - 4);
      ctx.fillText(yLabel, left, 10);
      const progress = reduced ? 1 : 1 - Math.pow(1 - Math.min(1, (now - start) / 500), 3);
      series.forEach((s, index) => {
        ctx.strokeStyle = color(s.color || ['--na-aff', '--na-eff', '--na-mod'][index % 3]!);
        ctx.fillStyle = ctx.strokeStyle;
        ctx.beginPath();
        const limit = Math.max(1, Math.floor(s.x.length * progress));
        for (let i = 0; i < limit; i++) {
          const x = s.x[i],
            y = s.y[i];
          if (x === undefined || y === undefined || !Number.isFinite(y)) continue;
          if (mode === 'points') {
            ctx.moveTo(px(x) + 2, py(y));
            ctx.arc(px(x), py(y), 2, 0, 2 * Math.PI);
          } else if (mode === 'bars') {
            ctx.moveTo(px(x), py(0));
            ctx.lineTo(px(x), py(y));
          } else if (i === 0) ctx.moveTo(px(x), py(y));
          else ctx.lineTo(px(x), py(y));
        }
        if (mode === 'points') ctx.fill();
        else ctx.stroke();
      });
      if (
        cursor &&
        cursor.x >= left &&
        cursor.x <= right &&
        cursor.y >= top &&
        cursor.y <= bottom
      ) {
        ctx.strokeStyle = color('--na-fg3');
        ctx.beginPath();
        ctx.moveTo(cursor.x, top);
        ctx.lineTo(cursor.x, bottom);
        ctx.moveTo(left, cursor.y);
        ctx.lineTo(right, cursor.y);
        ctx.stroke();
        ctx.fillStyle = color('--na-fg');
        ctx.fillText(
          `${(xmin + ((cursor.x - left) / (right - left)) * (xmax - xmin)).toPrecision(4)}, ${(ymin + ((bottom - cursor.y) / (bottom - top)) * (ymax - ymin)).toPrecision(4)}`,
          left + 4,
          top + 14,
        );
      }
      if (progress < 1) frame = requestAnimationFrame(draw);
    };
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(frame);
      start = 0;
      frame = requestAnimationFrame(draw);
    });
    observer.observe(canvas);
    frame = requestAnimationFrame(draw);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [series, xLabel, yLabel, cursor, mode]);
  return (
    <figure className="na-lab-plot">
      <canvas
        ref={ref}
        role="img"
        aria-label={`${yLabel} frente a ${xLabel}: ${series.map((s) => s.name).join(', ')}`}
        onMouseMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          setCursor({ x: e.clientX - r.left, y: e.clientY - r.top });
        }}
        onMouseLeave={() => setCursor(null)}
      />
      <figcaption>{series.map((s) => s.name).join(' · ')}</figcaption>
    </figure>
  );
}
export function RasterPlot({
  times,
  ids,
  ne,
}: {
  times: ArrayLike<number>;
  ids: ArrayLike<number>;
  ne: number;
}) {
  const excitatory: number[] = [],
    inhibitory: number[] = [],
    exTime: number[] = [],
    inTime: number[] = [];
  for (let i = 0; i < times.length; i++) {
    const id = ids[i]!,
      time = times[i]!;
    (id < ne ? excitatory : inhibitory).push(id);
    (id < ne ? exTime : inTime).push(time);
  }
  return (
    <Plot
      xLabel="Tiempo (ms)"
      yLabel="Neurona"
      mode="points"
      series={[
        { name: 'Excitadoras', x: exTime, y: excitatory },
        { name: 'Inhibidoras', x: inTime, y: inhibitory },
      ]}
    />
  );
}
