# Lista de revisión para integrar una entrega

Para Claude (o el usuario) antes de fusionar un PR de cualquier modelo.

## Alcance

- [ ] El PR corresponde a **un** WP y no amplía su alcance.
- [ ] Los criterios de aceptación del WP están marcados uno a uno; los incumplidos están explicados.

## Verificación

- [ ] CI en verde (o `npm run check` + `npm run e2e` ejecutados por el revisor).
- [ ] Las pruebas nuevas comprueban comportamiento, no repiten la implementación.
- [ ] No se desactivaron pruebas, reglas de lint ni reglas del validador.

## Arquitectura

- [ ] Sin cambios en `packages/schemas` salvo que el WP lo pida, con ADR y `npm run schemas:export`.
- [ ] `npm run boundaries` sin violaciones; dependencias nuevas solo si el WP las autoriza y en el paquete correcto.
- [ ] Nada de datos científicos (textos, parámetros, geometrías) en componentes de interfaz.
- [ ] Sin llamadas a CDN o servicios externos en tiempo de ejecución (salvo decisión explícita).

## Ciencia y derechos

- [ ] Ningún `status` por encima de `draft` sin revisión `human_expert` registrada por una persona.
- [ ] Ningún `locatorVerified: true` que no haya confirmado una persona.
- [ ] Citas y DOIs nuevos comprobados (p. ej. `npm run sources:verify-doi`), sin citas textuales largas.
- [ ] Assets externos con licencia verificada, atribución y procedencia.
- [ ] Esquemas rotulados como esquemas; cambios de especie/contexto declarados.

## Cierre

- [ ] `docs/backlog.md` actualizado; entrada en `docs/session-log.md` si fue una sesión completa.
