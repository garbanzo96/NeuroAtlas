import { describe, expect, it } from 'vitest';
import { checkBoundaries, extractImports, packageNameOf } from './check-boundaries';

describe('check-boundaries', () => {
  it('extrae imports estáticos, de tipo, re-exportaciones y dinámicos', () => {
    const src = `
      import { a } from 'three';
      import type { B } from '@neuroatlas/schemas';
      export { c } from './c';
      import './side-effect.css';
      const m = await import('@react-three/drei');
      // import { ignored } from 'commented';
    `;
    expect(extractImports(src)).toEqual([
      'three',
      '@neuroatlas/schemas',
      './c',
      './side-effect.css',
      '@react-three/drei',
    ]);
  });

  it('obtiene el nombre de paquete de un especificador', () => {
    expect(packageNameOf('@neuroatlas/schemas/json-schema')).toBe('@neuroatlas/schemas');
    expect(packageNameOf('three/examples/jsm/controls/OrbitControls.js')).toBe('three');
  });

  it('el repositorio respeta sus fronteras', () => {
    expect(checkBoundaries()).toEqual([]);
  });
});
