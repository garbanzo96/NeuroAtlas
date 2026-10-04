# Backlog de paquetes de trabajo

Cada WP es un encargo acotado y verificable. Los marcados con 📄 tienen especificación completa en
[work-packages/](work-packages/) (con prompt listo para copiar); el resto se detallará cuando se acerque su turno
(tarea de Claude al cerrar cada sesión).

**Ejecutor** — quién debería hacerlo:

- **U** usuario · **H** experto humano · **C** Claude (sesión de integración)
- **M** modelo económico de código (ChatGPT, Kimi u otro) con revisión posterior de Claude o del usuario
- **R** modelo con búsqueda web real y acceso a fuentes, **siempre** con verificación humana de lo citado

**Estado**: pendiente · en curso · bloqueado · hecho.

## Operación (fase 0–1)

| ID        | Título                                                                         | Ejecutor | Depende de | Estado    |
| --------- | ------------------------------------------------------------------------------ | -------- | ---------- | --------- |
| WP-001    | Resolver decisiones de arranque ([decisions-pending.md](decisions-pending.md)) | U        | —          | pendiente |
| WP-002 📄 | [Activar CI, rama principal y protección de rama](work-packages/WP-002.md)     | U + C    | —          | pendiente |
| WP-003 📄 | [Vista previa pública en GitHub Pages](work-packages/WP-003.md)                | M        | DEC-007    | pendiente |
| WP-004    | Licencias del proyecto: `LICENSE` (código) y aviso de licencia del contenido   | U → M    | DEC-008    | pendiente |
| WP-005    | Revisión humana de ingeniería de la arquitectura (1–2 h, generalista web/3D)   | H        | —          | pendiente |

## Evidencia y contenido de la unidad visual

| ID        | Título                                                                                                                         | Ejecutor    | Depende de       | Estado    |
| --------- | ------------------------------------------------------------------------------------------------------------------------------ | ----------- | ---------------- | --------- |
| WP-010 📄 | [Extraer evidencia con localizadores para las 25 afirmaciones](work-packages/WP-010.md)                                        | R + U       | DEC-001          | pendiente |
| WP-011    | Revisión experta de la vía visual y del circuito laminar; registrar `Review` `human_expert`                                    | H           | WP-010, DEC-011  | pendiente |
| WP-012 📄 | [Cotejar HH con el artículo original y revisión computacional](work-packages/WP-012.md)                                        | R + H (+ C) | —                | pendiente |
| WP-013 📄 | [Referencias externas verificadas (UBERON) para entidades](work-packages/WP-013.md)                                            | M           | —                | pendiente |
| WP-014    | Verificar metadatos de fuentes sin DOI (libros, portales): URL, edición, editorial                                             | R           | —                | pendiente |
| WP-015    | Ejecutar el protocolo de búsqueda de la unidad visual ([research/protocols/visual-unit.md](research/protocols/visual-unit.md)) | R           | DEC-001, DEC-002 | pendiente |

## Assets y escenas

| ID        | Título                                                                                          | Ejecutor  | Depende de      | Estado    |
| --------- | ----------------------------------------------------------------------------------------------- | --------- | --------------- | --------- |
| WP-020 📄 | [V1 sobre atlas humano autorizado (desbloquear escena 2)](work-packages/WP-020.md)              | C + R + U | DEC-005, WP-022 | bloqueado |
| WP-021    | Escena de reconstrucción neuronal (NeuroMorpho.Org) con marco físico en µm                      | C / M     | WP-023          | pendiente |
| WP-022 📄 | [Soporte de mallas GLB en pipeline y visor 3D](work-packages/WP-022.md)                         | C         | —               | pendiente |
| WP-023    | Soporte de morfologías SWC (pipeline → buffers; render instanciado)                             | M         | WP-022          | pendiente |
| WP-024    | Circuito laminar con especie decidida y fuentes primarias (nuevas entidades + correspondencias) | C + R + H | DEC-004, WP-010 | pendiente |

## UX y visualización

| ID        | Título                                                                                                  | Ejecutor | Depende de | Estado    |
| --------- | ------------------------------------------------------------------------------------------------------- | -------- | ---------- | --------- |
| WP-030 📄 | [Vista 2D de escenas esquemáticas (alternativa accesible y sin WebGL)](work-packages/WP-030.md)         | M        | —          | pendiente |
| WP-031 📄 | [Pase de UX en móvil](work-packages/WP-031.md)                                                          | M        | —          | pendiente |
| WP-032    | Diagrama de campos visuales y hemicampos (requiere contrato de esquema 2D con ADR; datos en `content/`) | C        | —          | pendiente |
| WP-038    | Animación conceptual de flujo en la vía visual (rotulada como ilustrativa)                              | M        | WP-030     | pendiente |
| WP-033 📄 | [Renderizar ecuaciones con KaTeX (carga diferida)](work-packages/WP-033.md)                             | M        | —          | pendiente |
| WP-034 📄 | [Auditoría de accesibilidad automatizada (axe) y correcciones](work-packages/WP-034.md)                 | M        | —          | pendiente |
| WP-035    | Selección múltiple y comparación de escenas (`compareWith`)                                             | C        | —          | pendiente |
| WP-036    | Medir el presupuesto de rendimiento en dispositivos de referencia e informar                            | M + U    | DEC-003    | pendiente |
| WP-037    | Piloto docente: 5 tareas observables, 2–3 docentes, 5–8 estudiantes                                     | U + H    | M4         | pendiente |

## Simulación

| ID        | Título                                                                                      | Ejecutor | Depende de | Estado    |
| --------- | ------------------------------------------------------------------------------------------- | -------- | ---------- | --------- |
| WP-040 📄 | [Ajustar ḡ_Na y ḡ_K desde la interfaz](work-packages/WP-040.md)                             | M        | —          | pendiente |
| WP-041    | Protocolo de pulsos pareados (período refractario): extensión de `StimulusProtocol` con ADR | C        | —          | pendiente |
| WP-042    | Modelo LIF comparativo (otra abstracción, con su propia ficha y referencia)                 | C / M    | WP-012     | pendiente |

## Plataforma

| ID        | Título                                                                                             | Ejecutor | Depende de | Estado    |
| --------- | -------------------------------------------------------------------------------------------------- | -------- | ---------- | --------- |
| WP-050 📄 | [Mapeos espaciales y transiciones registradas](work-packages/WP-050.md)                            | C        | —          | pendiente |
| WP-051    | Varios releases en el catálogo y registro de cambios de conocimiento                               | M        | —          | pendiente |
| WP-052    | Tabla de cobertura generada desde `content/` (por tema: fuentes, extraídas, revisadas, publicadas) | M        | —          | pendiente |
| WP-053    | Internacionalización de la interfaz (inglés)                                                       | M        | DEC-010    | pendiente |

## Expansión (fase 4, tras el piloto)

| ID     | Título                                                                                       | Ejecutor  | Depende de | Estado |
| ------ | -------------------------------------------------------------------------------------------- | --------- | ---------- | ------ |
| WP-100 | Planificar unidad: hipocampo y navegación (preguntas, protocolo, fuentes, escenas)           | C + R     | M5         | futuro |
| WP-110 | Planificar unidad: codificación predictiva e interocepción (modelos comparados, no consenso) | C + R + H | M5         | futuro |
| WP-120 | Planificar unidad: control motor                                                             | C + R     | M5         | futuro |
| WP-130 | Planificar unidad: microcircuitos y tipos celulares (MICrONS, BICAN)                         | C + R     | M5, WP-024 | futuro |
