import React, { createContext, useContext, useEffect, useState } from 'react';
import { AppMode } from '../types';

const STORAGE_KEY = 'bd_ledger_active_mode';

interface ModeContextValue {
  mode: AppMode;
  setMode: (mode: AppMode) => void;
  toggleMode: () => void;
}

const ModeContext = createContext<ModeContextValue | null>(null);

export const ModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setModeState] = useState<AppMode>(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      return saved === 'personal' ? 'personal' : 'business';
    } catch {
      return 'business';
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, mode);
    } catch {
      // ignore storage errors
    }
  }, [mode]);

  const setMode = (next: AppMode) => setModeState(next);
  const toggleMode = () => setModeState((prev) => (prev === 'business' ? 'personal' : 'business'));

  return (
    <ModeContext.Provider value={{ mode, setMode, toggleMode }}>
      {children}
    </ModeContext.Provider>
  );
};

export function useMode(): ModeContextValue {
  const ctx = useContext(ModeContext);
  if (!ctx) {
    throw new Error('useMode must be used inside a ModeProvider');
  }
  return ctx;
}
