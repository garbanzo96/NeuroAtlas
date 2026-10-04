# NeuroAtlas: paquete de planificación para Claude

Plan inicial para una plataforma docente de neurociencia multiescala. Preparado el **4 de octubre de 2026**, para estudiantes avanzados y docentes. Ejecución prevista: tú con Claude y otros modelos, más asesores puntuales.

## Entrega a Claude

La forma más sencilla es adjuntar `NEUROATLAS_DOSSIER_COMPLETO.md` y utilizar el **prompt A** de `04-ejecucion-y-prompts.md`. Si Claude puede trabajar con archivos, entregar la carpeta completa o el ZIP y apuntar `[DIRECTORIO_PLAN]` a la carpeta descomprimida. No entregar el ZIP como si fuera una aplicación: contiene planificación y prompts, sin implementación.

Primera tarea: cerrar arquitectura concreta, esquemas validables, fuentes/assets del recorrido visual y backlog con dependencias. Después construir el camino mínimo integrado por bloques. Las validaciones científicas pendientes deben permanecer visibles; el resto del trabajo puede avanzar.

## Archivos

| Archivo | Contenido |
|---|---|
| [01-plan-maestro.md](01-plan-maestro.md) | Visión de producto, principios, primer módulo, expansión y riesgos. |
| [02-modelo-cientifico.md](02-modelo-cientifico.md) | Grafo, clasificaciones, escalas, evidencia, coordenadas y ejemplos de afirmaciones. |
| [03-arquitectura-e-interaccion.md](03-arquitectura-e-interaccion.md) | Stack, módulos, contratos, pipeline, UX y objetivos de rendimiento. |
| [04-ejecucion-y-prompts.md](04-ejecucion-y-prompts.md) | Equipo, reclutamiento, fases, presupuestos orientativos y diez prompts copiables. |
| [05-fuentes-y-agenda.md](05-fuentes-y-agenda.md) | 25 recursos/publicaciones candidatos, estado de comprobación y protocolos de investigación. |
| `NEUROATLAS_DOSSIER_COMPLETO.md` | Los cinco documentos reunidos en un archivo para transferencia. |
| `research/source-register.json` | Registro legible por máquina del estado de los 25 recursos. |
| `research/metadata-check.json` | Metadatos de la única referencia comprobada externamente en esta fase. |

## Estado de decisiones

**Confirmado por el usuario:** público inicial y forma de ejecución. **Recomendado en este plan:** primer recorrido visual, arquitectura web ligera y expansión por unidades. **Propuesto, sujeto a medición:** objetivos de rendimiento, herramientas particulares y plazos/costes. **Pendiente:** libros/ediciones, geometrías y licencias, especie/dataset del circuito, dispositivos y dedicación/gasto.

Los contratos TypeScript/YAML son bocetos para cerrar con ejemplos y validadores; no código listo para producción. Las afirmaciones de ejemplo son borradores, no conocimiento revisado. `Claim` es el nombre canónico recomendado para una afirmación; los nombres españoles de relaciones en el documento científico expresan significado y deberán mapearse a códigos estables.

## Tres comprobaciones antes de ampliar

1. Una unidad completa funciona y sus cambios de contexto resultan comprensibles.
2. Su contenido publicado es trazable, con revisión humana delimitada y derechos de uso comprobados.
3. Docentes y estudiantes pueden realizar las tareas esenciales; rendimiento, accesibilidad y simulación se han comprobado.

El plan no afirma haber revisado exhaustivamente la bibliografía hasta octubre de 2026. Separa candidatos, metadatos comprobados y contenido revisado. Cada nueva unidad necesita su propia investigación y validación.
