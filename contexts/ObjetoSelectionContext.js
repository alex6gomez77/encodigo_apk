import { createContext, useContext, useState } from 'react';

const ObjetoSelectionContext = createContext(null);

export function ObjetoSelectionProvider({ children }) {
  const [selectedObjeto, setSelectedObjeto] = useState(null);

  return (
    <ObjetoSelectionContext.Provider
      value={{ selectedObjeto, setSelectedObjeto }}
    >
      {children}
    </ObjetoSelectionContext.Provider>
  );
}

export function useObjetoSelection() {
  const context = useContext(ObjetoSelectionContext);
  if (!context) {
    throw new Error('useObjetoSelection debe usarse dentro de ObjetoSelectionProvider.');
  }
  return context;
}