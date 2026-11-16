import { useState, type ReactNode } from 'react';
import { applyView, type AtlasView } from '../view';

type Inline = { text: string; marks?: string[]; type?: 'action'; view?: AtlasView };
type Block = { type: string; text?: Inline[] | string; view?: AtlasView; title?: Inline[]; blocks?: Block[]; items?: Inline[][]; ordered?: boolean; rows?: Inline[][][] };
export interface Course { semesters: { n: string; sub: string; units: { id: string; n: string; baj: string; obj: string[]; blocks: Block[] }[] }[] }
function inlines(items: Inline[] = []): ReactNode { return items.map((item, i) => {
  if (item.type === 'action' && item.view) return <button className="na-course-action" key={i} onClick={() => applyView(item.view!)}>{item.text} ↗</button>;
  let content: ReactNode = item.text;
  if (item.marks?.includes('bold')) content = <strong>{content}</strong>;
  if (item.marks?.includes('italic')) content = <em>{content}</em>;
  return <span key={i}>{content}</span>;
}); }
function blocks(items: Block[]): ReactNode { return items.map((b, i) => {
  if (b.type === 'action' && b.view) return <button key={i} className="na-course-action" onClick={() => applyView(b.view!)}>{b.text as string} ↗</button>;
  if (b.type === 'p') return <p key={i}>{inlines(b.text as Inline[])}</p>;
  if (b.type === 'h') return <h3 key={i}>{inlines(b.text as Inline[])}</h3>;
  if (b.type === 'ul') { const List = b.ordered ? 'ol' : 'ul'; return <List key={i}>{b.items?.map((item, j) => <li key={j}>{inlines(item)}</li>)}</List>; }
  if (b.type === 'table') return <div className="na-course-table" key={i}><table><tbody>{b.rows?.map((row, j) => <tr key={j}>{row.map((cell, k) => j === 0 ? <th scope="col" key={k}>{inlines(cell)}</th> : <td key={k}>{inlines(cell)}</td>)}</tr>)}</tbody></table></div>;
  if (b.type === 'key' || b.type === 'clinical') return <aside className="na-course-aside" key={i}><h3>{inlines(b.title)}</h3>{blocks(b.blocks ?? [])}</aside>;
  return null;
}); }
export function CourseReader({ course, onBack, onClose }: { course: Course; onBack(): void; onClose(): void }) {
  const [id, setId] = useState<string | null>(null);
  const unit = course.semesters.flatMap(s => s.units).find(u => u.id === id);
  return <section className="na-learn na-course" aria-label="Curso"><header><button className="na-course-back" onClick={() => unit ? setId(null) : onBack()}>← {unit ? 'Todas las unidades' : 'Recorridos'}</button><button className="na-sheet__close" onClick={onClose} aria-label="Cerrar curso">×</button><p className="na-kicker">Curso · borrador sin revisión experta</p><h2>{unit?.n ?? 'Curso de neuroanatomía'}</h2><p>{unit?.baj ?? 'Elige una unidad para leer y explorar sus vistas en el atlas.'}</p></header>
  {unit ? <article className="na-course-content"><h3>Objetivos</h3><ul>{unit.obj.map(o => <li key={o}>{o}</li>)}</ul>{blocks(unit.blocks)}</article> : <div className="na-course-content">{course.semesters.map(s => <div key={s.n}><h3>{s.n}</h3><p>{s.sub}</p>{s.units.map(u => <button className="na-unit" key={u.id} onClick={() => setId(u.id)}><span>{u.id.toUpperCase()}</span><strong>{u.n}</strong><small>{u.baj}</small></button>)}</div>)}</div>}
  </section>;
}
