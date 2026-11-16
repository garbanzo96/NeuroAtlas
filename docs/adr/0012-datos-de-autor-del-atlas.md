# ADR-0012 · Datos de autor del atlas: circuitos, capas de lectura, recorridos y vínculos

- **Estado:** aceptada · **Fecha:** 2026-11-16 · **Decide:** director del proyecto (Gabriel Salas), con Claude

## Contexto

El plan de conocimiento (`docs/atlas/plan-de-conocimiento.md`) agrega al atlas circuitos con signo, capas
de lectura que recolorean la anatomía, recorridos guiados, curso, preguntas y vínculos entre estructuras y
modelos. Son datos redactados o derivados, no importados tal cual, y varios agentes los escribirán en paralelo.

## Decisión

1. Extiende el ADR-0011. Estos datos viven en `apps/web/public/atlas/` (`circuits.json`, `overlays.json`,
   `tours.json`, `course.json`, `quiz.json`, `links.json`, `molecules.json`), igual que `levels.json`.
2. Cada archivo declara `"status": "borrador — sin revisión experta"` y lo valida
   `tools/check-atlas-data.mjs`, que corre en `npm run check` (`atlas:check`): claves desconocidas, textos
   vacíos y referencias a mallas, vías, niveles o circuitos inexistentes hacen fallar la comprobación.
3. Los contratos TypeScript (`Circuit`, `Overlay`, `AtlasView`, campos del store, canal `signals.ts`) los fija
   Claude en WP-060; los WP paralelos los usan sin cambiarlos.
4. Un circuito declara su naturaleza (`observacion`, `modelo`, `hipotesis`). Su simulación es un esquema de
   signos, no biofísica, y la interfaz lo dice siempre.

## Alternativas

- Llevarlos a `content/` con el validador Zod: exige fuentes por afirmación y revisión que hoy no existen;
  queda para cuando haya revisión experta.
- Sin validación: barato, pero con agentes en paralelo las referencias rotas se notarían solo en pantalla.

## Consecuencias

- Los WP pueden agregar datos del atlas sin ADR propio si respetan el contrato y pasan `atlas:check`.
- Ningún dato de autor se presenta como revisado.
