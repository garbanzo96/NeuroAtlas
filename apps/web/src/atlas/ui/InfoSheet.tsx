import { useEffect, useState } from 'react';
import {
  assetUrl,
  baseKey,
  sideOf,
  loadNeurons,
  loadMicrocircuits,
  type Microcircuit,
  type NeuronRecord,
} from '../data';
import { builtinOverlays } from '../overlays';
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
        {builtinOverlays(data)
          .filter((o) => o.id !== 'sistemas' && o.id !== 'brodmann')
          .flatMap((o) => {
            const v = o.values[base];
            return typeof v === 'object'
              ? Object.keys(v).map((id) => (
                  <span className="na-chip" key={o.id}>
                    {o.classes?.find((c) => c.id === id)?.n}
                  </span>
                ))
              : [];
          })}
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

function NeuronSheet({ neuron }: { neuron: NeuronRecord }) {
  return (
    <article className="na-sheet__body">
      <p className="na-kicker">Morfología reconstruida · {neuron.group}</p>
      <h2 className="na-sheet__title">{neuron.name}</h2>
      <div className="na-chips">
        <span className="na-chip">{neuron.species}</span>
        <span className="na-chip">{neuron.region}</span>
      </div>
      <p className="na-lead">{neuron.description}</p>
      <p>
        Integridad: {neuron.integrity}. Longitud total: {neuron.length} µm · {neuron.branches}{' '}
        ramificaciones.
      </p>
      {neuron.group !== 'Glía' && (
        <p>Propagación didáctica (model_prediction), no simulada en esta morfología.</p>
      )}
      <section>
        <h3>Fuentes</h3>
        <ul className="na-refs">
          <li>
            Publicación original:{' '}
            {neuron.doi.map((doi) => (
              <a key={doi} href={`https://doi.org/${doi}`}>
                DOI {doi}{' '}
              </a>
            ))}{' '}
            {neuron.pmid.map((pmid) => (
              <span key={pmid}>PMID {pmid} </span>
            ))}
          </li>
          <li>
            <a href={neuron.url}>NeuroMorpho.Org</a> (RRID:SCR_002145), CC BY 4.0.
          </li>
          <li>
            Tecuatl, Ljungquist y Ascoli (2024), FASEB BioAdv 6(7):207–221.{' '}
            <a href="https://doi.org/10.1096/fba.2024-00048">doi:10.1096/fba.2024-00048</a>.
          </li>
        </ul>
      </section>
      <p className="na-prov">{neuron.status}</p>
    </article>
  );
}

function LevelSheet() {
  const level = useAtlas((s) => s.level);
  const variant = useAtlas((s) => s.variant);
  const [neurons, setNeurons] = useState<NeuronRecord[]>([]);
  const [circuits, setCircuits] = useState<Microcircuit[]>([]);
  useEffect(() => {
    if (level === 'circuito') void loadMicrocircuits().then(setCircuits);
  }, [level]);
  useEffect(() => {
    if (level === 'neurona' || level === 'circuito') void loadNeurons().then(setNeurons);
  }, [level]);
  const neuron = neurons.find((n) => n.id === variant);
  const [docs, setDocs] = useState<LevelDoc[] | null>(null);
  useEffect(() => void loadLevels().then(setDocs), []);
  const doc = docs?.find((d) => d.id === level);
  if (neuron) return <NeuronSheet neuron={neuron} />;
  const circuit = level === 'circuito' ? circuits.find((c) => c.id === variant) : undefined;
  if (circuit)
    return (
      <article className="na-sheet__body">
        <p className="na-kicker">Microcircuito · esquema didáctico</p>
        <h2 className="na-sheet__title">{circuit.name}</h2>
        <p className="na-lead">{circuit.compute}</p>
        <h3>Flujo de la señal</h3>
        <p>{circuit.flow}</p>
        <h3>Formas de referencia</h3>
        <ul>
          {circuit.cells.map((cell) => {
            const reference = neurons.find((n) => n.id === cell.morphology);
            return (
              <li key={cell.id}>
                {cell.name}: {reference ? `${reference.name} · ${reference.species}` : 'esquema'}
              </li>
            );
          })}
        </ul>
        <h3>Qué mirar</h3>
        <ul>
          {circuit.scenarios.map((sc) => (
            <li key={sc.id}>
              <strong>{sc.name}:</strong> {sc.look}
            </li>
          ))}
        </ul>
        <p>
          Formas de ratón, rata, gato y humano usadas como referencia de tipo celular; disposición
          esquemática. Las formas rotuladas como esquema no son reconstrucciones del tipo
          representado. Los pesos son didácticos y no representan mediciones.
        </p>
        <p className="na-prov">borrador — sin revisión experta</p>
      </article>
    );
  if (!doc) return <p className="na-muted">Cargando lámina…</p>;
  let i = 0;
  const meta = LEVELS.find((l) => l.id === level)!;
  return (
    <article className="na-sheet__body" key={level}>
      <header className="na-level-header" style={stagger(i++)}>
        <div>
          <p className="na-kicker">
            {doc.kicker} · <span className="na-nocaps">{meta.space}</span> ·{' '}
            <span className="na-nocaps">{meta.time}</span>
          </p>
          <h2 className="na-sheet__title">{doc.title}</h2>
        </div>
        <img
          className="na-level-header__icon"
          src={assetUrl(`img/nivel-${level}.webp`)}
          alt=""
          loading="lazy"
          decoding="async"
        />
      </header>
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
  // en celular la lámina abre a media altura para no tapar la escena; el asa la despliega
  const [full, setFull] = useState(false);
  useEffect(() => setFull(false), [sheet, selected]);
  return (
    <aside
      className="na-sheet"
      data-open={open ? '' : undefined}
      data-full={full ? '' : undefined}
      aria-label="Lámina informativa"
      aria-hidden={!open}
    >
      {open && (
        <>
          <button
            type="button"
            className="na-sheet__grip"
            aria-expanded={full}
            aria-label={full ? 'Reducir lámina' : 'Desplegar lámina'}
            onClick={() => setFull((f) => !f)}
          />
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
