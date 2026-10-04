import { useEffect, useRef } from 'react';
import { useAppStore } from '../state/store';

const SHORTCUTS: Array<[string, string]> = [
  ['/', 'Buscar en el atlas'],
  ['↑ ↓ Inicio Fin', 'Moverse por la lista de estructuras'],
  ['Enter / Espacio', 'Seleccionar la estructura enfocada'],
  ['Esc', 'Cerrar aviso o limpiar la selección'],
  ['[ ]', 'Paso anterior / siguiente del recorrido'],
  ['← →', 'Mover el cursor de tiempo en un gráfico enfocado (Mayús: pasos largos)'],
  ['?', 'Mostrar esta ayuda'],
];

export function ShortcutsDialog() {
  const open = useAppStore((s) => s.shortcutsOpen);
  const setOpen = useAppStore((s) => s.setShortcutsOpen);
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (open) closeRef.current?.focus();
  }, [open]);
  if (!open) return null;
  return (
    <div className="na-dialog-backdrop" onClick={() => setOpen(false)}>
      <div
        className="na-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="na-shortcuts-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="na-shortcuts-title">Atajos de teclado</h2>
        <table className="na-table">
          <tbody>
            {SHORTCUTS.map(([key, action]) => (
              <tr key={key}>
                <th scope="row">
                  <kbd>{key}</kbd>
                </th>
                <td>{action}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="na-muted">
          En el visor 3D: arrastrar para girar, rueda o pellizco para acercar. Los botones de cámara
          ofrecen las mismas acciones sin gestos precisos.
        </p>
        <button ref={closeRef} type="button" onClick={() => setOpen(false)}>
          Cerrar
        </button>
      </div>
    </div>
  );
}
