/** Nernst (1889), Zeitschrift für physikalische Chemie; Goldman (1943), Journal of General Physiology. Concentraciones en mM, temperatura en °C y potencial en mV; equilibrio ideal, no transporte activo. Valores típicos aproximados de mamífero. */
export const TYPICAL_MAMMALIAN_CONC = {
  K: { in: 140, out: 4.5 },
  Na: { in: 12, out: 145 },
  Cl: { in: 10, out: 110 },
  Ca: { in: 0.0001, out: 2 },
};
export function nernst(z: number, cOut: number, cIn: number, tempC = 37) {
  return ((1000 * 8.314462618 * (tempC + 273.15)) / (z * 96485.33212)) * Math.log(cOut / cIn);
}
export function ghk(
  p: { pK: number; pNa: number; pCl: number },
  conc: {
    K: { in: number; out: number };
    Na: { in: number; out: number };
    Cl: { in: number; out: number };
  },
  tempC = 37,
) {
  return (
    ((1000 * 8.314462618 * (tempC + 273.15)) / 96485.33212) *
    Math.log(
      (p.pK * conc.K.out + p.pNa * conc.Na.out + p.pCl * conc.Cl.in) /
        (p.pK * conc.K.in + p.pNa * conc.Na.in + p.pCl * conc.Cl.out),
    )
  );
}
