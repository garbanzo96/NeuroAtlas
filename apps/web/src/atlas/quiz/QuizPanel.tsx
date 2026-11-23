import { useEffect, useMemo, useState } from 'react';
import { loadQuiz, type AtlasData, type QuizData } from '../data';
import { useAtlas } from '../store';
import type { Course } from '../ui/CourseReader';
import { applyView } from '../view';
import { correct, loadProgress, orderByDue, saveProgress, schedule, shuffle } from './engine';
import { pathwayQuestions, sameStructure, structureQuestions } from './generators';

const modes = [
  ['multiple', 'Opción múltiple'],
  ['caso', 'Caso clínico'],
  ['localizar', 'Localizar'],
  ['nombrar', 'Nombrar'],
  ['ordenar', 'Ordenar una vía'],
] as const;

export function QuizPanel({ data, course }: { data: AtlasData; course: Course | null }) {
  const quiz = useAtlas((s) => s.quiz)!;
  const [bank, setBank] = useState<QuizData | null>(null);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState(loadProgress);
  const [queue, setQueue] = useState<string[]>([]);
  const [index, setIndex] = useState(0);
  const [streak, setStreak] = useState(0);
  const [result, setResult] = useState<boolean | null>(null);
  const [order, setOrder] = useState<string[]>([]);
  const [copied, setCopied] = useState('');
  const structures = useMemo(() => structureQuestions(data, 19), [data]);
  const pathways = useMemo(() => pathwayQuestions(data.pathways.pathways), [data]);
  const all = useMemo(() => [...(bank?.questions ?? []), ...(bank?.cases ?? [])], [bank]);
  const id = queue[index];
  const question = all.find((q) => q.id === id);
  const structure = structures.find((s) => s.id === id);
  const path = pathways.find((p) => p.id === id);
  const options = useMemo(
    () =>
      question
        ? shuffle(
            question.options.map((text, i) => ({ text, i })),
            index + 321,
          )
        : [],
    [question, index],
  );
  useEffect(() => {
    let active = true;
    loadQuiz()
      .then((q) => {
        if (active) setBank(q);
      })
      .catch(() => {
        if (active) setError('No se pudo cargar la evaluación.');
      });
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    if (!bank) return;
    let ids: string[] = [];
    if (quiz.mode === 'examen')
      ids = (quiz.target ?? '').split(',').filter((x) => all.some((q) => q.id === x));
    else if (quiz.mode === 'multiple') ids = bank.questions.map((q) => q.id);
    else if (quiz.mode === 'caso') ids = bank.cases.map((q) => q.id);
    else if (quiz.mode === 'localizar' || quiz.mode === 'nombrar')
      ids = structures.map((s) => s.id);
    else if (quiz.mode === 'ordenar') ids = pathways.map((p) => p.id);
    setQueue(
      quiz.mode === 'examen'
        ? ids
        : orderByDue(
            shuffle(ids, Date.now()),
            Object.fromEntries(
              Object.entries(progress)
                .filter(([key]) => key.startsWith(`${quiz.mode}:`))
                .map(([key, value]) => [key.slice(quiz.mode.length + 1), value]),
            ),
          ),
    );
    setIndex(0);
    setStreak(0);
    setResult(null);
    // La agenda se aplica al iniciar una modalidad, no después de cada respuesta.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bank, quiz.mode, quiz.target, structures, pathways, all]);
  useEffect(() => {
    setResult(null);
    if (path) {
      const titles = path.pasos.map((s) => s.t);
      let shuffled = shuffle(titles, index + 23);
      if (shuffled.every((t, i) => t === titles[i]))
        shuffled = [...shuffled.slice(1), shuffled[0]!];
      setOrder(shuffled);
    }
    if (structure && (quiz.mode === 'localizar' || quiz.mode === 'nombrar')) {
      applyView({
        level: 'areas',
        pathway: null,
        circuit: null,
        select: quiz.mode === 'nombrar' ? structure.mesh : null,
      });
      useAtlas.getState().setSheet(null);
    }
  }, [id, index, path, structure, quiz.mode]);
  const respond = (passed: boolean) => {
    if (result !== null || !id) return;
    setResult(passed);
    setStreak((s) => (passed ? s + 1 : 0));
    const next = schedule(progress, `${quiz.mode}:${id}`, passed, Date.now());
    // La agenda usa turnos relativos al tiempo para conservar prioridad entre sesiones.
    next[`${quiz.mode}:${id}`]!.due = passed
      ? Date.now() + next[`${quiz.mode}:${id}`]!.box * 86400000
      : -1;
    setProgress(next);
    saveProgress(next);
    if (question) {
      const unit = course?.semesters.flatMap((s) => s.units).find((u) => u.id === question.unit) as
        { rel?: string[] } | undefined;
      const meshNames = Object.values(data.meshes).flatMap((group) => Object.keys(group));
      const linked = unit?.rel?.find((name) =>
        meshNames.some((m) => m === name || m === `${name}_L` || m === `${name}_R`),
      );
      const mesh =
        linked && meshNames.find((m) => m === linked || m === `${linked}_L` || m === `${linked}_R`);
      // cambiar de nivel lanza su propio vuelo, que pisa el de la estructura: solo si no hay anatomía en pantalla
      const level = ['encefalo', 'areas'].includes(useAtlas.getState().level)
        ? undefined
        : ('encefalo' as const);
      if (question.view) applyView({ level, ...question.view });
      else if (mesh) applyView({ level, select: mesh });
    }
    if (path && passed) applyView({ pathway: path.id });
  };
  useEffect(() => {
    if (quiz.mode !== 'localizar' || !structure || result !== null) return;
    const pick = (e: Event) =>
      respond(sameStructure((e as CustomEvent<string>).detail, structure.mesh));
    window.addEventListener('na:quiz-pick', pick);
    return () => window.removeEventListener('na:quiz-pick', pick);
  });
  const start = (mode: string) => useAtlas.getState().setQuiz({ mode });
  const close = () => {
    useAtlas.getState().setQuiz(null);
    const url = new URL(location.href);
    url.searchParams.delete('examen');
    history.replaceState(history.state, '', url);
  };
  const copy = async () => {
    const ids = queue.filter((x) => all.some((q) => q.id === x));
    const url = new URL(location.href);
    url.searchParams.set('examen', ids.join(','));
    try {
      await navigator.clipboard.writeText(url.href);
      setCopied('Enlace copiado');
    } catch {
      setCopied('No se pudo copiar el enlace');
    }
  };
  const move = (i: number, delta: number) =>
    setOrder((items) => {
      const next = [...items];
      const j = i + delta;
      [next[i], next[j]] = [next[j]!, next[i]!];
      return next;
    });
  return (
    <section className="na-quiz-panel" aria-label="Evaluación">
      <button className="na-sheet__close" onClick={close} aria-label="Cerrar evaluación">
        ×
      </button>
      <p className="na-kicker">
        Evaluación{' '}
        {quiz.mode !== 'menu' && `· ${modes.find(([m]) => m === quiz.mode)?.[1] ?? 'Examen'}`}
      </p>
      {error && <p role="alert">{error}</p>}
      {!bank && !error && <p>Cargando preguntas…</p>}
      {bank && quiz.mode === 'menu' && (
        <>
          <h2>Comprueba lo aprendido</h2>
          <div className="na-quiz-options">
            {modes.map(([mode, label]) => (
              <button key={mode} onClick={() => start(mode)}>
                {label} →
              </button>
            ))}
          </div>
        </>
      )}
      {bank && quiz.mode !== 'menu' && (
        <>
          <p>
            Pregunta {queue.length ? index + 1 : 0} / {queue.length} · Racha: {streak}
          </p>
          {!id && <p>No hay preguntas disponibles para esta selección.</p>}
          {question && (
            <>
              <h2>{question.q}</h2>
              <div className="na-quiz-options">
                {options.map((o) => (
                  <button
                    key={o.i}
                    disabled={result !== null}
                    onClick={() => respond(correct(String(o.i), String(question.answer)))}
                  >
                    {o.text}
                  </button>
                ))}
              </div>
            </>
          )}
          {structure && (
            <>
              <h2>
                {quiz.mode === 'localizar'
                  ? `Haz clic en ${structure.name}`
                  : '¿Qué estructura está resaltada?'}
              </h2>
              {quiz.mode === 'nombrar' && (
                <div className="na-quiz-options">
                  {structure.options.map((o) => (
                    <button
                      key={o}
                      disabled={result !== null}
                      onClick={() => respond(correct(o, structure.name))}
                    >
                      {o}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
          {path && (
            <>
              <h2>Ordena los relevos: {path.n}</h2>
              <ol className="na-quiz-order">
                {order.map((item, i) => (
                  <li key={item}>
                    <span>{item}</span>
                    <button
                      aria-label={`Subir ${item}`}
                      disabled={i === 0 || result !== null}
                      onClick={() => move(i, -1)}
                    >
                      ↑
                    </button>
                    <button
                      aria-label={`Bajar ${item}`}
                      disabled={i === order.length - 1 || result !== null}
                      onClick={() => move(i, 1)}
                    >
                      ↓
                    </button>
                  </li>
                ))}
              </ol>
              <button
                disabled={result !== null}
                onClick={() => respond(order.every((x, i) => x === path.pasos[i]?.t))}
              >
                Comprobar orden
              </button>
            </>
          )}
          {result !== null && (
            <div className="na-quiz-feedback" data-correct={result} role="status">
              <strong>{result ? 'Correcto' : 'Revisa la respuesta'}</strong>
              <p>
                {question?.why ??
                  (structure
                    ? `La respuesta es ${structure.name}.`
                    : path
                      ? `Orden: ${path.pasos.map((s) => s.t).join(' → ')}.`
                      : '')}
              </p>
            </div>
          )}
          {result !== null && (
            <button
              onClick={() => {
                if (index + 1 < queue.length) setIndex(index + 1);
                else start('menu');
              }}
            >
              {index + 1 < queue.length ? 'Siguiente →' : 'Terminar'}
            </button>
          )}
          <div className="na-quiz-actions">
            <button onClick={() => start('menu')}>Modalidades</button>
            {(quiz.mode === 'multiple' || quiz.mode === 'caso' || quiz.mode === 'examen') && (
              <button onClick={() => void copy()}>Copiar examen</button>
            )}
          </div>
          <p role="status">{copied}</p>
        </>
      )}
      <p className="na-learn__draft">
        Preguntas y casos: ontoterrorist, CC BY-SA 4.0 · borrador — sin revisión experta
      </p>
    </section>
  );
}
