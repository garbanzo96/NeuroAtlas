/** Bi y Poo (1998), Journal of Neuroscience; Song, Miller y Abbott (2000), Nature Neuroscience. Tiempo en ms y cambios relativos; ventana por pares, no regla universal de plasticidad. */
export interface STDPParams {
  aPlus: number;
  aMinus: number;
  tauPlus: number;
  tauMinus: number;
}
export const STDP_DEFAULTS: STDPParams = {
  aPlus: 0.005,
  aMinus: 0.00525,
  tauPlus: 20,
  tauMinus: 20,
};
export function stdpWindow(dtMs: number, p: STDPParams = STDP_DEFAULTS) {
  return dtMs > 0
    ? p.aPlus * Math.exp(-dtMs / p.tauPlus)
    : dtMs < 0
      ? -p.aMinus * Math.exp(dtMs / p.tauMinus)
      : 0;
}
