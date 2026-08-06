import React, { createContext, useContext, useState, useCallback } from 'react';
import { UnitSystem } from '../lib/weightUtils';

type UnitContextType = {
  system: UnitSystem;
  setSystem: (s: UnitSystem) => void;
};

const UnitContext = createContext<UnitContextType | undefined>(undefined);

/** localStorage key for the user's preferred unit system. */
const UNIT_PREF_KEY = 'tw-unit-system';

function readStoredSystem(): UnitSystem {
  try {
    const v = localStorage.getItem(UNIT_PREF_KEY);
    return v === 'metric' ? 'metric' : 'imperial';
  } catch {
    return 'imperial';
  }
}

interface UnitProviderProps {
  children: React.ReactNode;
  /**
   * When supplied (e.g. from a share-link snapshot), this value takes priority
   * over the localStorage preference.  The recipient's own localStorage
   * preference is NOT overwritten — they can still toggle freely.
   */
  initialSystem?: UnitSystem;
}

export function UnitProvider({ children, initialSystem }: UnitProviderProps) {
  const [system, setSystemState] = useState<UnitSystem>(
    () => initialSystem ?? readStoredSystem(),
  );

  const setSystem = useCallback((s: UnitSystem) => {
    setSystemState(s);
    try { localStorage.setItem(UNIT_PREF_KEY, s); } catch {}
  }, []);

  return (
    <UnitContext.Provider value={{ system, setSystem }}>
      {children}
    </UnitContext.Provider>
  );
}

export function useUnit() {
  const context = useContext(UnitContext);
  if (!context) throw new Error('useUnit must be used within a UnitProvider');
  return context;
}
