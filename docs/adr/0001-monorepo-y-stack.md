# ADR-0001: Monorepo con npm workspaces y stack web ligero

- **Estado:** Aceptada
- **Fecha:** 2026-10-04

## Contexto

El plan pide separar `schemas`, `knowledge`, `data-pipeline`, `viewer-3d`, `viewer-2d`, `simulation`,
`lessons` y `app` "dentro de un proyecto, sin microservicios", con React/TypeScript, Three.js vía React Three
Fiber, WebGL2, Workers y datos estáticos versionados. El equipo es una persona con varios modelos; los modelos
económicos necesitan límites claros para no romper la arquitectura.

## Decisión

- Monorepo con **npm workspaces**: `packages/*` y `apps/web`. Paquetes de código fuente (sin build propio),
  exportados con `exports → src/index.ts`. TypeScript 6.0 (compatible con typescript-eslint), Vite 8, Vitest 5,
  React 19.3, three 0.186, @react-three/fiber 9, drei 10, Zustand 5, Zod 4, Playwright 1.56.
- Un único `tsconfig.json` para comprobación de tipos de todo el repo; ESLint + Prettier comunes.
- Sin backend. Postgres/FastAPI solo cuando exista una necesidad demostrable (cuentas, catálogo grande,
  consultas complejas), como indica el plan.

## Alternativas consideradas

- **Un solo paquete con carpetas**: más simple, pero sin dependencias declaradas por módulo; las fronteras
  dependerían solo de convenciones.
- **pnpm workspaces**: dependencias estrictas por paquete, pero añade una herramienta más a instalar para el
  usuario y para cada modelo. Las fronteras se verifican igualmente con `tools/check-boundaries.ts`.
- **TypeScript 7 (nativo)**: más rápido, pero typescript-eslint aún exige `< 6.1`.

## Consecuencias

Cada paquete declara sus dependencias y CI comprueba la matriz de fronteras. Añadir un paquete nuevo exige
añadirlo a `ALLOWED` en `tools/check-boundaries.ts` y a esta tabla de arquitectura.
