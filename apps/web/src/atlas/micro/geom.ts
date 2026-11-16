import * as THREE from 'three';

/** Generador reproducible para esquemas, sin pretensión de reconstrucción celular. */
export function random(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

export function taperedTube(
  curve: THREE.Curve<THREE.Vector3>,
  r0: number,
  r1: number,
  tubular = 32,
  radial = 12,
) {
  const geometry = new THREE.TubeGeometry(curve, tubular, 1, radial, false);
  const pos = geometry.getAttribute('position');
  for (let i = 0; i <= tubular; i++) {
    const t = i / tubular;
    const center = curve.getPointAt(t);
    // Hemispherical ends, with a short transition at each endpoint.
    const cap = Math.sqrt(
      Math.max(0, 1 - Math.pow(Math.max(0, 1 - Math.min(t, 1 - t) * tubular), 2)),
    );
    const radius = THREE.MathUtils.lerp(r0, r1, t) * cap;
    for (let j = 0; j <= radial; j++) {
      const k = i * (radial + 1) + j;
      const point = new THREE.Vector3()
        .fromBufferAttribute(pos, k)
        .sub(center)
        .multiplyScalar(radius)
        .add(center);
      pos.setXYZ(k, point.x, point.y, point.z);
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
