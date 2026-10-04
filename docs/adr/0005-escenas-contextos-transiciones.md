# ADR-0005: Escenas de contexto único, marcos de coordenadas y transiciones

- **Estado:** Aceptada
- **Fecha:** 2026-10-04

## Contexto

El plan exige que una transición visual no sugiera continuidad anatómica, registro espacial ni equivalencia de
especies inexistentes, y prohíbe presentar anatomía inventada.

## Decisión

- Cada escena tiene un único `contextId` y un `coordinateFrame` (`physical` con unidades o `schematic`). Las
  representaciones de sus capas deben ser del mismo contexto.
- Marco `schematic` ⇒ solo assets `schematic`/`illustration`. Marco `physical` ⇒ ningún esquema. Contexto
  anatómico ⇒ marco físico. Por eso la reconstrucción neuronal real irá en una escena aparte (WP-021).
- Una entidad de especie X no aparece en escenas ni afirmaciones de contexto Y, ni en contextos generales.
- `SceneTransition`: `correspondence: conceptual | registered`, `contextChanges`, `bridgeClaimId`
  (`didactic_bridge`). `registered` queda prohibido hasta implementar mapeos espaciales (WP-050).
- Assets `blocked_missing`/`blocked_license` con motivo, fuentes candidatas, WP y decisiones; la escena sigue
  navegable y muestra lo consultable.
- Las leyendas de color se declaran en la escena; el validador exige explicar cada `colorGroup` usado.

## Alternativas consideradas

- Escenas multicontexto con capas de especies distintas superpuestas: más espectacular, pero induce lecturas
  de registro inexistente.
- Rellenar V1 humana con una malla aproximada: descartado por el plan ("no se fabrica un cerebro").

## Consecuencias

La escena "V1 en la anatomía humana" está bloqueada hasta WP-020. La continuidad del recorrido se apoya en
puentes conceptuales explícitos, que la interfaz muestra antes (botón de transición) y después (aviso).
