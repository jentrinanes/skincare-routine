import { useReducer } from 'react';
import type { AppStore, User, UserProfile, Product, RoutineItem, Log, Reaction, PatchTest } from '../types';
import { loadStore } from './data';

export type Action =
  | { type: 'LOGIN'; payload: User }
  | { type: 'LOGOUT' }
  | { type: 'UPDATE_PROFILE'; payload: UserProfile }
  | { type: 'SET_DARK_MODE'; payload: boolean }
  | { type: 'ADD_PRODUCT'; payload: Product }
  | { type: 'UPDATE_PRODUCT'; payload: Product }
  | { type: 'DELETE_PRODUCT'; payload: string }
  | { type: 'ADD_ROUTINE_ITEM'; payload: RoutineItem }
  | { type: 'UPDATE_ROUTINE_ITEM'; payload: { id: string; changes: Partial<RoutineItem> } }
  | { type: 'REMOVE_ROUTINE_ITEM'; payload: { id: string } }
  | { type: 'ADD_LOG'; payload: Log }
  | { type: 'REMOVE_LOG'; payload: { date: string; routineItemId: string; period: string } }
  | { type: 'SKIP_TODAY'; payload: Log }
  | { type: 'UNSKIP_TODAY'; payload: { date: string; routineItemId: string; period: string } }
  | { type: 'CLEAR_LOGS' }
  | { type: 'ADD_PATCH_TEST'; payload: PatchTest }
  | { type: 'UPDATE_PATCH_TEST'; payload: PatchTest }
  | { type: 'DELETE_PATCH_TEST'; payload: string }
  | { type: 'ADD_REACTION'; payload: Reaction }
  | { type: 'UPDATE_REACTION'; payload: Reaction }
  | { type: 'DELETE_REACTION'; payload: string }
  | { type: 'LOAD_STORE'; payload: Partial<AppStore> };

function reducer(state: AppStore, action: Action): AppStore {
  let next: AppStore;

  switch (action.type) {
    case 'LOGIN':
      next = { ...state, user: action.payload, userProfile: { ...state.userProfile, ...action.payload } };
      break;
    case 'LOGOUT':
      next = { ...state, user: null };
      break;
    case 'UPDATE_PROFILE':
      next = {
        ...state,
        userProfile: action.payload,
        user: state.user
          ? { ...state.user, name: action.payload.name, email: action.payload.email, skinType: action.payload.skinType }
          : null,
      };
      break;
    case 'SET_DARK_MODE':
      next = { ...state, darkMode: action.payload };
      break;

    case 'ADD_PRODUCT':
      next = { ...state, products: [...state.products, action.payload] };
      break;
    case 'UPDATE_PRODUCT':
      next = { ...state, products: state.products.map(p => p.id === action.payload.id ? action.payload : p) };
      break;
    case 'DELETE_PRODUCT':
      next = {
        ...state,
        products: state.products.filter(p => p.id !== action.payload),
        routine: state.routine.filter(r => r.productId !== action.payload),
      };
      break;

    case 'ADD_ROUTINE_ITEM':
      next = { ...state, routine: [...state.routine, action.payload] };
      break;
    case 'UPDATE_ROUTINE_ITEM':
      next = { ...state, routine: state.routine.map(r => r.id === action.payload.id ? { ...r, ...action.payload.changes } : r) };
      break;
    case 'REMOVE_ROUTINE_ITEM':
      next = { ...state, routine: state.routine.filter(r => r.id !== action.payload.id) };
      break;

    case 'ADD_LOG':
      next = { ...state, logs: [...state.logs, action.payload] };
      break;
    case 'REMOVE_LOG':
      next = {
        ...state,
        logs: state.logs.filter(l => !(
          l.date === action.payload.date &&
          l.routineItemId === action.payload.routineItemId &&
          l.period === action.payload.period
        )),
      };
      break;
    case 'SKIP_TODAY':
      next = {
        ...state,
        logs: [
          ...state.logs.filter(l => !(
            l.date === action.payload.date &&
            l.routineItemId === action.payload.routineItemId &&
            l.period === action.payload.period
          )),
          { ...action.payload, completed: false, skipped: true },
        ],
      };
      break;
    case 'UNSKIP_TODAY':
      next = {
        ...state,
        logs: state.logs.filter(l => !(
          l.date === action.payload.date &&
          l.routineItemId === action.payload.routineItemId &&
          l.period === action.payload.period &&
          l.skipped
        )),
      };
      break;
    case 'CLEAR_LOGS':
      next = { ...state, logs: [] };
      break;

    case 'ADD_PATCH_TEST':
      next = { ...state, patchTests: [...state.patchTests, action.payload] };
      break;
    case 'UPDATE_PATCH_TEST':
      next = { ...state, patchTests: state.patchTests.map(t => t.id === action.payload.id ? action.payload : t) };
      break;
    case 'DELETE_PATCH_TEST':
      next = { ...state, patchTests: state.patchTests.filter(t => t.id !== action.payload) };
      break;

    case 'ADD_REACTION':
      next = { ...state, reactions: [...state.reactions, action.payload] };
      break;
    case 'UPDATE_REACTION':
      next = { ...state, reactions: state.reactions.map(r => r.id === action.payload.id ? action.payload : r) };
      break;
    case 'DELETE_REACTION':
      next = { ...state, reactions: state.reactions.filter(r => r.id !== action.payload) };
      break;

    case 'LOAD_STORE': {
      const profile = action.payload.userProfile;
      next = {
        ...state,
        ...action.payload,
        // Restore user from profile when hydrating from API
        user: profile?.id && profile?.name && profile?.email
          ? { id: profile.id, name: profile.name, email: profile.email, skinType: profile.skinType }
          : state.user,
      };
      break;
    }

    default:
      return state;
  }

  return next;
}

export function useStore() {
  const [store, dispatch] = useReducer(reducer, undefined, loadStore);
  return { store, dispatch };
}
