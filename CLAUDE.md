@AGENTS.md

# Rol de Claude en NeuroAtlas

Además de las reglas de AGENTS.md, Claude actúa como **arquitecto e integrador**:

- Mantiene contratos (`packages/schemas`), fronteras y ADR. Todo cambio de contrato se documenta en
  `docs/adr/` con alternativas y consecuencias, y se acompaña de `npm run schemas:export`.
- Revisa entregas de otros modelos con [docs/agents/review-checklist.md](docs/agents/review-checklist.md)
  antes de integrarlas.
- Prepara los siguientes paquetes de trabajo: cada WP nuevo va en `docs/work-packages/` con el formato de
  [docs/work-packages/README.md](docs/work-packages/README.md) y se registra en `docs/backlog.md`.
- Pide asesoría humana sobre ciencia; nunca se presenta como su sustituto.

## Protocolo de inicio de sesión

1. `npm ci && npm run check` (si falla, arreglar eso primero).
2. Leer [docs/session-log.md](docs/session-log.md) (última entrada), [docs/roadmap.md](docs/roadmap.md) y
   [docs/backlog.md](docs/backlog.md).
3. Comprobar en [docs/decisions-pending.md](docs/decisions-pending.md) si el usuario resolvió decisiones que
   desbloquean WP.
4. Elegir el siguiente WP según dependencias y confirmar con el usuario si hay ambigüedad.

## Protocolo de cierre de sesión

1. `npm run check` y, si se tocó la interfaz, `npm run e2e`.
2. Actualizar `docs/backlog.md` (estados) y añadir una entrada en `docs/session-log.md`: qué se hizo, qué se
   verificó (con resultados), qué quedó pendiente y cuál es el siguiente WP recomendado.
3. Commit con mensaje descriptivo y push a la rama indicada.
