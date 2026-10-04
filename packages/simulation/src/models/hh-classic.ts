import type { CompiledModel, ModelImplementation } from './types';

/**
 * Hodgkin–Huxley (1952), axón gigante de calamar, compartimento único con space clamp.
 *
 * Convención moderna: V en mV con reposo ≈ −65 mV y despolarización positiva; t en ms;
 * corrientes en µA/cm² (positivas = salientes); conductancias en mS/cm²; C en µF/cm².
 * La corriente externa positiva despolariza: C dV/dt = I_ext − I_Na − I_K − I_L.
 *
 * Las funciones de tasa están escritas en esa convención desplazada. Las constantes
 * (40, 55, 65, 35, 10, 18, 20, 80 mV; 0.1, 4, 0.07, 1, 0.01, 0.125 ms⁻¹) forman parte
 * de la formulación y no son parámetros ajustables. Verificación de transcripción: WP-012.
 */

/** x / (1 − exp(−x/y)) con su límite y + x/2 cuando x → 0 (evita 0/0). */
export function vtrap(x: number, y: number): number {
  const u = x / y;
  if (Math.abs(u) < 1e-6) return y + x / 2;
  return x / (1 - Math.exp(-u));
}

export function rates(v: number, phi: number) {
  const am = 0.1 * vtrap(v + 40, 10);
  const bm = 4 * Math.exp(-(v + 65) / 18);
  const ah = 0.07 * Math.exp(-(v + 65) / 20);
  const bh = 1 / (1 + Math.exp(-(v + 35) / 10));
  const an = 0.01 * vtrap(v + 55, 10);
  const bn = 0.125 * Math.exp(-(v + 65) / 80);
  return {
    am: phi * am,
    bm: phi * bm,
    ah: phi * ah,
    bh: phi * bh,
    an: phi * an,
    bn: phi * bn,
  };
}

interface HHParams {
  c_m: number;
  g_na: number;
  g_k: number;
  g_l: number;
  e_na: number;
  e_k: number;
  e_l: number;
  temperature: number;
}

function compile(p: HHParams): CompiledModel {
  // Factor de temperatura del artículo original: φ = 3^((T − 6.3)/10).
  const phi = Math.pow(3, (p.temperature - 6.3) / 10);

  const steadyGates = (v: number) => {
    const r = rates(v, phi);
    return {
      m: r.am / (r.am + r.bm),
      h: r.ah / (r.ah + r.bh),
      n: r.an / (r.an + r.bn),
    };
  };

  const currents = (v: number, m: number, h: number, n: number) => ({
    i_na: p.g_na * m * m * m * h * (v - p.e_na),
    i_k: p.g_k * n * n * n * n * (v - p.e_k),
    i_l: p.g_l * (v - p.e_l),
  });

  return {
    stateIds: ['v', 'm', 'h', 'n'],

    restState() {
      // Potencial donde la corriente iónica total con compuertas estacionarias es cero.
      const total = (v: number) => {
        const g = steadyGates(v);
        const c = currents(v, g.m, g.h, g.n);
        return c.i_na + c.i_k + c.i_l;
      };
      let lo = -90;
      let hi = -40;
      if (total(lo) * total(hi) > 0) {
        throw new Error(
          'No se encontró un potencial de reposo en [−90, −40] mV con estos parámetros.',
        );
      }
      for (let i = 0; i < 200; i++) {
        const mid = (lo + hi) / 2;
        if (total(lo) * total(mid) <= 0) hi = mid;
        else lo = mid;
      }
      const v = (lo + hi) / 2;
      const g = steadyGates(v);
      return [v, g.m, g.h, g.n];
    },

    derivatives(_t, y, iExt, out) {
      const v = y[0]!;
      const m = y[1]!;
      const h = y[2]!;
      const n = y[3]!;
      const r = rates(v, phi);
      const c = currents(v, m, h, n);
      out[0] = (iExt - c.i_na - c.i_k - c.i_l) / p.c_m;
      out[1] = r.am * (1 - m) - r.bm * m;
      out[2] = r.ah * (1 - h) - r.bh * h;
      out[3] = r.an * (1 - n) - r.bn * n;
    },

    observe(_t, y, iExt) {
      const v = y[0]!;
      const m = y[1]!;
      const h = y[2]!;
      const n = y[3]!;
      const c = currents(v, m, h, n);
      return { v, m, h, n, i_na: c.i_na, i_k: c.i_k, i_l: c.i_l, i_ext: iExt };
    },
  };
}

export const hhClassic: ModelImplementation = {
  key: 'hh_classic_v1',
  parameters: {
    c_m: 'uF/cm^2',
    g_na: 'mS/cm^2',
    g_k: 'mS/cm^2',
    g_l: 'mS/cm^2',
    e_na: 'mV',
    e_k: 'mV',
    e_l: 'mV',
    temperature: 'degC',
  },
  stateVariables: { v: 'mV', m: '1', h: '1', n: '1' },
  observables: {
    v: 'mV',
    m: '1',
    h: '1',
    n: '1',
    i_na: 'uA/cm^2',
    i_k: 'uA/cm^2',
    i_l: 'uA/cm^2',
    i_ext: 'uA/cm^2',
  },
  protocols: ['none', 'current_step'],
  create(parameters) {
    const get = (id: keyof HHParams) => {
      const value = parameters[id];
      if (value === undefined || !Number.isFinite(value)) {
        throw new Error(`Parámetro ausente o no finito: ${id}`);
      }
      return value;
    };
    return compile({
      c_m: get('c_m'),
      g_na: get('g_na'),
      g_k: get('g_k'),
      g_l: get('g_l'),
      e_na: get('e_na'),
      e_k: get('e_k'),
      e_l: get('e_l'),
      temperature: get('temperature'),
    });
  },
};
