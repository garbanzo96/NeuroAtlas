import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Source } from '@neuroatlas/schemas';

export interface DoiCheck {
  doi: string;
  checkedOn: string;
  endpoint: string;
  httpStatus: number;
  metadata: {
    title: string | null;
    authors: string[];
    container: string | null;
    year: number | null;
    volume: string | null;
    page: string | null;
  } | null;
  /** Comparación con el registro de content/sources (si se proporcionó). */
  comparison: { field: string; content: string; crossref: string; matches: boolean }[];
  scope: string;
}

function normalizeTitle(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/**
 * Consulta Crossref para un DOI y compara título/año con la fuente registrada.
 * Verifica metadatos bibliográficos únicamente: no lee el artículo ni su licencia.
 */
export async function checkDoi(
  doi: string,
  source?: Source,
  today = new Date(),
): Promise<DoiCheck> {
  const endpoint = `https://api.crossref.org/works/${encodeURIComponent(doi)}`;
  const response = await fetch(endpoint, {
    headers: {
      'User-Agent': 'NeuroAtlas metadata check (https://github.com/garbanzo96/NeuroAtlas)',
    },
  });
  const checkedOn = today.toISOString().slice(0, 10);
  const scope = 'Crossref: título, autores, revista y fecha. No verifica contenido ni licencia.';
  if (!response.ok) {
    return {
      doi,
      checkedOn,
      endpoint,
      httpStatus: response.status,
      metadata: null,
      comparison: [],
      scope,
    };
  }
  const body = (await response.json()) as { message: Record<string, unknown> };
  const m = body.message;
  const title = (m.title as string[] | undefined)?.[0] ?? null;
  const dateParts = (m.issued as { 'date-parts'?: number[][] } | undefined)?.['date-parts']?.[0];
  const metadata = {
    title,
    authors: ((m.author as Array<{ family?: string; given?: string }> | undefined) ?? []).map((a) =>
      [a.family, a.given].filter(Boolean).join(', '),
    ),
    container: (m['container-title'] as string[] | undefined)?.[0] ?? null,
    year: dateParts?.[0] ?? null,
    volume: (m.volume as string | undefined) ?? null,
    page: (m.page as string | undefined) ?? null,
  };
  const comparison: DoiCheck['comparison'] = [];
  if (source) {
    comparison.push({
      field: 'title',
      content: source.title,
      crossref: title ?? '',
      matches: title !== null && normalizeTitle(title) === normalizeTitle(source.title),
    });
    comparison.push({
      field: 'year',
      content: String(source.year),
      crossref: String(metadata.year),
      matches: source.year === metadata.year,
    });
  }
  return { doi, checkedOn, endpoint, httpStatus: response.status, metadata, comparison, scope };
}

/** Guarda el resultado como registro de auditoría en docs/research/metadata-checks/. */
export function saveDoiCheck(check: DoiCheck, dir: string): string {
  mkdirSync(dir, { recursive: true });
  const file = join(dir, `${check.doi.replace(/[^a-zA-Z0-9]+/g, '_')}.json`);
  writeFileSync(file, JSON.stringify(check, null, 2) + '\n');
  return file;
}
