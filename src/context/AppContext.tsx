import { createContext, useContext } from 'react';
import type { AppStore } from '../types';
import type { Action } from '../store/reducer';

interface AppContextValue {
  store: AppStore;
  dispatch: React.Dispatch<Action>;
}

export const AppContext = createContext<AppContextValue | null>(null);

export function useAppContext(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used within AppContext.Provider');
  return ctx;
}
