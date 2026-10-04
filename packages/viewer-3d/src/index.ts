import { lazy } from 'react';

export { boundsCenter, endDirection, isWebGL2Available, itemsForLayer } from './geometry';
export type { LayerItems, ViewerLayer } from './geometry';
export type { CameraCommand, SchematicSceneProps } from './SchematicScene';

/**
 * Componente 3D cargado de forma diferida: three.js no entra en el bundle inicial y la
 * aplicación funciona (listas, fichas, gráficos) aunque WebGL2 no esté disponible.
 */
export const LazySchematicScene = lazy(() => import('./SchematicScene'));
