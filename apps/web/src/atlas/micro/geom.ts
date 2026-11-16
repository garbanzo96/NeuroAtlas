import * as THREE from 'three';

/** Generador reproducible para esquemas, sin pretensión de reconstrucción celular. */
export function random(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

export function taperedTube(points: THREE.Vector3[], radius: number) {
  const curve = new THREE.CatmullRomCurve3(points);
  const segments = Math.max(8, points.length * 8);
  const geometry = new THREE.TubeGeometry(curve, segments, radius, 7, false);
  const pos = geometry.getAttribute('position');
  for (let i = 0; i <= segments; i++) {
    const center = curve.getPointAt(i / segments);
    const factor = 1 - 0.78 * (i / segments);
    for (let j = 0; j <= 7; j++) {
      const k = i * 8 + j;
      const p = new THREE.Vector3()
        .fromBufferAttribute(pos, k)
        .sub(center)
        .multiplyScalar(factor)
        .add(center);
      pos.setXYZ(k, p.x, p.y, p.z);
    }
  }
  geometry.computeVertexNormals();
  return geometry;
}

export function reducedMotion() {
  return (
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}
