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
  uniform float uBack;
  varying vec3 vN;
  varying vec3 vV;
  varying vec3 vW;
  void main() {
    float d = max(length(vV), 1e-4);
    vec3 V = vV / d;
    vec3 N = vN / max(length(vN), 1e-4);
    // clamp: sin él, la imprecisión deja bases negativas en pow() → NaN, y el bloom lo esparce por la pantalla
    float ndv = clamp(abs(dot(N, V)), 0.0, 1.0);
    float fres = pow(max(1.0 - ndv, 1e-4), uPower);
    // pelado por proximidad: lo que queda pegado a la cámara se apaga
    float prox = smoothstep(uNear, uNear * 2.4, d);
    // respiración lenta de la luz a lo largo del eje rostrocaudal
    float shimmer = 0.94 + 0.06 * sin(vW.z * 0.9 + vW.y * 0.6 - uTime * 1.1);
    float heat = uHover * 0.6 + uSelect;
    vec3 col = mix(uColor, uHot, clamp(heat, 0.0, 1.0));
    float a = (uFill * (1.0 + heat * 2.2) + fres * uRim * (1.0 + heat * 0.9)) * shimmer;
    // la cara trasera se atenúa: sin esto, los surcos del lado lejano se superponen a los del cercano
    a *= (gl_FrontFacing ? 1.0 : uBack) * uVisible * prox * (1.0 - uDim * 0.82);
    a = clamp(a, 0.0, 4.0);
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
    | 'uTime'
    | 'uBack',
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
      uHot: { value: new THREE.Color('#c4e6ff') },
      uFill: { value: look.fill },
      uRim: { value: look.rim },
      uPower: { value: look.power ?? 2.2 },
      uHover: { value: 0 },
      uSelect: { value: 0 },
      uVisible: { value: 1 },
      uDim: { value: 0 },
      uNear: { value: 2 },
      uTime: { value: 0 },
      uBack: { value: 0.35 },
    },
  }) as HoloMaterial;
}

/** Aproxima `current` a `target` de forma independiente de los fps. */
export function approach(current: number, target: number, dt: number, rate = 10): number {
  return current + (target - current) * (1 - Math.exp(-rate * dt));
}
