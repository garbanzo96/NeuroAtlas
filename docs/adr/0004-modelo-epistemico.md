# ADR-0004: Modelo epistémico — tipos, etiquetas, estados y verificación

- **Estado:** Aceptada
- **Fecha:** 2026-10-04

## Contexto

El riesgo principal del proyecto es comunicar más certeza de la que hay: afirmaciones sin fuente, modelos
presentados como mediciones, revisiones entre LLM tomadas como validación experta.

## Decisión

- `Claim.kind` (tipo epistémico) + `Claim.display.label` (etiqueta visible permanente), con coherencia
  validada. Se añade `didactic_bridge` al vocabulario del plan para las afirmaciones **sobre la representación**
  que exigen las transiciones.
- `model_prediction` cubre lo que un modelo postula o produce (su estructura y sus resultados); exige `modelId`.
- Estados `draft | reviewed | published | questioned | retired`. `reviewed`/`published` exigen: revisión
  `human_expert` aprobada, localizadores verificados y fuentes `content_inspected`. `Review.kind` distingue
  `human_expert`, `human_editorial` y `llm_crosscheck` (esta nunca habilita estados).
- Fuentes: `candidate` → `metadata_verified` (p. ej. Crossref) → `content_inspected`. Una candidata no puede
  tener fecha de verificación; no se declaran condiciones de licencia sin revisarla.
- Sin puntuaciones de confianza numéricas: incertidumbre descrita por separado (medida, generalización,
  explicaciones alternativas).
- Canal del release: `dev` muestra borradores con aviso global; `public` solo admite contenido publicado.

## Consecuencias

El esqueleto arranca con 25 afirmaciones `draft` redactadas por un LLM a partir de conocimiento de manual, con
fuentes candidatas o con metadatos verificados y localizadores `pending`. La interfaz lo muestra. El cuello de
botella real del proyecto es la revisión experta (WP-010, WP-011, WP-012), no el código.
