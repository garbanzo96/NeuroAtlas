# ADR-0011 · Atlas multiescala holográfico como portada

- **Estado:** aceptada · **Fecha:** 2026-11-16 · **Decide:** director del proyecto (Gabriel Salas), con Claude

## Contexto

El esqueleto inicial priorizó contratos epistémicos y una unidad curada pequeña (retina → potencial de
acción). El director pidió ejecutar la visión completa: un entorno 3D pulido que recorra todos los niveles de
organización (cuerpo y vías → encéfalo → áreas → columnas y redes → neurona → sinapsis → membrana y moléculas),
con láminas educativas y simulaciones. Existen proyectos abiertos con assets y textos reutilizables:
`ontoterrorist/neuroanatomia` (código MIT, textos CC BY-SA 4.0, mallas Allen HRA CC BY 4.0 y BodyParts3D
CC BY-SA 2.1 JP, ya alineadas en un marco común en cm).

## Decisión

1. La portada es el **atlas** (`apps/web/src/atlas/`). La unidad curada sigue disponible en `?unidad`.
2. El atlas es una **capa exploratoria** con su propio régimen de datos:
   - Datos importados (mallas, fichas de estructuras, vías) viven en `apps/web/public/atlas/`, se generan con
     `tools/import-onto.mjs` y no se editan a mano. Se cargan por `fetch` (fuera del bundle).
   - Láminas por nivel: `apps/web/public/atlas/levels.json`, validadas con `tools/check-levels.mjs`.
   - Escenas procedurales (neurona, sinapsis, membrana, columna): su **geometría procedural, sus parámetros de
     animación y las fichas breves de sus partes** pueden vivir en el código de la escena, porque son
     inseparables de la representación y son esquemas didácticos declarados como tales.
3. Todo texto del atlas lleva su estado: "borrador sin revisión experta" hasta que una persona lo revise. Las
   escenas procedurales se rotulan como esquemas. Los modelos (HH, Izhikevich…) declaran su alcance.
4. Las reglas de `content/` (afirmaciones con fuente, estados de revisión, validador) siguen rigiendo la unidad
   curada. Migrar contenido del atlas a `content/` es trabajo futuro cuando haya revisión experta.

## Consecuencias

- Se avanza rápido en experiencia y cobertura sin fingir validación: la procedencia y el estado se muestran.
- Los textos de ontoterrorist obligan a distribuir derivados bajo CC BY-SA 4.0; las mallas de BodyParts3D
  bajo CC BY-SA 2.1 JP. Se acreditan en la interfaz.
- Hay dos regímenes de contenido; el riesgo de deriva se controla con este ADR y la etiqueta de estado.
