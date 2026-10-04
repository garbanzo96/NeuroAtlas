"""
Genera trazas de referencia independientes del modelo Hodgkin–Huxley clásico con NEURON.

Propósito: comparar la implementación TypeScript (@neuroatlas/simulation, hh_classic_v1)
contra un simulador establecido cuyo mecanismo `hh` fue transcrito por terceros.
La comparación verifica transcripción de ecuaciones y exactitud numérica; NO valida
científicamente el modelo (eso exige revisión experta, ver WP-012).

Uso (requiere Python 3.10+ y `pip install neuron numpy`):
    python tools/reference/hh_neuron_reference.py > packages/simulation/src/fixtures/hh-neuron-reference.json

Detalles:
- Mecanismo `hh` de NEURON con celsius = 6.3 y el_hh = -54.387 mV (valor de la ficha;
  NEURON trae -54.3 por defecto).
- Compartimento único (nseg=1) con área lateral 1e-4 cm² ⇒ 1 nA ≡ 10 µA/cm².
- usetable_hh = 0 (tasas exactas, sin tablas) y CVODE con tolerancias estrictas;
  registro interpolado a intervalos fijos.
- Estado inicial: reposo calculado como el V donde la corriente iónica estacionaria es cero.
"""
import json
import math
import sys

import numpy as np
from neuron import h

h.load_file("stdrun.hoc")

E_L = -54.387
AREA_CM2 = 1e-4


def rates(v):
    def vtrap(x, y):
        u = x / y
        return y + x / 2 if abs(u) < 1e-6 else x / (1 - math.exp(-u))

    am = 0.1 * vtrap(v + 40, 10)
    bm = 4 * math.exp(-(v + 65) / 18)
    ah = 0.07 * math.exp(-(v + 65) / 20)
    bh = 1 / (1 + math.exp(-(v + 35) / 10))
    an = 0.01 * vtrap(v + 55, 10)
    bn = 0.125 * math.exp(-(v + 65) / 80)
    return am, bm, ah, bh, an, bn


def rest_potential():
    def total(v):
        am, bm, ah, bh, an, bn = rates(v)
        m, hh, n = am / (am + bm), ah / (ah + bh), an / (an + bn)
        return 120 * m**3 * hh * (v - 50) + 36 * n**4 * (v + 77) + 0.3 * (v - E_L)

    lo, hi = -90.0, -40.0
    for _ in range(200):
        mid = (lo + hi) / 2
        if total(lo) * total(mid) <= 0:
            hi = mid
        else:
            lo = mid
    return (lo + hi) / 2


def run(protocol, duration):
    soma = h.Section(name="soma")
    soma.nseg = 1
    d = math.sqrt(AREA_CM2 * 1e8 / math.pi)  # µm, para área lateral π·d·L con L = d
    soma.L = d
    soma.diam = d
    soma.cm = 1.0
    soma.insert("hh")
    seg = soma(0.5)
    seg.gnabar_hh = 0.12
    seg.gkbar_hh = 0.036
    seg.gl_hh = 0.0003
    seg.el_hh = E_L
    seg.ena = 50.0
    seg.ek = -77.0
    h.celsius = 6.3
    # Sin tablas de interpolación (TABLE de hh.mod, resolución 1 mV): tasas exactas.
    h.usetable_hh = 0
    area_um2 = seg.area()
    assert abs(area_um2 - AREA_CM2 * 1e8) < 1e-6, area_um2

    stim = None
    if protocol["kind"] == "current_step":
        stim = h.IClamp(seg)
        stim.delay = protocol["start"]
        stim.dur = protocol["duration"]
        # µA/cm² → nA: I_nA = densidad · área(cm²) · 1e3
        stim.amp = protocol["amplitude"] * AREA_CM2 * 1e3

    h.cvode_active(1)
    h.cvode.atol(1e-9)
    h.cvode.rtol(1e-9)

    coarse_dt = 0.1
    fine_dt = 0.001
    v_coarse = h.Vector().record(seg._ref_v, coarse_dt)
    v_fine = h.Vector().record(seg._ref_v, fine_dt)

    v0 = rest_potential()
    h.finitialize(v0)
    h.continuerun(duration)

    vf = np.array(v_fine)
    tf = np.arange(len(vf)) * fine_dt
    spikes = []
    for i in range(1, len(vf)):
        if vf[i - 1] < 0 <= vf[i]:
            frac = (0 - vf[i - 1]) / (vf[i] - vf[i - 1])
            spikes.append(round(float(tf[i - 1] + frac * fine_dt), 4))
    vc = [round(float(x), 5) for x in np.array(v_coarse)]
    soma = None
    return {
        "restPotential_mV": round(v0, 6),
        "peak_mV": round(float(vf.max()), 4),
        "spikeTimes_ms": spikes,
        "trace": {"dt_ms": coarse_dt, "v_mV": vc},
    }


CASES = [
    ("rest", {"kind": "none"}, 50.0),
    ("subthreshold_pulse", {"kind": "current_step", "amplitude": 2.0, "start": 5.0, "duration": 1.0}, 30.0),
    ("suprathreshold_pulse", {"kind": "current_step", "amplitude": 20.0, "start": 5.0, "duration": 1.0}, 30.0),
    ("sustained_step", {"kind": "current_step", "amplitude": 10.0, "start": 10.0, "duration": 100.0}, 120.0),
]

out = {
    "generator": "tools/reference/hh_neuron_reference.py",
    "simulator": f"NEURON {h.nrnversion(5) if hasattr(h, 'nrnversion') else 'unknown'}",
    "settings": "mecanismo hh; usetable_hh 0; celsius 6.3; el_hh -54.387 mV; CVODE atol=rtol=1e-9; cm 1 µF/cm²",
    "cases": {},
}
for name, protocol, duration in CASES:
    out["cases"][name] = {"protocol": protocol, "duration_ms": duration, **run(protocol, duration)}

json.dump(out, sys.stdout, indent=1)
sys.stdout.write("\n")
