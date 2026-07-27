// Phase 14 — useDisclosure hook
import { useState, useCallback } from 'react';

export function useDisclosure(initial = false): {
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
  onToggle: () => void;
} {
  const [open, setOpen] = useState(initial);
  return {
    open,
    onOpen: useCallback(() => setOpen(true), []),
    onClose: useCallback(() => setOpen(false), []),
    onToggle: useCallback(() => setOpen((v) => !v), []),
  };
}
