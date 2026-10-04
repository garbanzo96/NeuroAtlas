# Fuentes, agenda de investigación y control de cobertura

## 1. Estado de este documento

Este es un **mapa preliminar de fuentes para ejecutar la investigación**, fechado el 4 de octubre de 2026. No es una revisión sistemática ni un inventario exhaustivo actualizado de neurociencia. Los proyectos y publicaciones siguientes se proponen por su pertinencia conocida; sus páginas, releases, licencias y cobertura deben comprobarse durante la fase 0.

En esta preparación se verificaron mediante Crossref el título, DOI y fecha bibliográfica de Bastos y colaboradores (2012): *Canonical Microcircuits for Predictive Coding*, DOI `10.1016/j.neuron.2012.10.038`, noviembre de 2012. Esa comprobación de metadatos **no verifica sus resultados ni sustituye lectura del artículo**. No se completó la consulta externa de los demás recursos; se etiquetan como candidatos. No atribuirles fecha de acceso ni una licencia que no haya sido inspeccionada.

Los ejemplos de afirmaciones de `02-modelo-cientifico.md` son borradores editoriales, pendientes de extracción y revisión. No forman un corpus publicable.

## 2. Recursos candidatos y uso previsto

Estado **C**: candidato pendiente de comprobación documental. Estado **M**: metadatos bibliográficos comprobados; contenido no verificado. Un sitio oficial es un buen punto de entrada, pero no acredita que cualquier activo de ese sitio pueda redistribuirse.

| # | Fuente / punto de entrada | Uso previsto y alcance | Limitación que debe conservarse | Estado |
|---|---|---|---|---|
| 1 | Kandel y colaboradores, *Principles of Neural Science*, 6.ª edición como candidata; [McGraw Hill AccessMedicine](https://accessmedicine.mhmedical.com/) | Fundamentos anatómicos, fisiológicos y de sistemas; elegir edición y capítulos con el usuario. | Verificar edición, páginas y acceso. Manual y figuras no equivalen a recursos abiertos redistribuibles. | C |
| 2 | Dayan y Abbott, *Theoretical Neuroscience*; [MIT Press](https://mitpress.mit.edu/9780262541855/theoretical-neuroscience/) | Codificación, dinámica, aprendizaje y modelos; complemento candidato. | No se ha confirmado que sea el libro computacional que mencionó el usuario. | C |
| 3 | Gerstner y colaboradores, *Neuronal Dynamics*; [libro en línea](https://neuronaldynamics.epfl.ch/) | Modelos neuronales, redes y formalismos computacionales. | Comprobar edición, permisos de recursos y adecuación a cada modelo. | C |
| 4 | [EBRAINS](https://www.ebrains.eu/) y [Jülich Brain / siibra-explorer](https://siibra-explorer.org/) | Atlas humanos, parcelaciones y vínculos multimodales. | Parcelaciones y versiones tienen alcance distinto; atlas probabilístico no es anatomía exacta de cada individuo. | C |
| 5 | [siibra-python](https://siibra-python.readthedocs.io/) | Acceso programático y correspondencias de atlas para pipeline offline. | Verificar API, formatos, versión y términos de datasets; una biblioteca no resuelve por sí sola todas las correspondencias. | C |
| 6 | [BigBrain](https://bigbrainproject.org/) | Reconstrucción histológica humana y organización cortical. | Referencia de espécimen concreto; resolución geométrica no equivale a conectoma sináptico ni a variabilidad poblacional. | C |
| 7 | [Human Connectome Project](https://www.humanconnectome.org/) | Datos humanos de MRI, tractografía, actividad y organización a escala macroscópica. | Distinguir tractografía, conectividad funcional y anatomía sináptica; inspeccionar restricciones y sujetos. | C |
| 8 | [Allen Brain Map](https://portal.brain-map.org/) | Atlas de ratón/CCF, conectividad y recursos humanos/celulares; elegir producto y release. | No transferir CCF de ratón a humano ni dar por compatible toda clasificación. | C |
| 9 | [BICCN](https://biccn.org/) / [BICAN](https://www.bicannetwork.org/) | Taxonomías celulares, referencias multimodales y censos por especie/región. | Confirmar portales activos y releases. Cobertura y clases dependen de muestreo y modalidades; no es una taxonomía cerrada universal. | C |
| 10 | [MICrONS Explorer](https://www.microns-explorer.org/) | Conectómica y relaciones estructura–actividad en tejido de corteza visual de ratón; revisar colección de trabajos de 2025. | Volumen local y contexto experimental definido; no representa el conectoma humano completo ni prueba toda interpretación funcional. | C |
| 11 | [FlyWire](https://flywire.ai/) | Conectoma de cerebro de Drosophila adulta, navegación de circuitos y anotaciones; localizar artículos/releases de 2024 y posteriores. | Especie, espécimen y límites de reconstrucción explícitos; no extrapolar a circuitos corticales humanos. | C |
| 12 | [H01, fragmento de corteza humana](https://h01-release.storage.googleapis.com/landing.html) | Reconstrucción de microscopía electrónica a escala sináptica; localizar publicación de 2024. | Fragmento de tejido y preparación concretos; no cerebro humano completo ni registro funcional simultáneo. | C |
| 13 | [NeuroMorpho.Org](https://neuromorpho.org/) | Morfologías neuronales/gliales y metadatos para escenas celulares. | Una reconstrucción puede ser parcial y sufrir efectos de preparación; comprobar términos por depósito. | C |
| 14 | [Neuroglancer](https://github.com/google/neuroglancer) | Visor especializado y formatos para volúmenes y anotaciones masivos. | Herramienta, no fuente científica ni curador de evidencia; integración/licencia separadas de datos. | C |
| 15 | [OpenNeuro](https://openneuro.org/) | Datasets humanos/neuroimagen para preguntas funcionales y ejemplos reproducibles. | Revisar dataset, consentimiento/uso, versión y calidad; un archivo disponible no establece una conclusión. | C |
| 16 | [BIDS](https://bids.neuroimaging.io/) | Convenciones y metadatos de datasets de neuroimagen. | Estándar de organización; no ontología completa ni garantía de calidad científica. | C |
| 17 | [DANDI](https://dandiarchive.org/) y [NWB](https://www.nwb.org/) | Datos de neurofisiología, series y metadatos; elegir conjuntos pequeños y pertinentes. | DANDI es repositorio y NWB un estándar; revisar modalidades, permisos y validación por dataset. | C |
| 18 | [ModelDB](https://modeldb.science/) | Modelos publicados, código y vínculos con artículos. | Reproducir y revisar código/parametrización; presencia en repositorio no garantiza validez general. | C |
| 19 | [NEURON](https://nrn.readthedocs.io/) | Simulación de neuronas y redes con modelos detallados cuando sea necesario. | No obligatorio para MVP web; solver, mecanismos y contexto científico requieren verificación. | C |
| 20 | [Brian2](https://brian2.readthedocs.io/) | Modelos spiking/rate y experimentos computacionales; pipeline o motor posterior. | Seleccionar formalismo y unidades; simulación de red no equivale a conectoma funcional validado. | C |
| 21 | Hubel y Wiesel (1962), [DOI](https://doi.org/10.1113/jphysiol.1962.sp006837) | Candidato fundacional para respuestas de corteza visual y organización funcional. | Verificar preparación, especies, selección de unidades y localizadores; no generalizar curvas/cifras sin lectura. | C |
| 22 | Rao y Ballard (1999), [DOI](https://doi.org/10.1038/4580) | Modelo jerárquico de codificación predictiva visual; ecuaciones y fenómenos explicados. | Interpretación computacional contextualizada; no demostración de identidad con toda arquitectura biológica. | C |
| 23 | Bastos y colaboradores (2012), [DOI](https://doi.org/10.1016/j.neuron.2012.10.038) | Propuesta de microcircuitos para codificación predictiva; candidato para comparar mensajes y capas. | Metadatos verificados en esta fase; falta lectura y extracción. Propuesta de arquitectura no implica universalidad laminar. | M |
| 24 | Barrett y Simmons (2015), [DOI](https://doi.org/10.1038/nrn3950) | *Interoceptive predictions in the brain*: marco para interocepción y predicción. | Verificar texto, afirmaciones y alternativas; una revisión teórica no prueba por sí sola cada mecanismo. | C |
| 25 | Kleckner y colaboradores (2017), [DOI](https://doi.org/10.1038/s41562-017-0069) | *Evidence for a large-scale brain system supporting allostasis and interoception in humans*: candidato para organización funcional. | Verificar métodos y alcance; asociaciones/arquitectura funcional no establecen conexiones sinápticas ni validación global de teoría de emoción. | C |

Los artículos actuales deben localizarse en bases bibliográficas y cotejarse con la fuente primaria. La lista contiene hitos y recursos, no solamente los trabajos más recientes. Los enlaces candidatos pueden requerir corrección tras comprobación.

## 3. Protocolo de búsqueda por unidad

### Protocolo inicial visual

**Preguntas:** estaciones y lateralidad de vía visual; entradas y organización local de V1 en una especie elegida; mecanismos y límites del modelo de excitabilidad. Separar las tres preguntas porque sus fuentes y escalas son distintas.

**Recursos:** capítulos autorizados de manuales, PubMed/Europe PMC, Crossref para resolver metadatos, revisiones especializadas, artículos primarios y repositorios de datos/modelos. Buscar también literatura que critique generalizaciones, reconstrucciones incompletas y correspondencias entre especies.

**Cadenas iniciales para ajustar:**

```text
(visual pathway OR geniculocortical) AND (anatomy OR retinotopy)
(primary visual cortex OR V1) AND (laminar OR microcircuit) AND [SPECIES]
(cortical cell types) AND (morphology OR electrophysiology OR transcriptomics)
(Hodgkin Huxley) AND (parameters OR temperature OR numerical integration)
```

**Filtros:** fundamentos sin límite inferior; para cambios recientes, desde 2023 hasta la fecha efectiva de ejecución. Ejecutar una búsqueda adicional 2025–2026, sin confundir año indexado, preprint y fecha de publicación. No declarar esa ventana revisada mientras no se hayan realizado las consultas.

**Inclusión:** relación directa con pregunta, contexto/especie identificables, fuente recuperable y método suficiente para evaluar afirmación. **Exclusión:** citas que no se pueden verificar para la afirmación publicada, demostraciones gráficas sin procedencia, transferencias de parámetros sin justificación. Estudios inaccesibles pueden quedar como pendientes, no como inexistentes.

### Protocolo predictivo e interoceptivo

```text
(predictive coding OR predictive processing) AND
(laminar OR cortical microcircuit OR prediction error) AND
(experiment OR model OR alternative OR adaptation)

(interoception OR allostasis) AND
(predictive OR insula OR autonomic OR cortical architecture)

("Lisa Feldman Barrett" OR "Barrett LF") AND
(interoception OR allostasis OR brain)
```

Separar evidencia anatómica, actividad/tareas, intervenciones y modelos. Buscar controles de adaptación, atención, expectativas y precisión; distinguir explicaciones compatibles de predicciones que discriminan teorías. Una búsqueda por autor complementa, no sustituye, la búsqueda por problema y por hipótesis alternativa.

### Protocolos posteriores

- **Hipocampo/navegación:** especie/tarea, células de lugar y cuadrícula, secuencias/replay, dinámica del entorno, modelos de atractores y aprendizaje; incluir corteza entorrinal y otras estructuras pertinentes.
- **Control motor:** vías descendentes, bucles cortico–basales/cerebelosos, médula, retroalimentación sensorial; separar representación, planificación, ejecución y modelos de control.
- **Conectómica/tipos celulares:** resolución, extensión, muestra, segmentación, anotación, registros multimodales, errores y métricas; comprobar releases y versiones de clasificaciones.

## 4. Entregables de investigación

Por unidad: `protocol.md`, registro de búsquedas, bibliografía con IDs, tabla de evidencia, afirmaciones, catálogo de datasets/assets, lista de discrepancias y reporte del asesor. Las afirmaciones deben enlazar pasaje/figura/tabla/página cuando esa ubicación sea verificable. Un abstract puede orientar selección; su uso y límites se registran.

Ejemplo de tabla de cobertura:

| Tema | Fuentes recuperadas | Texto/activo inspeccionado | Afirmaciones extraídas | Revisión humana | Publicación |
|---|---|---|---|---|---|
| Vía visual humana | Pendiente | Pendiente | 0 | Pendiente | No |
| Circuito laminar de V1, especie por decidir | Pendiente | Pendiente | 0 | Pendiente | No |
| Modelo HH clásico | Pendiente | Pendiente | 0 | Pendiente | No |
| Arquitecturas predictivas | Metadatos de Bastos 2012 | No | 0 | Pendiente | No |

Guardar la distinción entre **fuente candidata**, **metadatos verificados**, **contenido inspeccionado**, **afirmación extraída**, **revisión experta** y **publicación**. Cada etapa requiere evidencia propia; no ascender automáticamente una referencia por haber resuelto su DOI.

## 5. Vigilancia y versiones

Fecha de corte por unidad, no una etiqueta global engañosa. Las búsquedas nuevas generan cambios propuestos: afirmaciones que se añaden, se acotan o se cuestionan; nuevas releases; correcciones/retractaciones; assets afectados. Preservar versiones y razones de cambio. Es preferible mantener pocas unidades con cobertura declarada que producir una enciclopedia cuyo estado científico no pueda auditarse.
