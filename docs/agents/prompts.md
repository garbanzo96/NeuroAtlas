# Prompts adaptados al repositorio

Versiones de los diez prompts del plan ([../plan-original/04-ejecucion-y-prompts.md](../plan-original/04-ejecucion-y-prompts.md)
§5) ajustadas a las rutas, formatos y reglas de este repositorio. Sustituye lo que está entre `<...>`. Adjunta
siempre `AGENTS.md`. Los prompts específicos de cada WP están en su archivo; estos son las plantillas generales.

---

## A. Sesión de Claude (arquitecto e integrador)

```text
Eres el arquitecto e integrador de NeuroAtlas (repositorio actual). Sigue CLAUDE.md y AGENTS.md.
1) Ejecuta npm ci && npm run check; si algo falla, arréglalo primero.
2) Lee la última entrada de docs/session-log.md, docs/roadmap.md, docs/backlog.md y docs/decisions-pending.md.
3) Objetivo de esta sesión: <WP-XXX, o "elige el siguiente WP desbloqueado de mayor impacto y justifícalo">.
4) Antes de cambiar contratos, escribe el ADR. No mezcles WP. No inventes datos ni fuentes: si faltan, deja la
   parte bloqueada explícitamente y sigue con contratos/UX.
5) Verifica comportamiento (pruebas, e2e, capturas si hay interfaz), registra decisiones y prepara el siguiente
   WP en docs/work-packages/ con prompt listo para un modelo económico si procede.
6) Cierre: actualiza backlog y session-log con lo verificado (comandos y resultados), commit y push a <rama>.
```

## B. Investigación con fuentes (modelo con búsqueda real)

```text
Investiga <PREGUNTA> para la unidad <UNIDAD>, nivel <NIVEL>, especie <ESPECIE>. Recupera fuentes reales con tus
herramientas; registra consultas, recursos, criterios de inclusión/exclusión y fecha. Si no puedes buscar o
acceder al texto, dilo y limita la salida: no inventes citas ni declares revisión sistemática.
Usa manuales para fundamentos (Kandel, edición <DEC-001>) y revisiones/estudios primarios para cambios y
controversias. Sin copias piratas; parafrasea.
Entrega:
1) Tabla: afirmación precisa | fuente (DOI/URL) | localizador (página/figura/pasaje) | especie/preparación |
   método | escala | resultado | inferencia permitida | límites | evidencia discrepante | relevancia docente.
2) Las afirmaciones como YAML válido para content/claims/ (esquema en packages/schemas/json/claim.schema.json),
   con status: draft, locatorVerified: false y provenance.extractor: "llm:<modelo>".
3) Fuentes nuevas como YAML para content/sources/ con verification.status: candidate.
Separa observación, hipótesis, modelo y simplificación. No conviertas conectividad en función causal ni
extrapoles entre especies. Busca resultados contradictorios. Para predicción/interocepción/Barrett, distingue
datos, interpretación y alternativas; no etiquetes una teoría como consenso. Cierra con lagunas y corpus fechado.
```

## C. Ontología y curación

```text
Con la evidencia <ARCHIVOS> y los esquemas de packages/schemas/json/ (entity, relation, claim), propone entidades
y relaciones para <ALCANCE> como YAML válido para content/. Conserva IDs originales de atlas/ontologías en
externalRefs (verified: false salvo auditoría), crea IDs internos según docs/adr/0003, y no asumas equivalencias
por nombre o parcelación. Separa part_of, conexión observada (con connection.modality real o pending_extraction),
participates_in, implemented_by_model y corresponds_to (con correspondence.category). Cada relación con claimIds.
No mezcles especies (el validador lo rechaza). Entrega YAML, tabla de mapeos con incertidumbre y conflictos para
revisión humana. Ejecuta (o pídeme ejecutar) npm run validate y corrige los errores.
```

## D. Assets anatómicos y 3D

```text
Prepara <ASSET> desde <FUENTE_AUTORIZADA> para la escena <ESCENA>. Antes de modificarlo verifica licencia, uso
permitido, atribución, versión y posibilidad de redistribuir, y deja la evidencia en docs/research/assets/.
Entrega: script reproducible de derivación, archivo optimizado y su entrada en content/assets/manifest.yaml
(kind, nature, origin, license con status verified solo si lo comprobaste, units, coordinateFrameId, processing).
Mantén la correspondencia de estructuras seleccionables con entidades. Explica qué pierde cada LOD. No construyas
tractos a partir de conexiones conceptuales ni presentes streamlines como axones. Si falta geometría válida, deja
el asset blocked_missing con motivo y WP. Mide tamaño y tiempo de carga.
```

## E. UX y evaluación docente

```text
Diseña <UNIDAD/ESCENA> para responder <TRES PREGUNTAS DOCENTES> con las escenas de content/scenes/. Entrega
flujo, estados y criterios observables antes de lo decorativo: exploración libre y recorrido guiado
(content/lessons/), rótulos por densidad, búsqueda, ficha de evidencia, selección persistente, capas y
transparencia, leyenda, escala y contexto visibles. Define hover/foco, toque y teclado con salida clara; explica
cambios de especie/dataset/abstracción (avisos de transición). Movimiento reducido, contraste y alternativa
textual al 3D. Propón cinco tareas para observar comprensión con errores esperados; no confundas satisfacción
visual con aprendizaje. Prioriza fallos por impacto docente.
```

## F. Modelos y simulaciones

```text
Implementa <MODELO_REFERENCIADO> para enseñar <FENÓMENO> en NeuroAtlas. Primero entrega la ficha como YAML para
content/models/ (esquema model.schema.json): ecuaciones, unidades, condiciones iniciales, parámetros con
sourceId y locator, preparación/especie, supuestos, validez y límites. Distingue fidelidad pedagógica y ajuste
experimental; nunca atribuyas el modelo a todas las neuronas. Justifica la abstracción (tasas, LIF, HH).
Después la implementación en packages/simulation/src/models/ registrada en registry.ts (mismos IDs y unidades
que la ficha: checkSpecCompatibility), solver y paso justificados, y pruebas: convergencia temporal,
comparación con una referencia independiente documentada (script en tools/reference/), límites fisiológicos
pertinentes y semilla si hay aleatoriedad. No acoples a una red anatómica sin mapeo justificado. Sigue ADR-0006.
La validación científica la hace el asesor: no la declares.
```

## G. Implementación acotada (modelo económico)

```text
Realiza únicamente <WP-XXX> en el repositorio NeuroAtlas. Te adjunto AGENTS.md, docs/work-packages/<WP-XXX>.md
y los archivos de su sección "Leer". Objetivo: <RESULTADO>. Respeta las rutas de "Crear/Modificar" y no toques
las de "No tocar". Conserva contratos e IDs; no cambies arquitectura, dependencias ni ciencia por iniciativa
propia. Si hay contradicción, infórmala y propone la mínima resolución. No inventes datos.
Implementa, ejecuta npm run check (y npm run e2e si tocas la interfaz) y corrige. No escribas pruebas que
repitan la implementación ni amplíes el alcance. Entrega: diff o archivos completos, salida de las
comprobaciones, criterios de aceptación cumplidos/incumplidos y limitaciones.
```

## H. Crítica científica independiente (otro modelo)

```text
Revisa <ARCHIVOS de content/claims, content/relations, content/scenes o content/models> contra <FUENTES>.
Evalúa atribución de especie, escala, causalidad, geometría, parámetros y discrepancias. Busca afirmaciones sin
soporte y casos donde una visualización (leyendas, flechas, colores, animaciones) sugiera más certeza que el texto.
Distingue fallo demostrable, evidencia insuficiente, desacuerdo legítimo y mejora didáctica. Por incidencia:
ID, fuente, gravedad, corrección y qué exige juicio experto. No apruebes lo que no pudiste verificar.
Si registras tu revisión, hazlo como Review con kind: llm_crosscheck (nunca human_expert) y sin cambiar status.
```

## I. Vigilancia y actualizaciones

```text
Actualiza solo <TEMA> desde la última búsqueda <FECHA>, con el protocolo docs/research/protocols/<PROTOCOLO>.md.
Recupera y verifica fuentes nuevas, correcciones y retractaciones. Entrega un diff revisable: afirmación anterior
(ID y versión), nueva evidencia, tipo de cambio, especie/método, confianza cualitativa justificada, assets/modelos
afectados y recomendación. Las modificaciones suben la `version` de la afirmación; no borres versiones ni
publiques automáticamente. Un paper reciente no reemplaza al consenso por sí solo. Indica cobertura, accesos
ausentes y fecha de corte, y propone revisión experta para cambios sustantivos.
```

## J. Visualización y animación científica

```text
Diseña la visualización/animación de <FENÓMENO> en la escena <ESCENA> para responder <PREGUNTA DOCENTE>, a partir
de <DATOS/MODELO> y los contratos del repositorio. Primero un storyboard y una tabla: elemento visible |
significado | variable/fuente | unidad | normalización | simplificación. Separa animación ilustrativa de
reproducción de datos o simulación (las ilustrativas se rotulan como tales). Todo cambio de especie, dataset,
coordenadas o escala temporal con rótulo y puente explícito (SceneTransition + didactic_bridge). Para mapear
resultados de simulación a la geometría usa VisualMapping con leyenda. No inventes trayectorias axonales,
velocidades ni eventos individuales a partir de una matriz regional. Controles de pausa/paso/repetición,
teclado, toque y movimiento reducido; mide el rendimiento en el hardware de DEC-003.
```
