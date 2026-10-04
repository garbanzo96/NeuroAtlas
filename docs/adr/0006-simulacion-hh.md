# ADR-0006: Simulación desacoplada; Hodgkin–Huxley con RK4 y referencia NEURON

- **Estado:** Aceptada
- **Fecha:** 2026-10-04

## Contexto

El plan pide modelos con ecuaciones, unidades, solver y supuestos explícitos, ejecución separada del
renderizado, comparación con una referencia y convergencia al reducir el paso.

## Decisión

- Ficha del modelo en `content/models/` y su implementación registrada en `packages/simulation`;
  `checkSpecCompatibility` exige IDs y unidades idénticas.
- HH clásico en convención moderna (V en mV, reposo ≈ −65 mV, despolarización positiva; potenciales de
  inversión convertidos con V_moderno = −65 mV − V_HH). Factor de temperatura φ = 3^((T−6,3)/10), T fija en 6,3 °C.
- **RK4 de paso fijo**. El estímulo se evalúa una vez por intervalo, en su punto medio, y sus bordes deben ser
  múltiplos de `dt` (validado). Motivo: evaluar el estímulo en cada subetapa con `t = paso·dt` introducía errores
  de redondeo en los bordes y degradaba el método a primer orden (detectado por la prueba de convergencia).
- **Referencia independiente**: trazas de NEURON 9.0.2 (mecanismo `hh`, `usetable_hh = 0`, CVODE con
  tolerancia 1e-9). Con las tablas de interpolación por defecto de NEURON (1 mV) la diferencia acumulada era
  ~0,1 ms en 7 espigas; sin tablas, < 0,0001 ms. Tolerancias en `hh-reference.ts` (~50× de holgura).
- Ejecución en Web Worker con chunks y cancelación (`AbortSignal`); respaldo en el hilo principal.

## Alternativas consideradas

- Euler explícito: más simple pero necesita dt ~10× menor para la misma precisión (se mantiene como
  comprobación cruzada).
- Paso adaptativo (RK45): innecesario para el tamaño del problema y complica la reproducibilidad de muestreo.
- Ejecutar NEURON/Brian2 en servidor: contradice "sin backend" en el MVP.

## Consecuencias

La comparación con NEURON verifica ejecución y transcripción, **no** la validez biológica ni los localizadores
de parámetros en el artículo original (WP-012, asesor de neurociencia computacional).
