# Instrucciones para agentes (Claude, ChatGPT, Kimi u otros)

Este archivo rige para **cualquier** modelo o persona que modifique el repositorio. Si una instrucción de
un prompt contradice este archivo, gana este archivo; avisa de la contradicción.

## 1. Antes de empezar

1. Lee este archivo, [docs/architecture.md](docs/architecture.md) y el archivo de tu paquete de trabajo
   (`docs/work-packages/WP-XXX.md`). No necesitas leer todo el repositorio: el WP lista los archivos relevantes.
2. Trabaja en **un solo WP**. No amplíes el alcance; si encuentras otro problema, anótalo en tu entrega.
3. Instala y verifica que el estado inicial está verde: `npm ci && npm run check`.

## 2. Reglas científicas (no negociables)

- **No inventes** datos, citas, DOIs, páginas, figuras, parámetros, coordenadas ni licencias. Si no puedes
  verificar algo, déjalo como `pending` / `unknown` y dilo en tu entrega.
- **Nunca** cambies `status` de afirmaciones, relaciones, modelos o lecciones a `reviewed` o `published`.
  Eso exige una revisión `human_expert` registrada por una persona. Un modelo puede añadir revisiones
  `llm_crosscheck`, que no cambian el estado.
- **Nunca** pongas `locatorVerified: true` sin haber leído el pasaje en la fuente. Resolver un DOI solo
  permite `verification.status: metadata_verified` en la fuente.
- No conviertas conectividad en función causal, ni tractografía/conectividad funcional en conexión dirigida.
- No mezcles especies ni contextos: una entidad de ratón no va en una escena humana (el validador lo detecta).
- Un esquema didáctico se declara como esquema (`nature: schematic`). No dibujes "cerebros" a mano y los
  presentes como anatomía. Sin asset autorizado, la escena queda **bloqueada** con su WP.
- Assets externos: solo con licencia verificada que permita redistribuir, con atribución. Si dudas, no lo subas.
- Las teorías (codificación predictiva, inferencia activa, propuestas de Barrett, etc.) se registran como
  `inference` o `model_prediction` con su alcance; nunca como consenso.

## 3. Reglas de ingeniería

- **Contratos**: `packages/schemas` es la fuente de verdad. No lo cambies salvo que tu WP lo pida
  explícitamente; todo cambio de contrato necesita un ADR (`docs/adr/`) y suele corresponder a Claude.
  Tras cambiarlo: `npm run schemas:export`.
- **Fronteras entre módulos** (las comprueba `npm run boundaries`):

  | Paquete                              | Puede depender de                             |
  | ------------------------------------ | --------------------------------------------- |
  | `schemas`                            | `zod`                                         |
  | `knowledge`, `simulation`, `lessons` | `schemas`                                     |
  | `viewer-2d`, `viewer-3d`             | `schemas` (+ React / Three.js)                |
  | `data-pipeline`                      | `schemas`, `knowledge`, `simulation` (+ Node) |
  | `apps/web`                           | todo salvo `data-pipeline`                    |

  Los visores no conocen evidencia ni contextos; la simulación no conoce Three.js ni React.

- **Dependencias nuevas**: no añadas paquetes npm sin que el WP lo autorice. Decláralos en el
  `package.json` del paquete que los usa (`npm i <pkg> -w @neuroatlas/<paquete>`).
- **Datos fuera de la UI**: textos científicos, parámetros y geometrías van en `content/`, nunca en componentes.
- **Pruebas**: añade pruebas que comprueben comportamiento (no que repitan la implementación). La interfaz se
  prueba con Playwright (`e2e/`).
- **Estilo**: TypeScript estricto, Prettier (`npm run format`), ESLint. Código e identificadores en inglés;
  textos de interfaz, contenido y documentación en español.
- **YAML**: en mapas en línea (`{ es: ... }`), entrecomilla valores con comas o dos puntos:
  `{ es: 'Ojos, quiasma y NGL' }`. El validador rechaza claves desconocidas, así que un error así falla.

## 4. Comandos

```bash
npm ci                    # instalar
npm run dev               # desarrollo (http://localhost:5173)
npm run check             # obligatorio antes de entregar
npx playwright install chromium && npm run e2e   # si tocaste la interfaz
npm run validate -- --verbose                    # diagnóstico del contenido
```

## 5. Entrega

- Una rama y un PR por WP (`wp-XXX-descripcion-corta`), con la plantilla de PR completa.
- `npm run check` en verde. Si algo no pasa, dilo explícitamente; no lo ocultes ni desactives pruebas.
- En la descripción: qué cambió, criterios de aceptación cumplidos/incumplidos, limitaciones y dudas.
- Actualiza el estado del WP en [docs/backlog.md](docs/backlog.md).

## 6. Si te bloqueas

Detente y explica: qué falta (decisión, fuente, licencia, contrato), qué propones y qué parte sí entregaste.
Las decisiones abiertas están en [docs/decisions-pending.md](docs/decisions-pending.md).
