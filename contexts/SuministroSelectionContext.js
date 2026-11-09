import { createContext, useContext, useState } from 'react';

const SuministroSelectionContext = createContext(null);

export function SuministroSelectionProvider({ children }) {
  const [selectedSuministro, setSelectedSuministro] = useState(null);

  return (
    <SuministroSelectionContext.Provider
      value={{ selectedSuministro, setSelectedSuministro }}
    >
      {children}
    </SuministroSelectionContext.Provider>
  );
}

export function useSuministroSelection() {
  const context = useContext(SuministroSelectionContext);
  if (!context) {
    throw new Error('useSuministroSelection debe usarse dentro de SuministroSelectionProvider.');
  }
  return context;
}
