import { useEffect, useMemo, useRef } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { approach, holoMaterial } from '../holo';
import { useAtlas, type PartInfo } from '../store';

export type Point = [number, number, number];

export function useParts(parts: Record<string, PartInfo>) {
  useEffect(() => {
    useAtlas.getState().setParts(parts);
    return () => useAtlas.getState().setParts({});
  }, [parts]);
}

export function useReducedMotion() {
  return useMemo(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    [],
  );
}

export function useHolo(key: string, color = '#5ca4ff', fill = 0.1, rim = 0.55) {
  const material = useMemo(() => holoMaterial({ color, fill, rim }), [color, fill, rim]);
  const hot = useRef(false);
  useEffect(() => () => material.dispose(), [material]);
  useFrame((state, dt) => {
    material.uniforms.uHover.value = approach(
      material.uniforms.uHover.value as number,
      hot.current ? 1 : 0,
      dt,
      5,
    );
    material.uniforms.uSelect.value = approach(
      material.uniforms.uSelect.value as number,
      useAtlas.getState().selected === key ? 1 : 0,
      dt,
      5,
    );
    material.uniforms.uTime.value = state.clock.elapsedTime;
  });
  return { material, hot };
}

export function handlers(
  key: string,
  title: string,
  anchor: Point,
  hot: React.MutableRefObject<boolean>,
) {
  return {
    onPointerOver: (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation();
      hot.current = true;
      useAtlas.getState().setHover({ key, title, subtitle: 'Esquema didáctico', anchor });
    },
    onPointerOut: () => {
      hot.current = false;
      useAtlas.getState().setHover(null);
    },
    onClick: (e: ThreeEvent<MouseEvent>) => {
      e.stopPropagation();
      useAtlas.getState().select(key);
    },
  };
}

/** Deterministic positions avoid changing the scene on rerenders. */
export function random(seed: number) {
  let s = seed;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}
