import type { ModelSpecification } from '@neuroatlas/schemas';
import { useAppStore } from '../state/store';
import { STATUS } from './labels';

/** Ficha del modelo: ecuaciones, parámetros con procedencia, supuestos y límites. */
export function ModelCard({ spec }: { spec: ModelSpecification }) {
  const kb = useAppStore((s) => s.kb)!;
  return (
    <details className="na-model">
      <summary>
        Ficha del modelo: ecuaciones, parámetros y límites{' '}
        <span className={`na-badge na-badge--status-${spec.status}`}>{STATUS[spec.status]}</span>
      </summary>
      <p>{spec.description.es}</p>
      <p className="na-muted">{spec.conventions.es}</p>
      <h4>Ecuaciones (notación LaTeX)</h4>
      <ul className="na-equations">
        {spec.equations.map((eq) => (
          <li key={eq.id}>
            <code>{eq.latex}</code>
            <span className="na-muted"> — {eq.description.es}</span>
          </li>
        ))}
      </ul>
      <h4>Parámetros</h4>
      <table className="na-table">
        <thead>
          <tr>
            <th scope="col">Símbolo</th>
            <th scope="col">Valor</th>
            <th scope="col">Unidades</th>
            <th scope="col">Fuente</th>
            <th scope="col">Localizador</th>
          </tr>
        </thead>
        <tbody>
          {spec.parameters.map((p) => (
            <tr key={p.id}>
              <th scope="row" title={p.description.es}>
                {p.symbol}
              </th>
              <td>{p.value}</td>
              <td>{p.units}</td>
              <td>{kb.source(p.sourceId)?.title ?? p.sourceId}</td>
              <td>{p.locator === 'pending' ? 'pendiente' : p.locator}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <h4>Solver</h4>
      <p>
        {spec.solver.method.toUpperCase()}, dt por defecto {spec.solver.defaultDt} ms (máximo{' '}
        {spec.solver.maxDt} ms). {spec.solver.notes.es}
      </p>
      <h4>Supuestos</h4>
      <ul>
        {spec.assumptions.map((a) => (
          <li key={a.es}>{a.es}</li>
        ))}
      </ul>
      <h4>Validez y límites</h4>
      <p>{spec.validity.es}</p>
      <ul>
        {spec.limitations.map((l) => (
          <li key={l.es}>{l.es}</li>
        ))}
      </ul>
    </details>
  );
}
