/**
 * Verifica las fronteras de la arquitectura (docs/architecture.md §2):
 *  1. Un paquete solo importa paquetes internos permitidos por la matriz ALLOWED.
 *  2. Toda dependencia externa importada está declarada en el package.json del propio paquete
 *     (los archivos de prueba pueden usar devDependencies de la raíz).
 *  3. Los módulos `node:*` solo se usan en el pipeline offline, herramientas y pruebas.
 *  4. Ningún import relativo sale del directorio del paquete.
 * Uso: npm run boundaries
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

export const ALLOWED: Record<string, string[]> = {
  '@neuroatlas/schemas': [],
  '@neuroatlas/knowledge': ['@neuroatlas/schemas'],
  '@neuroatlas/simulation': ['@neuroatlas/schemas'],
  '@neuroatlas/lessons': ['@neuroatlas/schemas'],
  '@neuroatlas/viewer-2d': ['@neuroatlas/schemas'],
  '@neuroatlas/viewer-3d': ['@neuroatlas/schemas'],
  '@neuroatlas/data-pipeline': [
    '@neuroatlas/schemas',
    '@neuroatlas/knowledge',
    '@neuroatlas/simulation',
  ],
  '@neuroatlas/web': [
    '@neuroatlas/schemas',
    '@neuroatlas/knowledge',
    '@neuroatlas/simulation',
    '@neuroatlas/lessons',
    '@neuroatlas/viewer-2d',
    '@neuroatlas/viewer-3d',
  ],
};

const NODE_BUILTINS_ALLOWED = new Set(['@neuroatlas/data-pipeline']);

const IMPORT_RE =
  /(?:^|[\s;])(?:import|export)\s+(?:type\s+)?(?:[^'";]*?\sfrom\s+)?['"]([^'"]+)['"]|import\(\s*['"]([^'"]+)['"]\s*\)/g;

export function extractImports(source: string): string[] {
  const out: string[] = [];
  const stripped = source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  for (const match of stripped.matchAll(IMPORT_RE)) {
    const spec = match[1] ?? match[2];
    if (spec) out.push(spec);
  }
  return out;
}

export function packageNameOf(specifier: string): string {
  if (specifier.startsWith('@')) return specifier.split('/').slice(0, 2).join('/');
  return specifier.split('/')[0]!;
}

function isTestFile(file: string): boolean {
  return (
    /\.test\.tsx?$/.test(file) || /[\\/]fixtures[\\/]/.test(file) || /test-fixtures\.ts$/.test(file)
  );
}

function listSources(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out.push(...listSources(full));
    else if (/\.(ts|tsx)$/.test(name)) out.push(full);
  }
  return out;
}

interface Workspace {
  name: string;
  dir: string;
  deps: Set<string>;
}

function readWorkspaces(): Workspace[] {
  const out: Workspace[] = [];
  for (const group of ['packages', 'apps']) {
    for (const name of readdirSync(join(ROOT, group))) {
      const dir = join(ROOT, group, name);
      const pkgFile = join(dir, 'package.json');
      try {
        const pkg = JSON.parse(readFileSync(pkgFile, 'utf8')) as {
          name: string;
          dependencies?: Record<string, string>;
        };
        out.push({ name: pkg.name, dir, deps: new Set(Object.keys(pkg.dependencies ?? {})) });
      } catch {
        // directorio sin package.json: no es un workspace
      }
    }
  }
  return out;
}

export function checkBoundaries(): string[] {
  const rootPkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as {
    devDependencies?: Record<string, string>;
  };
  const devDeps = new Set(Object.keys(rootPkg.devDependencies ?? {}));
  const errors: string[] = [];
  for (const ws of readWorkspaces()) {
    const allowed = ALLOWED[ws.name];
    if (!allowed) {
      errors.push(
        `${ws.name}: paquete sin entrada en la matriz ALLOWED de tools/check-boundaries.ts.`,
      );
      continue;
    }
    const srcDir = join(ws.dir, 'src');
    for (const file of listSources(srcDir)) {
      const rel = relative(ROOT, file);
      const test = isTestFile(file);
      for (const spec of extractImports(readFileSync(file, 'utf8'))) {
        if (spec.startsWith('.')) {
          const target = resolve(dirname(file), spec);
          if (!target.startsWith(ws.dir))
            errors.push(`${rel}: import relativo "${spec}" sale del paquete ${ws.name}.`);
          continue;
        }
        if (spec.startsWith('node:')) {
          if (!test && !NODE_BUILTINS_ALLOWED.has(ws.name))
            errors.push(`${rel}: "${spec}" solo se permite en el pipeline offline o en pruebas.`);
          continue;
        }
        if (spec.startsWith('virtual:') || spec.startsWith('/')) continue;
        const pkg = packageNameOf(spec);
        if (pkg.startsWith('@neuroatlas/')) {
          if (pkg === ws.name) {
            errors.push(`${rel}: el paquete se importa a sí mismo ("${spec}").`);
          } else if (!allowed.includes(pkg)) {
            errors.push(
              `${rel}: ${ws.name} no puede depender de ${pkg} (ver docs/architecture.md).`,
            );
          } else if (!ws.deps.has(pkg) && !test) {
            errors.push(
              `${rel}: ${pkg} no está declarado en ${relative(ROOT, ws.dir)}/package.json.`,
            );
          }
          continue;
        }
        const declared = ws.deps.has(pkg) || (pkg.startsWith('@types/') && devDeps.has(pkg));
        if (!declared && !(test && devDeps.has(pkg)))
          errors.push(
            `${rel}: dependencia externa "${pkg}" no declarada en ${relative(ROOT, ws.dir)}/package.json.`,
          );
      }
    }
  }
  return errors;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const errors = checkBoundaries();
  for (const e of errors) console.error(`FRONTERA: ${e}`);
  if (errors.length) {
    console.error(`\n${errors.length} violaciones de frontera.`);
    process.exitCode = 1;
  } else {
    console.log('Fronteras de arquitectura: OK');
  }
}
