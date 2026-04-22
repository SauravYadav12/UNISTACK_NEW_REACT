import { useEffect, useCallback } from 'react';
import { useAi } from '../context/AiContext';

export function useCommandPalette() {
  const { commandPaletteOpen, setCommandPaletteOpen } = useAi();

  const toggle = useCallback(() => {
    setCommandPaletteOpen(!commandPaletteOpen);
  }, [commandPaletteOpen, setCommandPaletteOpen]);

  const open = useCallback(() => setCommandPaletteOpen(true), [setCommandPaletteOpen]);
  const close = useCallback(() => setCommandPaletteOpen(false), [setCommandPaletteOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        toggle();
      }
      if (e.key === 'Escape' && commandPaletteOpen) {
        e.preventDefault();
        close();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggle, close, commandPaletteOpen]);

  return { isOpen: commandPaletteOpen, open, close, toggle };
}

export function fuzzyMatch(query: string, target: string): boolean {
  const q = query.toLowerCase();
  const t = target.toLowerCase();
  if (t.includes(q)) return true;

  let qi = 0;
  for (let ti = 0; ti < t.length && qi < q.length; ti++) {
    if (t[ti] === q[qi]) qi++;
  }
  return qi === q.length;
}
