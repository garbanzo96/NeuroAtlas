import { type Issue, validateKnowledge } from '@neuroatlas/knowledge';
import { checkSpecCompatibility } from '@neuroatlas/simulation';
import { type LoadedContent, loadContent } from './load-content';

export interface ContentReport {
  loaded: LoadedContent;
  issues: Issue[];
  ok: boolean;
}

/** Carga, valida esquemas, reglas epistémicas y compatibilidad de modelos. */
export function validateContent(contentDir: string): ContentReport {
  const loaded = loadContent(contentDir);
  const issues: Issue[] = loaded.problems.map((p) => ({
    severity: 'error',
    code: 'SCHEMA',
    id: p.file,
    message: p.message,
  }));
  if (loaded.pack) {
    issues.push(...validateKnowledge(loaded.pack, { geometries: loaded.geometries }));
    for (const model of loaded.pack.models) {
      for (const message of checkSpecCompatibility(model))
        issues.push({
          severity: 'error',
          code: 'MODEL_IMPLEMENTATION_MISMATCH',
          id: model.id,
          message,
        });
    }
  }
  return { loaded, issues, ok: !issues.some((i) => i.severity === 'error') };
}
