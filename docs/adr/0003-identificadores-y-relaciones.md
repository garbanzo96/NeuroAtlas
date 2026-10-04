# ADR-0003: Identificadores estables y códigos de relación

- **Estado:** Aceptada
- **Fecha:** 2026-10-04

## Contexto

El plan pide IDs persistentes, separar sinónimos de equivalencias y mapear los nombres españoles de relaciones
a códigos estables.

## Decisión

- Formato `<prefijo>.<segmento>(.<segmento>)*` en minúsculas ASCII; prefijo por colección (`src`, `ctx`, `ent`,
  `rel`, `claim`, `asset`, `rep`, `scene`, `lesson`, `model`, `map`). IDs locales (capas, nodos, pasos) con
  `[a-z0-9_]+`.
- Entidades específicas de especie llevan la especie en el ID (`ent.human.*`, `ent.squid.*`); los conceptos
  generales usan `ent.generic.*` o un dominio (`ent.neocortex.*`) y `taxonScope: general`.
- Un ID publicado nunca cambia de significado: si cambia, se crea otro y el anterior pasa a `retired`.
- Códigos de relación: parte_de→`part_of`, ubicado_en→`located_in`, clasificado_como→`classified_as`,
  conecta_con→`connects_to`, proyecta_a→`projects_to`, modula→`modulates`, participa_en→`participates_in`,
  medido_por→`measured_by`, implementado_por_modelo→`implemented_by_model`, corresponde_a→`corresponds_to`,
  derivado_de→`derived_from`. "sustenta"/"contradice" son relaciones de **evidencia** (`Claim.evidence.relation`).
- Sinónimos en `Entity.synonyms`; equivalencias entre atlas/especies solo como `corresponds_to` con categoría
  (`equivalent_per_scheme`, `approximate`, `one_to_many`, `uncertain`) y afirmación.

## Alternativas consideradas

- UUID: estables pero ilegibles para revisión humana y para modelos.
- IDs de ontologías externas como ID primario: no cubren todo y cambian entre versiones; se guardan como
  `externalRefs` verificadas una a una.

## Consecuencias

Los IDs son legibles en diffs y prompts. Renombrar exige migración explícita (no hay alias automáticos todavía).
