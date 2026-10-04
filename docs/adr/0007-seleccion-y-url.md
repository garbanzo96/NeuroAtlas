# ADR-0007: Estado de selección único y URL reproducible

- **Estado:** Aceptada
- **Fecha:** 2026-10-04

## Decisión

- Un único `SelectionState` (contrato del plan) en un store Zustand; todas las vistas lo leen. La lógica de
  transición entre escenas, lecciones y búsqueda es pura (`apps/web/src/state/logic.ts`) y probada en Node.
- Al entrar en una escena: capas por defecto, selección vacía y aviso de contexto si procede (no se
  autoselecciona; la ficha muestra el resumen y sugiere por dónde empezar).
- La URL refleja `r`, `s`, `e`, `l`, `lesson`, `step` y `sim`; al abrirla se descartan IDs desconocidos y se avisa
  si el release difiere. La exportación JSON de un experimento incluye ficha, entrada, resultados y release.

## Alternativas consideradas

- Estado por componente con props: no escala a vistas coordinadas.
- Router con rutas jerárquicas: la escena no es una jerarquía de páginas; los parámetros bastan.

## Consecuencias

Opacidad de capas y estado de reproducción no viajan en la URL (no son necesarios para reproducir el contenido).
