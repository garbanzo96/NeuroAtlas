/** Esquema didáctico de tasas; los tiempos y pesos no son parámetros fisiológicos. */
export interface SignedGraph {
  nodes: { id: string; basal?: number }[];
  edges: {
    from: string;
    to: string;
    sign: 'exc' | 'inh' | 'mod' | 'horm';
    delay: number;
    w?: number;
    modulates?: { edges: number[]; gain: number };
  }[];
}
export interface GraphScenario {
  stim: { node: string; at: number; amp: number; dur: number }[];
  lesions?: string[];
}
export function simulateSignedGraph(
  graph: SignedGraph,
  scenario: GraphScenario,
  { dt, T, tau }: { dt: number; T: number; tau: number },
) {
  if (!(dt > 0 && T > 0 && tau > 0 && dt <= tau)) throw new Error('Parámetros de tiempo inválidos');
  const ids = new Map(graph.nodes.map((n, i) => [n.id, i]));
  const lesions = new Set(scenario.lesions ?? []);
  const count = Math.floor(T / dt) + 1;
  const t = Float32Array.from({ length: count }, (_, i) => i * dt);
  const activity = graph.nodes.map(() => new Float32Array(count));
  const clamp = (x: number) => Math.max(0, Math.min(1, x));
  const step = (current: number[], time: number, sample: (node: number, delay: number) => number) =>
    graph.nodes.map((node, j) => {
      if (lesions.has(node.id)) return 0;
      let input = node.basal ?? 0;
      graph.edges.forEach((edge, k) => {
        if (edge.to !== node.id || edge.sign === 'mod' || lesions.has(`edge:${k}`)) return;
        const source = ids.get(edge.from);
        if (source === undefined || lesions.has(edge.from)) return;
        let gain = 1;
        graph.edges.forEach((mod, m) => {
          if (
            mod.sign !== 'mod' ||
            !mod.modulates?.edges.includes(k) ||
            lesions.has(`edge:${m}`) ||
            lesions.has(mod.from)
          )
            return;
          const mi = ids.get(mod.from);
          if (mi !== undefined) gain += mod.modulates.gain * sample(mi, mod.delay);
        });
        input += (edge.sign === 'inh' ? -1 : 1) * gain * (edge.w ?? 1) * sample(source, edge.delay);
      });
      for (const s of scenario.stim)
        if (s.node === node.id && time >= s.at && time < s.at + s.dur) input += s.amp;
      return current[j]! + ((clamp(input) - current[j]!) * dt) / tau;
    });
  // El estado previo se estabiliza antes del estímulo; las lesiones también afectan ese basal.
  let basal = graph.nodes.map((n) => (lesions.has(n.id) ? 0 : clamp(n.basal ?? 0)));
  for (let i = 0; i < Math.ceil((20 * tau) / dt); i++) basal = step(basal, -1, (j) => basal[j]!);
  basal.forEach((a, j) => {
    activity[j]![0] = a;
  });
  for (let i = 1; i < count; i++) {
    const current = activity.map((a) => a[i - 1]!);
    const next = step(current, t[i - 1]!, (j, delay) => {
      const index = i - 1 - Math.round(delay / dt);
      return index < 0 ? basal[j]! : activity[j]![index]!;
    });
    next.forEach((a, j) => {
      activity[j]![i] = a;
    });
  }
  const pulses: { edge: number; t0: number; t1: number; strength: number }[] = [];
  graph.edges.forEach((edge, k) => {
    const source = ids.get(edge.from);
    if (
      source === undefined ||
      lesions.has(edge.from) ||
      lesions.has(edge.to) ||
      lesions.has(`edge:${k}`)
    )
      return;
    let last = -Infinity;
    for (let i = 1; i < count; i++) {
      const change = Math.abs(
        activity[source]![i]! - activity[source]![Math.max(0, i - Math.ceil(tau / dt))]!,
      );
      if (change > 0.025 && t[i]! - last >= Math.max(tau, dt)) {
        const t0 = t[i]!;
        pulses.push({
          edge: k,
          t0,
          t1: t0 + Math.max(edge.delay, dt),
          strength: Math.min(1, change * 3),
        });
        last = t0;
      }
    }
  });
  return { t, activity, pulses };
}
