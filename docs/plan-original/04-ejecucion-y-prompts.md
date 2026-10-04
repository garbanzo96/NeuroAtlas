# Ejecución, equipo y prompts

Este plan parte de una persona que dirige el proyecto, trabaja con Claude y otros modelos y contrata asesorías puntuales. El primer público son estudiantes avanzados y docentes de neurociencia. El objetivo inicial es un recorrido docente científicamente defendible; la expansión enciclopédica llega después de probar ese recorrido.

## 1. Equipo mínimo y reclutamiento

| Función | Responsable inicial | Cuándo contratar y qué pedir |
|---|---|---|
| Dirección y edición científica | Tú | Elegir preguntas docentes, aceptar alcance y mantener decisiones. Reservar horas semanales estables. |
| Arquitectura e integración | Claude, con tu revisión | Mantener contratos, decisiones arquitectónicas y entregas ejecutables. Una revisión humana de ingeniería al cerrar la arquitectura y antes del piloto. |
| Investigación y extracción | Modelos con búsqueda real | Entregar afirmaciones trazables, diferencias entre especies y desacuerdos. Un modelo que revisa a otro sirve para detectar problemas; no sustituye al experto. |
| Anatomía y circuitos | Asesor de neuroanatomía/neurofisiología | Dos sesiones tempranas y revisión remunerada de la primera unidad; experiencia concreta en vía visual y circuitos corticales. |
| Modelos computacionales | Asesor de neurociencia computacional | Revisar ecuaciones, unidades, parámetros, condiciones experimentales y límites de los modelos. |
| 3D e interacción | Generalista web/3D por horas | Resolver adquisición de assets, rendimiento y accesibilidad cuando el prototipo revele problemas concretos. |
| Evaluación docente | 2–3 docentes y 5–8 estudiantes voluntarios | Observar tareas de aprendizaje. Esta muestra sirve para descubrir fallos, no para demostrar eficacia educativa. |

Al crecer a varios dominios, añadir curación/ingeniería de datos científicos, arte técnico y animación científica, diseño de interacción/pedagogía y mantenimiento de simulaciones. Reclutar cada función por un problema y entregable concreto; no hace falta abrir todos los puestos al comenzar.

Buscar asesores en departamentos universitarios, comunidades de neurociencia computacional y responsables de atlas o herramientas abiertas. Invitar con un encargo de una página: pregunta concreta, artefacto que revisarán, horas, remuneración y entregable. Antes de contratar, pedir una revisión breve remunerada de un caso: detectar una conexión atribuida a la especie equivocada, una geometría sin licencia y una interpretación que excede la evidencia. Seleccionar por criterio y claridad, además de publicaciones.

No hace falta formar todos estos puestos como empleos permanentes. Para un presupuesto pequeño, priorizar 2–4 sesiones de 60–120 minutos: elección de fuentes/contextos, revisión del circuito, revisión de simulación y cierre de la unidad. Una persona puede cubrir dos asesorías si tiene experiencia verificable; conviene una segunda mirada independiente sobre el primer módulo. No subir manuscritos confidenciales o material de asesores a modelos sin autorización.

## 2. Fases y condiciones para avanzar

Los plazos son estimaciones de trabajo humano y revisión; generar código rápidamente no elimina curación, depuración ni validación.

| Fase | Entrega | Condición para avanzar |
|---|---|---|
| 0. Acotar, 1–2 semanas | Preguntas docentes, fuentes candidatas, inventario de assets y riesgos | Un recorrido explicable en 10–15 minutos; assets accesibles y licencias comprobadas; resolver libro/edición cuando afecten la tarea. |
| 1. Base, 2–3 semanas | Arquitectura, esquemas, ADR, 15–25 afirmaciones curadas, prototipo de navegación | Identificadores estables, procedencia consultable, especies separadas, estados de incertidumbre y carga de datos validados. |
| 2. Unidad vertical, 3–5 semanas | Retina → LGN → V1 → circuito laminar → célula/potencial de acción | Recorrido completo con geometría anatómica real donde corresponda, esquemas declarados, simulación reproducible y navegación por teclado. |
| 3. Piloto, 2–3 semanas | Observaciones de estudiantes/docentes y correcciones | Las tareas esenciales son realizables; sin errores científicos bloqueantes; tiempos de carga y fluidez medidos en dispositivos objetivo. |
| 4. Ampliar, ciclos de 2–4 semanas | Una nueva unidad cada ciclo | Reutiliza contratos; tiene evidencia, revisión, presupuesto y una pregunta docente propia. |

Las cinco escenas de la unidad visual representan contextos distintos. La anatomía humana, un esquema laminar de una especie documentada y el Hodgkin–Huxley clásico del axón de calamar se enlazan mediante explicaciones y transiciones. No implican que exista un registro espacial continuo entre esos datos. Si falta un asset autorizado, se usa un esquema etiquetado o se reduce el alcance; no se fabrica un cerebro presentado como anatomía real.

Priorizar después una unidad motora o hipocampal según disponibilidad de fuentes y evaluación docente. Las arquitecturas predictivas, la interocepción y las propuestas asociadas a Lisa Feldman Barrett requieren comparar modelos y evidencia; se integran como hipótesis y marcos con alcance explícito. La versión inicial no promete sintetizar toda la neurociencia ni permanecer automáticamente actualizada.

## 3. Presupuesto y capacidad

Estimaciones acumuladas orientativas en dólares estadounidenses, excluidos sueldo propio, impuestos, hardware nuevo y licencias extraordinarias. Son reservas de planificación, no tarifas comprobadas de proveedores. Ajustar después del inventario y la primera revisión.

| Escenario | Tiempo calendario | Dedicación tuya | Asesoría especializada | Reserva de gasto total |
|---|---|---|---|---|
| Demostrador de un recorrido | 6–10 semanas | 60–150 h | 4–8 h | 400–1.800 USD |
| Alfa docente revisada | 3–5 meses | 150–300 h | 12–24 h | 1.500–5.000 USD |
| Piloto con 2–3 unidades | 6–9 meses | 300–550 h | 25–50 h | 3.500–10.000 USD |

Estos rangos suponen datos abiertos, infraestructura ligera, una dedicación de aproximadamente 10–15 horas semanales y poco desarrollo contratado. Reservar inicialmente 40–150 USD/mes para modelos, ejecución y almacenamiento, y 60–180 USD/h de asesoría como supuestos que deberán contrastarse. Un especialista 3D contratado durante semanas cambia el presupuesto de forma sustancial. Con menos dinero, reducir unidades y horas de producción visual antes que eliminar revisión científica. Establecer un límite mensual de llamadas a modelos y cachear búsquedas y resultados.

## 4. Paquetes de trabajo y contratos

Cada encargo se registra con `id`, objetivo docente, dependencias, entradas versionadas, salidas, criterios de aceptación, responsable, presupuesto y dudas. Un modelo simple recibe un paquete pequeño ya especificado. Claude conserva el contexto de integración y decide cambios de contratos mediante ADR.

| Paquete | Entradas → salidas | Contrato y comprobación |
|---|---|---|
| Evidencia | Pregunta y corpus → afirmaciones, fuentes y discrepancias | Cada afirmación tiene fuente, especie, método, alcance y fecha de verificación; comprobar que la fuente respalda exactamente el texto. |
| Ontología | Términos/afirmaciones → entidades y relaciones | IDs persistentes; sinónimos separados de equivalencias; relaciones tipadas; validador detecta referencias rotas y mezcla de contextos. |
| Assets | Dataset, derechos y coordenadas → geometría y manifiesto | Autor, versión, licencia, atribución, especie, unidades, sistema de coordenadas y transformación; revisión visual de orientación y correspondencia anatómica. |
| UX | Preguntas docentes y escenas → flujo e interacciones | Hover, foco, toque, selección y salida equivalentes; tareas observables y ruta sin ratón; comprobar móvil y reducción de movimiento. |
| Simulación | Artículo/modelo → implementación y ficha | Ecuaciones, unidades, solver, parámetros y procedencia; comparar contra referencia, conservación cuando aplique y convergencia al reducir paso. |
| Integración | Contratos y componentes → unidad completa | Selección y contexto permanecen coherentes; carga/error explícitos; sin enlaces de evidencia falsos; prueba del recorrido y presupuesto de rendimiento. |
| Revisión | Unidad y registro de afirmaciones → incidencias y dictamen | Separar error, inferencia excesiva, incertidumbre y mejora editorial; bloquear publicación del contenido con errores científicos materiales. |
| Actualización | Corpus y versión previa → cambios revisables | Diferencia entre versiones, motivo y nueva evidencia; conservar referencias históricas; no reemplazar automáticamente contenido validado. |

**Definition of Done de una unidad:** funciona desde una instalación limpia; cumple una tarea docente completa; toda afirmación científica publicada es trazable; revisiones expertas tienen responsable, fecha y alcance; contextos/especies/modelos están rotulados; assets tienen derechos y procedencia; simulaciones muestran supuestos; pruebas significativas pasan; teclado y toque funcionan; rendimiento se mide; limitaciones y deuda quedan registradas. No basta con una captura atractiva o código que compila.

## 5. Prompts copiables

Sustituir los campos entre corchetes. Adjuntar archivos concretos y limitar cada sesión a un paquete. Los nombres de documentos deben ajustarse al directorio entregado. Estos prompts especifican procedimientos; no proporcionan acceso a fuentes que el modelo no tenga.

### A. Prompt maestro para Claude

```text
Actúa como arquitecto e integrador de NeuroAtlas, un entorno docente interactivo
multiescala para estudiantes avanzados y docentes de neurociencia. El equipo es
una persona, modelos y asesores puntuales. Debes entregar trabajo ejecutable,
documentado y comprobable, por unidades pequeñas.

Lee primero README.md, 01-plan-maestro.md, 02-modelo-cientifico.md,
03-arquitectura-e-interaccion.md, 04-ejecucion-y-prompts.md y
05-fuentes-y-agenda.md en [DIRECTORIO_PLAN], README/AGENTS del repo y el estado
existente. No supongas que todos los ejemplos son decisiones firmes.
Entrega un mapa de requisitos: obligatorio, recomendado, pendiente; enumera
contradicciones y decide las reversibles con fundamento. Pregunta solo cuando
falte una decisión imprescindible. No reescribas trabajo válido ni mezcles tareas.

Antes de programar, produce: arquitectura concreta; estructura del repo;
componentes y límites; decisiones ADR con alternativas; esquemas validables de
entidad, relación, afirmación, evidencia, asset, escena/contexto y modelo;
contratos de selección, transición y simulación; inventario de fuentes/assets;
presupuesto de rendimiento medible; backlog con dependencias y aceptación.
Adapta nombres a los esquemas del plan. Define IDs, unidades, coordenadas,
especie, versión y errores. Mantén datos científicos fuera del código de UI.

Después implementa una unidad completa: retina → LGN → V1 → circuito laminar
→ célula/potencial de acción. Usa assets anatómicos autorizados y documentados.
Un esquema didáctico debe decir que lo es. No generes una escena cerebral
ficticia presentada como anatomía. No infieras registro espacial entre anatomía
humana, circuito de otra especie y HH clásico. Cada cambio de contexto requiere
manifest y puente conceptual visible. Usa fuentes disponibles; señala lo que
falta. Si no hay fuentes/assets, sigue con contratos y UX, y deja esa parte
bloqueada explícitamente; no la rellenes con datos inventados.

Entrega primero un camino mínimo integrado, con panel de evidencia, navegación
por teclado/toque, controles de capas, transición entre contextos y una simulación
desacoplada. Evita expandir a todo el cerebro. Delegar a modelos simples mediante
paquetes con archivos, contratos, alcance y aceptación. Cada iteración: ejecutar,
verificar comportamiento relevante, corregir, registrar decisión y dejar la unidad
revisable. Pide asesoría sobre ciencia, sin presentarte como su sustituto.

Al cerrar: instrucciones reproducibles, resultados de comprobación, cambios,
limitaciones, fuentes/licencias y siguiente paquete. No despliegues ni publiques
contenido externo sin la autorización correspondiente del usuario.
```

### B. Investigación con recuperación de fuentes

```text
Investiga [PREGUNTA] para [UNIDAD, NIVEL, ESPECIE]. Recupera fuentes reales
mediante las herramientas disponibles. Registra consulta, recursos buscados,
criterios de inclusión/exclusión y fecha efectiva de búsqueda. Si no puedes buscar
o acceder al texto, dilo y limita la salida; no inventes citas ni declares revisión
sistemática sin protocolo y cobertura suficientes.

Usa manuales para fundamentos y revisiones/estudios primarios para cambios y
controversias. Para Kandel solicita edición/capítulo si hace falta; el título del
libro de neurociencia computacional está pendiente: no lo supongas. Usa acceso
abierto, biblioteca o material autorizado; no busques copias piratas ni reproduzcas
figuras/textos protegidos sin derechos. Parafrasea y cita las fuentes consultadas.

Entrega tabla: afirmación precisa; fuente/DOI/URL verificable; pasaje, página o
figura cuando esté disponible; especie/preparación; método; escala; resultado;
inferencia permitida; límites; evidencia discrepante; relevancia docente.
Separa observación, hipótesis, modelo y simplificación. No conviertas conectividad
en función causal ni extrapoles entre especies sin evidencia. Busca activamente
resultados contradictorios. Para predicción/interocepción y Barrett, distingue
datos, interpretación y alternativas; no etiquetes una teoría como consenso por
su popularidad. Cierra con lagunas, revisión experta necesaria y corpus fechado;
nunca con la afirmación «todo actualizado».
```

### C. Ontología y curación

```text
Con [EVIDENCIA] y [ESQUEMAS], propone entidades y relaciones para [ALCANCE].
Conserva ID original, versión de atlas, especie y contexto; crea IDs internos
estables. No asumas que áreas con nombres similares o parcelaciones distintas
son equivalentes. Separa parte-de, conexión observada, función asociada,
implementación de modelo y correspondencia tentativa. Adjunta evidencia a cada
relación científica, incluyendo método, dirección y contexto cuando corresponda.
Entrega datos validables, tabla de mapeos con incertidumbre y conflictos para
revisión humana. No rellenes ausencias con plausibilidad ni inventes porcentajes
de confianza. Comprueba referencias, duplicados y unidades.
```

### D. Assets anatómicos y 3D

```text
Prepara [ASSET] desde [FUENTE_AUTORIZADA] para [ESCENA]. Antes de modificarlo,
verifica licencia, uso permitido, atribución, versión y posibilidad de redistribuir.
Entrega geometría optimizada y manifiesto con especie, procedencia, unidades,
coordenadas, transformación, orientación, procesamiento y checksum.
Mantén correspondencia de estructuras seleccionables. Explica qué pierde cada
LOD y verifica visualmente cortes, laterales y rótulos con referencias. No construyas
tractos reales a partir de conexiones conceptuales ni presentes streamlines como
axones individuales. Si falta geometría válida, propone un esquema declarado.
Reporta tamaño, tiempo de carga y rendimiento en [DISPOSITIVO_OBJETIVO].
```

### E. UX y evaluación docente

```text
Diseña [UNIDAD] para responder [TRES_PREGUNTAS_DOCENTES] con [ESCENAS].
Entrega flujo, estados y criterios observables antes de detalles decorativos.
Incluye exploración libre y recorrido guiado; rótulos por densidad; búsqueda;
panel de evidencia; selección persistente; transparencia; leyenda; escala y
contexto visibles. Define hover/foco, toque/selección y teclado con salida clara.
Explica cambios de especie, dataset y abstracción en las transiciones. Respeta
reducción de movimiento, contraste y una alternativa textual al 3D. Diseña cinco
tareas para observar comprensión y navegación, con errores esperados y sin
confundir satisfacción visual con aprendizaje. Prioriza fallos por impacto docente.
```

### F. Modelos y simulaciones

```text
Implementa [MODELO_REFERENCIADO] para enseñar [FENOMENO], usando [PARAMETROS].
Primero entrega ecuaciones, unidades, condiciones iniciales, procedencia,
preparación/especie, supuestos y rango de validez. Distingue fidelidad pedagógica
y ajuste experimental. Nunca atribuyas este modelo a todas las neuronas.
Elige y justifica la abstracción: modelo de tasas para actividad poblacional;
spiking/LIF para tiempos de disparo y dinámica de redes; HH para corrientes y
potencial de membrana. No presentes esos niveles como equivalentes. En HH
clásico identifica axón de calamar, temperatura y convenciones; usar parámetros
humanos exige su propia fuente. En redes rate/spiking, documenta conectividad,
signo sináptico, retardos y ruido. Un parámetro útil para demostrar un fenómeno
no se convierte por ello en una medición anatómica o fisiológica.
Define solver, paso, estabilidad, rangos de controles y ejecución desacoplada.
Compara resultados con una implementación o figura de referencia documentada;
comprueba convergencia temporal y límites fisiológicos pertinentes. Conserva
semilla si hay aleatoriedad. Produce ficha, experimento reproducible, tests
significativos y límites visibles. No acoples a una red anatómica sin mapping y
justificación científica explícitos. Consulta al asesor antes de validarlo como ciencia.
```

### G. Implementación para un modelo más simple

```text
Realiza únicamente [PAQUETE_ID] en [ARCHIVOS]. Objetivo: [RESULTADO]. Entradas:
[DATOS/CONTRATOS]. Salidas: [INTERFACES]. Aceptación: [COMPORTAMIENTOS].
Lee las instrucciones del repo y los archivos necesarios. Conserva contratos e
IDs; no cambies arquitectura, dependencias o ciencia por iniciativa propia.
Si hay contradicción, informa y propone la mínima resolución. No inventes datos.
Implementa, ejecuta comprobaciones relevantes y corrige fallos. No escribas tests
que repitan la implementación ni amplíes el alcance. Entrega cambios, evidencia
de funcionamiento y limitaciones; deja claro cualquier criterio aún incumplido.
```

### H. Crítica científica independiente

```text
Revisa [UNIDAD/AFIRMACIONES] contra [FUENTES]. Evalúa atribución de especie,
escala, causalidad, geometría, parámetros y discrepancias. Busca afirmaciones
sin soporte y situaciones donde una animación sugiera más certeza que el texto.
Distingue fallo demostrable, evidencia insuficiente, desacuerdo legítimo y mejora
didáctica. Para cada incidencia indica ubicación/ID, fuente, gravedad, corrección
y qué exige juicio experto. No apruebes material que no hayas podido verificar.
Entrega un dictamen con alcance y exclusiones explícitos. Una revisión LLM no
debe etiquetarse como validación de un especialista humano.
```

### I. Vigilancia y actualizaciones

```text
Actualiza solo [TEMA] desde la última búsqueda [FECHA], con el protocolo [ID].
Recupera y verifica fuentes nuevas/correcciones/retractaciones. Entrega un diff:
afirmación anterior, nueva evidencia, tipo de cambio, especie/método, confianza
cualitativa justificada, assets/modelos afectados y recomendación. Conserva
versiones previas. No publiques automáticamente resultados ni conviertas un
paper reciente en reemplazo de consenso. Identifica cobertura y accesos ausentes.
Propón revisión experta para cambios sustantivos y registra fecha de corte.
```

### J. Visualización y animación científica

```text
Diseña la visualización/animación de [FENOMENO] en [ESCENA], para responder
[PREGUNTA_DOCENTE], a partir de [DATOS/MODELO] y los contratos del proyecto.
Primero entrega un storyboard y una tabla: elemento visible, significado,
variable/fuente, unidad, normalización y simplificación. Separa animación
ilustrativa y reproducción de datos o simulación. Todo cambio de especie,
dataset, coordenadas o escala temporal debe tener rótulo y puente explícito.

Especifica cámara, selección, capas, cortes, transparencia, leyendas, densidad
de etiquetas y estados de carga/error. Coordina 3D con curvas/diagramas 2D.
Para un potencial de acción, vincula Vm y corrientes a variables del modelo;
partículas/canales son esquemas salvo datos que justifiquen esa representación.
No inventes trayectorias axonales, velocidades de conducción ni eventos de
neuronas individuales a partir de una matriz regional. Una animación de flujo
conceptual debe identificarse como tal.

Entrega componentes y assets separados de afirmaciones científicas, mapping
explícito variable→representación, controles de pausa/paso/repetición y exportación
del experimento cuando corresponda. Respeta teclado, toque y movimiento reducido.
Mide [PRESUPUESTO_RENDIMIENTO] con escena y hardware definidos. Evalúa si el
usuario interpreta correctamente cada símbolo antes de aumentar complejidad.
```

## 6. Decisiones pendientes para el inicio

Confirmar edición y capítulos de Kandel, título/edición del manual de neurociencia computacional, dispositivos objetivo, horas semanales y límite de gasto. Son decisiones registrables: no impiden inventariar fuentes abiertas ni preparar contratos. El primer encargo a Claude debería cerrar ese inventario y producir arquitectura revisable antes de multiplicar las unidades.
