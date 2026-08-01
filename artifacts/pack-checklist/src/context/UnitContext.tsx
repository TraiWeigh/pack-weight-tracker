import React, { createContext, useContext, useState } from 'react';

type UnitContextType = {
  unit: 'oz' | 'lbs';
  toggleUnit: () => void;
};

const UnitContext = createContext<UnitContextType | undefined>(undefined);

export function UnitProvider({ children }: { children: React.ReactNode }) {
  const [unit, setUnit] = useState<'oz' | 'lbs'>('oz');
  
  const toggleUnit = () => setUnit(prev => prev === 'oz' ? 'lbs' : 'oz');

  return (
    <UnitContext.Provider value={{ unit, toggleUnit }}>
      {children}
    </UnitContext.Provider>
  );
}

export function useUnit() {
  const context = useContext(UnitContext);
  if (context === undefined) {
    throw new Error('useUnit must be used within a UnitProvider');
  }
  return context;
}
