import { useEffect, useState } from 'react';
import { assetUrl, baseKey, sideOf } from '../data';
import { LEVELS } from '../levels';
import { useAtlas } from '../store';
import { goToLevel } from './ScaleRail';

interface LevelDoc {
  id: string;
  title: string;
  kicker: string;
  space: string;
  time: string;
  lead: string;
  sections: { h: string; p: string; items?: string[] }[];
  types?: { name: string; where?: string; traits?: string; role?: string }[];
  concepts: { term: string; def: string }[];
  equations?: { name: string; eq: string; vars?: string; note?: string }[];
  models?: string[];
  numbers?: { label: string; value: string; source?: string }[];
  readings: string[];
  questions: string[];
}

let levelsPromise: Promise<LevelDoc[]> | null = null;
export function loadLevels() {
  levelsPromise ??= fetch(assetUrl('levels.json'))
    .then((r) => r.json() as Promise<{ levels: LevelDoc[] }>)
    .then((d) => d.levels);
  return levelsPromise;
}

const stagger = (i: number) => ({ '--i': i }) as React.CSSProperties;

function provenance(name: string, data: NonNullable<ReturnType<typeof useAtlas.getState>['data']>) {
  if (data.meshes.brain[name]) return 'Malla: Allen Human Reference Atlas 3D (CC BY 4.0)';
  if (data.meshes.nerves[name]) return 'Trayecto esquemático didáctico (no es una segmentación)';
  return 'Malla: BodyParts3D, © DBCLS (CC BY-SA 2.1 JP)';
}

function StructureSheet({ name }: { name: string }) {
  const data = useAtlas((s) => s.data)!;
  const info = data.structures[baseKey(name)];
  const region = info ? data.taxonomy.regions[info.g]?.[1] : undefined;
  const system = info?.s ? data.taxonomy.systems[info.s]?.[1] : undefined;
  const base = baseKey(name);
  const paths = data.pathways.pathways.filter((p) => p.solidos?.includes(base));
  const side = sideOf(name);
  let i = 0;
  return (
    <article className="na-sheet__body" key={name}>
      <p className="na-kicker" style={stagger(i++)}>
        {region ?? 'Estructura'}
        {side && ` · hemisferio ${side}`}
      </p>
      <h2 className="na-sheet__title" style={stagger(i++)}>
        {info?.n ?? name.replace(/_/g, ' ')}
      </h2>
      {info?.la && (
        <p className="na-sheet__latin" style={stagger(i++)}>
          {info.la}
        </p>
      )}
      <div className="na-chips" style={stagger(i++)}>
        {system && <span className="na-chip">{system}</span>}
        {info?.ba && <span className="na-chip">Brodmann {info.ba}</span>}
      </div>
      {info?.d && (
        <section style={stagger(i++)}>
          <p>{info.d}</p>
        </section>
      )}
      {info?.f && info.f.length > 0 && (
        <section style={stagger(i++)}>
          <h3>Funciones</h3>
          <ul>
            {info.f.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
        </section>
      )}
      {info?.c && (
        <section style={stagger(i++)}>
          <h3>Conexiones</h3>
          <p>{info.c}</p>
        </section>
      )}
      {info?.cl && (
        <section style={stagger(i++)}>
          <h3>Clínica</h3>
          <p>{info.cl}</p>
        </section>
      )}
      {paths.length > 0 && (
        <section style={stagger(i++)}>
          <h3>Vías que pasan por aquí</h3>
          <div className="na-chips">
            {paths.map((p) => (
              <button
                key={p.id}
                type="button"
                className="na-chip na-chip--btn"
                onClick={() => startPathway(p.id)}
              >
                {p.n}
              </button>
            ))}
          </div>
        </section>
      )}
      {info?.g.startsWith('ctx') && (
        <button
          type="button"
          className="na-cta"
          style={stagger(i++)}
          onClick={() => goToLevel('circuito')}
        >
          Bajar a la columna cortical <span aria-hidden="true">↓</span>
        </button>
      )}
      <p className="na-prov" style={stagger(i)}>
        {provenance(name, data)} · Texto: ontoterrorist/neuroanatomia (CC BY-SA 4.0), sin revisión
        experta.
      </p>
    </article>
  );
}

function LevelSheet() {
  const level = useAtlas((s) => s.level);
  const [docs, setDocs] = useState<LevelDoc[] | null>(null);
  useEffect(() => void loadLevels().then(setDocs), []);
  const doc = docs?.find((d) => d.id === level);
  if (!doc) return <p className="na-muted">Cargando lámina…</p>;
  let i = 0;
  const meta = LEVELS.find((l) => l.id === level)!;
  return (
    <article className="na-sheet__body" key={level}>
      <p className="na-kicker" style={stagger(i++)}>
        {doc.kicker} · {meta.space} · {meta.time}
      </p>
      <h2 className="na-sheet__title" style={stagger(i++)}>
        {doc.title}
      </h2>
      <p className="na-lead" style={stagger(i++)}>
        {doc.lead}
      </p>
      {doc.models && doc.models.length > 0 && (
        <button
          type="button"
          className="na-cta"
          style={stagger(i++)}
          onClick={() =>
            window.dispatchEvent(new CustomEvent('na:lab', { detail: doc.models![0] }))
          }
        >
          Abrir el laboratorio <span aria-hidden="true">→</span>
        </button>
      )}
      {doc.sections.map((s) => (
        <section key={s.h} style={stagger(i++)}>
          <h3>{s.h}</h3>
          <p>{s.p}</p>
          {s.items && (
            <ul>
              {s.items.map((it) => (
                <li key={it}>{it}</li>
              ))}
            </ul>
          )}
        </section>
      ))}
      {doc.types && (
        <section style={stagger(i++)}>
          <h3>Tipos</h3>
          <div className="na-types">
            {doc.types.map((t) => (
              <div key={t.name} className="na-type">
                <strong>{t.name}</strong>
                {t.where && <span className="na-type__where">{t.where}</span>}
                {t.traits && <p>{t.traits}</p>}
                {t.role && <p className="na-muted">{t.role}</p>}
              </div>
            ))}
          </div>
        </section>
      )}
      {doc.equations && doc.equations.length > 0 && (
        <section style={stagger(i++)}>
          <h3>Ecuaciones</h3>
          {doc.equations.map((e) => (
            <figure key={e.name} className="na-eq">
              <figcaption>{e.name}</figcaption>
              <code>{e.eq}</code>
              {e.vars && <p className="na-muted">{e.vars}</p>}
              {e.note && <p className="na-muted">{e.note}</p>}
            </figure>
          ))}
        </section>
      )}
      <section style={stagger(i++)}>
        <h3>Conceptos</h3>
        <dl className="na-dl">
          {doc.concepts.map((c) => (
            <div key={c.term}>
              <dt>{c.term}</dt>
              <dd>{c.def}</dd>
            </div>
          ))}
        </dl>
      </section>
      <section style={stagger(i++)}>
        <h3>Para pensar</h3>
        <ol>
          {doc.questions.map((q) => (
            <li key={q}>{q}</li>
          ))}
        </ol>
      </section>
      <section style={stagger(i++)}>
        <h3>Lecturas</h3>
        <ul className="na-refs">
          {doc.readings.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
      </section>
      <p className="na-prov" style={stagger(i)}>
        Borrador redactado con asistencia de IA, sin revisión experta.
      </p>
    </article>
  );
}

function PartSheet({ id }: { id: string }) {
  const part = useAtlas((s) => s.parts[id])!;
  let i = 0;
  return (
    <article className="na-sheet__body" key={id}>
      <p className="na-kicker" style={stagger(i++)}>
        {part.kicker ?? 'Parte'}
      </p>
      <h2 className="na-sheet__title" style={stagger(i++)}>
        {part.title}
      </h2>
      <section style={stagger(i++)}>
        <p>{part.body}</p>
      </section>
      {part.items && (
        <section style={stagger(i++)}>
          <ul>
            {part.items.map((it) => (
              <li key={it}>{it}</li>
            ))}
          </ul>
        </section>
      )}
      {part.model && (
        <button
          type="button"
          className="na-cta"
          style={stagger(i)}
          onClick={() => window.dispatchEvent(new CustomEvent('na:lab', { detail: part.model }))}
        >
          Simularlo en el laboratorio <span aria-hidden="true">→</span>
        </button>
      )}
    </article>
  );
}

export function startPathway(id: string) {
  window.dispatchEvent(new CustomEvent('na:pathway', { detail: id }));
}

export function InfoSheet() {
  const sheet = useAtlas((s) => s.sheet);
  const selected = useAtlas((s) => s.selected);
  const isPart = useAtlas((s) => !!s.selected && !!s.parts[s.selected]);
  const close = () => {
    const s = useAtlas.getState();
    s.setSheet(null);
    s.select(null);
  };
  const open = sheet === 'level' || (sheet === 'structure' && !!selected);
  return (
    <aside
      className="na-sheet"
      data-open={open ? '' : undefined}
      aria-label="Lámina informativa"
      aria-hidden={!open}
    >
      {open && (
        <>
          <button
            type="button"
            className="na-sheet__close"
            onClick={close}
            aria-label="Cerrar lámina"
          >
            ×
          </button>
          <div className="na-sheet__scroll">
            {sheet === 'structure' && selected ? (
              isPart ? (
                <PartSheet id={selected} />
              ) : (
                <StructureSheet name={selected} />
              )
            ) : (
              <LevelSheet />
            )}
          </div>
        </>
      )}
    </aside>
  );
}
