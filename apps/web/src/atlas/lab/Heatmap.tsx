import { useEffect, useRef } from 'react';

export function Heatmap({ values, n }: { values: Float32Array; n: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const draw = () => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const width = canvas.clientWidth,
        height = canvas.clientHeight,
        dpr = window.devicePixelRatio || 1;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const samples = values.length / n;
      const style = getComputedStyle(canvas);
      const cold = style.getPropertyValue('--na-aff').trim(),
        hot = style.getPropertyValue('--na-eff').trim();
      for (let t = 0; t < samples; t++)
        for (let j = 0; j < n; j++) {
          const fraction = Math.max(0, Math.min(1, (values[t * n + j]! + 80) / 120));
          ctx.fillStyle = cold;
          ctx.globalAlpha = 1;
          ctx.fillRect(
            (t * width) / samples,
            ((n - 1 - j) * height) / n,
            Math.ceil(width / samples),
            Math.ceil(height / n),
          );
          ctx.fillStyle = hot;
          ctx.globalAlpha = fraction;
          ctx.fillRect(
            (t * width) / samples,
            ((n - 1 - j) * height) / n,
            Math.ceil(width / samples),
            Math.ceil(height / n),
          );
        }
      ctx.globalAlpha = 1;
    };
    const observer = new ResizeObserver(draw);
    observer.observe(canvas);
    draw();
    return () => observer.disconnect();
  }, [values, n]);
  return (
    <figure className="na-lab-plot">
      <canvas ref={ref} role="img" aria-label="Mapa espacio-tiempo del voltaje del axón" />
      <figcaption>Tiempo → · compartimento ↑ · cian: voltaje bajo; ámbar: voltaje alto</figcaption>
    </figure>
  );
}
