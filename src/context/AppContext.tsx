import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { AppStore } from '../types';
import type { Action } from '../store/reducer';
import { useStore } from '../store/reducer';
import { api, setUserId } from '../api/client';
import { syncToApi } from '../api/sync';

interface AppContextValue {
  store: AppStore;
  dispatch: React.Dispatch<Action>;
  loading: boolean;
}

export const AppContext = createContext<AppContextValue | null>(null);

const SESSION_KEY = 'skUserId';

async function fetchAllData(userId: string, dispatch: React.Dispatch<Action>): Promise<void> {
  setUserId(userId);
  const [products, routine, logs, reactions, patchTests, profile] = await Promise.allSettled([
    api.products.list(),
    api.routineItems.list(),
    api.logs.list(),
    api.reactions.list(),
    api.patchTests.list(),
    api.profile.get(),
  ]);
  dispatch({
    type: 'LOAD_STORE',
    payload: {
      products:    products.status    === 'fulfilled' ? products.value    : [],
      routine:     routine.status     === 'fulfilled' ? routine.value     : [],
      logs:        logs.status        === 'fulfilled' ? logs.value        : [],
      reactions:   reactions.status   === 'fulfilled' ? reactions.value   : [],
      patchTests:  patchTests.status  === 'fulfilled' ? patchTests.value  : [],
      userProfile: profile.status     === 'fulfilled' ? profile.value     : undefined,
    },
  });
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { store, dispatch } = useStore();
  const [loading, setLoading] = useState(true);

  // Restore session on mount — if a userId is in sessionStorage, load all data
  useEffect(() => {
    const storedId = sessionStorage.getItem(SESSION_KEY);
    if (!storedId) { setLoading(false); return; }
    fetchAllData(storedId, dispatch).finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const apiDispatch = useCallback((action: Action) => {
    // Handle auth actions before dispatching to reducer
    if (action.type === 'LOGIN') {
      const userId = action.payload.id;
      sessionStorage.setItem(SESSION_KEY, userId);
      dispatch(action);
      setLoading(true);
      fetchAllData(userId, dispatch).finally(() => setLoading(false));
      return;
    }

    if (action.type === 'LOGOUT') {
      sessionStorage.removeItem(SESSION_KEY);
      setUserId(null);
      dispatch(action);
      return;
    }

    // Optimistic update: apply locally first, then sync to API
    dispatch(action);
    syncToApi(action, store).catch(err =>
      console.error('[API sync failed]', action.type, err)
    );
  }, [dispatch, store]);

  return (
    <AppContext.Provider value={{ store, dispatch: apiDispatch, loading }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used within AppProvider');
  return ctx;
}
