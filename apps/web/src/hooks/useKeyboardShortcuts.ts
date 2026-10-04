import { useEffect } from 'react';
import { useAppStore } from '../state/store';

function isTyping(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable;
}

/**
 * Atajos globales: "/" buscar · Esc cerrar aviso o limpiar selección · "?" ayuda ·
 * "[" y "]" paso anterior/siguiente de la lección.
 */
export function useKeyboardShortcuts() {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const state = useAppStore.getState();
      if (event.key === 'Escape') {
        if (state.shortcutsOpen) state.setShortcutsOpen(false);
        else if (state.notice) state.dismissNotice();
        else state.selectEntity(null);
        return;
      }
      if (isTyping(event.target) || event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.key === '/') {
        event.preventDefault();
        document.getElementById('na-search')?.focus();
      } else if (event.key === '?') {
        event.preventDefault();
        state.setShortcutsOpen(true);
      } else if (event.key === ']' && state.lesson) {
        state.lessonStep(1);
      } else if (event.key === '[' && state.lesson) {
        state.lessonStep(-1);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);
}
