/**
 * Destino del build. "artifact" es la vista previa publicada como página de claude.ai
 * (tools/build-artifact.ts): allí el marco bloquea las descargas iniciadas por la página.
 */
export const BUILD_TARGET: string = import.meta.env.VITE_NEUROATLAS_TARGET ?? 'web';
export const DOWNLOADS_SUPPORTED = BUILD_TARGET !== 'artifact';
