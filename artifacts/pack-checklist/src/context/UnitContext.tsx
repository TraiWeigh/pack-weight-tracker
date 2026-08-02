import React, { createContext, useContext, useState } from 'react';
import { UnitSystem } from '../lib/weightUtils';

type UnitContextType = {
  system: UnitSystem;
  setSystem: (s: UnitSystem) => void;
};

const UnitContext = createContext<UnitContextType | undefined>(undefined);

export function UnitProvider({ children }: { children: React.ReactNode }) {
  const [system, setSystem] = useState<UnitSystem>('imperial');

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
