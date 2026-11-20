# Registro de sesiones

Cada sesión (de cualquier modelo o persona) añade una entrada **al principio**: qué hizo, qué verificó (con
resultados), qué quedó pendiente y cuál es el siguiente paso recomendado. Es la memoria del proyecto entre sesiones.

---

## 2026-11-19 · Depuración pedida por el usuario y morfologías reales

- **Hecho:** el panel de capas (dock) tapaba la escala en ventanas bajas y no se podía cerrar: ahora es
  plegable y parte cerrado bajo 820 px de alto. El holograma del encéfalo se veía confuso: la cara trasera se
  atenúa (los surcos del hemisferio lejano ya no se mezclan), corteza con borde más agudo, núcleos profundos en
  cian, bloom con umbral mayor. Rótulos ambientales con despeje en pantalla. Integrados WP-065 (recorridos y
  lector del curso) y WP-067 (la simulación mueve la escena). Carrera de la intro con la vista de la URL en
  equipos lentos corregida; movimiento reducido sin vuelos de cámara.
- **Fuentes:** análisis de cinco proyectos de referencia; solo NeuroMorpho.Org (CC BY 4.0) sirve para
  morfologías publicables. 19 SWC descargados con sus citas (ADR-0013).
- **Verificado:** `npm run check` verde (96 pruebas); e2e del atlas 9/9 (dos de ellas en serie: la máquina
  tenía un proceso ajeno al 100 % de CPU). Desplegado en gh-pages.
- **En curso:** WP-069 (galería de neuronas reales y potencial de acción sobre su forma) y WP-070 (ciclo de
  vida de los neurotransmisores), ambos con Codex.
- **Integrado después:** WP-069 (19 neuronas reales con propagación didáctica), WP-070 (ciclo de ocho
  neurotransmisores con fármacos), WP-071 (cinco microcircuitos canónicos con células reales y motor con signo),
  WP-072 (bicapa lipídica, canales Nav/Kv con compuertas sincronizadas al laboratorio HH, conducción
  saltatoria). Dos veces Codex usó `active` como uniforme GLSL (palabra reservada): el shader no compilaba.
- **Verificación final:** check verde. E2e: 12/14 en la última corrida; «enlace copiado» y «conducción
  saltatoria» fallan solo bajo la carga de un proceso ajeno al 100 % de CPU (la escena no alcanza a montarse
  con la traza de Playwright); comprobadas a mano sobre el build. Repetir con la máquina libre.
- **Siguiente:** pulido de WP-072 (iones que cruzan los poros, rótulos que se pisan, panel de V(t) más fino),
  retina en WP-071, móvil de la galería de neuronas, WP-066 (modo evaluación).

## 2026-11-16 (tarde) · Plan de conocimiento en marcha: contratos, capas, circuitos e ilustraciones

- **Hecho:** plan de conocimiento (`docs/atlas/plan-de-conocimiento.md`, Fable). WP-060 (Claude): contratos
  (`view.ts`, `signals.ts`, store), `tools/check-atlas-data.mjs` en `npm run check`, ADR-0012, e2e de humo.
  WP-061 (capas de lectura), WP-062 y WP-062b (circuitos con signo y su pasada visual), WP-083a (12
  ilustraciones generadas con IA, 147 kB + íconos con alfa) con Codex; integración y revisión con capturas.
- **Corregido al integrar:** el material holográfico se duplicaba con StrictMode (el animado no era el
  visible; afectaba también el resalte por foco en desarrollo); unidades en mayúsculas (µm → ΜM); favicon 404.
- **Verificado:** `npm run check` verde; e2e del atlas 7/7; publicado en gh-pages.
- **Pendiente:** WP-063 y WP-064 en curso con Codex; luego WP-065 (recorridos) y WP-068 (neuromoduladores).
  Gemini sigue bloqueado hasta autenticar la cuenta Pro. Ilustraciones 4, 5 y 18 esperan aprobación del director.

## 2026-11-16 · Claude (con Codex) · Atlas multiescala holográfico

**Hecho**

- Portada nueva: atlas continuo cuerpo → encéfalo → áreas con shader holográfico Fresnel + bloom, hover por
  lóbulo o área, pelado por proximidad, zoom semántico entre niveles, 22 vías aferentes/eferentes animadas,
  láminas por estructura y por nivel, búsqueda, capas, créditos, rótulos de ambiente. ADR-0011.
- Escenas micro (Codex, dos pasadas): columna cortical, neurona (7 tipos), sinapsis (4 variantes), membrana
  (bomba Na⁺/K⁺, canales). Laboratorio con 12 simuladores (Codex) sobre `packages/simulation/src/dynamics`.
- Publicación en gh-pages con `tools/deploy-gh-pages.sh`: https://garbanzo96.github.io/NeuroAtlas/
- Unidad curada original en `?unidad`.

**Verificado**

- `npm run check` en verde (87 pruebas). e2e de escritorio: 14 de 15; la que falla («carga la vía visual»,
  rótulo 3D) también falla en el código previo al atlas en este equipo (WebGL por software en macOS).
- Revisión visual por capturas en escritorio y móvil de todos los niveles.

**Pendiente**

- Plan de conocimiento (agente de planificación) → WP-060+ para mapas, circuitos, animaciones y recorridos.
- Láminas por nivel más ricas; revisión experta de todo el contenido.
- Gemini CLI: la sesión usa una cuenta universitaria no elegible; hay que reautenticar con la cuenta Pro.
- Rama por defecto del repo sigue siendo `claude/neuroscience-interactive-base-wgbx0a`; conviene cambiarla a `main`.

---

## 2026-10-04 (2) · Claude · Enlaces para ver y ejecutar la app

**Hecho**

- Vista previa privada publicada en claude.ai: https://claude.ai/artifact/6e4xyrNq2scBfTpyZEz8tu (solo la ve
  el propietario y quien él comparta). Se regenera con `npm run build:artifact` y se republica en la misma URL.
- GitHub Pages: `.github/workflows/pages.yml` (falta que el propietario active _Settings → Pages → Source:
  GitHub Actions_; hasta entonces termina en verde con un aviso). URL prevista: https://garbanzo96.github.io/NeuroAtlas/
- Codespaces: `.devcontainer/devcontainer.json` + insignia en el README.
- Robustez: límite de errores en el visor 3D, respaldo de la simulación si el Worker falla, aviso estático si el
  código no carga, `lang="es"`, gráficos sin desborde en móvil. ADR-0010.

**Verificado**

- Flujo de verificación con 9 agentes: clon limpio con la ruta de Pages (pasa), arnés de marco tipo claude.ai
  (0 errores y 0 violaciones de CSP tras la corrección), revisión de configuración contra la documentación oficial
  y lectura completa del bundle publicado.
- `npm run check` (76 pruebas) y 12 e2e en verde; la nueva prueba de desborde falla con el CSS anterior.

**Pendiente**

- Activar Pages (propietario) y comprobar el primer despliegue real.
- Abrir una vez el Codespace: Vite 8 podría bloquear el host reenviado; se añadió `allowedHosts` para
  `*.app.github.dev` sin poder probarlo desde aquí.
- La vista previa de claude.ai se verificó en un marco emulado, no en el real.

---

## 2026-10-04 · Claude · Arquitectura base y esqueleto funcional

**Hecho**

- Monorepo (npm workspaces): `schemas`, `knowledge`, `simulation`, `lessons`, `viewer-2d`, `viewer-3d`,
  `data-pipeline`, `apps/web`. ADR 0001–0009.
- Contratos Zod + 27 JSON Schema; validador con reglas epistémicas (estados, especies, licencias, puentes,
  leyendas, mapeos visuales).
- Contenido de la unidad visual: 28 fuentes (25 del plan + 3 nuevas; 9 con metadatos verificados en Crossref),
  5 contextos, 27 entidades, 8 relaciones, 25 afirmaciones **en borrador**, 5 escenas (V1 anatómica bloqueada),
  1 lección de 8 pasos, ficha del modelo HH.
- Simulación HH (RK4) en Web Worker; trazas de referencia de NEURON 9.0.2 en el repositorio.
- App: ficha con evidencia, capas, búsqueda, avisos de contexto, escena bloqueada, lección, experimento con
  exportación, URL reproducible, teclado y móvil.
- CI (GitHub Actions), plantillas de PR/issue, AGENTS.md, CLAUDE.md, hoja de ruta, backlog, 13 WP detallados,
  prompts por tipo de modelo.

**Verificado**

- `npm run check`: formato, lint, tipos, fronteras, contenido (0 errores), 75 pruebas unitarias, build.
- `npx playwright test`: 9 pruebas e2e (escritorio y móvil) en Chromium headless.
- HH vs NEURON: diferencias < 0,0001 ms en tiempos de espiga y < 0,0001 mV RMS en los 4 casos de referencia.
- Hallazgos corregidos durante la sesión: degradación de RK4 a primer orden por el borde del estímulo
  (ADR-0006); primer rótulo 3D ausente con `Html` de drei (ADR-0008); canvas que tapaba el panel inferior.

**Pendiente / limitaciones**

- Ninguna afirmación tiene localizador verificado ni revisión experta. Varias proposiciones de manual se
  redactaron sin consultar el texto: pueden necesitar matices al extraer la evidencia (WP-010).
- La especie del circuito laminar (DEC-004) y el atlas de V1 (DEC-005) siguen abiertos.
- UX móvil mejorable (WP-031); ecuaciones en LaTeX sin renderizar (WP-033).
- El rendimiento solo se midió en CI headless (no representativo, WP-036).

**Siguiente paso recomendado**

1. Usuario: resolver DEC-001, DEC-004, DEC-005, DEC-008 y DEC-011; activar CI y protección de rama (WP-002).
2. En paralelo, modelos económicos: WP-013, WP-030, WP-033, WP-034, WP-040 (no dependen de decisiones).
3. Siguiente sesión de Claude: WP-022 (prepara WP-020), WP-032 y revisión de las entregas anteriores; WP-050 cuando haga falta registrar escenas entre sí.
