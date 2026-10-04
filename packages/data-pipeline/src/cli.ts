import { summarizeIssues } from '@neuroatlas/knowledge';
import { buildPacks } from './build-packs';
import { exportSchemas } from './export-schemas';
import { CONTENT_DIR, JSON_SCHEMA_DIR, METADATA_CHECKS_DIR, PACKS_DIR } from './paths';
import { validateContent } from './validate-content';
import { checkDoi, saveDoiCheck } from './verify-doi';

const USAGE = `Uso: tsx packages/data-pipeline/src/cli.ts <comando>

  validate                 Valida content/ (esquemas, reglas epistémicas, modelos). Sale con 1 si hay errores.
  build                    Valida y escribe apps/web/public/packs/ (release inmutable + catálogo).
  export-schemas           Regenera packages/schemas/json/*.schema.json desde los contratos Zod.
  verify-doi <src.id|DOI>  Consulta Crossref, compara con content/sources y guarda auditoría.
`;

function printIssues(report: ReturnType<typeof validateContent>, verbose: boolean) {
  const { errors, warnings, infos } = summarizeIssues(report.issues);
  for (const issue of report.issues) {
    if (issue.severity === 'info' && !verbose) continue;
    const tag =
      issue.severity === 'error' ? 'ERROR' : issue.severity === 'warning' ? 'AVISO' : 'INFO ';
    console.log(`${tag} [${issue.code}] ${issue.id}: ${issue.message}`);
  }
  const pack = report.loaded.pack;
  if (pack) {
    const drafts = pack.claims.filter((c) => c.status === 'draft').length;
    console.log(
      `\nRelease ${pack.release.id} (${pack.release.channel}) · ${report.loaded.fileCount} archivos · ` +
        `${pack.entities.length} entidades · ${pack.relations.length} relaciones · ${pack.claims.length} afirmaciones (${drafts} en borrador) · ` +
        `${pack.sources.length} fuentes · ${pack.scenes.length} escenas · ${pack.models.length} modelos`,
    );
  }
  console.log(`Resultado: ${errors} errores, ${warnings} avisos, ${infos} informativos.`);
}

async function main() {
  const [command, arg] = process.argv.slice(2);
  const verbose = process.argv.includes('--verbose');
  switch (command) {
    case 'validate': {
      const report = validateContent(CONTENT_DIR);
      printIssues(report, verbose);
      process.exitCode = report.ok ? 0 : 1;
      return;
    }
    case 'build': {
      const report = validateContent(CONTENT_DIR);
      if (!report.ok) {
        printIssues(report, verbose);
        console.error('\nNo se construyen paquetes con errores de contenido.');
        process.exitCode = 1;
        return;
      }
      const catalog = buildPacks(report.loaded, PACKS_DIR);
      const release = catalog.releases[0]!;
      console.log(
        `Paquete ${release.id}: knowledge.json ${(release.knowledge.bytes / 1024).toFixed(1)} KiB, ${release.assets.length} assets → apps/web/public/packs/`,
      );
      return;
    }
    case 'export-schemas': {
      const names = exportSchemas(JSON_SCHEMA_DIR);
      console.log(`${names.length} JSON Schemas escritos en packages/schemas/json/`);
      return;
    }
    case 'verify-doi': {
      if (!arg) throw new Error('Indica un ID de fuente (src.xxx) o un DOI.');
      let doi = arg;
      let source;
      if (arg.startsWith('src.')) {
        const report = validateContent(CONTENT_DIR);
        source = report.loaded.pack?.sources.find((s) => s.id === arg);
        if (!source) throw new Error(`Fuente ${arg} no encontrada.`);
        if (!source.doi) throw new Error(`La fuente ${arg} no tiene DOI.`);
        doi = source.doi;
      }
      const check = await checkDoi(doi, source);
      const file = saveDoiCheck(check, METADATA_CHECKS_DIR);
      console.log(JSON.stringify(check, null, 2));
      console.log(`\nAuditoría guardada en ${file}`);
      if (check.httpStatus !== 200 || check.comparison.some((c) => !c.matches)) {
        console.log(
          'Revisar: el DOI no resolvió o los metadatos no coinciden. No marcar como verificada.',
        );
        process.exitCode = 1;
      } else {
        console.log(
          `Si todo coincide, actualizar la fuente en content/sources con:\n  verification: { status: metadata_verified, verifiedOn: ${check.checkedOn}, scope: "${check.scope}", method: crossref_api }`,
        );
      }
      return;
    }
    default:
      console.log(USAGE);
      process.exitCode = command ? 1 : 0;
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
