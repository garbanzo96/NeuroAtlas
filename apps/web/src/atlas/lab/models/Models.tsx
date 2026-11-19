import { useEffect, useMemo, useState } from 'react';
import { dynamics as d } from '@neuroatlas/simulation';
import { Plot, RasterPlot, type Series } from '../Plot';
import { Slider } from '../Slider';
import { Heatmap } from '../Heatmap';
import { clearSignals, publish } from '../../signals';

const seq = (n: number, f: (i: number) => number) => Array.from({ length: n }, (_, i) => f(i));
function useDelay<T>(value: T) {
  const [result, setResult] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setResult(value), 60);
    return () => clearTimeout(timer);
  }, [value]);
  return result;
}
// Playback uses simulation time, independently of React renders and the numerical solver.
function usePlayback(update: (seconds: number) => void, deps: React.DependencyList) {
  useEffect(() => {
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      update((now - start) / 1000);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      clearSignals();
    };
    // The supplied dependencies identify the simulation result.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
function Control({
  name,
  value,
  set,
  min,
  max,
  step,
  unit,
}: {
  name: string;
  value: number;
  set: (n: number) => void;
  min: number;
  max: number;
  step: number;
  unit?: string;
}) {
  return (
    <Slider label={name} value={value} onChange={set} min={min} max={max} step={step} unit={unit} />
  );
}
function Frame({
  equation,
  observe,
  scope,
  children,
}: {
  equation: string;
  observe: string;
  scope: string;
  children: React.ReactNode;
}) {
  return (
    <div className="na-lab-model">
      <p className="na-lab-equation">{equation}</p>
      {children}
      <p>
        <strong>Qué observar:</strong> {observe}
      </p>
      <p>
        <strong>Alcance:</strong> {scope}
      </p>
    </div>
  );
}
const graph = (x: ArrayLike<number>, y: ArrayLike<number>, name: string): Series => ({
  x,
  y,
  name,
});
export function HH() {
  const [a, sa] = useState(10),
    [duration, sd] = useState(40);
  const aa = useDelay(a),
    dd = useDelay(duration);
  const r = useMemo(() => d.simulateHHPoint(aa, dd), [aa, dd]);
  usePlayback(
    (seconds) => {
      const i = Math.floor(((seconds * 20) % 60) / 0.01);
      publish('hh.V', r.v[i]!);
      publish('hh.m', r.m[i]!);
      publish('hh.h', r.h[i]!);
      publish('hh.n', r.n[i]!);
    },
    [r],
  );
  return (
    <Frame
      equation="C dV/dt = I − Iₙₐ − Iₖ − Iₗ"
      observe="Compara 1 y 10 µA/cm²; cambia la duración del escalón."
      scope="Axón gigante de calamar, 6,3 °C; compartimento uniforme."
    >
      <Control name="Corriente" value={a} set={sa} min={0} max={30} step={1} unit="µA/cm²" />
      <Control name="Duración" value={duration} set={sd} min={1} max={50} step={1} unit="ms" />
      <Plot xLabel="Tiempo (ms)" yLabel="V (mV)" series={[graph(r.t, r.v, 'V')]} />
      <Plot
        xLabel="Tiempo (ms)"
        yLabel="Compuertas"
        series={[graph(r.t, r.m, 'm'), graph(r.t, r.h, 'h'), graph(r.t, r.n, 'n')]}
      />
    </Frame>
  );
}
export function Izhikevich() {
  const [preset, sp] = useState<keyof typeof d.IZH_PRESETS>('RS'),
    [current, sc] = useState(10);
  const c = useDelay(current);
  const r = useMemo(
    () => d.simulateIzhikevich({ params: d.IZH_PRESETS[preset], current: c, tMax: 200 }),
    [preset, c],
  );
  return (
    <Frame
      equation="v′ = 0,04v² + 5v + 140 − u + I"
      observe="Cambia el preset y compara el patrón de disparo al subir la corriente."
      scope="Modelo fenomenológico puntual; no reconstruye canales."
    >
      <label>
        Preset{' '}
        <select value={preset} onChange={(e) => sp(e.target.value as typeof preset)}>
          {Object.entries(d.IZH_PRESETS).map(([id, p]) => (
            <option key={id} value={id}>
              {id} · {p.name}
            </option>
          ))}
        </select>
      </label>
      <p>{d.IZH_PRESETS[preset].description}</p>
      <Control name="Corriente" value={current} set={sc} min={0} max={30} step={1} />
      <Plot xLabel="Tiempo (ms)" yLabel="V (mV)" series={[graph(r.t, r.v, 'V')]} />
    </Frame>
  );
}
export function LIF() {
  const [current, sc] = useState(2),
    [tau, st] = useState(20);
  const c = useDelay(current),
    t = useDelay(tau);
  const p = { tauM: t, R: 10, vRest: -65, vThresh: -50, vReset: -65, tRef: 2 };
  const r = d.simulateLIF({ ...p, current: c, tMax: 500, dt: 0.1 });
  const x = seq(31, (i) => i / 10);
  return (
    <Frame
      equation="τₘ dV/dt = Vᵣ − V + RI"
      observe="Sube la corriente sobre el umbral y compara las tasas analítica y simulada."
      scope="Neurona puntual con reinicio; sin canales explícitos."
    >
      <Control name="Corriente" value={current} set={sc} min={0} max={3} step={0.1} />
      <Control name="τₘ" value={tau} set={st} min={5} max={50} step={1} unit="ms" />
      <Plot xLabel="Tiempo (ms)" yLabel="V (mV)" series={[graph(r.t, r.v, 'V')]} />
      <Plot
        xLabel="Corriente"
        yLabel="Tasa (Hz)"
        series={[
          graph(
            x,
            x.map((i) => d.lifRateAnalytic(i, p)),
            'Analítica',
          ),
          graph(
            x,
            x.map((i) => d.simulateLIF({ ...p, current: i, tMax: 1000, dt: 0.1 }).spikes.length),
            'Simulada',
          ),
        ]}
      />
    </Frame>
  );
}
export function WilsonCowan() {
  const [p, sp] = useState(1.25),
    [c, sc] = useState(12);
  const pp = useDelay(p),
    cc = useDelay(c);
  const r = useMemo(
    () =>
      d.simulateWilsonCowan(
        { ...d.WC_OSCILLATORY, P: pp, c2: cc },
        { tMax: 40, dt: 0.02, E0: 0.1, I0: 0.1 },
      ),
    [pp, cc],
  );
  usePlayback(
    (seconds) => {
      const i = Math.floor(((seconds * 4) % 40) / 0.02);
      publish('wc.E', r.E[i]!);
      publish('wc.I', r.I[i]!);
    },
    [r],
  );
  return (
    <Frame
      equation="τₑ E′ = −E + (1 − rₑE) Sₑ(c₁E − c₂I + P)"
      observe="Varía P y c₂; observa la trayectoria y las oscilaciones."
      scope="Actividades medias adimensionales, no neuronas individuales."
    >
      <Control name="Entrada P" value={p} set={sp} min={0} max={4} step={0.05} />
      <Control name="Inhibición c₂" value={c} set={sc} min={0} max={20} step={0.5} />
      <Plot
        xLabel="Tiempo"
        yLabel="Actividad"
        series={[graph(r.t, r.E, 'E'), graph(r.t, r.I, 'I')]}
      />
      <Plot xLabel="E" yLabel="I" series={[graph(r.E, r.I, 'Trayectoria')]} />
    </Frame>
  );
}
export function Kuramoto() {
  const [k, sk] = useState(2),
    [sd, ss] = useState(1);
  const kk = useDelay(k),
    s = useDelay(sd);
  const r = useMemo(
    () => d.simulateKuramoto({ n: 60, K: kk, omegaSd: s, tMax: 30, dt: 0.05 }),
    [kk, s],
  );
  return (
    <Frame
      equation="θᵢ′ = ωᵢ + Kr sin(ψ − θᵢ)"
      observe="Aumenta K y compara la sincronía con distintas dispersiones."
      scope="Osciladores ideales; tiempo arbitrario."
    >
      <Control name="Acoplamiento K" value={k} set={sk} min={0} max={5} step={0.1} />
      <Control name="Dispersión ω" value={sd} set={ss} min={0} max={3} step={0.1} />
      <Plot xLabel="Tiempo" yLabel="r" series={[graph(r.t, r.r, 'Orden')]} />
      <svg
        className="na-lab-circle"
        viewBox="-1.2 -1.2 2.4 2.4"
        role="img"
        aria-label="Fases finales"
      >
        <circle r="1" fill="none" stroke="currentColor" strokeWidth="0.01" />
        {Array.from(r.phases, (p) => (
          <circle key={p} cx={Math.cos(p)} cy={Math.sin(p)} r="0.025" fill="currentColor" />
        ))}
      </svg>
    </Frame>
  );
}
export function Network() {
  const [size, ss] = useState(100),
    [seed, st] = useState(1);
  const n = useDelay(size),
    s = useDelay(seed);
  const r = useMemo(
    () =>
      d.simulateNetwork({
        ne: Math.round(n * 0.8),
        ni: n - Math.round(n * 0.8),
        tMax: 300,
        seed: s,
      }),
    [n, s],
  );
  const bins = seq(
    30,
    (i) =>
      (Array.from(r.spikeTimes).filter((t) => t >= i * 10 && t < (i + 1) * 10).length / n) * 100,
  );
  return (
    <Frame
      equation="v′ = 0,04v² + 5v + 140 − u + I"
      observe="Cambia la semilla y el tamaño; compara los patrones de espigas."
      scope="Red puntual con ruido, no conectoma anatómico."
    >
      <Control name="Neuronas" value={size} set={ss} min={20} max={300} step={10} />
      <Control name="Semilla" value={seed} set={st} min={1} max={100} step={1} />
      <RasterPlot times={r.spikeTimes} ids={r.spikeIds} ne={r.ne} />
      <Plot
        xLabel="Tiempo (ms)"
        yLabel="Tasa (Hz)"
        series={[
          graph(
            seq(30, (i) => i * 10),
            bins,
            'Tasa poblacional',
          ),
        ]}
      />
    </Frame>
  );
}
export function TsodyksMarkram() {
  const [preset, sp] = useState<keyof typeof d.TM_PRESETS>('depressing'),
    [freq, sf] = useState(20);
  const f = useDelay(freq);
  const x = seq(12, (i) => i + 1),
    y = d.tmResponses(
      x.map((i) => ((i - 1) * 1000) / f),
      d.TM_PRESETS[preset],
    );
  usePlayback(
    (seconds) => {
      const p = d.TM_PRESETS[preset];
      const interval = 1000 / f;
      const time = (seconds * 250) % (12 * interval + 1000);
      let resource = 1,
        utilization = 0,
        last = 0;
      for (let i = 0; i < 12 && i * interval <= time; i++) {
        const delta = i === 0 ? Infinity : interval;
        resource = 1 - (1 - resource) * Math.exp(-delta / p.tauRec);
        utilization = p.tauFacil > 0 ? utilization * Math.exp(-delta / p.tauFacil) : 0;
        utilization += p.U * (1 - utilization);
        resource *= 1 - utilization;
        last = i * interval;
      }
      publish('tm.x', 1 - (1 - resource) * Math.exp(-(time - last) / p.tauRec));
      publish('tm.u', utilization * (p.tauFacil > 0 ? Math.exp(-(time - last) / p.tauFacil) : 1));
    },
    [preset, f],
  );
  return (
    <Frame
      equation="Aₙ = uₙRₙ"
      observe="Compara los presets a distintas frecuencias."
      scope="Sinapsis fenomenológica; amplitudes relativas."
    >
      <label>
        Preset{' '}
        <select value={preset} onChange={(e) => sp(e.target.value as typeof preset)}>
          <option value="depressing">Depresivo</option>
          <option value="facilitating">Facilitador</option>
        </select>
      </label>
      <Control name="Frecuencia" value={freq} set={sf} min={1} max={100} step={1} unit="Hz" />
      <Plot
        mode="bars"
        xLabel="Espiga"
        yLabel="Amplitud relativa"
        series={[graph(x, y, 'Respuesta')]}
      />
    </Frame>
  );
}
export function STDP() {
  const [ap, sa] = useState(0.005),
    [am, sb] = useState(0.00525),
    [tau, st] = useState(20);
  const a = useDelay(ap),
    b = useDelay(am),
    t = useDelay(tau),
    x = seq(201, (i) => i - 100);
  return (
    <Frame
      equation="Δw = A₊ exp(−Δt/τ₊) o −A₋ exp(Δt/τ₋)"
      observe="Cambia las amplitudes y τ para comparar ambos lados de la ventana."
      scope="Regla por pares; no es una regla universal de plasticidad."
    >
      <Control name="A₊" value={ap} set={sa} min={0} max={0.02} step={0.00025} />
      <Control name="A₋" value={am} set={sb} min={0} max={0.02} step={0.00025} />
      <Control name="τ" value={tau} set={st} min={5} max={60} step={1} unit="ms" />
      <Plot
        xLabel="Δt (ms)"
        yLabel="Δw"
        series={[
          graph(
            x,
            x.map((v) => d.stdpWindow(v, { aPlus: a, aMinus: b, tauPlus: t, tauMinus: t })),
            'Ventana',
          ),
        ]}
      />
    </Frame>
  );
}
export function Nernst() {
  const [ion, si] = useState<keyof typeof d.TYPICAL_MAMMALIAN_CONC>('K'),
    [inside, sin] = useState(140),
    [outside, sout] = useState(4.5),
    [temp, st] = useState(37);
  const i = useDelay(inside),
    o = useDelay(outside),
    t = useDelay(temp);
  const val = d.nernst(ion === 'Cl' ? -1 : ion === 'Ca' ? 2 : 1, o, i, t);
  return (
    <Frame
      equation="E = RT/(zF) ln([ion]ₒ/[ion]ᵢ)"
      observe="Invierte el gradiente y observa el signo del potencial."
      scope="Equilibrio ideal; concentraciones aproximadas de mamífero."
    >
      <label>
        Ion{' '}
        <select
          value={ion}
          onChange={(e) => {
            const k = e.target.value as typeof ion;
            si(k);
            sin(d.TYPICAL_MAMMALIAN_CONC[k].in);
            sout(d.TYPICAL_MAMMALIAN_CONC[k].out);
          }}
        >
          {Object.keys(d.TYPICAL_MAMMALIAN_CONC).map((k) => (
            <option key={k}>{k}</option>
          ))}
        </select>
      </label>
      <Control
        name="Concentración interna"
        value={inside}
        set={sin}
        min={0.0001}
        max={150}
        step={0.0001}
        unit="mM"
      />
      <Control
        name="Concentración externa"
        value={outside}
        set={sout}
        min={0.0001}
        max={150}
        step={0.0001}
        unit="mM"
      />
      <Control name="Temperatura" value={temp} set={st} min={0} max={40} step={1} unit="°C" />
      <p>Potencial de equilibrio: {val.toFixed(1)} mV</p>
      <Plot
        mode="bars"
        xLabel="Ion seleccionado"
        yLabel="Potencial (mV)"
        series={[graph([0, 1], [0, val], ion)]}
      />
    </Frame>
  );
}
export function GHK() {
  const [k, sk] = useState(1),
    [na, sn] = useState(0.04),
    [cl, sc] = useState(0.45);
  const kk = useDelay(k),
    nn = useDelay(na),
    cc = useDelay(cl);
  const conc = d.TYPICAL_MAMMALIAN_CONC;
  const vm = d.ghk({ pK: kk, pNa: nn, pCl: cc }, conc);
  return (
    <Frame
      equation="Vₘ = RT/F ln((Pₖ[K]ₒ + Pₙₐ[Na]ₒ + P꜀ₗ[Cl]ᵢ)/(Pₖ[K]ᵢ + Pₙₐ[Na]ᵢ + P꜀ₗ[Cl]ₒ))"
      observe="Aumenta PNa y compara Vm con E_Na y E_K."
      scope="Campo constante y concentraciones ideales aproximadas de mamífero."
    >
      <Control name="P K" value={k} set={sk} min={0.01} max={2} step={0.01} />
      <Control name="P Na" value={na} set={sn} min={0} max={2} step={0.01} />
      <Control name="P Cl" value={cl} set={sc} min={0} max={2} step={0.01} />
      <p>
        Vm {vm.toFixed(1)} mV · E K {d.nernst(1, conc.K.out, conc.K.in).toFixed(1)} mV · E Na{' '}
        {d.nernst(1, conc.Na.out, conc.Na.in).toFixed(1)} mV
      </p>
    </Frame>
  );
}
export function NakPump() {
  const [rate, sr] = useState(1),
    [time, st] = useState(0);
  useEffect(() => {
    const id = setInterval(() => st((t) => t + 0.1), 100);
    return () => clearInterval(id);
  }, []);
  const phase = d.pumpPhase(time, rate);
  usePlayback(() => publish('pump.rate', rate), [rate]);
  return (
    <Frame
      equation="3 Na⁺ fuera : 2 K⁺ dentro : 1 ATP"
      observe="Cambia la velocidad y sigue los seis estados del ciclo."
      scope="Esquema Post–Albers; no representa cinética molecular medida."
    >
      <Control name="Ciclos" value={rate} set={sr} min={0.1} max={3} step={0.1} unit="s⁻¹" />
      <svg
        className="na-lab-circle"
        viewBox="-120 -120 240 240"
        role="img"
        aria-label="Ciclo de seis estados"
      >
        {d.NAK_PUMP_STATES.map((state, i) => {
          const angle = (i * Math.PI) / 3 - Math.PI / 2;
          return (
            <g key={state.id}>
              <circle
                cx={85 * Math.cos(angle)}
                cy={85 * Math.sin(angle)}
                r="14"
                fill={i === phase.stateIndex ? 'var(--na-acc)' : 'var(--na-glass-hi)'}
                stroke="var(--na-line-hi)"
              />
              <text
                x={85 * Math.cos(angle)}
                y={85 * Math.sin(angle) + 4}
                textAnchor="middle"
                fill="var(--na-fg)"
                fontSize="11"
              >
                {i + 1}
              </text>
            </g>
          );
        })}
      </svg>
      <p>
        {d.NAK_PUMP_STATES[phase.stateIndex]?.label}:{' '}
        {d.NAK_PUMP_STATES[phase.stateIndex]?.description}
      </p>
      <p>
        {phase.cycles * 3} Na⁺ hacia fuera · {phase.cycles * 2} K⁺ hacia dentro
      </p>
    </Frame>
  );
}
export function Axon() {
  const [amp, sa] = useState(100);
  const a = useDelay(amp);
  const r = useMemo(() => d.simulateAxon({ tMax: 20, stimAmp: a }), [a]);
  const sample = seq(r.vSnapshots.length / r.n, (i) => i * 0.05);
  const signalNames = useMemo(() => Array.from({ length: r.n }, (_, i) => `axon.V[${i}]`), [r.n]);
  usePlayback(
    (seconds) => {
      const sampleIndex = Math.floor(((seconds * 10) % 20) / 0.05);
      for (let i = 0; i < r.n; i++) publish(signalNames[i]!, r.vSnapshots[sampleIndex * r.n + i]!);
    },
    [r, signalNames],
  );
  return (
    <Frame
      equation="C dV/dt = Iᵢₒₙ + Iₐₓᵢₐₗ + Iₑₓₜ"
      observe="Reduce el estímulo y observa si la señal llega al extremo."
      scope="Cable uniforme idealizado de axón gigante de calamar, sin mielina."
    >
      <Control name="Estímulo" value={amp} set={sa} min={0} max={200} step={5} unit="µA/cm²" />
      <Heatmap values={r.vSnapshots} n={r.n} />
      <Plot
        xLabel="Tiempo (ms)"
        yLabel="V (mV)"
        series={[
          graph(
            sample,
            sample.map((_, i) => r.vSnapshots[i * r.n]!),
            'Inicio',
          ),
          graph(
            sample,
            sample.map((_, i) => r.vSnapshots[i * r.n + Math.floor(r.n / 2)]!),
            'Centro',
          ),
          graph(
            sample,
            sample.map((_, i) => r.vSnapshots[i * r.n + r.n - 1]!),
            'Extremo',
          ),
        ]}
      />
      <p>
        Velocidad de conducción:{' '}
        {Number.isFinite(r.conductionVelocity)
          ? `${r.conductionVelocity.toFixed(1)} m/s`
          : 'sin propagación detectada'}
      </p>
    </Frame>
  );
}
