# ADR-0013: Morfologías neuronales reales desde NeuroMorpho.Org

- **Estado:** Aceptada
- **Fecha:** 2026-11-19
- **Autor:** Claude (integrador)

## Contexto

Las neuronas del nivel celular son esquemas procedurales. Para estudiar tipos celulares se necesita la forma
real (árbol dendrítico, axón, proporciones), con especie y cita a la vista. De las fuentes revisadas, solo
NeuroMorpho.Org publica reconstrucciones con una licencia que permite redistribuir en la web: CC BY 4.0
(https://neuromorpho.org/useterm.jsp). Allen Cell Types exige uso no comercial y el portal de Blue Brain prohíbe
publicar sus modelos en sitios de terceros.

## Decisión

- 19 reconstrucciones en versión CNG (estandarizada por NeuroMorpho) quedan en `tools/reference/neuromorpho/`
  con `meta.json` (especie, región, tipo, integridad, DOI y PMID del artículo original, URL del archivo).
- `tools/import-neuromorpho.mjs` las convierte a JSON compacto en `apps/web/public/atlas/neurons/`
  (un archivo por célula más `index.json` con metadatos y citas). La conversión simplifica tramos sin ramas y
  cuantiza; no inventa geometría.
- Cada célula se muestra con su especie, región y la cita triple que pide NeuroMorpho: el artículo original,
  NeuroMorpho.Org (RRID:SCR_002145) y Tecuatl C, Ljungquist B, Ascoli GA (2024) FASEB Bioadv 6(7):207-221, doi:10.1096/fba.2024-00048 (citas exigidas en https://neuromorpho.org/useterm.jsp, verificadas el 2026-11-19), en la lámina y en Créditos.
- Las morfologías son datos (`nature: data`); lo que se anime sobre ellas (propagación del potencial) es
  `model_prediction` didáctico y se rotula así. Las neuronas procedurales actuales siguen como esquema.
- Especies distintas (humano, ratón, rata, gato) conviven en la galería del nivel celular, nunca dentro de una
  escena anatómica humana.

## Alternativas consideradas

- Allen Cell Types: mejor metadato electrofisiológico, pero ataría el proyecto a uso no comercial.
- Seguir con neuronas procedurales: no muestran la variedad real y se ven geométricas.
- Descargar en tiempo de ejecución desde NeuroMorpho: depende de un servicio externo y de su disponibilidad.

## Consecuencias

Unos 4 MB de SWC en el repositorio (no se publican) y menos de 2 MB de JSON publicados. Agregar una célula es
sumar su SWC y su entrada en `meta.json` y volver a correr el importador. Se revierte borrando
`apps/web/public/atlas/neurons/` y la galería.
