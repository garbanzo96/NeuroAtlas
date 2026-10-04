import { divergingColor } from './scales';

export interface CategoricalLegendItem {
  key: string;
  color: string;
  label: string;
}

/** Leyenda categórica: color siempre acompañado de texto. */
export function CategoricalLegend({
  title,
  items,
}: {
  title: string;
  items: readonly CategoricalLegendItem[];
}) {
  if (items.length === 0) return null;
  return (
    <div className="na-legend" role="group" aria-label={title}>
      <p className="na-legend__title">{title}</p>
      <ul>
        {items.map((item) => (
          <li key={item.key}>
            <span className="na-swatch" style={{ background: item.color }} aria-hidden="true" />
            {item.label}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Barra de color continua para un mapeo variable → color, con dominio y unidades. */
export function ColorScaleLegend({
  title,
  domain,
  units,
  description,
  value,
}: {
  title: string;
  domain: [number, number];
  units: string;
  description: string;
  value?: number | null;
}) {
  const stops = Array.from({ length: 11 }, (_, i) => {
    const v = domain[0] + ((domain[1] - domain[0]) * i) / 10;
    return `${divergingColor(v, domain)} ${i * 10}%`;
  });
  const marker =
    value != null
      ? Math.min(100, Math.max(0, ((value - domain[0]) / (domain[1] - domain[0])) * 100))
      : null;
  return (
    <div className="na-colorscale" role="group" aria-label={title}>
      <p className="na-legend__title">{title}</p>
      <div
        className="na-colorscale__bar"
        style={{ background: `linear-gradient(to right, ${stops.join(', ')})` }}
      >
        {marker !== null && (
          <span className="na-colorscale__marker" style={{ left: `${marker}%` }} />
        )}
      </div>
      <div className="na-colorscale__labels">
        <span>
          {domain[0]} {units}
        </span>
        {value != null && (
          <span>
            actual: {value.toFixed(1)} {units}
          </span>
        )}
        <span>
          {domain[1]} {units}
        </span>
      </div>
      <p className="na-colorscale__desc">{description}</p>
    </div>
  );
}
