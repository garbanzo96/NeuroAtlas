# ADR-0002: Contenido en YAML y paquetes versionados con SHA-256

- **Estado:** Aceptada
- **Fecha:** 2026-10-04

## Contexto

El plan exige que "corregir una afirmación no exija reconstruir la aplicación", datos curados offline,
paquetes versionados con caché por hash y procedencia consultable. El contenido lo editarán personas y modelos.

## Decisión

- Fuente de verdad en `content/<colección>/*.yaml` (un registro o una lista por archivo), con cabecera
  `yaml-language-server` apuntando a `packages/schemas/json/*.file.schema.json` para validar en el editor.
- `npm run packs` valida (esquemas + reglas epistémicas + compatibilidad de modelos) y escribe un release
  inmutable en `apps/web/public/packs/<release>/` con `catalog.json` (rutas, bytes y SHA-256). Los paquetes
  generados no se versionan en git.
- La app descarga el catálogo, verifica SHA-256 con SubtleCrypto y valida el paquete con Zod en tiempo de ejecución.
- Solo se copian assets `available`; los externos exigen licencia verificada.

## Alternativas consideradas

- **Importar YAML en el bundle**: más simple, pero cada corrección exigiría reconstruir la app.
- **Base de datos (Postgres) desde el inicio**: innecesaria para un release de ~100 KiB.
- **JSON como formato de edición**: sin comentarios y más propenso a errores manuales.

## Consecuencias

El contenido se puede revisar en diffs legibles y validar en CI. La app depende de `npm run packs` antes de
`dev`/`build` (los scripts lo hacen automáticamente). Futuro: múltiples releases en el catálogo para volver al
estado de conocimiento de una fecha.
