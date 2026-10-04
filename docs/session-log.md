# Registro de sesiones

Cada sesión (de cualquier modelo o persona) añade una entrada **al principio**: qué hizo, qué verificó (con
resultados), qué quedó pendiente y cuál es el siguiente paso recomendado. Es la memoria del proyecto entre sesiones.

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
