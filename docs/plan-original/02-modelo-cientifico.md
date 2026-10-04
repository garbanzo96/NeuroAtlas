# Modelo científico y epistemológico del atlas

El atlas debe ser una interfaz de conocimiento trazable y una colección de modelos examinables. Una imagen anatómica, un resultado experimental y una simulación no tienen el mismo estatuto: la interfaz debe indicarlo siempre. La continuidad visual entre escalas facilita la exploración, pero no demuestra una continuidad causal ni una medición simultánea en un mismo organismo.

## 1. Alcance científico: escalas, dimensiones y recorridos

Usar escalas orientativas; sus límites se solapan y dependen de la especie, el tejido y el instrumento.

| Escala espacial | Objetos relevantes | Dinámicas y observaciones habituales |
|---|---|---|
| Organismo y sistema nervioso | Encéfalo, médula, nervios periféricos, ganglios, órganos y sensores | Milisegundos a años; conducta, desarrollo y regulación corporal |
| Sistemas y regiones | Corteza, núcleos, cerebelo, vías, redes distribuidas | Milisegundos a minutos; conducción, ritmos, tareas y estados |
| Mesoscópica | Capas, columnas cuando corresponda, poblaciones, microcircuitos | Submilisegundos a horas; actividad, sincronía y plasticidad |
| Celular | Neuronas, glía, morfologías, axones y dendritas | Submilisegundos a días; excitabilidad, señalización y homeostasis |
| Subcelular y molecular | Sinapsis, canales, receptores, orgánulos | Microsegundos a años según proceso; apertura de canales, transmisión y remodelación |

Agregar tres ejes independientes: **resolución del dato**, **extensión observada** y **escala del proceso**. Una señal fMRI agregada no es una observación directa de disparos individuales; un potencial de acción simulado tampoco es una medición. La escala temporal debe especificar muestreo, duración, ventana de agregación y filtro, cuando existan.

Ofrecer recorridos por anatomía, vía sensorial, función, desarrollo, especie y pregunta computacional. Ninguno organiza exhaustivamente todos los otros. Un recorrido «visión → V1 → población → neurona → sinapsis» combina datasets y representaciones: debe mostrar los cambios de procedencia y las correspondencias inferidas al cruzar escalas.

Cobertura mínima del mapa conceptual: sistema central y periférico; somático, autonómico y entérico; tronco y médula; cerebelo; ganglios basales; tálamo e hipotálamo; hipocampo y corteza; glía, vasculatura y barreras cuando sean pertinentes. El sistema nervioso debe poder conectarse con cuerpo y ambiente para interocepción, acción y aprendizaje. El MVP puede limitar datos implementados, pero no debe hacer desaparecer esos dominios de la ontología.

## 2. Grafo de conocimiento y clasificaciones múltiples

No construir una única taxonomía universal. Un área puede tener varias parcelaciones; una célula puede clasificarse por transcriptómica, morfología, conectividad y electrofisiología sin que esas clases coincidan uno a uno. Representar clasificaciones versionadas y correspondencias explícitas.

**Entidades:** organismo/cohorte; muestra; región; parcelación y parcela; capa; población; tipo celular según esquema; célula; compartimento; sinapsis; vía; red; proceso; tarea; capacidad operacionalizada; variable; modelo; dataset; método; fuente; afirmación y recurso visual.

**Relaciones:** `parte_de`, `ubicado_en`, `clasificado_como`, `conecta_con`, `proyecta_a`, `modula`, `participa_en`, `medido_por`, `implementado_por_modelo`, `sustenta`, `contradice`, `corresponde_a` y `derivado_de`.

Cada relación relevante tiene identificador, contexto, procedencia y versión. `conecta_con` debe distinguir conexión sináptica observada, trazado axonal, tractografía, conectividad funcional y conectividad efectiva estimada. La direccionalidad, peso, signo y retraso solo existen si el método los permite; ausencia de dato no equivale a ausencia de conexión. Una arista funcional tampoco implica necesariamente una conexión anatómica directa.

`participa_en` vincula región y tarea con evidencia y condiciones; no convierte una región en sede exclusiva de una capacidad. Evitar el razonamiento «se activó X, por tanto ocurrió Y» sin evaluar especificidad y alternativas.

Las correspondencias entre especies, atlas y clases usan categorías como `equivalente_según_esquema`, `aproximada`, `uno_a_varios` e `incierta`. La homología requiere su propia justificación; no basta un parecido geométrico o un nombre compartido.

## 3. Cuatro capas científicas separadas

1. **Anatomía observada o reconstruida:** superficies, volúmenes, células y conexiones, conservando origen y procesamiento.
2. **Función medida e inferida:** respuestas, tareas, estados, asociaciones y efectos de intervenciones. Separar medida de interpretación.
3. **Modelo computacional:** ecuaciones, supuestos, parámetros, entradas y predicciones. Sus animaciones muestran una ejecución del modelo.
4. **Evidencia:** fuentes, métodos, contexto, incertidumbres, discrepancias y estado de revisión de cada afirmación.

Las capas pueden superponerse, pero deben identificarse mediante texto e iconos además del color. Cambiar transparencia no cambia confianza. Una estructura reconstruida, una interpolación y una ilustración deben ser distinguibles. Los modelos idealizados requieren la etiqueta «esquema» y sus simplificaciones.

### Microcircuitos, hubs y sistemas predictivos

«Microcircuito canónico» describe una familia de propuestas útiles, no una unidad universal intercambiable. Explicitar región, especie, edad, capas, clases celulares, neurotransmisores y excepciones. No trasladar automáticamente esquemas neocorticales a corteza agranular, cerebelo o formación hipocampal. Las diferencias regionales constituyen contenido del atlas.

Un hub depende del grafo construido, la métrica, el umbral, la parcelación y el conjunto de nodos. Guardar esos parámetros y evaluar estabilidad cuando sea posible. Alto grado, intermediación y participación entre módulos son propiedades distintas; ninguna implica por sí sola control causal o «importancia cognitiva».

Distinguir codificación predictiva, procesamiento predictivo, inferencia activa y teorías de construcción de la emoción. Comparten algunas ideas, pero no son sinónimos. Las propuestas relacionadas con Lisa Feldman Barrett conectan regulación corporal, alostasis, interocepción y construcción de experiencia: su arquitectura funcional y sus interpretaciones computacionales deben examinarse por afirmación. La existencia de circuitos interoceptivos no prueba por sí misma una teoría global de emoción.

Presentar mecanismos alternativos y predicciones que los diferencien. No asignar automáticamente «predicción», «error» y «precisión» a determinadas capas o células. Esas asignaciones necesitan un modelo concreto y evidencia contextual. Una respuesta a estímulos inesperados puede admitir explicaciones por adaptación, atención o aprendizaje; la revisión debe examinar esos controles.

## 4. Identidad, coordenadas y reutilización

Cada objeto científico debe incluir especie y referencia taxonómica; estado de desarrollo; tejido; identificador de muestra o población; sexo y otras variables cuando estén disponibles y sean relevantes; método; fecha y versión. Registrar información desconocida explícitamente.

Un espacio geométrico requiere `space_id`, atlas y versión, unidades, origen, orientación de ejes, lateralidad, resolución y referencia. Nunca asumir que «MNI» identifica un único espacio intercambiable. Guardar coordenadas originales junto con las transformadas.

Cada transformación registra espacios origen/destino, método, archivo o parámetros, versión, restricciones, error evaluado y procedencia. Especificar si es afín, no lineal, sobre superficie o entre especies. Una transformación geométrica entre especies no establece homología funcional. Permitir inspeccionar registro y desajustes; no mostrar precisión submilimétrica si el dato o la transformación no la justifican.

Para toda fuente y activo registrar licencia, titular, atribución, condiciones de redistribución, URL, fecha de acceso, checksum y derivaciones. Los libros de Kandel y otros manuales pueden orientar conceptos con edición y página verificadas; no asumir permiso para copiar texto, tablas o ilustraciones. Datasets, código, mallas y publicaciones pueden tener licencias diferentes. Separar material autorizado para redistribución, material enlazable y material interno pendiente de revisión.

## 5. Esquema de afirmaciones verificables

Una afirmación es una proposición acotada; no un párrafo que mezcle anatomía, causalidad y teoría. Debe poder corregirse o retirarse sin borrar el objeto anatómico asociado.

```yaml
claim_id: identificador_estable
version: entero
proposition: frase_con_alcance_explícito
kind: observación | asociación | intervención_causal | inferencia | predicción_modelo
subject_ids: [entidades_versionadas]
predicate: relación_o_propiedad
object: entidad_o_valor_con_unidad
context:
  species: identificador
  population_sample: descripción_o_desconocido
  developmental_stage: valor_o_desconocido
  region_atlas_space: referencias_o_no_aplica
  preparation_task_state: descripción
measurement: método_y_variable_o_no_aplica
model: versión_supuestos_parámetros_o_no_aplica
evidence:
  - source_id: identificador
    locator: figura_tabla_página_pasaje_o_pendiente
    relation: sustenta | contradice | contextualiza
    method_limitations: texto
uncertainty:
  measurement: valor_o_no_reportado
  sampling_generalization: texto
  competing_explanations: texto
status: borrador | revisada | publicada | cuestionada | retirada
review: responsable_fecha_criterios
provenance: autor_extractor_fecha_y_transformaciones
display: capas_permitidas_etiqueta_y_vinculación_visual
```

No reducir confianza a una puntuación única. Mostrar por separado precisión de medida, diseño causal, alcance poblacional, replicación, correspondencia de especies y desacuerdo. Una revisión narrativa y un dataset primario tienen funciones diferentes; la cantidad de citas no sustituye evaluación metodológica. Mantener historial, afirmaciones incompatibles y motivos de revisión.

### Ejemplo empírico completo, listo para verificación editorial

```yaml
claim_id: claim.cat_v1.orientation_selectivity.001
version: 1
proposition: "En gatos adultos, ciertas neuronas registradas en corteza visual responden de forma selectiva a la orientación de estímulos visuales."
kind: observación
subject_ids: [population.cat.visual_cortex.recorded_neurons]
predicate: muestra_selectividad_a
object: orientación_de_estímulo_visual
context:
  species: Felis_catus
  population_sample: "Animales y unidades del estudio; número pendiente de extracción."
  developmental_stage: "Adultos; verificar selección exacta en texto primario."
  region_atlas_space: "Corteza visual del gato; coordenadas de atlas no extraídas."
  preparation_task_state: "Preparación experimental anestesiada; verificar detalles."
measurement: "Registro extracelular de unidades y presentación de estímulos visuales."
model: no_aplica
evidence:
  - source_id: hubel_wiesel_1962
    locator: "Pendiente: figuras y pasajes específicos."
    relation: sustenta
    method_limitations: "Registro y selección de unidades condicionan qué poblaciones representan."
uncertainty:
  measurement: no_extraída
  sampling_generalization: "No describe todas las neuronas ni todas las especies; no estima prevalencia general."
  competing_explanations: "Este enunciado describe respuestas; no establece el algoritmo que las produce."
status: borrador
review: "Pendiente: neurofisiólogo verifica fuente, preparación, alcance y localizador."
provenance: "Ejemplo editorial basado en conocimiento establecido; fuente no consultada en esta fase."
display: "Etiqueta: observación; visualización esquemática de respuesta, sin atribuir curva medida."
```

Fuente candidata: Hubel y Wiesel, *Receptive fields, binocular interaction and functional architecture in the cat's visual cortex* (1962), https://doi.org/10.1113/jphysiol.1962.sp006837. URL y correspondencia documental pendientes de comprobación. No publicar cifras ni digitalizar curvas antes de verificar fuente y permisos.

### Ejemplo teórico completo, listo para verificación editorial

```yaml
claim_id: claim.predictive_coding.hierarchical_messages.001
version: 1
proposition: "En el modelo jerárquico de codificación predictiva seleccionado, las predicciones descendentes y los errores ascendentes actualizan representaciones para explicar la entrada sensorial."
kind: predicción_modelo
subject_ids: [model.rao_ballard_1999, architecture.hierarchical_visual_model]
predicate: intercambia_mensajes
object: predicciones_descendentes_y_errores_ascendentes
context:
  species: no_aplica_al_modelo
  population_sample: no_aplica
  developmental_stage: no_aplica
  region_atlas_space: "Jerarquía visual idealizada; sin registro anatómico directo."
  preparation_task_state: "Entrada visual y tarea de reconstrucción definidas por el modelo."
measurement: "Variables simuladas; equivalencias con registros necesitan hipótesis adicionales."
model: "Rao–Ballard 1999; ecuaciones, parámetros y versión de implementación pendientes de extracción."
evidence:
  - source_id: rao_ballard_1999
    locator: "Pendiente: ecuaciones y diagrama del modelo."
    relation: contextualiza
    method_limitations: "Una implementación plausible no identifica de forma única el mecanismo biológico."
uncertainty:
  measurement: no_aplica
  sampling_generalization: "Aplicación a regiones, células y especies concretas pendiente de evidencia."
  competing_explanations: "Comparar con modelos alternativos que expliquen los fenómenos evaluados."
status: borrador
review: "Pendiente: especialista en modelado verifica formalismo y separación entre predicción y observación."
provenance: "Ejemplo editorial; publicación e implementación no inspeccionadas en esta fase."
display: "Etiqueta permanente: modelo; flechas funcionales hipotéticas; sin asignación laminar automática."
```

Fuente candidata: Rao y Ballard, *Predictive coding in the visual cortex: a functional interpretation of some extra-classical receptive-field effects* (1999), https://doi.org/10.1038/4580. Referencia pendiente de verificación; no implica validación general de la teoría ni aval de toda arquitectura predictiva.

## 6. Validación humana y actualización

Separar extracción automática, revisión científica y publicación. Cada afirmación publicada requiere fuente verificable, localizador, alcance compatible con el método y revisión de un especialista del dominio. Afirmaciones causales, correspondencias entre especies y superposiciones entre escalas requieren revisión adicional del método o del registro.

Para modelos ejecutables, un científico computacional verifica ecuaciones, unidades, supuestos, estabilidad y correspondencia con el resultado original; un curador valida la explicación al usuario. Registrar discrepancias y permitir revisiones adversariales. Las animaciones educativas deben describir aceleración temporal, geometría simplificada y procesos omitidos.

La cobertura se informa por dominio y fecha de revisión, con backlog y criterios de inclusión. «Actualizado» significa un proceso reproducible de vigilancia y revisión, nunca lectura exhaustiva garantizada de la literatura. Publicar correcciones versionadas y permitir volver al estado de conocimiento de una fecha determinada.
