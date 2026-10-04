# Contenido científico (`content/`)

Fuente de verdad del conocimiento de NeuroAtlas. Se edita en YAML, se valida con `npm run validate` y se publica
como paquete versionado con `npm run packs` (lo hacen `npm run dev` y `npm run build` automáticamente).

## Estructura

| Carpeta                | Contrato             | Contenido                                                                    |
| ---------------------- | -------------------- | ---------------------------------------------------------------------------- |
| `release.yaml`         | `Release`            | ID del release, canal (`dev`/`review`/`public`), fecha de corte.             |
| `sources/`             | `Source`             | Fuentes con su escalera de verificación y licencia.                          |
| `contexts/`            | `Context`            | Especie/alcance, preparación, modalidad, atlas.                              |
| `entities/`            | `Entity`             | Identidades (sin afirmaciones).                                              |
| `relations/`           | `Relation`           | Relaciones tipadas con `claimIds`.                                           |
| `claims/`              | `Claim`              | Afirmaciones con evidencia, incertidumbre, estado y procedencia.             |
| `assets/manifest.yaml` | `Asset`              | Archivos con licencia; `assets/files/` contiene los originales del proyecto. |
| `representations/`     | `Representation`     | Un asset en un contexto (y qué grupos de su geometría muestra).              |
| `scenes/`              | `SceneManifest`      | Escenas: contexto, marco, capas, leyenda, transiciones, simulación.          |
| `lessons/`             | `Lesson`             | Recorridos guiados.                                                          |
| `models/`              | `ModelSpecification` | Fichas de modelos ejecutables.                                               |

Cada archivo contiene un registro o una lista de registros. La primera línea
`# yaml-language-server: $schema=...` activa la validación en editores (VS Code con la extensión YAML).

## Reglas rápidas

- Todo lo nuevo entra como `status: draft`. Solo una revisión `human_expert` registrada por una persona permite
  `reviewed`/`published` (el validador lo exige).
- `locator: pending` y `locatorVerified: false` hasta que una persona lea el pasaje.
- Una entidad de una especie no puede aparecer en contextos de otra especie ni en contextos generales.
- Cada color usado en una geometría (`colorGroup`) debe explicarse en la `legend` de la escena.
- **YAML:** en mapas en línea, entrecomilla valores con comas o dos puntos: `{ es: 'Ojos, quiasma y NGL' }`.
  El validador rechaza claves desconocidas, así que el error aparece con archivo, índice y campo.

## Estado actual

Release `2026.10.0-dev`: 28 fuentes (9 con metadatos verificados en Crossref, ninguna con contenido inspeccionado),
27 entidades, 8 relaciones, 25 afirmaciones en borrador, 5 escenas (1 bloqueada), 1 lección, 1 modelo.
