# NeuroAtlas

Entorno docente interactivo y multiescala de neurociencia: atlas anatómico y conectómico, base de
conocimiento con evidencia trazable y laboratorio de modelos computacionales, coordinados por
identificadores y selección compartidos.

> **Estado (2026-10-04): esqueleto de arquitectura funcional.** El primer recorrido (retina → NGL → V1 →
> circuito laminar → neurona → potencial de acción) funciona de punta a punta, pero **todo su contenido
> científico es borrador**: 0 de 25 afirmaciones tienen revisión experta, la escena anatómica de V1 está
> bloqueada hasta disponer de un atlas con licencia verificada y la especie del circuito laminar está
> pendiente de decisión. Ver [docs/roadmap.md](docs/roadmap.md).

## Qué hay ya

| Pieza                | Estado                                                                                                                                                                                                          |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Contratos validables | Zod + JSON Schema para entidad, relación, afirmación, fuente, contexto, asset, representación, escena, lección, modelo, simulación y selección (`packages/schemas`).                                            |
| Validador científico | Referencias rotas, mezcla de especies/contextos, estados de revisión, licencias, leyendas de color, transiciones sin puente (`packages/knowledge`).                                                             |
| Pipeline offline     | YAML en `content/` → paquete versionado con SHA-256 (`packages/data-pipeline`).                                                                                                                                 |
| Simulación           | Hodgkin–Huxley clásico (RK4) en Web Worker, cancelable, exportable; **coincide con NEURON 9.0.2** con < 0,001 ms de diferencia en tiempos de espiga (`packages/simulation`).                                    |
| Visores              | 3D esquemático con React Three Fiber (carga diferida) y gráficos SVG accesibles (`packages/viewer-3d`, `packages/viewer-2d`).                                                                                   |
| Aplicación           | 5 escenas, ficha científica con evidencia, capas con opacidad, búsqueda, avisos de cambio de contexto, escena bloqueada explícita, recorrido guiado de 8 pasos, URL reproducible, teclado y móvil (`apps/web`). |
| Calidad              | 75 pruebas unitarias, 9 e2e (Playwright, escritorio y móvil), verificación de fronteras entre módulos, CI en GitHub Actions.                                                                                    |

## Arranque rápido

Requisitos: Node.js ≥ 22.12 (ver `.nvmrc`) y npm.

```bash
npm ci            # instala dependencias (usa package-lock.json)
npm run dev       # construye los paquetes de datos y abre http://localhost:5173
```

| Comando                                  | Para qué                                                                                     |
| ---------------------------------------- | -------------------------------------------------------------------------------------------- |
| `npm run check`                          | Todo lo que exige CI: formato, lint, tipos, fronteras, contenido, pruebas y build.           |
| `npm run validate`                       | Valida solo `content/` (esquemas + reglas científicas). `-- --verbose` muestra informativos. |
| `npm test`                               | Pruebas unitarias (Vitest).                                                                  |
| `npm run e2e`                            | Build + pruebas end-to-end (Playwright; instalar antes `npx playwright install chromium`).   |
| `npm run schemas:export`                 | Regenera `packages/schemas/json/` tras cambiar un contrato.                                  |
| `npm run sources:verify-doi -- src.<id>` | Comprueba metadatos de una fuente en Crossref y guarda la auditoría en `docs/research/`.     |

## Mapa del repositorio

```text
apps/web/                 Aplicación React (shell, estado, paneles). Sin datos científicos en el código.
packages/schemas/         Contratos (Zod) y JSON Schema exportados. Única fuente de verdad de los tipos.
packages/knowledge/       Índice, consultas y validación del grafo de conocimiento.
packages/simulation/      Modelos y solvers desacoplados del renderizado; adaptadores Worker/en proceso.
packages/lessons/         Motor de recorridos guiados.
packages/viewer-3d/       Visor 3D (React Three Fiber). No conoce evidencia ni contextos.
packages/viewer-2d/       Gráficos y leyendas SVG.
packages/data-pipeline/   CLI offline: validar, construir paquetes, exportar esquemas, verificar DOIs.
content/                  Conocimiento: fuentes, contextos, entidades, relaciones, afirmaciones, escenas…
tools/                    Verificador de fronteras y generador de trazas de referencia (NEURON).
e2e/                      Pruebas end-to-end.
docs/                     Arquitectura, ADR, hoja de ruta, backlog, paquetes de trabajo, prompts, plan original.
```

## Cómo se trabaja en este repositorio

El proyecto avanza por **paquetes de trabajo (WP)** pequeños y verificables. Cada WP tiene un archivo en
[docs/work-packages/](docs/work-packages/) con entradas, salidas, criterios de aceptación y un prompt listo
para copiar. Quién ejecuta qué:

- **Tú** decides lo científico-docente y lo legal ([docs/decisions-pending.md](docs/decisions-pending.md)).
- **Asesores humanos** revisan la ciencia; solo su revisión permite pasar contenido de `draft` a `reviewed`.
- **Claude** mantiene arquitectura, contratos (ADR) e integración, y revisa lo que entregan otros modelos.
- **Modelos económicos** (ChatGPT, Kimi u otros) ejecutan WP acotados de código o datos, siguiendo
  [AGENTS.md](AGENTS.md). Guía de asignación: [docs/agents/README.md](docs/agents/README.md).

Lectura recomendada, en orden: [AGENTS.md](AGENTS.md) → [docs/architecture.md](docs/architecture.md) →
[docs/roadmap.md](docs/roadmap.md) → [docs/backlog.md](docs/backlog.md).

## Principios que el código hace cumplir

1. Ninguna afirmación científica sin fuente; ninguna pasa de `draft` sin revisión experta humana registrada.
2. Un esquema didáctico se rotula como esquema; no se sitúa en un marco de coordenadas físico.
3. Cambiar de especie, dataset o nivel de abstracción entre escenas exige un puente explícito y visible.
4. Los assets externos solo se distribuyen con licencia verificada; si falta, la escena queda bloqueada.
5. La simulación avanza con su propio paso de integración; la pantalla solo interpola muestras.
6. Los datos científicos viven en `content/`, fuera del código de interfaz.

## Licencia

**Pendiente de decisión (DEC-008).** Hasta entonces el repositorio no concede licencia de uso. El plan
original está en [docs/plan-original/](docs/plan-original/).
