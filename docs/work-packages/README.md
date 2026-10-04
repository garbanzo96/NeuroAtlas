# Paquetes de trabajo (WP)

Un WP es un encargo que una persona o un modelo puede completar en una sesión, con entradas, salidas y
criterios de aceptación verificables. El índice y los estados están en [../backlog.md](../backlog.md).

## Formato

```markdown
# WP-XXX: Título

- **Hito / fase:** · **Ejecutor recomendado:** · **Depende de:** · **Tamaño:** S (≤2 h) / M (≤1 día) / L (>1 día)

## Objetivo — una o dos frases

## Contexto — por qué, enlaces a ADR/plan

## Archivos — leer / crear o modificar / NO tocar

## Pasos sugeridos

## Criterios de aceptación — verificables (comandos, pruebas, comportamientos)

## Fuera de alcance

## Prompt para copiar — listo para pegar en el modelo indicado
```

## Cómo entregar un WP a un modelo económico

1. Abre una conversación nueva (un WP por conversación).
2. Pega el **prompt para copiar** del WP. Adjunta `AGENTS.md`, el archivo del WP y los archivos de la sección
   "Leer" (si el modelo no puede leer el repositorio por sí mismo).
3. Pide archivos completos o un diff unificado. Aplica los cambios en una rama `wp-XXX-...`.
4. Ejecuta `npm run check` (y `npm run e2e` si tocó la interfaz). Si falla, pega el error al mismo modelo
   (máximo 2–3 iteraciones; después, escala a Claude).
5. Abre un PR con la plantilla y pide revisión (Claude usa [../agents/review-checklist.md](../agents/review-checklist.md)).
