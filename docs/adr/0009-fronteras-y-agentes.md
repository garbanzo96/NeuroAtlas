# ADR-0009: Fronteras verificadas y trabajo por paquetes con varios modelos

- **Estado:** Aceptada
- **Fecha:** 2026-10-04

## Contexto

El usuario quiere avanzar con Claude y con modelos más económicos (ChatGPT, Kimi). Sin controles automáticos,
el código generado tiende a cruzar módulos, añadir dependencias y "rellenar" datos.

## Decisión

- `npm run check` (formato, lint, tipos, fronteras, contenido, pruebas, build) + e2e en CI para cada push/PR.
- `AGENTS.md` con reglas científicas y de ingeniería válidas para cualquier modelo; `CLAUDE.md` añade el rol
  de integrador y los protocolos de sesión.
- Trabajo por WP (`docs/work-packages/`), un PR por WP, plantilla de PR con comprobaciones, lista de revisión
  para integrar entregas (`docs/agents/review-checklist.md`) y registro de sesiones (`docs/session-log.md`).
- El validador de contenido hace cumplir mecánicamente lo que no debe depender de la disciplina del modelo
  (estados, especies, licencias, puentes).

## Consecuencias

Un modelo económico puede trabajar con poco contexto: AGENTS.md + su WP + los archivos que el WP lista. Las
decisiones de contrato y la integración quedan centralizadas.
