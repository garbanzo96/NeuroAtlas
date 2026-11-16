# Plan de conocimiento y experiencia del atlas

- **Estado:** propuesta de arquitectura (2026-11-16). No es contenido revisado: todo lo que aquí se describe como
  texto, circuito o parámetro entra al atlas como «borrador — sin revisión experta» (ADR-0011).
- **Para quién:** Claude (integrador) lo usa para abrir los WP-060 a WP-084 y lanzar agentes Codex; el director lo
  usa para decidir prioridades y pedir las ilustraciones de base.
- **Alcance:** qué debe enseñar el atlas en cada nivel, con qué representación, sobre qué datos y en qué orden
  construirlo. No contiene código.

## 0. Diagnóstico y convenciones

### 0.1 Qué hay hoy y qué limita

El atlas ya tiene la anatomía continua (cuerpo, nervios y 141 estructuras Allen por hemisferio), 22 vías con
pasos, cuatro escenas micro con variantes y 12 simuladores. Leyendo el código aparecen siete límites que ordenan
este plan:

1. **Las vías no tienen signo ni secuencia.** `scene/Pathways.tsx` pinta cada tramo con un tren periódico de
   pulsos y elige el color por una expresión regular sobre el nombre del tramo. El campo `col` de `pathways.json`
   y el neurotransmisor (que solo está en el nombre: «Vía directa: putamen → GPi (GABA)») se ignoran. No se puede
   mostrar desinhibición, que es justamente lo que hay que entender en ganglios basales y cerebelo.
2. **Cuatro mapas ya están en los datos y no se muestran.** `structures.json` trae sistema funcional (`s`, 22
   clases), áreas de Brodmann (`ba`, 60 estructuras) y territorio arterial (`a`, 12 clases); `taxonomy.json` trae
   colores por región y por sistema. Hoy solo se usan para el hover por lóbulo.
3. **No hay recorridos, evaluación ni estado en la URL.** Un docente no puede enlazar una vista ni guiar una clase.
4. **El laboratorio está desconectado de las escenas.** La única unión es el evento `na:lab`, que abre un modelo.
   Ninguna simulación maneja una animación 3D.
5. **Las variantes micro viven en un archivo por nivel** (`ColumnScene.tsx` resuelve cuatro variantes). Agregar
   cerebelo, hipocampo, médula o retina ahí lo vuelve inmanejable y rompe la carga diferida.
6. **Los núcleos pequeños no tienen malla.** Locus cerúleo, rafe, ATV, sustancia gris periacueductal y otros se
   ubican como fracciones de la caja de una malla mayor (`{ en, f }`). Sirve, pero hay que declararlos
   marcadores esquemáticos.
7. **El atlas no tiene pruebas e2e ni validación de datos en `npm run check`** (`tools/check-levels.mjs` existe,
   pero no está en el script `check`).

Material de `ontoterrorist/neuroanatomia` sin usar y con licencia compatible (textos CC BY-SA 4.0): curso de 34
unidades con 60 enlaces «ver en 3D», 107 preguntas, 18 casos clínicos con estructura diana, 20 proteínas del PDB
(543 kB) y 31 moléculas (30 kB).

### 0.2 Convenciones del documento

| Sigla        | Significado                                                                         |
| ------------ | ----------------------------------------------------------------------------------- |
| P0 / P1 / P2 | imprescindible para un curso canónico / lo completa / profundización                |
| A3D          | anatomía 3D (mallas Allen HRA y BodyParts3D ya cargadas)                            |
| E3D          | esquema 3D procedural, declarado como esquema                                       |
| D2D          | diagrama 2D (SVG hecho en código; el texto nunca va dentro de una imagen generada)  |
| GRAF         | gráfico de datos o de una función (componentes `Plot` y `Heatmap` del laboratorio)  |
| SIM          | simulador con ecuaciones (`packages/simulation` + `lab/`)                           |
| ANIM         | animación activable sobre una escena 3D                                             |
| ✔ / ◐ / ✘    | existe / existe en parte / falta                                                    |
| Clave Allen  | clave de `structures.json` sin lado (`putamen`); con lado es la malla (`putamen_L`) |
| Marcador     | punto `{ en, f }` dentro de una malla mayor; núcleo sin malla propia, esquemático   |

### 0.3 Reglas epistémicas que el plan respeta

- Cada elemento declara su naturaleza: **observación** (anatomía, registro), **modelo** (ecuaciones con alcance) o
  **hipótesis/marco** (codificación predictiva, inferencia activa, EPIC, compuerta del dolor). La interfaz muestra
  esa etiqueta junto al título, con el mismo peso visual que «borrador».
- Las referencias de este documento están citadas de memoria por el arquitecto. Antes de mostrarse en la interfaz
  se verifican (Crossref o `npm run sources:verify-doi`); las que no se verifiquen quedan `pending`.
- Ningún parámetro numérico de un modelo se escribe sin transcribirlo de la fuente que se cita. Si el ejecutor no
  tiene acceso a la fuente, usa valores de demostración y los rotula «valores ilustrativos».
- Los datos del atlas son humanos adultos. Lo que venga de roedor o macaco (trisináptico, células de lugar,
  microcircuito) se rotula con su especie de origen en la ficha.

## 1. Mapa del conocimiento por nivel

Cada tabla lista los temas canónicos del nivel (Kandel, Purves, Bear; Dayan y Abbott, Gerstner, Izhikevich,
Sporns y Buzsáki para la parte computacional), la mejor representación y la pregunta que el estudiante debería
poder responder al salir.

### 1.1 Sistema nervioso y cuerpo (≈ 1 m)

| Tema                                                              | P   | Representación                                      | Pregunta docente                                             | Hoy |
| ----------------------------------------------------------------- | --- | --------------------------------------------------- | ------------------------------------------------------------ | --- |
| Divisiones: central/periférico, somático/autónomo                 | P0  | A3D con capas + recorrido                           | ¿Qué partes tiene y qué criterio las separa?                 | ◐   |
| Médula: segmentos, intumescencias, sustancia gris y tractos       | P0  | A3D + E3D de sección medular                        | ¿Por qué una lesión en T8 produce ese cuadro?                | ◐   |
| Nervios espinales, plexos y nervios periféricos                   | P0  | A3D (119 mallas de nervios)                         | ¿Qué raíz y qué nervio inervan esta zona?                    | ✔   |
| Nervios craneales                                                 | P0  | A3D + tabla en lámina                               | ¿Qué hace cada par y por dónde sale?                         | ◐   |
| Vías largas ascendentes y descendentes                            | P0  | ANIM sobre A3D (ya hay 8)                           | ¿Dónde cruza cada vía y qué se pierde según el nivel?        | ✔   |
| Reflejos espinales: miotático, retirada, extensión cruzada, Golgi | P0  | ANIM con signo + E3D medular                        | ¿Cómo responde la médula sin la corteza?                     | ◐   |
| Sistema autónomo: simpático, parasimpático, órganos diana         | P0  | ANIM sobre A3D (tronco simpático, vago, vísceras)   | ¿Qué cambia en el cuerpo en lucha o huida?                   | ◐   |
| Unidad motora, placa neuromuscular, huso y órgano tendinoso       | P1  | E3D (variantes de sinapsis y circuito)              | ¿Cómo se gradúa la fuerza?                                   | ✘   |
| Receptores somáticos y tipos de fibra (Aα…C)                      | P1  | D2D + GRAF de adaptación + ANIM «carrera de pulsos» | ¿Por qué el dolor llega después del tacto?                   | ✘   |
| Dermatomas y miotomas                                             | P1  | D2D (la piel es una sola malla)                     | ¿Qué nivel medular corresponde a esta zona?                  | ✘   |
| Meninges, LCR y barrera hematoencefálica                          | P1  | A3D + ANIM (vía `lcr`)                              | ¿De dónde sale y por dónde drena el LCR?                     | ◐   |
| Irrigación: polígono de Willis y arterias                         | P1  | A3D (31 mallas de arterias) + capa de territorios   | ¿Qué arteria se ocluyó?                                      | ◐   |
| Eje neuroendocrino (hipotálamo, hipófisis, suprarrenal)           | P1  | ANIM hormonal lenta sobre A3D                       | ¿Cómo responde el organismo en minutos y no en milisegundos? | ✘   |
| Sistema entérico                                                  | P2  | D2D                                                 | ¿Por qué se lo llama «segundo cerebro» y qué tan cierto es?  | ✘   |
| Locomoción y generadores centrales de patrones                    | P2  | SIM (oscilador de medio centro) + ANIM              | ¿Cómo se genera un ritmo sin entrada rítmica?                | ✘   |
| Desarrollo: neurulación, vesículas, cresta neural                 | P2  | E3D en línea de tiempo                              | ¿De qué vesícula deriva cada estructura adulta?              | ✘   |

### 1.2 Encéfalo (≈ 10 cm)

| Tema                                                           | P   | Representación                                 | Pregunta docente                                            | Hoy |
| -------------------------------------------------------------- | --- | ---------------------------------------------- | ----------------------------------------------------------- | --- |
| Divisiones y origen embrionario (tel-, di-, mes-, met-, miel-) | P0  | A3D con capa «divisiones»                      | ¿Qué estructuras comparten origen?                          | ◐   |
| Lóbulos, surcos y giros                                        | P0  | A3D con capa «lóbulos»                         | ¿Dónde termina un lóbulo y empieza otro?                    | ◐   |
| Sustancia gris y blanca; fibras de asociación, comisurales     | P0  | A3D + haces (tractografía, §2)                 | ¿Cómo se conectan dos áreas lejanas?                        | ◐   |
| Sistema ventricular                                            | P0  | A3D                                            | ¿Qué cavidad corresponde a cada división?                   | ✔   |
| Sistemas funcionales                                           | P0  | A3D con capa «sistemas»                        | ¿Qué regiones participan en cada función?                   | ✘   |
| Territorios vasculares                                         | P0  | A3D con capa «territorios» + arterias          | ¿Qué síntomas da cada arteria?                              | ✘   |
| Sistemas neuromoduladores difusos                              | P0  | ANIM de proyección desde núcleos de origen     | ¿Cómo pocas neuronas cambian el estado de todo el encéfalo? | ◐   |
| Redes de gran escala                                           | P0  | A3D con capa «redes» + ANIM de coactivación    | ¿Qué es una red funcional y en qué se distingue de una vía? | ✘   |
| Estados globales: vigilia, NREM, REM; ritmos del EEG           | P1  | ANIM de ondas + GRAF de EEG sintético (modelo) | ¿Qué cambia en el encéfalo al dormir?                       | ✘   |
| Conectoma: hubs, club de ricos, mundo pequeño                  | P1  | A3D con nodos y arcos + GRAF + SIM             | ¿Por qué dañar un hub es peor que dañar otra región?        | ✘   |
| Gradiente sensoriomotor → transmodal                           | P1  | A3D con capa escalar                           | ¿Qué organiza la corteza además de los lóbulos?             | ✘   |
| Jerarquía cortical: flujo ascendente y descendente             | P1  | ANIM + marco de codificación predictiva        | ¿Qué llevan las conexiones de retroalimentación?            | ✘   |
| Lateralización y cuerpo calloso                                | P1  | A3D + recorrido                                | ¿Qué está lateralizado y con qué evidencia?                 | ◐   |
| Localización clínica por síndromes                             | P1  | Evaluación con casos sobre el modelo           | ¿Dónde está la lesión?                                      | ✘   |
| Metabolismo, acoplamiento neurovascular y señal BOLD           | P1  | D2D + GRAF de respuesta hemodinámica           | ¿Qué mide realmente la resonancia funcional?                | ✘   |
| Métodos y sus resoluciones de espacio y tiempo                 | P2  | D2D interactivo                                | ¿Qué técnica responde qué pregunta?                         | ✘   |
| Desarrollo posnatal y envejecimiento                           | P2  | GRAF cualitativo + lámina                      | ¿Qué madura primero y qué último?                           | ✘   |

### 1.3 Áreas y núcleos (≈ 1 cm)

| Tema                                                      | P   | Representación                                | Pregunta docente                                                  | Hoy |
| --------------------------------------------------------- | --- | --------------------------------------------- | ----------------------------------------------------------------- | --- |
| Áreas primarias, secundarias y de asociación; Brodmann    | P0  | A3D con capa «Brodmann» y rótulos             | ¿Qué distingue un área de otra?                                   | ◐   |
| Tálamo: núcleos, relevo y destino cortical                | P0  | A3D + ANIM «núcleo → corteza diana»           | ¿Qué corteza se apaga si falla este núcleo?                       | ◐   |
| Ganglios basales: vías directa, indirecta e hiperdirecta  | P0  | ANIM con signo + SIM de selección de acción   | ¿Cómo inhibir un inhibidor libera un movimiento?                  | ◐   |
| Bucles paralelos corteza–ganglios basales–tálamo          | P0  | ANIM (motor, oculomotor, prefrontal, límbico) | ¿Por qué el estriado participa en movimiento, cognición y hábito? | ✘   |
| Cerebelo: divisiones, pedúnculos, núcleos profundos       | P0  | A3D + ANIM + E3D de corteza cerebelosa        | ¿Cómo corrige el cerebelo un movimiento?                          | ◐   |
| Formación hipocampal y memoria declarativa                | P0  | A3D + ANIM (Papez) + E3D trisináptico         | ¿Por dónde circula la información que se va a recordar?           | ◐   |
| Amígdala y condicionamiento del miedo                     | P0  | ANIM con signo (10 núcleos con malla)         | ¿Por qué hay respuesta antes de reconocer el estímulo?            | ✘   |
| Hipotálamo: homeostasis, eje HPA, ritmos, sueño           | P0  | ANIM (regiones con malla + marcadores)        | ¿Cómo se regula una variable corporal?                            | ✘   |
| Tronco: núcleos de nervios craneales, formación reticular | P0  | A3D + marcadores esquemáticos                 | ¿Qué síndrome da una lesión medial o lateral?                     | ◐   |
| Visión: retina → NGL → V1 → corrientes dorsal y ventral   | P0  | ANIM (la vía existe) + circuito de corrientes | ¿Qué se pierde con cada lesión de la vía?                         | ◐   |
| Sistema motor cortical y vías descendentes                | P0  | ANIM (existen corticoespinal y corticobulbar) | ¿Qué diferencia una lesión de primera y de segunda motoneurona?   | ✔   |
| Somatosensorial y dolor, con modulación descendente       | P0  | ANIM (existen)                                | ¿Por qué dos vías y dos cruces?                                   | ✔   |
| Audición, equilibrio, gusto y olfato                      | P1  | ANIM (existen las cuatro)                     | ¿Qué sentido no pasa por el tálamo?                               | ✔   |
| Recompensa y motivación                                   | P1  | ANIM + SIM de error de predicción             | ¿Qué señala la dopamina?                                          | ◐   |
| Atención y movimientos oculares                           | P1  | ANIM (sacádico; redes dorsal y ventral)       | ¿Cómo se decide a dónde mirar?                                    | ✘   |
| Corteza prefrontal: control y memoria de trabajo          | P1  | A3D + SIM de actividad persistente            | ¿Cómo se sostiene una representación sin estímulo?                | ✘   |
| Ínsula e interocepción                                    | P1  | ANIM + marco (hipótesis)                      | ¿Cómo llega el estado del cuerpo a la corteza?                    | ✘   |
| Lenguaje                                                  | P1  | ANIM (existe la red perisilviana)             | ¿Qué afasia corresponde a cada lesión?                            | ✔   |
| Mapas topográficos: somatotopía, retinotopía, tonotopía   | P2  | E3D sobre el giro, declarado esquema          | ¿Qué significa que la corteza tenga un mapa?                      | ✘   |
| Navegación: células de lugar, de red y de dirección       | P2  | SIM + lámina (datos de roedor, rotulados)     | ¿Cómo se representa la posición?                                  | ✘   |

### 1.4 Columnas y redes (≈ 1 mm)

| Tema                                                       | P   | Representación                                   | Pregunta docente                                        | Hoy |
| ---------------------------------------------------------- | --- | ------------------------------------------------ | ------------------------------------------------------- | --- |
| Capas I–VI, columna y microcircuito canónico               | P0  | E3D (existe)                                     | ¿Por dónde entra y por dónde sale la información?       | ✔   |
| Balance excitación/inhibición y motivos de inhibición      | P0  | E3D de motivos + SIM                             | ¿Qué hace cada tipo de interneurona?                    | ◐   |
| Oscilaciones: gamma, theta, alfa, husos                    | P0  | E3D «ritmo E/I» manejado por SIM                 | ¿De dónde sale un ritmo?                                | ◐   |
| Corteza cerebelosa                                         | P0  | E3D nuevo                                        | ¿Qué calcula una célula de Purkinje?                    | ✘   |
| Circuito trisináptico del hipocampo                        | P0  | E3D nuevo                                        | ¿Qué aporta cada estación del circuito?                 | ✘   |
| Sección medular y circuitos reflejos                       | P0  | E3D nuevo                                        | ¿Cómo se relaja el antagonista?                         | ✘   |
| Retina: fotorreceptor → bipolar → ganglionar               | P0  | E3D nuevo + SIM centro-periferia                 | ¿Por qué la retina responde al contraste y no a la luz? | ✘   |
| Campos receptivos de V1 y columnas de orientación          | P1  | SIM (Gabor, modelo de anillo) + E3D              | ¿Cómo surge la selectividad a la orientación?           | ✘   |
| Tálamo–corteza–núcleo reticular: modos tónico y en ráfaga  | P1  | E3D + SIM                                        | ¿Por qué el tálamo deja de transmitir al dormir?        | ✘   |
| Estriado: neuronas espinosas D1/D2 e interneuronas         | P1  | E3D                                              | ¿Dónde actúa la dopamina?                               | ✘   |
| Codificación poblacional y curvas de sintonía              | P1  | SIM + GRAF                                       | ¿Cómo leen muchas neuronas ruidosas una variable?       | ✘   |
| Redes atractoras: memoria, decisión, actividad persistente | P1  | SIM (Hopfield, anillo)                           | ¿Qué es un atractor y qué explica?                      | ✘   |
| Microcircuito de codificación predictiva                   | P1  | E3D superpuesto a la columna, rotulado hipótesis | ¿Qué población llevaría el error y cuál la predicción?  | ✘   |
| Redes balanceadas e irregularidad del disparo              | P1  | SIM (existe `network`)                           | ¿Por qué la corteza dispara de forma irregular?         | ◐   |
| Órgano de Corti y huso muscular                            | P1  | E3D                                              | ¿Cómo se convierte un estímulo mecánico en señal?       | ✘   |
| Plasticidad de mapas y períodos críticos                   | P2  | GRAF + lámina                                    | ¿Por qué hay ventanas para aprender?                    | ✘   |
| Bulbo olfatorio; generador central de patrones             | P2  | E3D + SIM                                        | ¿Cómo separa el bulbo olores parecidos?                 | ✘   |

### 1.5 Neurona (≈ 100 µm)

| Tema                                                          | P   | Representación                                       | Pregunta docente                                                | Hoy |
| ------------------------------------------------------------- | --- | ---------------------------------------------------- | --------------------------------------------------------------- | --- |
| Morfología, compartimentos y tipos                            | P0  | E3D (7 variantes)                                    | ¿Qué dice la forma sobre la función?                            | ✔   |
| Potencial de reposo y de acción; umbral y período refractario | P0  | SIM (HH) que maneja el E3D                           | ¿Qué corriente domina en cada fase?                             | ◐   |
| Conducción continua y saltatoria; mielina                     | P0  | SIM (`axon`) que maneja el E3D                       | ¿Por qué la mielina acelera?                                    | ◐   |
| Integración sináptica: sumación y teoría del cable            | P0  | SIM de cable pasivo + ANIM de potenciales que decaen | ¿Por qué importa dónde está la sinapsis?                        | ✘   |
| Patrones de disparo y clases de excitabilidad                 | P0  | SIM (Izhikevich) + plano de fase                     | ¿Qué diferencia a una neurona de disparo regular de una rápida? | ◐   |
| Codificación: tasa, tiempo, variabilidad                      | P1  | SIM (Poisson, curva f–I) + GRAF                      | ¿Qué parte de un tren de espigas lleva información?             | ◐   |
| Dendritas activas y detección de coincidencias                | P1  | E3D + ANIM                                           | ¿La dendrita calcula?                                           | ✘   |
| Adaptación, ráfagas talámicas, corrientes lentas              | P1  | SIM (AdEx)                                           | ¿Por qué baja la frecuencia con estímulo sostenido?             | ✘   |
| Glía y barrera hematoencefálica                               | P1  | E3D (las fichas ya están en `micro.json`)            | ¿Qué hace cada tipo de glía?                                    | ◐   |
| Transporte axonal y citoesqueleto                             | P1  | ANIM sobre el axón                                   | ¿Cómo llega una proteína a un terminal a un metro del soma?     | ✘   |
| Neuronas sensoriales: fotorreceptor, célula ciliada           | P1  | E3D (variantes)                                      | ¿Qué neuronas no disparan potenciales de acción?                | ✘   |
| Morfologías reconstruidas                                     | P2  | A3D (NeuroMorpho; licencia por verificar)            | ¿Cuánto varía una «neurona piramidal»?                          | ✘   |
| Crecimiento axonal, degeneración y regeneración               | P2  | ANIM + lámina                                        | ¿Por qué regenera el nervio periférico y no la médula?          | ✘   |

### 1.6 Sinapsis (≈ 1 µm)

| Tema                                                            | P   | Representación                          | Pregunta docente                                    | Hoy |
| --------------------------------------------------------------- | --- | --------------------------------------- | --------------------------------------------------- | --- |
| Transmisión química y eléctrica                                 | P0  | E3D (existen)                           | ¿Qué gana y qué pierde cada tipo?                   | ✔   |
| Ciclo vesicular, Ca²⁺ y complejo SNARE                          | P0  | E3D con secuencia (existe)              | ¿Qué acopla la espiga a la liberación?              | ✔   |
| Receptores ionotrópicos y metabotrópicos; PEPS y PIPS           | P0  | E3D + SIM de conductancia sináptica     | ¿Por qué una sinapsis inhibe aunque despolarice?    | ◐   |
| Liberación cuántica                                             | P0  | SIM binomial + GRAF de histograma       | ¿Qué significan n, p y q?                           | ✘   |
| Plasticidad a corto plazo                                       | P0  | SIM (Tsodyks–Markram) que maneja el E3D | ¿Cuándo una sinapsis facilita y cuándo deprime?     | ◐   |
| Plasticidad a largo plazo: LTP, LTD, STDP                       | P0  | ANIM de tráfico de AMPA + SIM (STDP)    | ¿Qué cambia físicamente al aprender?                | ◐   |
| NMDA como detector de coincidencia                              | P1  | SIM (bloqueo por Mg²⁺) + ANIM           | ¿Por qué hace falta pre y post a la vez?            | ✘   |
| Neuromodulación por volumen y receptores acoplados a proteína G | P1  | ANIM de cascada                         | ¿En qué se diferencia modular de transmitir?        | ✘   |
| Unión neuromuscular                                             | P1  | E3D (variante)                          | ¿Por qué esta sinapsis casi nunca falla?            | ✘   |
| Sinapsis tripartita y recaptación                               | P1  | E3D (el astrocito ya está)              | ¿Cómo termina la señal?                             | ◐   |
| Inhibición presináptica, axoaxónica y perisomática              | P1  | E3D + D2D                               | ¿Dónde conviene inhibir para vetar una neurona?     | ✘   |
| Reglas de aprendizaje: Hebb, Oja, BCM, homeostasis              | P1  | SIM + GRAF                              | ¿Qué evita que el aprendizaje hebbiano se desborde? | ✘   |
| Farmacología sináptica                                          | P1  | Moléculas 3D (31 disponibles) + lámina  | ¿Dónde actúa este fármaco?                          | ✘   |
| Mensajeros retrógrados; dinámica de espinas                     | P2  | ANIM + lámina                           | ¿Puede la postsinapsis hablarle a la presinapsis?   | ✘   |

### 1.7 Membrana y moléculas (≈ 10 nm)

| Tema                                                     | P   | Representación                                   | Pregunta docente                                                    | Hoy |
| -------------------------------------------------------- | --- | ------------------------------------------------ | ------------------------------------------------------------------- | --- |
| Bicapa, gradientes, Nernst, Goldman–Hodgkin–Katz         | P0  | E3D + SIM (existen)                              | ¿De dónde sale el potencial de reposo?                              | ✔   |
| Canales dependientes de voltaje y sus compuertas         | P0  | E3D «canales» manejado por las variables m, h, n | ¿Qué es físicamente la inactivación?                                | ◐   |
| Bomba Na⁺/K⁺ y transportadores                           | P0  | E3D + SIM (existen)                              | ¿Cuánto cuesta mantener el gradiente?                               | ✔   |
| Receptores y canales reales                              | P0  | Visor molecular con 20 estructuras del PDB       | ¿Cómo es un canal de verdad?                                        | ✘   |
| Neurotransmisores: síntesis, almacenamiento, degradación | P0  | D2D de rutas + moléculas 3D                      | ¿De qué aminoácido sale cada transmisor?                            | ✘   |
| Canal unitario y estocasticidad                          | P1  | SIM de canal de dos estados + GRAF               | ¿Cómo sale una corriente suave de canales que solo abren o cierran? | ✘   |
| Segundos mensajeros: AMPc/PKA, IP₃/DAG, Ca²⁺/CaMKII      | P1  | ANIM de cascada                                  | ¿Cómo amplifica la célula una señal?                                | ✘   |
| Toxinas y fármacos sobre canales                         | P1  | Moléculas 3D + lámina                            | ¿Por qué la tetrodotoxina paraliza?                                 | ✘   |
| Canalopatías                                             | P1  | Lámina con correlación clínica                   | ¿Qué enfermedad produce un canal defectuoso?                        | ✘   |
| Expresión génica dependiente de actividad                | P2  | ANIM + lámina                                    | ¿Cómo se vuelve permanente un cambio sináptico?                     | ✘   |
| Herramientas moleculares (optogenética)                  | P2  | Lámina                                           | ¿Cómo se prueba causalidad en un circuito?                          | ✘   |

## 2. Capas de mapas superpuestos sobre la anatomía

Una capa de lectura recolorea las mismas 141 estructuras según otro criterio. Es la mejora de mayor rendimiento
docente por línea de código: cuatro capas salen de datos que ya están cargados.

### 2.1 Cómo se ve una capa en el estilo holográfico

- La capa cambia el tono, nunca la naturaleza del material: sigue siendo luz aditiva con borde de Fresnel. Cada
  estructura interpola `uColor` hacia el color de su clase y sube el relleno (`uFill × (1 + 2,5·w)`, con `w` el
  peso de pertenencia entre 0 y 1). Lo que no pertenece a la clase activa se atenúa con `uDim = 0,75`.
- Paleta: como máximo ocho tonos a la vez, todos con luminancia parecida y desplazados hacia el azul para no
  romper la escena. Los colores de `taxonomy.json` se usan como base y se mezclan un 30 % con `#73c5ff`.
- Al pasar el cursor por una entrada de la leyenda, esa clase sube a brillo pleno y el resto baja: es un
  «solo» como el de una mesa de mezcla. Con clic, queda fijada.
- Las capas escalares (gradiente) usan una rampa de dos extremos: azul profundo → cian → blanco cálido.
- Las capas con nodos (hubs, núcleos de origen) agregan esferas pequeñas con halo sobre la malla y arcos entre
  ellas; no reemplazan el recoloreo.
- Capa y vía son compatibles: la vía se dibuja encima. Capa y selección también: lo seleccionado conserva su
  resalte blanco.
- Toda capa muestra una línea de procedencia en la leyenda: fuente, licencia, método de asignación y la frase
  «asignación por giro; no reemplaza un atlas volumétrico» cuando corresponda.

### 2.2 Catálogo de capas

| Capa                                | P   | Datos necesarios                                             | Fuente y licencia                                                                                                                                                                      | Mapeo a las claves Allen                                                                                          | Visualización                                                      |
| ----------------------------------- | --- | ------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| Lóbulos y regiones                  | P0  | Campo `g` + `taxonomy.regions`                               | Ya en el repo (fichas CC BY-SA 4.0)                                                                                                                                                    | Directo                                                                                                           | Categórica, 7 lóbulos + regiones profundas                         |
| Divisiones embrionarias             | P0  | `taxonomy.tree`                                              | Ya en el repo                                                                                                                                                                          | Directo por prefijo de `g`                                                                                        | Categórica, 5 vesículas + médula                                   |
| Sistemas funcionales                | P0  | Campo `s` + `taxonomy.systems`                               | Ya en el repo                                                                                                                                                                          | Directo (una clase por estructura)                                                                                | Categórica con «solo» por sistema                                  |
| Brodmann                            | P0  | Campo `ba` (60 estructuras corticales)                       | Ya en el repo. Correspondencia giro ↔ área aproximada: se rotula así                                                                                                                   | Directo; un giro puede listar varias áreas                                                                        | Rótulos numéricos flotantes + búsqueda «área 17»; color por lóbulo |
| Territorios vasculares              | P0  | Campo `a` (12 clases) + capa de arterias                     | Ya en el repo. Refinamiento opcional: Liu et al. 2023, _Sci Data_ 10:74, atlas en NITRC `arterialatlas` (campo de licencia: «Attribution»)                                             | Directo. Refinamiento: tabulación cruzada en MNI (§2.3)                                                           | Categórica; al elegir un territorio se enciende su arteria         |
| Cerebelo funcional                  | P0  | Mallas de vermis, paravermis y hemisferio lateral            | Ya en el repo                                                                                                                                                                          | Directo: vestíbulo/espinocerebelo (vermis, paravermis), cerebrocerebelo (lateral)                                 | Categórica de 3 clases                                             |
| Tálamo → corteza diana              | P0  | Tabla núcleo → áreas (redactada desde el campo `c`)          | Derivado de las fichas (CC BY-SA 4.0), borrador                                                                                                                                        | Curado a mano, 16 núcleos                                                                                         | Clic en un núcleo: su corteza se enciende y viaja un pulso         |
| Redes de gran escala (7 y 17)       | P0  | Parcelación de Yeo 2011 en MNI152                            | Repositorio CBIG (ThomasYeoLab), licencia MIT verificada en `LICENSE.md`. Citar Yeo et al. 2011, _J Neurophysiol_ 106:1125                                                             | Tabulación cruzada con el volumen de anotación Allen HRA 3D 2020 (CC BY 4.0): fracción de cada red por estructura | Categórica con pesos; la lámina muestra la mezcla del giro         |
| Sistemas de neurotransmisores       | P0  | Núcleos de origen + proyecciones + regiones diana            | Fase A: tramos de las vías `dopamina` y `moduladores` (ya en el repo). Fase B: Harvard AAN Atlas v2.0 en Dryad, CC0 verificada, para afinar orígenes                                   | Fase A: marcadores `{ en, f }` existentes. Fase B: transformación afín MNI → atlas (§2.3)                         | Un modo por transmisor (§2.4)                                      |
| Gradiente principal                 | P1  | Mapa volumétrico del gradiente 1                             | Margulies et al. 2016, _PNAS_ 113:12574; colección 1598 de NeuroVault, CC0 (política de NeuroVault, verificada)                                                                        | Media del gradiente dentro de cada estructura Allen en MNI                                                        | Escalar; rampa de dos extremos                                     |
| Hubs y club de ricos                | P1  | Lista de regiones del club de ricos; opcional, matriz        | Lista: van den Heuvel y Sporns 2011, _J Neurosci_ 31:15775 (hechos publicados; verificar contra el artículo). Matriz: ENIGMA Toolbox (BSD-3) con datos HCP: **licencia por verificar** | Curado a mano: precúneo, frontal superior, parietal superior, hipocampo, putamen, tálamo                          | Nodos con halo + arcos; el resto atenuado                          |
| Tractos de sustancia blanca         | P1  | Haces promedio (arcuato, longitudinales, uncinado, cíngulo…) | Yeh 2022, _Nat Commun_ 13:4933, atlas HCP1065, CC BY-SA 4.0 verificada; exige el reconocimiento de uso de datos HCP                                                                    | Transformación afín MNI → atlas; 30–60 líneas por haz tras diezmar                                                | Líneas aditivas finas con pulsos; sustancia blanca atenuada        |
| Mapas topográficos                  | P2  | Parametrización a lo largo del giro                          | Sin dataset: esquema declarado                                                                                                                                                         | Fracciones de la caja de `primary_motor_cortex`, `postcentral_gyrus`, giro de Heschl, polo occipital              | Banda de color a lo largo del giro + homúnculo D2D                 |
| Tipos de corteza (citoarquitectura) | P2  | Clase por giro (granular, agranular, alocorteza…)            | Curado desde las fichas, borrador. Julich-Brain y BigBrain: **licencia por verificar** (probablemente no comercial)                                                                    | Curado a mano                                                                                                     | Categórica de 5 clases                                             |
| Densidad de receptores              | —   | Mapas PET de 19 receptores y transportadores                 | Hansen et al. 2022, _Nat Neurosci_ 25:1569; repositorio con CC BY-NC-SA 4.0 verificada. **No usar** sin decisión del director (§9)                                                     | —                                                                                                                 | —                                                                  |
| Desarrollo                          | P2  | Secuencia de vesículas; orden de mielinización               | Sin dataset abierto verificado. BrainSpan: **licencia por verificar**                                                                                                                  | Divisiones embrionarias (arriba)                                                                                  | Línea de tiempo que enciende divisiones; E3D del tubo neural       |

### 2.3 Cómo llevar un atlas en MNI a las 141 estructuras

Hay dos operaciones distintas y conviene no confundirlas.

**Pesos por estructura (redes, gradiente, territorios).** No requieren transformar nada al espacio del atlas. El
volumen de anotación del Allen Human Reference Atlas 3D 2020 (CC BY 4.0, dibujado sobre ICBM 2009b simétrico)
usa las mismas 141 estructuras que las mallas. Un script fuera de línea remuestrea el volumen de la capa a esa
grilla por coordenadas de mundo y cuenta, para cada estructura, qué fracción de sus vóxeles cae en cada clase. El
resultado es una tabla `estructura → { clase: fracción }` con su procedencia. Limitación que se declara: las
plantillas MNI152 y 2009b difieren en uno o dos milímetros y la corteza del atlas Allen es por giro, así que la
resolución efectiva es la del giro.

**Puntos y líneas (núcleos del tronco, tractos).** Sí requieren una transformación MNI → atlas. Se estima por
mínimos cuadrados con los centroides de las estructuras del volumen Allen (en mm, MNI) y los centroides `c` de
`meshes.json` (en cm), que son homólogos por construcción. El script informa el residuo; si la mediana supera
3 mm, la capa no se publica y se avisa. `ontoterrorist` aplicó un ajuste afín del 4 al 7 % para encajar el
encéfalo en el cráneo (`tools/registro.mjs` del repo de origen), así que una afín de 12 parámetros debería
absorberlo.

La correspondencia de nombres entre el volumen Allen y las claves de `structures.json` se hace por el nombre de
la estructura normalizado. Ocho mallas venían con el nombre permutado en el archivo original y `ontoterrorist`
las corrigió por geometría: el script debe listar las estructuras sin par y no adivinar.

### 2.4 Sistemas de neurotransmisores

Cada sistema es un modo propio dentro de la capa. Los colores salen de los tramos ya existentes en
`pathways.json`, para no inventar una segunda paleta.

| Sistema       | Origen (clave o marcador)                                                              | Proyecciones a mostrar                                               | Color     | Estado del dato                                     |
| ------------- | -------------------------------------------------------------------------------------- | -------------------------------------------------------------------- | --------- | --------------------------------------------------- |
| Dopamina      | `substantia_nigra`; ATV como marcador en `midbrain_tegmentum`; `tuberal_region_of_HTH` | Nigroestriada, mesolímbica, mesocortical, tuberoinfundibular         | `#b58cf0` | 6 tramos existentes                                 |
| Noradrenalina | Locus cerúleo, marcador en `pontine_tegmentum`                                         | Corteza difusa, tálamo, cerebelo, médula                             | `#5db7e8` | 2 tramos existentes; ampliar dianas                 |
| Serotonina    | Rafe dorsal y mediano (marcador en `pontine_tegmentum`), rafe magno (bulbo)            | Prosencéfalo difuso, ganglios basales, asta posterior                | `#f2c14e` | 2 tramos existentes                                 |
| Acetilcolina  | `basal_forebrain`, `septal_nuclei`, tegmento pedunculopontino (marcador)               | Neocorteza, hipocampo por el fórnix, tálamo                          | `#f08fc0` | 3 tramos existentes                                 |
| Histamina     | Núcleo tuberomamilar, marcador en `mammillary_region_of_HTH`                           | Corteza y tálamo difusos                                             | `#6fd08c` | 1 tramo existente                                   |
| Orexina       | Hipotálamo lateral, marcador en `tuberal_region_of_HTH`                                | Locus cerúleo, rafe, tuberomamilar, ATV, prosencéfalo basal, corteza | `#ff9a5c` | Falta. Posición del marcador: pendiente de revisión |

Lectura visual: el núcleo de origen late (pequeño, muy brillante), salen haces que se ramifican y las regiones
diana se encienden con un retardo proporcional a la distancia. Es la demostración directa de «pocas neuronas,
alcance global». La liberación es por volumen: en la diana no hay un destello puntual, hay una bruma que sube y
baja lentamente (§4, animación N1). Cada modo enlaza con su molécula 3D, sus receptores del PDB y la unidad 6 del
curso.

En la fase B los orígenes se afinan con el Harvard Ascending Arousal Network Atlas v2.0 (Edlow et al.; Dryad,
doi:10.5061/dryad.zw3r228d2, CC0), que trae núcleos del tronco en MNI152 a 1 mm. La lista exacta de núcleos se
confirma al descargar. Hipotálamo lateral, tuberomamilar y núcleo basal no tienen malla abierta verificada:
quedan como marcadores esquemáticos.

## 3. Circuitos y vías a animar

### 3.1 Qué cambia respecto de las 22 vías

Las vías actuales responden «por dónde pasa». Un circuito tiene que responder «qué le hace cada estación a la
siguiente». Para eso hace falta un segundo tipo de dato, el **circuito con signo**, que convive con las vías:

- **Nodos** con actividad basal (el pálido interno y la célula de Purkinje disparan tónicamente; el estriado
  casi no).
- **Aristas** con signo (excitatoria, inhibitoria, moduladora), neurotransmisor y retardo.
- **Escenarios**: qué nodo se estimula, cuándo, y qué lesiones están activas.
- Un **planificador puro** que integra un modelo de tasas mínimo y devuelve la actividad de cada nodo en el
  tiempo y los pulsos de cada arista. La escena solo reproduce ese resultado.

El modelo del planificador es didáctico y se declara así en la interfaz («esquema de signos; no es una simulación
biofísica»):

```text
τ · da_j/dt = −a_j + recorte( basal_j + Σ_i s_ij · g_ij · w_ij · a_i(t − d_ij) + estímulo_j(t), 0, 1 )
s_ij = +1 excitatoria, −1 inhibitoria;  g_ij = ganancia que fijan las aristas moduladoras (1 por defecto)
```

Con esto la desinhibición no se dibuja a mano: sale sola. Si el estriado se activa, el pálido interno baja, y el
tálamo, que estaba frenado, sube.

### 3.2 Gramática visual de la señal

| Tipo                              | Color                            | Forma del pulso                               | Llegada al nodo                                           |
| --------------------------------- | -------------------------------- | --------------------------------------------- | --------------------------------------------------------- |
| Excitatoria                       | verde menta `#7dffb2`            | cometa continuo, cabeza casi blanca           | destello y el nodo sube de brillo                         |
| Inhibitoria                       | magenta `#ff5c8a`                | tres trazos cortos (se lee sin color)         | disco plano en la terminal; el nodo se apaga visiblemente |
| Moduladora                        | violeta `#c49bff`                | resplandor ancho y lento, sin cabeza definida | halo que cambia el grosor de las aristas que modula       |
| Hormonal                          | ámbar pálido `#ffd79a`           | partículas que derivan por las arterias       | brillo lento en el órgano diana                           |
| Aferente / eferente (vías largas) | cian `#5ee6ff` / ámbar `#ffb057` | como hoy                                      | como hoy                                                  |

En vías largas el color codifica dirección; en circuitos codifica signo. La leyenda del panel lo dice siempre.
Forma y color son redundantes para que se lea con daltonismo.

### 3.3 Cómo se dispara

- El panel del circuito lista sus escenarios como botones («Iniciar un movimiento», «Sin dopamina»…).
- Con un circuito abierto, sus nodos muestran un anillo tenue. Clic en un nodo lo estimula (tecla `A` repite el
  último estímulo). El usuario provoca y el circuito responde.
- Controles: reproducir/pausar (barra espaciadora), paso a paso, velocidad (×0,25 a ×2) y una línea de tiempo con
  marcas en cada llegada. Una insignia indica la escala temporal («cámara lenta: 1 s ≈ 10 ms»).
- Las lesiones son interruptores: apagan un nodo o una arista y el mismo escenario se vuelve a ejecutar. Es la
  manera más directa de enseñar clínica (Parkinson, hemibalismo, lesión cerebelosa, narcolepsia).

### 3.4 Catálogo

Las claves son las de `structures.json`. «(m)» indica marcador esquemático. Las posiciones de marcadores que ya
existen en `pathways.json` se reutilizan; las nuevas las propone el ejecutor y las revisa Claude con captura.

**Migraciones: misma geometría, ahora con signo y escenarios**

| Circuito                         | P   | Base             | Escenarios                                                                                                     |
| -------------------------------- | --- | ---------------- | -------------------------------------------------------------------------------------------------------------- |
| Ganglios basales, bucle motor    | P0  | vía `ganglios`   | Iniciar (directa) · Suprimir (indirecta) · Freno global (hiperdirecta) · Sin dopamina · Lesión del subtalámico |
| Cerebrocerebelo                  | P0  | vía `cerebelo`   | Orden motora con copia al cerebelo · Error por fibra trepadora · Lesión del hemisferio                         |
| Circuito de Papez                | P1  | vía `papez`      | Recorrido completo · Lesión de cuerpos mamilares                                                               |
| Modulación descendente del dolor | P1  | vía `dolor-desc` | Dolor sin modulación · Analgesia descendente                                                                   |

**Circuitos nuevos**

| Circuito                                 | P   | Nodos (claves Allen)                                                                                                                                                                                                                                                                                                                                                                | Secuencia y signos                                                                                                                                                                | Disparo y escenarios                                                             |
| ---------------------------------------- | --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Bucles paralelos de los ganglios basales | P0  | Corteza: `primary_motor_cortex`, `middle_frontal_gyrus`, `lateral_orbital_gyrus`, `cingulate_gyrus_rostral_anterior_part`. Estriado: `putamen`, `head_of_caudate`, `nucleus_accumbens`. Salida: `internal_segment_of_globus_pallidus`, `substantia_nigra`. Tálamo: `ventral_lateral_nucleus_of_thalamus`, `ventral_anterior_nucleus_of_thalamus`, `mediodorsal_nucleus_of_thalamus` | Corteza → estriado (+), estriado → salida (−), salida → tálamo (−, tónica), tálamo → corteza (+). Cuatro bucles en paralelo, cada uno con su tono                                 | Elegir un bucle; comparar motor con límbico                                      |
| Tálamo–corteza–núcleo reticular          | P0  | `thalamus` y núcleos de relevo, núcleo reticular (m, cáscara lateral del tálamo), corteza diana según el núcleo                                                                                                                                                                                                                                                                     | Tálamo → corteza (+), corteza → tálamo (+), ambos → reticular (+), reticular → tálamo (−)                                                                                         | Vigilia (relevo tónico) · Sueño (ráfagas y husos, manejado por SIM)              |
| Corrientes visuales dorsal y ventral     | P0  | `occipital_pole`, `cuneus`, `lingual_gyrus_medial_occipitotemporal_gyrus`, `superior_occipital_gyrus`, `inferior_occipital_gyrus`, `supraparietal_lobule`, `angular_gyrus`, `lateral_occipitotemporal_fusiform_gyrus_occipital_part`, `occipitotemporal_fusiform_gyrus_temporal_part`, `inferior_temporal_gyrus`, `temporal_pole`, `middle_frontal_gyrus`                           | V1 → dorsal (parietal → premotora) y ventral (fusiforme → temporal inferior → polo), todas (+); retroalimentación como moduladora                                                 | «Mostrar un objeto»: avanza por ambas; lesiones: agnosia, ataxia óptica          |
| Miedo condicionado                       | P0  | `medial_geniculate_nuclei`, `transverse_temporal_gyrus_Heschls_gyrus`, `lateral_nucleus`, `basolateral_nucleus_basal_nucleus`, `central_nuclear_group`, `hypothalamus`, sustancia gris periacueductal (m), locus cerúleo (m), `subcallosal_gyrus_parolfactory_gyrus`, `body_of_hippocampus`                                                                                         | Vía corta tálamo → amígdala lateral y vía larga por corteza auditiva (+); lateral → basolateral → central (+); central → hipotálamo y tronco (+); prefrontal medial → central (−) | Tono solo · Tono con descarga · Extinción (la prefrontal frena) · Contexto       |
| Eje hipotálamo–hipófisis–suprarrenal     | P0  | Núcleo paraventricular (m en `supraoptic_region_of_HTH`), `hipofisis`, suprarrenal (m sobre `rinon_L`), `body_of_hippocampus`, `amygdaloid_complex`                                                                                                                                                                                                                                 | CRH → hipófisis (hormonal), ACTH por sangre → suprarrenal, cortisol → retroalimentación (−) sobre hipófisis, hipotálamo e hipocampo                                               | Estresor agudo · Estrés sostenido (retroalimentación debilitada, como hipótesis) |
| Recompensa y error de predicción         | P0  | ATV (m), `nucleus_accumbens`, `amygdaloid_complex`, `medial_orbital_gyrus`, `head_of_hippocampus`, `mediodorsal_nucleus_of_thalamus`, `habenular_nuclei`                                                                                                                                                                                                                            | ATV → accumbens, amígdala y prefrontal (moduladora); corteza e hipocampo → accumbens (+); habénula → ATV (−, vía interpuesta)                                                     | Recompensa inesperada · Predicha · Omitida. Manejado por el simulador TD         |
| Sueño y vigilia (interruptor)            | P0  | `preoptic_region_of_HTH`, orexina (m), tuberomamilar (m), locus cerúleo (m), rafe (m), tegmento pedunculopontino (m), `thalamus`, `basal_forebrain`                                                                                                                                                                                                                                 | Preóptico ventrolateral ⊣ núcleos de vigilia y viceversa (inhibición mutua); orexina (+) estabiliza la vigilia                                                                    | Dormirse · Despertar · Sin orexina (narcolepsia). Enlaza con la animación S1     |
| Barorreflejo                             | P1  | `corazon`, `n_glosofaringeo_L`, `n_vago_L`, núcleo del tracto solitario (m en `tegmentum_of_medulla_oblongata`), bulbo ventrolateral (m), `me_T1`–`me_T5`, `tronco_simpatico_L`                                                                                                                                                                                                     | Barorreceptor → tracto solitario (+) → caudal ⊣ rostral → simpático; tracto solitario → núcleo vagal (+) → corazón                                                                | Sube la presión · Ponerse de pie                                                 |
| Reflejo de retirada y extensión cruzada  | P1  | Nervios de la pierna, `me_L4`–`me_S1`, interneuronas (en la escena micro medular)                                                                                                                                                                                                                                                                                                   | Nociceptor → interneuronas → flexores ipsilaterales (+), extensores (−); contralateral al revés                                                                                   | «Pisar algo punzante»                                                            |
| Sacádico                                 | P1  | `middle_frontal_gyrus` (campo ocular frontal, fracción posterior), `supraparietal_lobule`, `head_of_caudate`, `substantia_nigra`, `superior_colliculus`, formación reticular pontina (m), `n_abducens_L`, `n_oculomotor_tronco_L`                                                                                                                                                   | Corteza → colículo (+); caudado ⊣ nigra reticulada ⊣ colículo (desinhibición); colículo → generador pontino → núcleos oculomotores                                                | «Mirar a la derecha»                                                             |
| Ritmo circadiano y melatonina            | P1  | `optic_chiasm`, supraquiasmático (m), paraventricular (m), médula torácica alta, ganglio cervical superior (reusar `horner`), `pineal_body`                                                                                                                                                                                                                                         | Retina → supraquiasmático; de noche se libera el freno y la pineal secreta                                                                                                        | Día · Noche · Luz de noche                                                       |
| Interocepción                            | P1  | `n_vago_L`, tracto solitario (m), parabraquial (m), `ventral_posterior_medial_nucleus`, `long_insular_gyri`, `short_insular_gyri`, `cingulate_gyrus_rostral_anterior_part`                                                                                                                                                                                                          | Aferencia visceral ascendente (+); descendente desde ínsula anterior y cíngulo como moduladora                                                                                    | «Latido»; capa opcional con el marco predictivo (hipótesis, §6)                  |
| Atención dorsal y ventral                | P1  | `supraparietal_lobule`, `middle_frontal_gyrus`, `supramarginal_gyrus`, `inferior_frontal_gyrus_opercular_part`, `pulvinar_of_thalamus`, `superior_colliculus`                                                                                                                                                                                                                       | Dorsal: sesgo descendente (moduladora) sobre corteza visual; ventral: reorientación                                                                                               | Atender a un lugar · Estímulo inesperado                                         |
| Sistemas descendentes medial y lateral   | P1  | `red_nucleus`, `superior_colliculus`, tegmentos, médula                                                                                                                                                                                                                                                                                                                             | Rubroespinal, tectoespinal, vestibuloespinal, reticuloespinal (+)                                                                                                                 | Comparar con la corticoespinal                                                   |
| Jerarquía predictiva (marco)             | P1  | V1 → occipital → temporal inferior, reusando las corrientes visuales                                                                                                                                                                                                                                                                                                                | Ascendente = error, descendente = predicción. **Hipótesis**, no hecho                                                                                                             | Estímulo predicho (la respuesta ascendente se atenúa) · Sorpresa                 |
| Micción; respiración; hambre y saciedad  | P2  | Marcadores en puente, bulbo e hipotálamo                                                                                                                                                                                                                                                                                                                                            | —                                                                                                                                                                                 | —                                                                                |

**Circuitos que viven en escenas micro (nivel «columnas y redes»)**

| Escena                    | P   | Elementos                                                                                                 | Secuencia y signos                                                                                                                | Interacción                                                               |
| ------------------------- | --- | --------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Corteza cerebelosa        | P0  | Fibras musgosas y trepadoras, granulares, paralelas, Purkinje, cesta, estrelladas, Golgi, núcleo profundo | Musgosa → granular (+) → paralela → Purkinje (+); Purkinje ⊣ núcleo; trepadora → Purkinje (+, espiga compleja); interneuronas (−) | Activar musgosas; activar trepadora junto a paralelas y ver bajar el peso |
| Hipocampo trisináptico    | P0  | Corteza entorrinal II/III/V, giro dentado, CA3, CA1, subículo, interneurona, aferencia septal             | Perforante → dentado → (musgosas) CA3 → (Schaffer) CA1 → subículo → entorrinal; recurrentes en CA3; vía directa a CA1             | Estimular la perforante; inducir potenciación en Schaffer; ritmo theta    |
| Sección medular           | P0  | Astas, tractos rotulados, motoneuronas α y γ, interneurona Ia, célula de Renshaw, huso, órgano tendinoso  | Miotático (+ monosináptico), inhibición recíproca (−), Renshaw (−), tendinoso (−), retirada                                       | Golpe de martillo; lesiones (hemisección, siringomielia)                  |
| Retina                    | P0  | Conos y bastones, horizontales, bipolares ON y OFF, amacrinas, ganglionares, epitelio pigmentario         | Luz → fotorreceptor se hiperpolariza → bipolar ON/OFF → ganglionar; horizontales dan el antagonismo de periferia                  | Mover un punto de luz por el campo receptivo; manejado por SIM            |
| Motivos de inhibición     | P1  | Piramidal, PV, SST, VIP                                                                                   | Inhibición anticipada, de retroalimentación, lateral, desinhibición (VIP ⊣ SST ⊣ piramidal)                                       | Elegir el motivo y estimular                                              |
| Tálamo y núcleo reticular | P1  | Célula de relevo, célula reticular, piramidal de capa VI                                                  | Bucle del catálogo anterior a escala celular                                                                                      | Cambiar entre modo tónico y en ráfaga                                     |
| Estriado                  | P1  | Espinosas medianas D1 y D2, interneurona colinérgica, terminal dopaminérgico                              | Dopamina sube la ganancia en D1 y la baja en D2                                                                                   | Deslizador de dopamina                                                    |
| Microcircuito predictivo  | P1  | Capas de la columna existente                                                                             | Superficiales = error (ascendente), profundas = predicción (descendente). Hipótesis (Bastos et al. 2012)                          | Interruptor «ver como hipótesis» sobre la columna                         |

## 4. Catálogo de animaciones

### 4.1 Principios de movimiento para todo el atlas

1. **La luz es información.** Los cuerpos son tenues; solo brilla lo que está ocurriendo. Antes de cualquier
   señal, el contexto baja (`uDim` 0,5 a 0,7 en 300 ms). Nunca más de tres elementos a brillo máximo.
2. **Causa antes que efecto, siempre visible.** Toda señal tiene cuatro tiempos: aviso en el origen (el nodo se
   contrae y brilla, 120 ms), viaje, llegada (destello de 80 ms) y respuesta del destino. Si el estudiante
   pestañea y se pierde uno, la animación falló.
3. **Ataque rápido, caída lenta.** El brillo sube en 60–90 ms y decae exponencialmente con τ ≈ 350 ms
   (`approach` con `rate` 14 para subir y 3 para bajar). Así se ve una espiga y queda su rastro.
4. **El tiempo real se declara.** Cada animación muestra su factor de cámara lenta y la duración real del
   fenómeno. Un potencial de acción dura 1 ms; en pantalla, 1,2 s.
5. **La velocidad relativa es dato; la absoluta, no.** Una fibra mielínica gruesa se ve más rápida que una
   amielínica, comprimiendo la razón real de forma logarítmica para que ambas sean visibles.
6. **Una sola gramática.** Los colores y formas de §3.2 valen en todos los niveles: una sinapsis inhibitoria en
   la escena micro usa el mismo magenta que una vía inhibitoria en el encéfalo.
7. **La cámara acompaña, no protagoniza.** Movimientos de 0,9 a 1,6 s con amortiguamiento crítico
   (`smoothTime` 0,45 de `CameraControls`), sin giros de más de 120° y sin mover la cámara mientras viaja una
   señal, salvo que el recorrido pida seguirla.
8. **Todo se puede pausar, repetir y recorrer por pasos.** Barra espaciadora, tecla `A` y una línea de tiempo.
9. **Movimiento reducido.** Con `prefers-reduced-motion`, los viajes se reemplazan por encendidos sucesivos sin
   desplazamiento, la cámara corta en vez de volar y no hay respiración de fondo.
10. **Presupuesto.** Pensado para un MacBook Air de 8 GB: como máximo 24 tubos con pulso a la vez, 2000
    partículas instanciadas, un solo paso de bloom (el actual) y ningún material nuevo por fotograma. El
    encéfalo ya son 607 000 triángulos con mezcla aditiva a doble cara: las animaciones solo cambian uniformes.

Brillo de referencia para el bloom actual (umbral 0,08, intensidad 0,95): cuerpos hasta 0,6; selección hasta
1,6; cabeza de pulso entre 2,2 y 3,0.

### 4.2 Especificaciones

| Id  | Animación                             | Qué se ilumina y en qué orden                                                                                                                                                                                                                                                                   | Duración y curva                                                                                                       | Color e intensidad                                                                 |
| --- | ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| V1  | Pulso por vía larga                   | El tubo se revela tramo a tramo (ya existe); luego una sola cabeza recorre toda la vía y cada relevo destella al pasar                                                                                                                                                                          | Revelado 1,1 s por tramo, desfase 0,55 s. Cabeza: 3–6 s por vía; pausa de 150 ms en cada sinapsis                      | Cian o ámbar; cabeza 2,6, cola exponencial del 18 % del tramo, tubo base 0,28      |
| V2  | Pulso de circuito con signo           | Aviso en el nodo → cometa o trazos por la arista → llegada → el nodo destino sube o baja a su nueva actividad                                                                                                                                                                                   | Aviso 120 ms; viaje 400–900 ms según el retardo; llegada 80 ms; respuesta con τ 350 ms                                 | §3.2; el brillo del nodo es su actividad `a` (0,15 + 1,4·a)                        |
| V3  | Tono basal                            | Los nodos tónicos laten suavemente antes de cualquier estímulo, para que se vea que frenan                                                                                                                                                                                                      | Latido de 1,2 s, seno, amplitud 15 %                                                                                   | Magenta tenue en nodos inhibitorios tónicos                                        |
| V4  | Lesión                                | El nodo lesionado pierde relleno, queda en contorno punteado y deja de emitir                                                                                                                                                                                                                   | 400 ms, salida suave                                                                                                   | Gris azulado `#6b80a5`, brillo 0,2                                                 |
| A1  | Potencial de acción en la neurona     | Sumación en dendritas (manchas que decaen hacia el soma) → el cono axónico cruza el umbral → onda por el axón: frente blanco (Na⁺), estela ámbar (K⁺), tramo refractario apagado                                                                                                                | 1,2 s por espiga en pantalla; frente con caída exponencial                                                             | Frente `#e8f7ff` a 2,8; estela `#ffb057` a 1,2; refractario a 0,3 del brillo base  |
| A2  | Conducción saltatoria                 | El frente salta de nodo en nodo; el internodo se ilumina de golpe, tenue                                                                                                                                                                                                                        | 90 ms por nodo; el mismo axón sin mielina avanza de forma continua y visiblemente más lenta                            | Nodos a 2,6; internodo a 0,6                                                       |
| A3  | Propagación retrógrada y coincidencia | Tras la espiga, una onda tenue sube por la dendrita apical; si coincide con una entrada distal, destello en el penacho                                                                                                                                                                          | 600 ms hacia arriba                                                                                                    | Violeta para la retrógrada; blanco en la coincidencia                              |
| S0  | Liberación sináptica                  | Espiga baja por el axón → entran partículas de Ca²⁺ por la zona activa → una vesícula se funde con destello → nube de 60–100 partículas cruza la hendidura → receptores se encienden → entra el ion → recaptación y endocitosis                                                                 | 3 s por ciclo (existe); con el simulador de corto plazo, el número de vesículas listas sigue a la variable de recursos | Ca²⁺ `#ffd27a`; glutamato `#6fd08c`; GABA magenta; receptor activo a 2,2           |
| S2  | Potenciación a largo plazo            | Estímulo débil: solo AMPA. Estímulo fuerte o pareado: el tapón de Mg²⁺ sale del NMDA, entra Ca²⁺, la espina se llena de brillo, aparecen receptores AMPA nuevos y la cabeza de la espina crece un 20 %                                                                                          | 6 s en tres actos, con rótulo de «minutos a horas» en el tiempo real                                                   | Mg²⁺ como punto gris que se expulsa; Ca²⁺ ámbar; receptores nuevos nacen en blanco |
| S3  | Ventana STDP                          | Dos espigas, pre y post, con el desfase del deslizador; la sinapsis engorda o adelgaza según el orden                                                                                                                                                                                           | 1,5 s por par; el grosor cambia en 300 ms                                                                              | Verde menta si potencia, magenta si deprime                                        |
| N1  | Neuromodulación por volumen           | El núcleo de origen late; los haces se revelan desde el origen con ramificación; cada región diana recibe una bruma que sube, se sostiene y decae                                                                                                                                               | Revelado 1,8 s; bruma: sube 600 ms, meseta 1,5 s, cae 2,5 s                                                            | Color del transmisor (§2.4); bruma a 0,5 sobre el relleno, sin cabeza brillante    |
| N2  | Cascada metabotrópica                 | Ligando llega → receptor cambia de forma → proteína G se separa → la enzima se enciende → muchas partículas de segundo mensajero → canal lejano se modifica                                                                                                                                     | 5 s; cada etapa nace cuando termina la anterior; la amplificación se ve como multiplicación de partículas              | Ligando en su color; mensajeros en ámbar pálido                                    |
| O1  | Oscilación de población               | En la columna, las células E destellan en fase y las I medio ciclo después; una traza de la tasa acompaña                                                                                                                                                                                       | Frecuencia del modelo, llevada a 0,8–2 ciclos por segundo en pantalla                                                  | E cian, I violeta (como hoy)                                                       |
| O2  | Onda cortical                         | Una banda de brillo recorre la corteza como fase de un oscilador por estructura. Dirección y coherencia vienen del modelo de Kuramoto                                                                                                                                                           | 4–8 s por barrido; modulación de `uFill` del 40 %                                                                      | Blanco azulado sobre el tono de la capa activa                                     |
| O3  | Coactivación de una red               | Los nodos de una red de gran escala laten juntos y fuera de fase con la red antagonista (por defecto frente a atencional dorsal)                                                                                                                                                                | Ciclo de 6 s, seno suave. Se rotula «ilustración de anticorrelación, no datos»                                         | Tono de cada red                                                                   |
| S1  | Sueño y vigilia                       | Vigilia: núcleos moduladores encendidos, corteza con brillo irregular y rápido. NREM: se apagan los moduladores, late el preóptico, ondas lentas barren la corteza de adelante hacia atrás y el tálamo emite husos. REM: corteza rápida otra vez, colinérgicos encendidos, aminérgicos apagados | Transición de 3 s entre estados; onda lenta de 1 s por barrido; huso de 1 s cada 4 s                                   | Paleta de la capa de neurotransmisores; ondas lentas en azul profundo              |
| H1  | Señal hormonal                        | Partículas salen del núcleo, bajan a la hipófisis, entran a las arterias y derivan hasta el órgano diana; la retroalimentación vuelve como trazos magenta                                                                                                                                       | 8–10 s; movimiento con ruido suave, sin cabeza                                                                         | Ámbar pálido a 0,8                                                                 |
| M1  | Compuertas de canal                   | Los sensores de voltaje se desplazan, el poro abre, pasan iones uno a uno, la partícula de inactivación tapa el poro                                                                                                                                                                            | Sigue a m, h y n del simulador; sin simulador, ciclo de 2,4 s                                                          | Na⁺ blanco frío, K⁺ ámbar, Ca²⁺ dorado, Cl⁻ verde azulado                          |
| M2  | Ciclo de la bomba                     | Tres Na⁺ entran al sitio, fosforilación (destello), giro, salen; dos K⁺ entran, desfosforilación, vuelven                                                                                                                                                                                       | 4 s por ciclo (existe); la velocidad sigue al simulador                                                                | Como M1; ATP como chispa blanca                                                    |
| T1  | Cambio de nivel                       | El destello de transición existente, más un arrastre de la estructura de origen hacia el centro antes del corte, para que se entienda dónde se entró                                                                                                                                            | 900 ms: 350 ms de acercamiento, 200 ms de destello, 350 ms de aparición                                                | Blanco azulado, opacidad máxima 0,5                                                |
| T2  | Cambio de capa de lectura             | Fundido cruzado de tonos por estructura, con un desfase de 8 ms por estructura ordenado de anterior a posterior                                                                                                                                                                                 | 600 ms en total                                                                                                        | Sin destello                                                                       |
| T3  | Acierto y error en evaluación         | Acierto: la estructura late dos veces. Error: la elegida se apaga y la correcta se enciende con un haz que las une                                                                                                                                                                              | 700 ms                                                                                                                 | Verde menta para acierto; ámbar para «era esta». No se usa rojo                    |

## 5. Recorridos guiados y evaluación

### 5.1 La pieza común: una vista serializable

Recorridos, casos, enlaces «ver en 3D» y enlaces para compartir necesitan lo mismo: describir una vista del
atlas como dato y aplicarla. Se define un solo contrato (`AtlasView`, §8.1) con nivel, selección, capa de
lectura, capas visibles, vía o circuito con escenario, variante micro, simulador y cámara. Un paso de recorrido
es un `AtlasView` con título y texto. La URL es el mismo objeto serializado.

### 5.2 Del curso de 34 unidades a recorridos

El curso de `ontoterrorist` es texto largo con 60 botones «ver en 3D». Convertirlo a mano sería lento; sin
convertirlo, es una pared de texto. Se propone hacerlo en dos capas.

- **Capa automática (lectura).** Un importador pasa cada unidad a bloques estructurados (párrafo, título, tabla,
  clave, correlación clínica, acción) sin HTML crudo. Las acciones se traducen: `e:clave` → seleccionar
  estructura; `v:id` → abrir vía; `m:c|n|s|p|q` → nivel y variante micro, proteína o molécula; `vista:nombre` →
  cámara y capas. La unidad se lee en el panel lateral y cada acción mueve el atlas. Las 34 unidades quedan
  disponibles desde el primer día, rotuladas con su fuente y licencia.
- **Capa de autor (recorrido).** Para las unidades clave, Claude escribe un recorrido de 6 a 10 pasos: cada paso
  tiene una idea, una vista y, si corresponde, una animación que se dispara al entrar. El texto del paso no
  supera 60 palabras; el detalle queda en la unidad. Cada recorrido termina con dos o tres preguntas del banco.

Recorridos de autor por orden de producción: (1) «De la piel a la corteza» (somatosensorial, cruza los siete
niveles); (2) «Un movimiento voluntario» (corteza, ganglios basales, cerebelo, médula, placa motora);
(3) «Ver» (retina, vía visual, V1, corrientes); (4) «Cómo dispara una neurona» (membrana, canales, potencial de
acción, propagación); (5) «Una sinapsis que aprende»; (6) «Dormir»; (7) «Miedo y estrés»; (8) «Recompensa y
dopamina»; (9) «Recordar» (hipocampo); (10) «Dónde está la lesión» (método de localización, unidad 34). Los diez
cubren las 34 unidades como lectura asociada.

Interacción: panel lateral con el paso actual, anterior y siguiente con las flechas del teclado, índice de
pasos, y un botón «explorar libremente» que suelta la cámara sin perder el paso. Si el usuario se aleja, aparece
«volver al recorrido». No se usa secuestro del scroll: el lienzo ya usa la rueda para el zoom.

### 5.3 Modo de evaluación sobre el modelo

| Modalidad            | Origen                                        | Mecánica sobre el 3D                                                                                             |
| -------------------- | --------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Opción múltiple      | 107 preguntas por unidad, con explicación     | Se barajan las opciones. Al responder, el atlas muestra la estructura o vía de la unidad (campo `rel` del curso) |
| Caso clínico         | 18 casos con acción diana (`e:` o `m:`)       | El estudiante elige; luego el atlas vuela a la lesión, la marca con la animación V4 y muestra la explicación     |
| Localizar            | Generada desde `structures.json`              | «Haz clic en el núcleo subtalámico». Los rótulos se ocultan; cuenta el clic sobre la malla correcta o su par     |
| Nombrar              | Generada                                      | Una estructura late; se elige entre cuatro nombres del mismo grupo `g` (distractores plausibles)                 |
| Ordenar una vía      | Generada desde los `pasos` de `pathways.json` | Se ordenan los relevos; al acertar, corre el pulso                                                               |
| Predecir el circuito | Escenarios de `circuits.json`                 | «Si se lesiona el subtalámico, ¿el tálamo sube o baja?». Se responde y el circuito lo ejecuta                    |
| Lesión inversa       | Casos + territorios vasculares                | Se muestran los síntomas y se pide marcar el territorio arterial en la capa de territorios                       |

Las tres últimas son las que aprovechan el medio: no se pueden hacer en papel. El progreso se guarda en
`localStorage` (aciertos por unidad y repetición espaciada simple: lo fallado vuelve antes). No hay cuentas ni
servidor. Un docente comparte un examen como enlace con la lista de identificadores de pregunta.

Los textos de preguntas y casos son CC BY-SA 4.0 de `ontoterrorist`; se muestran con atribución y como
borrador. Las preguntas generadas no afirman nada nuevo: solo consultan nombres y posiciones que ya están.

## 6. Neurociencia computacional integrada

### 6.1 Principio: la simulación maneja la escena

Hoy el laboratorio es un cajón aparte. Se propone un canal de señales mínimo: el simulador activo publica
valores con nombre en cada paso (`V`, `m`, `h`, `n`, `rE`, `rI`, `fase[i]`, `recursos`, `delta`…) y las escenas
los leen dentro de `useFrame`. Sin simulador, las escenas siguen con su animación autónoma actual. El estudiante
mueve un deslizador y ve cambiar la neurona, no solo la curva.

### 6.2 Estructura o circuito ↔ modelo

| Estructura o circuito             | Modelo                                                                             | Qué enseña                                               | Naturaleza                              | Referencias (por verificar)                                                                                                    |
| --------------------------------- | ---------------------------------------------------------------------------------- | -------------------------------------------------------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Membrana, canales                 | Nernst, GHK, Hodgkin–Huxley (existen); canal estocástico                           | Del canal a la corriente macroscópica                    | Modelo biofísico                        | Hodgkin y Huxley 1952; Hille, _Ion Channels of Excitable Membranes_                                                            |
| Neurona, axón                     | HH, LIF, Izhikevich, cable (existen); FitzHugh–Nagumo; AdEx                        | Umbral, clases de excitabilidad, adaptación              | Modelos reducidos                       | FitzHugh 1961; Izhikevich 2007; Brette y Gerstner 2005                                                                         |
| Dendrita                          | Cable pasivo de Rall                                                               | Constantes de espacio y tiempo, sumación                 | Modelo biofísico                        | Rall 1959 y 1967; Dayan y Abbott cap. 6                                                                                        |
| Sinapsis                          | Conductancias AMPA/NMDA/GABA; liberación binomial; Tsodyks–Markram, STDP (existen) | Inversión, coincidencia, cuantos                         | Modelo biofísico y fenomenológico       | Jahr y Stevens 1990; del Castillo y Katz 1954; Tsodyks y Markram 1997; Bi y Poo 1998                                           |
| Reglas de aprendizaje             | Hebb, Oja, BCM                                                                     | Estabilidad del aprendizaje                              | Modelo teórico                          | Oja 1982; Bienenstock, Cooper y Munro 1982                                                                                     |
| Columna cortical                  | Wilson–Cowan, red de espigas (existen)                                             | Balance E/I, ritmos                                      | Modelo de población                     | Wilson y Cowan 1972; Brunel 2000                                                                                               |
| V1                                | Filtro de Gabor lineal–no lineal; modelo de anillo                                 | Campo receptivo, selectividad afinada por la recurrencia | Modelo descriptivo y de circuito        | Hubel y Wiesel 1962; Jones y Palmer 1987; Ben-Yishai, Bar-Or y Sompolinsky 1995                                                |
| Retina                            | Diferencia de gaussianas                                                           | Centro-periferia, respuesta al contraste                 | Modelo descriptivo                      | Rodieck 1965; Kuffler 1953                                                                                                     |
| Corteza motora                    | Vector poblacional                                                                 | Decodificación de una población                          | Modelo descriptivo                      | Georgopoulos, Schwartz y Kettner 1986                                                                                          |
| Ganglios basales                  | Selección de acción por canales en competencia                                     | Directa, indirecta e hiperdirecta como selección y freno | Modelo de circuito                      | Gurney, Prescott y Redgrave 2001; Mink 1996; Frank 2005                                                                        |
| Dopamina, ATV, estriado ventral   | Aprendizaje por diferencias temporales                                             | Error de predicción de recompensa                        | Modelo normativo con apoyo experimental | Schultz, Dayan y Montague 1997; Sutton y Barto                                                                                 |
| Cerebelo                          | Perceptrón de Marr–Albus; filtro adaptativo                                        | Aprendizaje supervisado por la fibra trepadora           | Modelo teórico                          | Marr 1969; Albus 1971; Dean, Porrill, Ekerot y Jörntell 2010                                                                   |
| Hipocampo CA3                     | Red de Hopfield                                                                    | Completar un patrón, capacidad, recuerdos espurios       | Modelo teórico                          | Hopfield 1982; Amit, _Modeling Brain Function_                                                                                 |
| Hipocampo, navegación             | Campos de lugar gaussianos; atractor continuo                                      | Código de posición (datos de roedor)                     | Modelo descriptivo y de circuito        | O'Keefe y Dostrovsky 1971; Zhang 1996; Burak y Fiete 2009                                                                      |
| Prefrontal, parietal              | Difusión con deriva; atractor de decisión                                          | Acumular evidencia, velocidad frente a precisión         | Modelo cognitivo y de circuito          | Ratcliff 1978; Gold y Shadlen 2007; Wong y Wang 2006                                                                           |
| Tálamo y sueño                    | Dos procesos (homeostático y circadiano); interruptor                              | Presión de sueño, transiciones                           | Modelo fenomenológico                   | Borbély 1982; Saper, Scammell y Lu 2005; Phillips y Robinson 2007                                                              |
| Médula                            | Oscilador de medio centro                                                          | Ritmo sin entrada rítmica                                | Modelo de circuito                      | Brown 1911; Matsuoka 1985                                                                                                      |
| Redes de gran escala              | Kuramoto sobre un grafo (existe Kuramoto)                                          | Sincronía, hubs                                          | Modelo fenomenológico                   | Kuramoto 1984; Cabral et al. 2011; Sporns, _Networks of the Brain_                                                             |
| Jerarquía cortical, interocepción | Codificación predictiva; inferencia activa                                         | Predicción y error como principio de organización        | **Marco teórico e hipótesis**           | Rao y Ballard 1999; Friston 2005 y 2010; Bastos et al. 2012; Bogacz 2017; Parr, Pezzulo y Friston 2022; Barrett y Simmons 2015 |

Cada ficha de estructura gana una sección «Modelos y circuitos» con estos enlaces, generada desde un archivo de
vínculos, y cada simulador gana el enlace inverso: «dónde ocurre esto».

### 6.3 Simuladores nuevos

Todos son funciones puras en `packages/simulation/src/dynamics/`, con prueba, y un panel en `lab/models/`.

| Id                                       | Ecuaciones                                                                                                                   | Qué controla el usuario                        | Qué maneja en 3D                                                     | P   |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- | -------------------------------------------------------------------- | --- |
| `fhn`                                    | `dv/dt = v − v³/3 − w + I`; `dw/dt = ε(v + a − b·w)`. Plano de fase con nulclinas                                            | I, ε, a, b                                     | Brillo del soma en la neurona                                        | P0  |
| `synapse`                                | `I = g(t)·(V − E_rev)`; `g` biexponencial; NMDA con `B(V) = 1 / (1 + ([Mg²⁺]/3,57)·e^(−0,062·V))`                            | Tipo de receptor, V, [Mg²⁺]                    | Receptores y tapón de Mg²⁺ en la sinapsis (S2)                       | P0  |
| `td`                                     | `δ_t = r_t + γ·V(s_{t+1}) − V(s_t)`; `V(s_t) ← V(s_t) + α·δ_t`                                                               | α, γ, probabilidad de recompensa, omitirla     | Brillo de la ATV y bruma en el accumbens (circuito de recompensa)    | P0  |
| `basal-ganglia`                          | Canales en competencia con integradores con fuga: `da/dt = −k(a − u)`, salida lineal por tramos; la dopamina pondera D1 y D2 | Saliencia de dos o tres acciones, dopamina     | Actividad de los nodos del circuito de ganglios basales              | P0  |
| `hopfield`                               | `s_i ← signo(Σ_j w_ij·s_j)`; `w_ij = (1/N)·Σ_μ ξ_i^μ·ξ_j^μ`; `E = −½·Σ w_ij·s_i·s_j`                                         | Patrones guardados, ruido de la pista          | Células de CA3 en la escena del hipocampo                            | P0  |
| `cerebellum`                             | Filtro adaptativo: `y = Σ w_i·p_i(t)`; `Δw_i = −η·e(t)·p_i(t)`, con `e` la señal de la trepadora                             | Tasa de aprendizaje, perturbación              | Pesos de paralelas sobre Purkinje en la escena del cerebelo          | P0  |
| `gabor`                                  | `G(x,y) = e^(−(x′² + γ²y′²)/2σ²)·cos(2πx′/λ + φ)`; respuesta = rectificación del producto con el estímulo                    | Orientación, frecuencia, fase; barra o rejilla | Columna de orientación activa                                        | P1  |
| `ring`                                   | Tasas en anillo con conectividad `J₀ + J₂·cos(2(θ − θ′))`                                                                    | Contraste, anisotropía, recurrencia            | Bulto de actividad en un anillo de células                           | P1  |
| `ddm`                                    | `dx = v·dt + σ·dW`, con umbrales ±B                                                                                          | Deriva, umbral, ruido                          | Dos poblaciones que compiten                                         | P1  |
| `cable`                                  | `λ²·∂²V/∂x² = τ·∂V/∂t + V`; `λ = √((d/4)·(R_m/R_i))`                                                                         | Diámetro, R_m, posición de la sinapsis         | Decaimiento del potencial a lo largo de la dendrita                  | P1  |
| `quantal`                                | Número de cuantos ~ Binomial(n, p); amplitud = k·q                                                                           | n, p, q                                        | Vesículas que se liberan en la sinapsis                              | P1  |
| `dog`                                    | Centro menos periferia: diferencia de dos gaussianas                                                                         | Tamaños, posición del estímulo                 | Ganglionar ON u OFF en la escena de retina                           | P1  |
| `predictive`                             | Un nivel: `dφ/dt = ε_p·∂g/∂φ − ε_y`, con errores ponderados por precisión (formulación del tutorial de Bogacz)               | Precisión sensorial y del prior                | Poblaciones de error y de predicción en el microcircuito (hipótesis) | P1  |
| `sleep`                                  | Dos procesos: presión S que sube en vigilia y cae en sueño, más oscilación circadiana C                                      | Hora de acostarse, privación                   | Estado de la animación S1                                            | P1  |
| `half-center`                            | Dos unidades con inhibición mutua y adaptación                                                                               | Impulso tónico, fuerza de adaptación           | Flexor y extensor en la escena medular                               | P2  |
| `channel`                                | Canal de dos estados con tasas α(V) y β(V); N canales                                                                        | N, V                                           | Canales individuales que abren y cierran en la membrana              | P2  |
| `adex`, `bcm`, `popvector`, `jansen-rit` | Según sus artículos de origen                                                                                                | —                                              | —                                                                    | P2  |

Las ecuaciones anteriores son las formas estándar. Los valores de parámetros los transcribe el ejecutor desde la
fuente o los declara ilustrativos. Cada panel declara alcance y naturaleza, como ya hace `Frame` en `Models.tsx`.

### 6.4 Marcos teóricos

Codificación predictiva e inferencia activa entran como una lente que se activa de forma explícita («ver como
hipótesis»), nunca como rótulos por defecto. La lente hace tres cosas: recolorea las conexiones ascendentes y
descendentes de un circuito existente como error y predicción, abre el simulador `predictive` y muestra una
ficha con qué predice el marco, qué evidencia lo apoya, cuál lo complica y qué alternativas hay. El director es
quien revisa ese texto.

## 7. Ilustraciones de base a generar con IA

Reglas: (a) ninguna imagen lleva texto, números ni flechas; los rótulos se ponen en HTML o SVG; (b) ninguna se
presenta como anatomía: en créditos y en el atributo `alt` figuran como «ilustración esquemática generada con
IA»; (c) los sprites van sobre negro puro porque se dibujan con mezcla aditiva y el negro equivale a
transparente; (d) se entregan en WebP (PNG si hace falta canal alfa) dentro de `apps/web/public/atlas/img/`, con
un `manifest.json` que registra generador, fecha y prompt; (e) el peso total no supera 2,5 MB y todo se carga de
forma diferida.

**Estilo base** (anteponer a cada prompt):

```text
Ilustración científica estilizada tipo holograma. Luz azul eléctrica y cian (#3a86ff, #5ee6ff, #c4e6ff) que
emana de los bordes de las formas, con interior translúcido más denso hacia el centro, sobre fondo azul marino
muy oscuro que cae a negro (#020614 → #000000). Resplandor suave tipo bloom, líneas finas y precisas, sensación
de vidrio luminoso y luz volumétrica. Acentos mínimos en ámbar (#ffb057) o violeta (#c49bff) solo donde se
indique. Composición limpia y centrada con mucho espacio negativo. Sin texto, sin letras, sin números, sin
flechas, sin marcas de agua, sin marcos, sin personas. No fotorrealista, no caricatura, no estética de terror.
```

| N.º | Ilustración                          | Prompt (después del estilo base)                                                                                                                                                                                                                                                                                                                   | Tamaño y formato                  | Uso                                         |
| --- | ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------- | ------------------------------------------- |
| 1   | Íconos de los 7 niveles              | Siete íconos de línea luminosa, uno por imagen, mismo grosor de trazo: silueta humana con eje nervioso; encéfalo de perfil; corte coronal con núcleos; columna con seis estratos; neurona con dendritas y axón; botón sináptico frente a una espina; canal atravesando una membrana. Trazo único cian sobre negro, sin relleno.                    | 512×512 cada uno, PNG con alfa    | Riel de escalas, aviso de nivel, recorridos |
| 2   | Cabeceras de lámina por nivel        | Siete imágenes panorámicas, una por nivel, con el mismo motivo que el ícono pero como escena volumétrica con profundidad de campo; el sujeto a la derecha y el tercio izquierdo casi negro para superponer el título.                                                                                                                              | 1600×640, WebP                    | Cabecera de `InfoSheet`                     |
| 3   | Portadas de recorridos               | Diez imágenes evocadoras: una mano tocando una superficie con un hilo de luz que sube por el brazo; un ojo con un haz hacia la nuca; una figura en reposo con ondas lentas; dos formas en balanza con un punto ámbar; un laberinto con un punto brillante; y análogas para movimiento, espiga, sinapsis, miedo y lesión.                           | 1600×900, WebP                    | Tarjetas del índice de recorridos           |
| 4   | Tarjetas de tipos neuronales         | Doce retratos, uno por imagen, cuerpo entero sobre negro, proporciones distintivas y sin escala: piramidal de capa V, Purkinje, granular del cerebelo, estrellada espinosa, célula en cesta, candelabro, Martinotti, espinosa mediana, motoneurona alfa, bipolar de retina, pseudounipolar, dopaminérgica. Dendritas en cian, axón en ámbar tenue. | 768×1024, WebP                    | Sección «tipos» de la lámina de neurona     |
| 5   | Tarjetas de células gliales          | Cuatro retratos en el mismo estilo: astrocito con pies sobre un capilar, oligodendrocito envolviendo varios axones, microglía ramificada, célula de Schwann en un axón.                                                                                                                                                                            | 768×1024, WebP                    | Variante «glía» y su lámina                 |
| 6   | Emblemas de los 6 neuromoduladores   | Seis emblemas abstractos, uno por imagen: un pequeño núcleo muy brillante del que salen filamentos ramificados que se abren hacia arriba como un árbol. Mismo diseño con distinto color dominante: violeta, azul celeste, dorado, rosa, verde, naranja.                                                                                            | 800×800, WebP                     | Selector de la capa de neurotransmisores    |
| 7   | Emblemas de las redes de gran escala | Siete composiciones abstractas de nodos y arcos sobre una silueta cerebral apenas insinuada, cada una con una distribución distinta de nodos encendidos; sin pretender ubicación anatómica.                                                                                                                                                        | 800×800, WebP                     | Leyenda de la capa de redes                 |
| 8   | Íconos de capas de lectura           | Diez íconos de línea, uno por imagen: gajos (lóbulos), mosaico numerado sin números (Brodmann), árbol arterial, red de nodos, degradado en bandas, haces de fibras, tres divisiones apiladas, gota con ondas, núcleo con rayos, capas concéntricas.                                                                                                | 256×256, PNG con alfa             | Barra de capas                              |
| 9   | Sprite de vesícula sináptica         | Una esfera translúcida vista de frente, borde luminoso nítido e interior con granulado fino; fondo negro puro; sin sombras.                                                                                                                                                                                                                        | 256×256, PNG                      | Partículas instanciadas en la sinapsis      |
| 10  | Hoja de sprites de iones             | Cinco puntos de luz esféricos, en fila y bien separados, sobre negro puro: blanco frío, ámbar, dorado, verde azulado y gris azulado. Núcleo brillante y halo suave, todos del mismo tamaño.                                                                                                                                                        | 1280×256, PNG                     | Iones en membrana y sinapsis                |
| 11  | Destello de espiga                   | Destello anamórfico horizontal con núcleo blanco y halo cian, perfectamente simétrico, sobre negro puro.                                                                                                                                                                                                                                           | 512×512, PNG                      | Llegada de pulsos y espigas                 |
| 12  | Textura de bicapa lipídica           | Textura repetible sin costuras, en escala de grises: cabezas de lípidos como un empaquetado denso de discos pequeños con variación sutil, vista cenital. Plana, sin iluminación direccional.                                                                                                                                                       | 1024×1024, WebP                   | Modulación del relleno de la membrana       |
| 13  | Textura de fibras                    | Textura repetible sin costuras, en escala de grises: haces de fibras paralelas levemente onduladas, densidad variable. Plana.                                                                                                                                                                                                                      | 1024×1024, WebP                   | Sustancia blanca y nervios al acercarse     |
| 14  | Ruido volumétrico suave              | Textura repetible sin costuras, en escala de grises: nubosidad muy suave de baja frecuencia, sin detalles duros.                                                                                                                                                                                                                                   | 512×512, WebP                     | Bruma de neuromodulación                    |
| 15  | Fondo de carga                       | Campo profundo casi negro con una tenue nebulosa azul marino descentrada y polvo de puntos muy pequeños; ningún objeto reconocible.                                                                                                                                                                                                                | 2560×1440, WebP (menos de 250 kB) | Pantalla de carga y portada de recorridos   |
| 16  | Insignias de evaluación              | Seis medallones de línea luminosa con motivos abstractos distintos (anillos, hexágono, espiral, tres nodos, onda, estrella de seis puntas).                                                                                                                                                                                                        | 384×384, PNG con alfa             | Progreso por bloque de unidades             |
| 17  | Imagen para compartir                | Encéfalo de perfil como holograma de luz azul con un único haz ámbar que baja hacia la médula; el sujeto a la izquierda y el tercio derecho libre.                                                                                                                                                                                                 | 1200×630, PNG                     | Metadatos de la página                      |
| 18  | Láminas base sin rótulos             | Cuatro fondos para diagramas hechos en código: sección transversal de médula; corte de hipocampo con su doble C; folia cerebelosa con sus capas; retina en capas. Formas tenues, casi siluetas, para que el SVG rotulado vaya encima.                                                                                                              | 1600×1000, WebP                   | Fondo de D2D en láminas                     |

Antes de integrar cualquier imagen se revisa que no tenga letras falsas, que no parezca una micrografía real y
que su anatomía no sea engañosa. Si lo es, se descarta. Las imágenes 4, 5 y 18 son las más expuestas a ese
riesgo: son las que el director debería mirar con ojo de anatomista.

## 8. Plan de ejecución (WP-060 a WP-084)

### 8.1 Contratos compartidos

Los fija Claude en WP-060 antes de lanzar agentes, para que los WP paralelos no choquen en `store.ts`,
`AtlasApp.tsx` ni `Stage.tsx`.

```ts
// apps/web/src/atlas/store.ts — campos nuevos
overlay: string | null;                      // capa de lectura activa
overlaySolo: string | null;                  // clase fijada en la leyenda
circuit: string | null;                      // circuito con signo abierto
circuitRun: { scenario: string; lesions: string[]; nonce: number } | null;
tour: { id: string; step: number } | null;
setOverlay(id: string | null): void;  setOverlaySolo(c: string | null): void;
setCircuit(id: string | null): void;  runCircuit(scenario: string, lesions?: string[]): void;
setTour(t: { id: string; step: number } | null): void;
// CameraCommand gana: { type: 'pose'; pos: [number, number, number]; target: [number, number, number] }

// apps/web/src/atlas/view.ts — vista serializable
export interface AtlasView {
  level?: LevelId;  select?: string | null;  overlay?: string | null;  overlaySolo?: string | null;
  layers?: Partial<Record<LayerId, boolean>>;  peel?: number;
  pathway?: string | null;  pathwayStep?: number;
  circuit?: string | null;  scenario?: string | null;  lesions?: string[];
  variant?: string | null;  lab?: string | null;  camera?: CameraCommand;
}
export function applyView(v: AtlasView): void;
export function viewToQuery(v: AtlasView): string;
export function queryToView(q: string): AtlasView;

// apps/web/src/atlas/signals.ts — canal simulación → escena (sin React)
export function publish(name: string, value: number): void;
export function read(name: string, fallback?: number): number;
export function clearSignals(prefix?: string): void;

// apps/web/src/atlas/data.ts — tipos de datos nuevos
export interface CircuitNode { id: string; n: string; at: PathPoint; basal?: number; marker?: boolean }
export interface CircuitEdge {
  from: string; to: string; sign: 'exc' | 'inh' | 'mod' | 'horm';
  nt?: string; delay: number; w?: number; via?: PathPoint[]; modulates?: { edges: number[]; gain: number };
}
export interface Scenario { id: string; n: string; d: string; stim: { node: string; at: number; amp: number; dur: number }[]; lesions?: string[] }
export interface Circuit {
  id: string; g: string; n: string; sub?: string; res?: string;
  nature: 'observacion' | 'modelo' | 'hipotesis'; species?: string;
  nodes: CircuitNode[]; edges: CircuitEdge[]; scenarios: Scenario[];
  steps?: { t: string; d: string; focus: string }[]; model?: string; micro?: string; refs?: string[];
}
export interface Overlay {
  id: string; n: string; kind: 'categorical' | 'scalar';
  classes?: { id: string; n: string; col: string; d?: string }[];
  values: Record<string, number | Record<string, number>>;   // clave Allen (con `_L`/`_R` si es asimétrica)
  source: { cite: string; license: string; url?: string; method: string }; note?: string;
}
```

Archivos de datos nuevos, todos en `apps/web/public/atlas/` (nivel superior, ya excluido de Prettier) y con
`"status": "borrador — sin revisión experta"`: `overlays.json`, `circuits.json`, `tours.json`, `course.json`,
`quiz.json`, `links.json`, `molecules.json`. Cada uno tiene su comprobación en `tools/check-atlas-data.mjs`:
claves desconocidas, referencias a mallas, vías, circuitos o modelos inexistentes y textos vacíos hacen fallar
`npm run check`.

Reglas comunes a todos los WP: leer `AGENTS.md`, `docs/adr/0011-atlas-multiescala.md` y las secciones de este
plan que el WP cite; no agregar dependencias npm; no tocar `packages/schemas` ni `content/`; código en inglés y
textos en español; todo texto nuevo como borrador; verificación mínima `npm run typecheck`,
`npx eslint apps/web/src/atlas`, `npx prettier --write` sobre los archivos tocados y `npm run test`. Cada WP
autoriza solo los archivos que lista; si necesita otro, se detiene y lo dice.

### 8.2 Olas y paralelismo

`BOOT.md` del sistema del director fija un máximo de dos agentes en paralelo. Las parejas propuestas no
comparten archivos, salvo una línea de montaje en `AtlasApp.tsx` o `Stage.tsx` que Claude concilia al integrar.

| Ola | WP en paralelo                              | Resultado visible                                                       |
| --- | ------------------------------------------- | ----------------------------------------------------------------------- |
| 0   | 060 (Claude)                                | Contratos, validación y pruebas de humo                                 |
| 1   | 061 ∥ 062                                   | Capas de lectura y circuitos con signo: el salto visual y docente mayor |
| 2   | 063 ∥ 064, luego 065 ∥ 068                  | Enlaces compartibles, curso importado, recorridos y neuromoduladores    |
| 3   | 066 ∥ 067, luego 069                        | Evaluación; la simulación mueve las escenas; registro de variantes      |
| 4   | 070 ∥ 071, luego 072 ∥ 073                  | Cerebelo, hipocampo, médula y retina a escala de circuito               |
| 5   | 074 ∥ 077, luego 075 ∥ 078                  | Simuladores nuevos, más circuitos, ondas y sueño                        |
| 6   | 076 ∥ 079, luego 080 ∥ 081, luego 082 ∥ 083 | Vínculos estructura–modelo, redes y gradiente, moléculas, láminas, arte |
| 7   | 084                                         | Tractos de sustancia blanca                                             |

### 8.3 Paquetes de trabajo

#### WP-060 · Contratos del atlas, validación de datos y pruebas de humo

- **Tamaño:** S · **Ejecutor:** Claude · **Depende de:** — · **Paralelo:** no (va primero)
- **Objetivo:** dejar fijados los contratos de §8.1 y una red de seguridad antes de abrir trabajo paralelo.
- **Archivos:** editar `apps/web/src/atlas/store.ts`, `data.ts`, `scene/Stage.tsx` (solo el comando `pose`),
  `package.json` raíz (script `atlas:check` dentro de `check`). Crear `apps/web/src/atlas/view.ts`,
  `signals.ts`, `tools/check-atlas-data.mjs`, `e2e/atlas.spec.ts`, `docs/adr/0012-datos-de-autor-del-atlas.md`,
  los archivos `docs/work-packages/WP-06x.md` de la ola 1 y las filas de `docs/backlog.md`.
- **Contrato:** exactamente el de §8.1. `applyView` solo llama acciones existentes del store y emite `na:lab`.
  El ADR-0012 extiende el ADR-0011: circuitos, capas, recorridos y vínculos son datos de autor validados, igual
  que `levels.json`.
- **Aceptación:** `npm run check` en verde con `check-levels` y `check-atlas-data` incluidos; `e2e/atlas.spec.ts`
  carga la portada, cambia a los siete niveles con las teclas 1–7, abre una vía y una lámina, sin errores de
  consola; `queryToView(viewToQuery(v))` devuelve `v` en una prueba unitaria; con `prefers-reduced-motion` el
  destello de transición no se monta.

#### WP-061 · Capas de lectura I: lóbulos, divisiones, sistemas, Brodmann, territorios, cerebelo

- **Tamaño:** M · **Ejecutor:** Codex · **Depende de:** 060 · **Paralelo:** con 062
- **Objetivo:** recolorear las 141 estructuras según seis mapas que ya están en los datos.
- **Archivos:** crear `apps/web/src/atlas/overlays.ts`, `ui/OverlayBar.tsx`, `ui/OverlayLegend.tsx`,
  `overlays.test.ts`. Editar `scene/Anatomy.tsx`, `scene/AmbientLabels.tsx`, `ui/InfoSheet.tsx` (chips de
  pertenencia), `ui/Search.tsx` (buscar «área 17», «ACM»), `AtlasApp.tsx` (montaje), `atlas.css`.
- **Contrato:** `overlays.ts` exporta `builtinOverlays(data: AtlasData): Overlay[]`, derivadas de
  `structures[k].g | s | ba | a` y `taxonomy`, y `overlayStyle(overlay, solo, key): { color: string; w: number } | null`.
  `Anatomy` guarda el `HoloLook` base en cada `Part` y en `useFrame` interpola `uColor`, `uFill` y `uDim` según
  §2.1, sin tocar el shader. Lee `overlay` y `overlaySolo` del store. Las capas corporales no se recolorean.
- **Aceptación:** seis capas elegibles desde la barra; el cambio es un fundido de 600 ms; pasar el cursor por
  una clase de la leyenda aísla esa clase; con «territorios» activo y la capa de arterias visible, elegir ACM
  resalta `a_cerebral_media_*`; con «Brodmann» aparecen rótulos numéricos en el nivel de áreas; la leyenda
  muestra fuente y la advertencia de asignación por giro; prueba unitaria: cada clave cortical recibe clase en
  «lóbulos» y las 60 con `ba` reciben rótulo; sin capa activa, la imagen es idéntica a la actual.

#### WP-062 · Motor de circuitos con signo y tres circuitos semilla

- **Tamaño:** L · **Ejecutor:** Codex (datos semilla redactados por Claude) · **Depende de:** 060 · **Paralelo:** con 061
- **Objetivo:** que un circuito muestre excitación, inhibición y desinhibición como consecuencia de un estímulo.
- **Archivos:** crear `packages/simulation/src/dynamics/signedGraph.ts` y su prueba, `apps/web/src/atlas/scene/Circuits.tsx`,
  `ui/CircuitPanel.tsx`, `apps/web/public/atlas/circuits.json`. Editar `packages/simulation/src/dynamics/index.ts`,
  `data.ts` (carga de `circuits.json`), `scene/Stage.tsx` (montaje), `ui/PathwayPanel.tsx` (pestaña
  «Circuitos»), `AtlasApp.tsx`, `atlas.css`.
- **Contrato:** `simulateSignedGraph(graph, scenario, { dt, T, tau }) → { t: Float32Array; activity: Float32Array[]; pulses: { edge: number; t0: number; t1: number; strength: number }[] }`,
  función pura con el modelo de §3.1; no importa nada de la web. `Circuits.tsx` lee `circuit` y `circuitRun`
  del store, resuelve `at` y `via` con `resolvePoint`, dibuja nodos (esferas con halo cuyo brillo es la
  actividad) y aristas (tubos con el sombreador de `Pathways.tsx` extendido con `uHead`, `uSign` y `uStrength`).
  Clic en un nodo llama `runCircuit` con un escenario ad hoc. Circuitos semilla: `gb-motor` (geometría de la
  vía `ganglios`), `cerebelo-bucle` (de `cerebelo`) y `miedo`.
- **Aceptación:** pruebas del planificador: en `gb-motor`, «directa» sube el tálamo sobre su basal, «indirecta»
  lo baja, «hiperdirecta» lo baja antes de que llegue la directa, «sin dopamina» reduce la respuesta de la
  directa, y lesionar el subtalámico sube el tálamo; en pantalla, los tres tipos de señal se distinguen también
  en escala de grises; reproducir, pausar, paso a paso y velocidad funcionan; insignia de cámara lenta visible;
  etiqueta de naturaleza visible; 60 fps en el nivel de áreas con un circuito corriendo en el equipo de
  referencia (se informa la medición, no se supone).

#### WP-063 · Vista en la URL y enlaces compartibles

- **Tamaño:** S · **Ejecutor:** Codex · **Depende de:** 060 · **Paralelo:** con 064
- **Objetivo:** que cualquier estado del atlas sea un enlace.
- **Archivos:** editar `apps/web/src/atlas/view.ts`, `AtlasApp.tsx`. Crear `ui/ShareButton.tsx`, `view.test.ts`.
- **Contrato:** al cargar, `queryToView(location.search)` se aplica después de `setData`. Los cambios de nivel,
  selección, capa, vía, circuito y variante actualizan la URL con `history.replaceState` (con retardo de 300 ms).
  La cámara solo se serializa al pulsar «Copiar enlace». No interfiere con `?unidad`.
- **Aceptación:** abrir `?n=areas&e=putamen_L&capa=sistemas` muestra el putamen seleccionado con la capa
  activa; el botón copia un enlace que reproduce la vista, cámara incluida; parámetros desconocidos se ignoran
  sin error; prueba e2e del ida y vuelta.

#### WP-064 · Importar el curso, las preguntas y los casos

- **Tamaño:** S · **Ejecutor:** Codex · **Depende de:** 060 · **Paralelo:** con 063
- **Objetivo:** traer las 34 unidades, 107 preguntas y 18 casos como datos estructurados y sin HTML crudo.
- **Archivos:** crear `tools/import-onto-course.mjs`. Genera `apps/web/public/atlas/course.json` y `quiz.json`.
  Editar `tools/check-atlas-data.mjs` y `apps/web/src/atlas/ui/Credits.tsx` (atribución del curso).
- **Contrato:** `course.json`: `{ semesters: [{ n, sub, units: [{ id, n, baj, obj[], rel[], blocks[] }] }] }`,
  con `blocks` de tipo `p | h | ul | table | key | clinical | action`; el texto en línea admite solo negrita y
  cursiva como marcas. Cada `action` lleva un `AtlasView` traducido desde `e:`, `v:`, `m:` y `vista:`.
  `quiz.json`: `{ questions: [{ id, unit, q, options[4], answer: 0, why }], cases: [{ id, unit, q, options[4], answer: 0, why, view }] }`.
  El importador lee un clon local; no descarga nada.
- **Aceptación:** 34 unidades, 107 preguntas y 18 casos; ninguna cadena contiene `<` ni `>`; toda acción
  resuelve a una malla, vía o variante existente, o aparece en un informe de acciones sin destino (se informa,
  no se inventa); el comprobador pasa.

#### WP-065 · Recorridos guiados y lector del curso

- **Tamaño:** M · **Ejecutor:** Codex (recorridos redactados por Claude) · **Depende de:** 063, 064 · **Paralelo:** con 068
- **Objetivo:** guiar una clase paso a paso moviendo cámara, capas y animaciones.
- **Archivos:** crear `apps/web/src/atlas/ui/TourPlayer.tsx`, `ui/TourIndex.tsx`, `ui/CourseReader.tsx`,
  `apps/web/public/atlas/tours.json`. Editar `AtlasApp.tsx`, `atlas.css`, `tools/check-atlas-data.mjs`.
- **Contrato:** `tours.json`: `{ tours: [{ id, n, sub, cover?, units[], steps: [{ t, d, view: AtlasView, run?: 'pathway' | 'circuit' }] }] }`.
  `TourPlayer` lee `tour` del store y llama `applyView` al entrar en cada paso. Flechas izquierda y derecha
  navegan; «explorar libremente» deja el paso fijo y muestra «volver al recorrido». `CourseReader` muestra una
  unidad de `course.json`; sus acciones llaman `applyView`.
- **Aceptación:** tres recorridos semilla completos («De la piel a la corteza», «Un movimiento voluntario»,
  «Cómo dispara una neurona»); el recorrido cruza niveles anatómicos y micro sin perder el paso; cada paso tiene
  enlace propio; las 34 unidades se leen y sus acciones funcionan; todo navegable con teclado y anunciado con
  `aria-live`; prueba e2e que avanza un recorrido completo.

#### WP-066 · Modo de evaluación

- **Tamaño:** M · **Ejecutor:** Codex · **Depende de:** 063, 064 · **Paralelo:** con 067
- **Objetivo:** evaluar sobre el modelo con las modalidades de §5.3.
- **Archivos:** crear `apps/web/src/atlas/quiz/` (`engine.ts`, `engine.test.ts`, `QuizPanel.tsx`,
  `generators.ts`). Editar `scene/Anatomy.tsx` (modo que oculta rótulos e informa el clic), `store.ts` (campo
  `quiz: { mode: string; target?: string } | null`), `AtlasApp.tsx`, `atlas.css`.
- **Contrato:** `engine.ts` es puro: baraja con semilla, corrige y agenda repeticiones; guarda en
  `localStorage` bajo `na:quiz:v1`. `generators.ts` crea preguntas de localizar, nombrar y ordenar desde
  `AtlasData`; los distractores salen del mismo grupo `g`. En «localizar», el clic vale sobre la malla o su par
  contralateral.
- **Aceptación:** opción múltiple, caso clínico, localizar, nombrar y ordenar vía funcionan; al responder un
  caso la cámara vuela a la lesión; animación T3 en acierto y error, sin rojo; el progreso sobrevive a recargar;
  un examen se comparte como enlace con identificadores; «predecir el circuito» queda detrás de un indicador
  hasta que exista WP-062.

#### WP-067 · La simulación maneja la escena

- **Tamaño:** M · **Ejecutor:** Codex · **Depende de:** 060 · **Paralelo:** con 066
- **Objetivo:** que mover un deslizador cambie la escena 3D.
- **Archivos:** editar `apps/web/src/atlas/lab/models/Models.tsx`, `micro/NeuronScene.tsx`,
  `micro/ColumnScene.tsx`, `micro/MembraneScene.tsx`, `micro/SynapseScene.tsx`, `ui/LabDrawer.tsx`.
- **Contrato:** cada panel reproduce su última simulación en bucle y publica con `publish`: `hh.V`, `hh.m`,
  `hh.h`, `hh.n`, `wc.E`, `wc.I`, `tm.x`, `tm.u`, `axon.V[i]`, `pump.rate`. Las escenas leen con
  `read(nombre, NaN)` y, si el valor es `NaN`, siguen con su animación autónoma. El cajón del laboratorio deja
  de tapar la escena: se acopla abajo o al costado.
- **Aceptación:** con HH abierto en el nivel neurona, el brillo del soma y la onda del axón siguen a `V`; en
  «canales», las compuertas siguen a m, h y n; subir la corriente aumenta visiblemente la frecuencia en 3D; con
  Wilson–Cowan, la variante «ritmo E/I» sigue al modelo; con Tsodyks–Markram, la reserva de vesículas sigue a
  `x`; al cerrar el laboratorio la escena vuelve a su ciclo propio; sin regresión de fps.

#### WP-068 · Sistemas de neurotransmisores (fase A)

- **Tamaño:** M · **Ejecutor:** Codex · **Depende de:** 061, 062 · **Paralelo:** con 065
- **Objetivo:** un modo por transmisor con núcleo de origen, proyecciones animadas y regiones diana.
- **Archivos:** crear `apps/web/src/atlas/scene/Neuromod.tsx`, `apps/web/public/atlas/overlays.json` (entrada
  `neurotransmisores`). Editar `overlays.ts`, `ui/OverlayLegend.tsx`, `scene/Stage.tsx`, `data.ts`.
- **Contrato:** los orígenes y trayectos se leen de los tramos de `dopamina` y `moduladores` en
  `pathways.json`, agrupados por transmisor con una tabla `tramo → sistema` dentro de `overlays.json`. Las
  dianas son las estructuras donde termina cada tramo más las que Claude liste en el dato, como borrador.
  Orexina se agrega como marcador nuevo con `marker: true`. Animación N1. Colores de §2.4.
- **Aceptación:** seis modos; al elegir uno, late el origen, se revelan los haces y las dianas reciben la bruma
  con retardo según la distancia; los marcadores se rotulan «posición esquemática»; cada modo enlaza con su
  vía, y con su molécula cuando exista WP-081; no más de 24 tubos a la vez.

#### WP-069 · Registro de escenas micro por variante

- **Tamaño:** S · **Ejecutor:** Codex · **Depende de:** 060 · **Paralelo:** con cualquiera que no toque `micro/`
- **Objetivo:** que cada variante nueva sea un archivo con carga diferida propia.
- **Archivos:** editar `apps/web/src/atlas/micro/index.tsx`, `micro/variants.ts`, `ui/MicroBar.tsx`, `atlas.css`.
- **Contrato:** `MICRO_VARIANTS[level][i]` gana `group?: string`, `scene?: () => Promise<{ default: ComponentType }>`
  y `view?: { pos; target }`. Si la variante trae `scene`, se monta esa; si no, la escena del nivel, como hoy.
  `MicroBar` agrupa por `group` y, con más de seis variantes, pasa a un menú con grupos. El contrato de escena
  no cambia: sin props, centrada, radio cercano a 10, registra sus partes con `setParts`.
- **Aceptación:** las variantes actuales funcionan igual; una variante de prueba con `scene` propia carga en su
  propio fragmento (visible en la salida de `npm run build`); el selector se navega con teclado.

#### WP-070 · Escena micro: corteza cerebelosa

- **Tamaño:** M · **Ejecutor:** Codex · **Depende de:** 069 · **Paralelo:** con 071
- **Objetivo:** el circuito de la corteza cerebelosa como esquema 3D activable.
- **Archivos:** crear `apps/web/src/atlas/micro/CerebellumScene.tsx`. Editar `micro/variants.ts`.
- **Contrato:** variante `cerebelo` del nivel `circuito`, grupo «Circuitos». Elementos y signos de §3.4; usa
  `holoMaterial` y los ayudantes de `geom.ts` y `geom2.ts`; fichas de partes con `setParts`, apoyadas en
  `micro.json` cuando exista la entrada. Lee `cb.w[i]` y `cb.error` con `read` si el simulador está abierto.
- **Aceptación:** tres capas legibles con rótulos; las Purkinje se ven como abanicos planos perpendiculares a
  las paralelas; «activar musgosas» recorre granular → paralelas → Purkinje → núcleo con los signos de §3.2;
  «activar trepadora» produce una respuesta visiblemente distinta (espiga compleja); ficha de cada tipo
  celular; rótulo de esquema; encuadre según los principios de WP-056.

#### WP-071 · Escena micro: hipocampo trisináptico

- **Tamaño:** M · **Ejecutor:** Codex · **Depende de:** 069 · **Paralelo:** con 070
- **Archivos:** crear `apps/web/src/atlas/micro/HippocampusScene.tsx`. Editar `micro/variants.ts`.
- **Contrato:** variante `hipocampo`. Corte con la doble C del giro dentado y el asta de Amón; vías perforante,
  musgosas, Schaffer, temporoamónica y recurrentes de CA3; lee `hop.s[i]` si el simulador de Hopfield está
  abierto. La ficha declara que la mayor parte de la evidencia fisiológica es de roedor.
- **Aceptación:** «estimular la perforante» recorre las tres sinapsis en orden con sus retardos; «tétanos en
  Schaffer» engrosa esa sinapsis (animación S2 resumida); las recurrentes de CA3 se distinguen; fichas de
  dentado, CA3, CA1, subículo y entorrinal; rótulo de esquema y de especie.

#### WP-072 · Escena micro: sección medular y reflejos

- **Tamaño:** M · **Ejecutor:** Codex · **Depende de:** 069 · **Paralelo:** con 073
- **Archivos:** crear `apps/web/src/atlas/micro/SpinalScene.tsx`. Editar `micro/variants.ts`.
- **Contrato:** variante `medula`. Sección con astas y tractos rotulados (columnas dorsales, corticoespinal
  lateral, espinotalámico, espinocerebelosos), más un músculo esquemático con huso y órgano tendinoso.
  Escenarios: miotático, inhibición recíproca, Renshaw, tendinoso, retirada con extensión cruzada. Lesiones
  como sombreado de la zona: hemisección, siringomielia, arteria espinal anterior, columnas dorsales.
- **Aceptación:** cada escenario muestra sus signos; cada lesión sombrea los tractos afectados y lista los
  déficits con su lado, en texto tomado de las fichas existentes; los casos clínicos con acción `m:c:medula`
  abren esta escena.

#### WP-073 · Escena micro: retina

- **Tamaño:** M · **Ejecutor:** Codex · **Depende de:** 069 · **Paralelo:** con 072
- **Archivos:** crear `apps/web/src/atlas/micro/RetinaScene.tsx`. Editar `micro/variants.ts`.
- **Contrato:** variante `retina`. Capas de la retina con la luz entrando desde el lado de las ganglionares;
  conos, bastones, horizontales, bipolares ON y OFF, amacrinas, ganglionares. Un punto de luz arrastrable; lee
  `dog.response` si existe el simulador.
- **Aceptación:** en oscuridad los fotorreceptores liberan y con luz se apagan (la inversión se ve); la bipolar
  ON y la OFF responden en sentidos opuestos; mover la luz del centro a la periferia invierte la respuesta de
  la ganglionar; solo las ganglionares muestran espigas; rótulo de esquema.

#### WP-074 · Simuladores, tanda 1: `fhn`, `synapse`, `td`, `basal-ganglia`

- **Tamaño:** M · **Ejecutor:** Codex · **Depende de:** 067 (para publicar señales) · **Paralelo:** con 077
- **Archivos:** crear en `packages/simulation/src/dynamics/` los archivos `fitzhughNagumo.ts`, `synapse.ts`,
  `tdLearning.ts`, `basalGanglia.ts` y sus pruebas. Editar `dynamics/index.ts`,
  `apps/web/src/atlas/lab/models/Models.tsx`, `lab/Lab.tsx`, `tools/check-levels.mjs` (modelos permitidos).
- **Contrato:** funciones puras con el estilo de `wilsonCowan.ts` (parámetros tipados, valores por defecto con
  nombre, salida en arreglos). Ecuaciones de §6.3. Cada panel usa `Frame` con ecuación, qué observar y alcance,
  y publica sus señales (`td.delta`, `bg.thal`, `bg.gpi`…).
- **Aceptación:** pruebas de comportamiento: `fhn` tiene punto fijo estable bajo el umbral y ciclo límite sobre
  él; el bloqueo de NMDA crece con la hiperpolarización y con [Mg²⁺]; en `td`, tras entrenar, δ se traslada de
  la recompensa a la señal y se vuelve negativo al omitirla; en `basal-ganglia`, la acción más saliente gana y
  menos dopamina reduce la selección. Referencias con estado `pending` hasta verificarlas.

#### WP-075 · Simuladores, tanda 2: `hopfield`, `cerebellum`, `gabor`, `ring`, `ddm`, `cable`, `quantal`, `dog`

- **Tamaño:** L · **Ejecutor:** Codex · **Depende de:** 074 · **Paralelo:** con 078
- **Archivos:** como WP-074, con un archivo por modelo.
- **Contrato y aceptación:** igual esquema. Pruebas: `hopfield` recupera un patrón desde una pista con 20 % de
  ruido cuando la carga es baja y falla con carga alta; el filtro `cerebellum` reduce el error en una tarea de
  ganancia; `gabor` responde máximo a su orientación preferida; `ring` afina la sintonía al subir la
  recurrencia; en `ddm`, subir el umbral aumenta precisión y tiempo de reacción; `cable` cumple la atenuación
  estacionaria `e^(−x/λ)`; `quantal` reproduce media `n·p·q`. `gabor` y `ddm` usan `Heatmap` y `Plot`.

#### WP-076 · Vínculos estructura ↔ circuito ↔ modelo ↔ recorrido

- **Tamaño:** S · **Ejecutor:** Codex (tabla redactada por Claude) · **Depende de:** 062, 074 · **Paralelo:** con 079
- **Archivos:** crear `apps/web/public/atlas/links.json`. Editar `apps/web/src/atlas/ui/InfoSheet.tsx`,
  `ui/Search.tsx`, `lab/Lab.tsx`, `tools/check-atlas-data.mjs`, `data.ts`.
- **Contrato:** `links.json`: `{ structures: { [clave]: { circuits?: string[]; models?: string[]; tours?: string[]; micro?: string; overlays?: string[] } } }`,
  según la tabla de §6.2. La lámina de estructura agrega la sección «Modelos y circuitos»; cada simulador
  muestra «Dónde ocurre», que aplica una vista. La búsqueda indexa circuitos, modelos, recorridos y unidades.
- **Aceptación:** desde el putamen se llega al circuito de ganglios basales y al simulador en un clic, y desde
  el simulador se vuelve; ningún vínculo apunta a algo inexistente (lo verifica el comprobador).

#### WP-077 · Circuitos, tanda 2 (solo datos)

- **Tamaño:** M · **Ejecutor:** Claude redacta, Codex ubica y verifica · **Depende de:** 062 · **Paralelo:** con 074
- **Archivos:** editar `apps/web/public/atlas/circuits.json`. Crear `apps/web/src/atlas/circuits.test.ts`.
- **Contrato:** agregar los circuitos P0 y P1 de §3.4 que no son semilla: bucles paralelos, tálamo–corteza,
  corrientes visuales, eje HPA, recompensa, sueño y vigilia, barorreflejo, retirada, sacádico, circadiano,
  interocepción, atención, sistemas descendentes, y la jerarquía predictiva con `nature: 'hipotesis'`.
  Marcadores nuevos con `marker: true`; la posición se propone, se captura y la revisa Claude.
- **Aceptación:** cada circuito tiene al menos dos escenarios y una prueba que afirma el sentido del efecto en
  su nodo de salida; todos los nodos resuelven a una malla o marcador; las hipótesis muestran su etiqueta; las
  referencias quedan `pending` si no se verificaron.

#### WP-078 · Ondas, redes en coactivación y sueño–vigilia

- **Tamaño:** M · **Ejecutor:** Codex · **Depende de:** 061, 067, 068 · **Paralelo:** con 075
- **Archivos:** crear `apps/web/src/atlas/scene/BrainStates.tsx`, `ui/StateBar.tsx`,
  `packages/simulation/src/dynamics/sleepTwoProcess.ts` y su prueba. Editar `scene/Anatomy.tsx` (modulación de
  `uFill` por fase), `lab/models/Models.tsx`, `scene/Stage.tsx`, `AtlasApp.tsx`.
- **Contrato:** `BrainStates` publica una fase por estructura (`phase.<clave>`); `Anatomy` la lee con `read` y
  modula el relleno hasta un 40 %. Estados: vigilia, NREM, REM (animación S1), y «ritmo» con el Kuramoto
  existente (O2). La barra de estados solo aparece en los niveles encéfalo y áreas.
- **Aceptación:** los tres estados se distinguen a simple vista y la transición dura 3 s; en NREM las ondas
  lentas barren de anterior a posterior y el tálamo emite husos; el modelo de dos procesos mueve el estado; todo
  rotulado «ilustración de un modelo, no un registro»; se desactiva con movimiento reducido.

#### WP-079 · Tubería MNI: redes, gradiente y transformación afín

- **Tamaño:** M · **Ejecutor:** Codex · **Depende de:** — (sin interfaz) · **Paralelo:** con cualquiera
- **Objetivo:** producir pesos por estructura para Yeo 7 y 17 y el gradiente 1, y la afín MNI → atlas.
- **Archivos:** crear `tools/atlas/mni_overlap.py`, `tools/atlas/README.md`, `tools/atlas/requirements.txt`
  (numpy y nibabel, solo para uso local). Genera `apps/web/public/atlas/overlays-mni.json` y
  `tools/atlas/mni-affine.json`. Editar `.gitignore` (`tools/atlas/raw/`).
- **Contrato:** entradas descargadas a mano a `tools/atlas/raw/` con sus URL y sumas en el README: volumen de
  anotación y tabla de estructuras de Allen HRA 3D 2020, parcelación Yeo 2011 en MNI152 del repositorio CBIG,
  gradiente 1 de la colección 1598 de NeuroVault. Método de §2.3. La salida sigue el tipo `Overlay` con
  `source` completo.
- **Aceptación:** el script informa cuántas de las 141 estructuras encontraron par (y lista las que no); cada
  fila cortical suma 1 ± 0,01 entre redes y vóxeles sin red; residuo mediano de la afín informado, con fallo si
  supera 3 mm; el README copia el texto de licencia de cada fuente y la fecha de descarga; ningún archivo
  crudo entra al repositorio; Python no se agrega a la integración continua.

#### WP-080 · Capas de lectura II: redes, gradiente y hubs

- **Tamaño:** S · **Ejecutor:** Codex · **Depende de:** 061, 079 · **Paralelo:** con 081
- **Archivos:** editar `apps/web/src/atlas/overlays.ts`, `data.ts` (carga diferida de `overlays-mni.json`),
  `ui/OverlayLegend.tsx`, `ui/InfoSheet.tsx`. Crear `scene/Hubs.tsx`.
- **Contrato:** capas `redes7`, `redes17`, `gradiente` y `hubs`. En las categóricas con pesos, el color es el
  de la clase dominante y la lámina muestra la mezcla en barras. `hubs` usa la lista curada de §2.2 y dibuja
  nodos y arcos; la animación O3 se activa desde la leyenda de redes.
- **Aceptación:** el precúneo y el cíngulo posterior aparecen en la red por defecto (comprobación de cordura,
  no dato inventado: sale del archivo); el gradiente se ve como rampa continua; cada capa muestra cita, licencia
  y método; el archivo solo se descarga al activar una de estas capas.

#### WP-081 · Visor molecular: 20 proteínas y 31 moléculas

- **Tamaño:** M · **Ejecutor:** Codex · **Depende de:** 069 · **Paralelo:** con 080
- **Archivos:** editar `tools/import-onto.mjs` (copiar `assets/prot/*.json` a `apps/web/public/atlas/prot/` y
  generar `molecules.json` desde `data/moleculas.js` y `assets/moleculas.json`). Crear
  `apps/web/src/atlas/micro/MoleculeScene.tsx`, `ui/MoleculePicker.tsx`. Editar `micro/variants.ts`,
  `ui/Credits.tsx`.
- **Contrato:** variante `proteinas` del nivel `molecula`. El formato de `prot/*.json` se lee del repositorio de
  origen (documentarlo en el encabezado del componente antes de dibujar). Render con esferas o tubos
  instanciados y `holoMaterial`; cada proteína se descarga al elegirla. Créditos: RCSB PDB (CC0) y PubChem
  (dominio público), según declara el repositorio de origen.
- **Aceptación:** las 20 proteínas y 31 moléculas se ven con ficha, organismo, método y cita tal como vienen;
  una membrana tenue sitúa las proteínas transmembrana; cada estructura pesa menos de 80 kB en red; 60 fps con
  la mayor; enlaces desde sinapsis y membrana («ver la estructura real»).

#### WP-082 · Láminas por nivel, segunda versión

- **Tamaño:** M · **Ejecutor:** Claude redacta, Codex integra · **Depende de:** 065, 076 · **Paralelo:** con 083
- **Archivos:** editar `apps/web/public/atlas/levels.json`, `tools/check-levels.mjs`,
  `apps/web/src/atlas/ui/InfoSheet.tsx`, `atlas.css`.
- **Contrato:** `version: 2`. Cada nivel gana `map` (los temas de su tabla de §1 con prioridad y un `AtlasView`
  para ir a verlo), `tours[]`, `figures[]` (identificadores del manifiesto de imágenes o diagramas SVG) y, por
  sección, `nature`. El validador acepta la versión 2 y exige que cada tema P0 tenga destino o diga «en
  preparación».
- **Aceptación:** cada lámina funciona como índice navegable del nivel; todos los temas P0 de §1 aparecen;
  ningún texto nuevo afirma algo sin la etiqueta de borrador; lecturas con capítulo cuando se conozca y
  `pending` cuando no.

#### WP-083 · Integrar las ilustraciones generadas

- **Tamaño:** S · **Ejecutor:** Codex · **Depende de:** imágenes entregadas por el director · **Paralelo:** con 082
- **Archivos:** crear `apps/web/public/atlas/img/` y `img/manifest.json`. Editar
  `apps/web/src/atlas/ui/ScaleRail.tsx`, `ui/InfoSheet.tsx`, `ui/TourIndex.tsx`, `ui/OverlayBar.tsx`,
  `ui/Credits.tsx`, `micro/SynapseScene.tsx` y `micro/MembraneScene.tsx` (sprites), `apps/web/index.html`
  (imagen para compartir), `tools/check-atlas-data.mjs`.
- **Contrato:** `manifest.json`: `{ images: [{ id, file, w, h, alt, generator, date, prompt, use }] }`. Toda
  imagen se carga con `loading="lazy"` y dimensiones fijas; el `alt` empieza con «Ilustración esquemática».
- **Aceptación:** peso total de `img/` menor que 2,5 MB; ninguna imagen sin entrada en el manifiesto (lo
  verifica el comprobador); los créditos listan «ilustraciones generadas con IA» con el generador; sin
  desplazamientos de diseño al cargar.

#### WP-084 · Tractos de sustancia blanca

- **Tamaño:** L · **Ejecutor:** Codex · **Depende de:** 079 · **Paralelo:** no
- **Archivos:** crear `tools/atlas/tracts.py`, `apps/web/src/atlas/scene/Tracts.tsx`. Genera
  `apps/web/public/atlas/tracts.bin` y `tracts.json`. Editar `overlays.ts`, `scene/Stage.tsx`, `ui/Credits.tsx`.
- **Contrato:** del atlas HCP1065 (Yeh 2022, CC BY-SA 4.0) se toman fascículos de asociación, comisurales y de
  proyección; se diezman a 30–60 líneas por haz, se llevan al espacio del atlas con `mni-affine.json` y se
  guardan como posiciones cuantizadas a 16 bits. Render con `LineSegments` aditivo y pulsos en el sombreador.
- **Aceptación:** al menos arcuato, longitudinal superior e inferior, uncinado, cíngulo, cuerpo calloso y
  corticoespinal; peso total menor que 600 kB; los haces quedan dentro de la sustancia blanca en tres capturas
  de control (axial, coronal, sagital) adjuntas a la entrega; créditos con la cita y el reconocimiento que
  exigen los términos de uso de HCP; si el registro no es convincente, se entrega el informe y no se publica.

### 8.4 Qué hacer primero

Con dos agentes en paralelo, el orden de mayor impacto es: WP-060 (un día de Claude), luego WP-061 con WP-062, y
después WP-063 con WP-064. Con esos cinco el atlas pasa de «modelo que se puede mirar» a «modelo que explica»:
seis lecturas del mismo cerebro, circuitos donde se ve la desinhibición y enlaces para compartir en clase. El
segundo golpe es WP-065 con WP-068 (recorridos y neuromoduladores), que es lo que un docente puede usar en un
aula la semana siguiente.

Lo que se deja deliberadamente para después: tractografía (WP-084) y redes desde MNI (WP-079 y 080) dependen de
un registro que puede no quedar bien; morfologías reales, desarrollo, densidad de receptores y conectoma
completo dependen de licencias o decisiones abiertas.

## 9. Decisiones que necesita el director

| N.º | Decisión                                                                                                                                                | Recomendación                                                                                             |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| 1   | ¿Se admiten datos con licencia no comercial (mapas de receptores de Hansen 2022, `neuromaps`, probablemente Julich-Brain y BigBrain)?                   | No. El sitio deriva textos CC BY-SA 4.0 y conviene que todo pueda redistribuirse bajo los mismos términos |
| 2   | Licencia del contenido propio del atlas (sigue abierta la DEC-008)                                                                                      | CC BY-SA 4.0 para textos y datos de autor del atlas, por compatibilidad con lo importado                  |
| 3   | ¿Se acepta una herramienta local en Python (numpy, nibabel) para la tubería MNI, fuera de la integración continua?                                      | Sí; es la vía más corta y el repositorio de origen ya la usa                                              |
| 4   | Ilustraciones: quién las genera, con qué generador, y quién aprueba el estilo y descarta las engañosas                                                  | El director aprueba las 4, 5 y 18; se generan primero la 1, la 9, la 10 y la 11, que desbloquean interfaz |
| 5   | ¿El modelo de signos de los circuitos (§3.1) es aceptable como esquema didáctico, con ese rótulo?                                                       | Sí, con la frase «esquema de signos; no es una simulación biofísica» siempre visible                      |
| 6   | Revisión de los textos sobre codificación predictiva e inferencia activa (§6.4)                                                                         | El director los revisa personalmente; hasta entonces, hipótesis y borrador                                |
| 7   | Progreso de evaluación en `localStorage`, sin cuentas ni servidor                                                                                       | Sí                                                                                                        |
| 8   | Orden de los diez recorridos de autor (§5.2)                                                                                                            | Empezar por los tres semilla de WP-065                                                                    |
| 9   | Asesoría anatómica para los marcadores sin malla (orexina, tuberomamilar, tracto solitario, paraventricular, supraquiasmático) y para la escena medular | Una sesión con un anatomista después de WP-077; hasta entonces, «posición esquemática»                    |

### Licencias verificadas en esta sesión (2026-11-16)

| Recurso                                            | Licencia hallada                                | Dónde se comprobó                              |
| -------------------------------------------------- | ----------------------------------------------- | ---------------------------------------------- |
| CBIG (Yeo 2011, Schaefer 2018)                     | MIT                                             | `LICENSE.md` del repositorio y API de GitHub   |
| Allen Human Reference Atlas 3D 2020                | CC BY 4.0 (desde el 1 de septiembre de 2022)    | README del archivo de descarga y foro de Allen |
| NeuroVault, colección 1598 (Margulies 2016)        | CC0                                             | Preguntas frecuentes de NeuroVault             |
| Harvard AAN Atlas v2.0                             | CC0 1.0                                         | API de Dryad                                   |
| Atlas de tractografía HCP1065 (Yeh 2022)           | CC BY-SA 4.0, más el reconocimiento de HCP      | README del repositorio `data-others/tract`     |
| `hansen_receptors` y `neuromaps`                   | CC BY-NC-SA 4.0                                 | Archivos de licencia de ambos repositorios     |
| ENIGMA Toolbox                                     | BSD-3 (herramienta); matrices HCP por verificar | `LICENSE` del repositorio                      |
| Atlas de territorios arteriales (Liu 2023)         | «Attribution» en NITRC; artículo CC BY 4.0      | Página del proyecto en NITRC                   |
| NeuroMorpho.Org, Julich-Brain, BigBrain, BrainSpan | **Por verificar**                               | No se encontró el texto de licencia            |

Cada licencia se vuelve a leer en la fuente al momento de descargar; esta tabla orienta, no autoriza.
