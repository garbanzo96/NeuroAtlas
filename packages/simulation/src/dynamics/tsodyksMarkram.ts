/** Tsodyks y Markram (1997), Proceedings of the National Academy of Sciences; Markram et al. (1998), Proceedings of the National Academy of Sciences. Tiempo en ms, recursos y amplitud relativos; sinapsis fenomenológica, no mecanismo molecular. Los presets son valores típicos aproximados. */
export interface TMParams {
  U: number;
  tauRec: number;
  tauFacil: number;
}
export const TM_PRESETS = {
  depressing: { U: 0.5, tauRec: 800, tauFacil: 0 },
  facilitating: { U: 0.04, tauRec: 100, tauFacil: 1000 },
} satisfies Record<string, TMParams>;
export function tmResponses(spikeTimesMs: readonly number[], p: TMParams): number[] {
  let u = 0,
    R = 1,
    last = 0;
  return spikeTimesMs.map((time, index) => {
    if (index > 0 && time < last) throw new Error('Los tiempos deben estar ordenados.');
    const delta = index ? time - last : Infinity;
    R = 1 - (1 - R) * Math.exp(-delta / p.tauRec);
    u = p.tauFacil > 0 ? u * Math.exp(-delta / p.tauFacil) : 0;
    u += p.U * (1 - u);
    const response = u * R;
    R -= response;
    last = time;
    return response;
  });
}
