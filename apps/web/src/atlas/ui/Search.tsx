import { useEffect, useMemo, useRef, useState } from 'react';
import { useAtlas } from '../store';
import { activatePathway } from './PathwayPanel';

const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

interface Hit {
  kind: 'estructura' | 'vía';
  id: string;
  title: string;
  sub: string;
  hay: string;
}

/** Búsqueda de estructuras y vías (⌘K o /). */
export function Search() {
  const data = useAtlas((s) => s.data)!;
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [cursor, setCursor] = useState(0);
  const input = useRef<HTMLInputElement>(null);

  const index = useMemo<Hit[]>(() => {
    const meshNames = new Set([
      ...Object.keys(data.meshes.brain),
      ...Object.keys(data.meshes.body),
      ...Object.keys(data.meshes.nerves),
    ]);
    const hits: Hit[] = [];
    for (const [key, s] of Object.entries(data.structures)) {
      const mesh = [`${key}_L`, key, `${key}_R`].find((m) => meshNames.has(m));
      if (!mesh) continue;
      hits.push({
        kind: 'estructura',
        id: mesh,
        title: s.n,
        sub: s.la ?? '',
        hay: norm(`${s.n} ${s.la ?? ''}`),
      });
    }
    for (const p of data.pathways.pathways)
      hits.push({
        kind: 'vía',
        id: p.id,
        title: p.n,
        sub: p.sub ?? '',
        hay: norm(`${p.n} ${p.sub ?? ''}`),
      });
    return hits;
  }, [data]);

  const results = useMemo(() => {
    const t = norm(q.trim());
    if (!t) return [];
    return index
      .filter((h) => t.split(/\s+/).every((w) => h.hay.includes(w)))
      .sort((a, b) => Number(!a.hay.startsWith(t)) - Number(!b.hay.startsWith(t)))
      .slice(0, 8);
  }, [index, q]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = (e.target as HTMLElement)?.closest('input,textarea');
      if ((e.key === 'k' && (e.metaKey || e.ctrlKey)) || (e.key === '/' && !typing)) {
        e.preventDefault();
        input.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const choose = (h: Hit) => {
    const s = useAtlas.getState();
    if (h.kind === 'vía') activatePathway(h.id);
    else {
      s.setPathway(null);
      if (!['sistema', 'encefalo', 'areas'].includes(s.level)) s.setLevel('areas');
      s.select(h.id);
      s.command({ type: 'mesh', name: h.id });
    }
    setQ('');
    input.current?.blur();
  };

  return (
    <div className="na-search" data-open={open && results.length ? '' : undefined}>
      <input
        ref={input}
        type="search"
        placeholder="Buscar estructura o vía"
        aria-label="Buscar estructura o vía"
        value={q}
        onChange={(e) => (setQ(e.target.value), setCursor(0))}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') setCursor((c) => Math.min(c + 1, results.length - 1));
          else if (e.key === 'ArrowUp') setCursor((c) => Math.max(c - 1, 0));
          else if (e.key === 'Enter' && results[cursor]) choose(results[cursor]);
          else if (e.key === 'Escape') input.current?.blur();
          else return;
          e.preventDefault();
        }}
      />
      <kbd aria-hidden="true">/</kbd>
      {open && results.length > 0 && (
        <ul role="listbox" aria-label="Resultados">
          {results.map((h, i) => (
            <li key={h.kind + h.id} role="option" aria-selected={i === cursor}>
              <button type="button" onMouseDown={() => choose(h)} onMouseEnter={() => setCursor(i)}>
                <span>{h.title}</span>
                <small>
                  {h.kind}
                  {h.sub && ` · ${h.sub}`}
                </small>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
