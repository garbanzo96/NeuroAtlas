import { type KeyboardEvent, useMemo, useRef, useState } from 'react';
import { useAppStore } from '../state/store';
import { ENTITY_TYPE } from './labels';

/**
 * Alternativa textual al visor: todas las entidades seleccionables de la escena, navegables con
 * teclado (↑/↓, Inicio/Fin, Enter). Incluye búsqueda en todo el paquete.
 */
export function EntityList() {
  const kb = useAppStore((s) => s.kb)!;
  const selection = useAppStore((s) => s.selection)!;
  const hovered = useAppStore((s) => s.hoveredEntityId);
  const selectEntity = useAppStore((s) => s.selectEntity);
  const selectFromSearch = useAppStore((s) => s.selectFromSearch);
  const setHovered = useAppStore((s) => s.setHovered);
  const [query, setQuery] = useState('');
  const listRef = useRef<HTMLUListElement>(null);

  const sceneEntities = useMemo(() => kb.sceneEntities(selection.sceneId), [kb, selection.sceneId]);
  const results = useMemo(() => (query.trim() ? kb.searchEntities(query, 12) : []), [kb, query]);

  const onListKeyDown = (event: KeyboardEvent<HTMLUListElement>) => {
    const buttons = [...(listRef.current?.querySelectorAll<HTMLButtonElement>('button') ?? [])];
    const index = buttons.indexOf(document.activeElement as HTMLButtonElement);
    let next = -1;
    if (event.key === 'ArrowDown') next = Math.min(buttons.length - 1, index + 1);
    else if (event.key === 'ArrowUp') next = Math.max(0, index - 1);
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = buttons.length - 1;
    if (next >= 0) {
      event.preventDefault();
      buttons[next]?.focus();
    }
  };

  return (
    <section className="na-panel" aria-labelledby="na-entities-title">
      <h2 id="na-entities-title">Estructuras de la escena</h2>
      <div className="na-search">
        <label htmlFor="na-search">Buscar en todo el atlas</label>
        <input
          id="na-search"
          type="search"
          placeholder="p. ej. quiasma, NGL, axón…  (atajo: /)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoComplete="off"
        />
        {query.trim() && (
          <ul className="na-search__results" aria-label="Resultados de búsqueda">
            {results.length === 0 && <li className="na-muted">Sin resultados.</li>}
            {results.map((entity) => {
              const scenes = kb.scenesContainingEntity(entity.id);
              const elsewhere = !scenes.some((s) => s.sceneId === selection.sceneId);
              return (
                <li key={entity.id}>
                  <button
                    type="button"
                    onClick={() => {
                      selectFromSearch(entity.id);
                      setQuery('');
                    }}
                  >
                    <span>{entity.label.es}</span>
                    <span className="na-muted">
                      {ENTITY_TYPE[entity.type]}
                      {elsewhere && scenes[0] ? ` · en «${scenes[0].title.es}»` : ''}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      <ul className="na-entities" ref={listRef} onKeyDown={onListKeyDown}>
        {sceneEntities.map((entity) => {
          const selected = selection.selectedEntityIds.includes(entity.id);
          return (
            <li key={entity.id}>
              <button
                type="button"
                aria-pressed={selected}
                className={`na-entity${selected ? ' is-selected' : ''}${hovered === entity.id ? ' is-hovered' : ''}`}
                onClick={() => selectEntity(selected ? null : entity.id)}
                onMouseEnter={() => setHovered(entity.id)}
                onMouseLeave={() => setHovered(null)}
                onFocus={() => setHovered(entity.id)}
                onBlur={() => setHovered(null)}
              >
                <span>{entity.label.es}</span>
                <span className="na-muted">{ENTITY_TYPE[entity.type]}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
