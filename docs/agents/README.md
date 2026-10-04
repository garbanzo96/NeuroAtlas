# Guía para trabajar con varios modelos

Cómo repartir el trabajo entre tú, asesores humanos, Claude y modelos más económicos (ChatGPT, Kimi u otros)
sin perder coherencia de arquitectura ni rigor científico.

## 1. Qué hace cada uno

| Tipo de tarea                                                     | Quién                                            | Por qué                                                                      |
| ----------------------------------------------------------------- | ------------------------------------------------ | ---------------------------------------------------------------------------- |
| Decisiones docentes, legales y de alcance                         | **Tú**                                           | Son tuyas; ningún modelo debe decidirlas por ti.                             |
| Validar ciencia (anatomía, fisiología, modelos)                   | **Asesor humano**                                | Solo su revisión (`human_expert`) permite pasar de `draft`.                  |
| Contratos, ADR, integración, depuración difícil, revisar entregas | **Claude** (sesión de Claude Code)               | Mantiene el contexto de arquitectura; cambios de contrato centralizados.     |
| WP de código acotados (componentes, pruebas, scripts, CSS)        | **Modelo económico**                             | Bien especificados en su WP; el validador y CI frenan errores.               |
| Búsqueda y extracción de evidencia                                | **Modelo con búsqueda real** + verificación tuya | Los modelos inventan citas; todo localizador lo confirma una persona.        |
| Revisión cruzada de afirmaciones                                  | Otro modelo (prompt H)                           | Detecta problemas; se registra como `llm_crosscheck`, nunca como validación. |

Los WP del backlog indican el ejecutor recomendado (U, H, C, M, R).

## 2. Flujo para un WP con un modelo económico

1. Elige un WP `M` cuyas dependencias estén resueltas ([../backlog.md](../backlog.md)).
2. Conversación nueva. Pega el **prompt para copiar** del WP y adjunta `AGENTS.md`, el archivo del WP y los
   archivos de su sección "Leer" (o da acceso al repositorio si la herramienta lo permite).
3. Pide archivos completos o diff. Aplica en una rama `wp-XXX-...`.
4. Ejecuta `npm run check` (y `npm run e2e` si tocó la interfaz). Si falla, devuelve el error al mismo modelo.
   **Máximo 2–3 iteraciones**; si sigue fallando, pásalo a Claude con el historial.
5. PR con la plantilla. Revisión con [review-checklist.md](review-checklist.md) (Claude o tú).
6. Marca el WP en el backlog y añade una línea en [../session-log.md](../session-log.md).

Si el modelo **puede ejecutar comandos** (entornos con terminal), exígele que pegue la salida de
`npm run check`. Si **no puede**, ejecútalos tú: nunca aceptes "debería funcionar".

## 3. Flujo para una sesión de Claude

Pega el prompt A de [prompts.md](prompts.md). Claude sigue el protocolo de [../../CLAUDE.md](../../CLAUDE.md):
comprueba el estado, lee el registro de sesiones, elige WP, ejecuta, verifica, actualiza backlog y registro.

## 4. Control de costes

- Un WP por conversación; adjunta solo los archivos listados (el WP ya hace el trabajo de selección).
- Los WP `M` están pensados para modelos económicos: no gastes Claude en ellos salvo para revisar.
- La extracción de evidencia (WP-010) es la tarea más cara en tiempo humano: agrúpala por fuente (un capítulo
  o artículo por sesión) para leer cada fuente una vez.
- Cachea resultados: las auditorías de DOI y ontologías quedan en `docs/research/` y no hay que repetirlas.

## 5. Lo que ningún modelo debe hacer (aunque se lo pidas por error)

- Cambiar `status` científico por encima de `draft` o marcar `locatorVerified: true` sin lectura humana.
- Añadir assets externos sin licencia verificada, o "aproximar" anatomía a mano.
- Cambiar contratos de `packages/schemas` sin ADR (eso es trabajo de Claude, revisado por ti).
- Desactivar pruebas, reglas del validador o comprobaciones de CI para que algo "pase".
- Publicar o desplegar sin tu autorización.
