# ADR-0010: Distribución y ejecución — GitHub Pages, Codespaces y vista previa en claude.ai

- **Estado:** Aceptada
- **Fecha:** 2026-10-04

## Contexto

El usuario necesita un enlace para ver la app y otro para ejecutar el código sin instalar nada. El repositorio
es público. GitHub Pages no se puede activar desde un workflow con el token por defecto (exige permisos de
administración), y una vista previa en claude.ai se sirve dentro de un marco con CSP estricta, sin descargas ni
acceso a la query string.

## Decisión

- **GitHub Pages** (`.github/workflows/pages.yml`): construye con `NEUROATLAS_BASE=/<repositorio>/` y despliega
  desde la rama por defecto. Antes comprueba con la API que Pages usa "GitHub Actions"; si no, termina en verde con
  un aviso (sin cruces rojos mientras no se active).
- **Codespaces** (`.devcontainer/devcontainer.json`): imagen Node 22, `npm ci` al crear y `npm run dev` al
  conectar, con el puerto 5173 reenviado.
- **Vista previa en claude.ai** (`npm run build:artifact` → `tools/build-artifact.ts`): build con base relativa
  `./`, sin sourcemaps y con `index.html` sin esqueleto. `VITE_NEUROATLAS_TARGET=artifact` desactiva la
  exportación JSON (descargas bloqueadas por el marco).
- Robustez común: si el Worker de simulación no puede cargarse o falla, la simulación se repite en el hilo
  principal; `history.replaceState` se protege para marcos que lo prohíban; la app ocupa `height: 100%`.

## Verificación (2026-10-04)

- Clon limpio: `npm ci`, `npm run check` y build con `NEUROATLAS_BASE=/NeuroAtlas/` servido bajo ese prefijo;
  carga, selección, enlace profundo y simulación en Worker sin errores ni peticiones fallidas.
- Vista previa: arnés que reproduce el esqueleto y una CSP como la del marco de claude.ai (iframe con y sin
  `allow-same-origin`): 0 errores y 0 violaciones de CSP tras fijar `jitless` de Zod antes de cargar la app
  (su prueba de `new Function` generaba una violación aunque se capturase). Sin `allow-same-origin` y sin CORS el
  navegador bloquea los módulos: queda visible el aviso estático de `#root`.
- Bundle publicado leído por completo (sin secretos, telemetría ni cargas de hosts externos).
- Acciones de GitHub en versiones con runtime Node 24 (Node 20 se retiró de los runners en septiembre de 2026).
- Correcciones derivadas: límite de errores alrededor del visor 3D, respaldo de la simulación si el Worker falla,
  `lang="es"` en tiempo de ejecución, gráficos sin desborde en móvil, resultados obsoletos borrados ante una
  entrada inválida, y comprobación de Pages que solo trata el 404 como "no activado".

## Alternativas consideradas

- Desplegar una rama `gh-pages` desde la sesión: exige empujar a una rama no autorizada y no evita activar Pages.
- StackBlitz/WebContainers: no verificado con Vite 8 (binarios nativos de Rolldown); se descarta por ahora.
- Servidor propio: contradice "sin backend" (ADR-0001).

## Consecuencias

La web pública depende de un clic del propietario en la configuración. La vista previa de claude.ai es privada
por defecto y no admite enlaces con estado en la query string (`?s=...`): allí el estado vive en memoria.
