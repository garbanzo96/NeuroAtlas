# Protocolo de búsqueda: unidad visual

Basado en [../../plan-original/05-fuentes-y-agenda.md](../../plan-original/05-fuentes-y-agenda.md) §3. Estado:
**no ejecutado** (WP-015). Al ejecutarlo, registrar fecha efectiva, bases consultadas, cadenas exactas, número de
resultados, criterios aplicados y accesos ausentes en `../evidence/WP-015.md`.

## Preguntas (separadas porque sus fuentes y escalas difieren)

1. Estaciones y lateralidad de la vía visual humana (retina → quiasma → tracto → NGL → radiación → V1).
2. Entradas y organización laminar de V1 en la especie elegida (DEC-004).
3. Mecanismos y límites del modelo de excitabilidad (Hodgkin–Huxley clásico; parámetros, temperatura, integración).

## Recursos

Capítulos autorizados de manuales (Kandel, DEC-001; libro computacional, DEC-002), PubMed/Europe PMC, Crossref
para metadatos (`npm run sources:verify-doi`), revisiones especializadas, artículos primarios y repositorios de
datos/modelos (ModelDB, NeuroMorpho.Org, Allen, MICrONS). Buscar también críticas a generalizaciones,
reconstrucciones incompletas y correspondencias entre especies.

## Cadenas iniciales (ajustar)

```text
(visual pathway OR geniculocortical) AND (anatomy OR retinotopy)
(primary visual cortex OR V1) AND (laminar OR microcircuit) AND <ESPECIE>
(cortical cell types) AND (morphology OR electrophysiology OR transcriptomics)
(Hodgkin Huxley) AND (parameters OR temperature OR numerical integration)
```

## Filtros

Fundamentos sin límite inferior; cambios recientes desde 2023 hasta la fecha de ejecución, más una búsqueda
específica 2025–2026 (sin confundir año indexado, preprint y publicación). No declarar la ventana revisada hasta
haber hecho las consultas.

## Inclusión / exclusión

**Incluir:** relación directa con la pregunta, contexto/especie identificables, fuente recuperable y método
suficiente para evaluar la afirmación. **Excluir:** citas no verificables para la afirmación publicada,
demostraciones gráficas sin procedencia, transferencias de parámetros sin justificación. Los estudios
inaccesibles quedan como pendientes, no como inexistentes.

## Salidas

Afirmaciones como YAML (prompt B de [../../agents/prompts.md](../../agents/prompts.md)), tabla de evidencia,
discrepancias, lagunas y fecha de corte.
