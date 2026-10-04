# ADR-0008: Rótulos 3D proyectados con control de densidad

- **Estado:** Aceptada
- **Fecha:** 2026-10-04

## Contexto

Con `Html` de drei, el primer rótulo de cada escena no llegaba al DOM (comprobado con y sin `StrictMode`), y
cada rótulo crea su propia raíz React. El plan pide además "rótulos por densidad".

## Decisión

Una capa HTML superpuesta al canvas con un `<span>` por rótulo; un componente dentro del canvas proyecta cada
anclaje 3D a pantalla en cada frame y oculta los rótulos que se solaparían, priorizando los seleccionados o
señalados. Nodos con `labelMode: focus` solo se rotulan bajo foco; `labelOffset` permite desplazar el anclaje.

## Consecuencias

Sin dependencia de `Html` de drei. Los rótulos ocultos por colisión siguen disponibles en la lista HTML. Mejoras
futuras (líneas guía, rótulos por zoom semántico) caben en el mismo componente.
