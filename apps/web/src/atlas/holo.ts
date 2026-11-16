import * as THREE from 'three';

/**
 * Material "holograma": la forma se lee por el borde (Fresnel) y por un relleno tenue, con mezcla aditiva.
 * Las estructuras profundas usan más relleno y se ven más densas. Al acercar la cámara, la superficie
 * cercana se desvanece (pelado por proximidad), dejando ver lo que hay dentro.
 */
export interface HoloLook {
  color: string;
  fill: number; // brillo del cuerpo (0–0.4)
  rim: number; // brillo del borde (0–1.5)
  power?: number; // agudeza del borde
}

const vertexShader = /* glsl */ `
  varying vec3 vN;
  varying vec3 vV;
  varying vec3 vW;
  void main() {
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vW = wp.xyz;
    vN = normalize(mat3(modelMatrix) * normal);
    vV = cameraPosition - wp.xyz;
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;

const fragmentShader = /* glsl */ `
  uniform vec3 uColor;
  uniform vec3 uHot;
  uniform float uFill;
  uniform float uRim;
  uniform float uPower;
  uniform float uHover;
  uniform float uSelect;
  uniform float uVisible;
  uniform float uDim;
  uniform float uNear;
  uniform float uTime;
  varying vec3 vN;
  varying vec3 vV;
  varying vec3 vW;
  void main() {
    float d = length(vV);
    vec3 V = vV / d;
    float ndv = abs(dot(normalize(vN), V));
    float fres = pow(1.0 - ndv, uPower);
    // pelado por proximidad: lo que queda pegado a la cámara se apaga
    float prox = smoothstep(uNear, uNear * 2.4, d);
    // respiración lenta de la luz a lo largo del eje rostrocaudal
    float shimmer = 0.88 + 0.12 * sin(vW.z * 0.9 + vW.y * 0.6 - uTime * 1.1);
    float heat = uHover * 0.75 + uSelect;
    vec3 col = mix(uColor, uHot, clamp(heat, 0.0, 1.0));
    float a = (uFill * (1.0 + heat * 2.2) + fres * uRim * (1.0 + heat * 0.9)) * shimmer;
    a *= uVisible * prox * (1.0 - uDim * 0.82);
    gl_FragColor = vec4(col * a, a);
  }
`;

export type HoloMaterial = THREE.ShaderMaterial & {
  uniforms: Record<
    | 'uColor'
    | 'uHot'
    | 'uFill'
    | 'uRim'
    | 'uPower'
    | 'uHover'
    | 'uSelect'
    | 'uVisible'
    | 'uDim'
    | 'uNear'
    | 'uTime',
    THREE.IUniform
  >;
};

export function holoMaterial(look: HoloLook): HoloMaterial {
  return new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uColor: { value: new THREE.Color(look.color) },
      uHot: { value: new THREE.Color('#d8f4ff') },
      uFill: { value: look.fill },
      uRim: { value: look.rim },
      uPower: { value: look.power ?? 2.2 },
      uHover: { value: 0 },
      uSelect: { value: 0 },
      uVisible: { value: 1 },
      uDim: { value: 0 },
      uNear: { value: 2 },
      uTime: { value: 0 },
    },
  }) as HoloMaterial;
}

/** Aproxima `current` a `target` de forma independiente de los fps. */
export function approach(current: number, target: number, dt: number, rate = 10): number {
  return current + (target - current) * (1 - Math.exp(-rate * dt));
}
