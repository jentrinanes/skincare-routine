import type { Action } from '../store/reducer';
import type { AppStore } from '../types';
import { api } from './client';

// Maps each mutating Action to the corresponding API call.
// Called after the reducer has already applied the action optimistically.
// LOGIN and LOGOUT are handled directly in AppContext (not here).
export async function syncToApi(action: Action, _state: AppStore): Promise<void> {
  switch (action.type) {
    // ── Profile ──────────────────────────────────────────────────────────────
    case 'UPDATE_PROFILE':
      await api.profile.upsert(action.payload);
      break;

    // ── Products ─────────────────────────────────────────────────────────────
    case 'ADD_PRODUCT':
      await api.products.create(action.payload);
      break;
    case 'UPDATE_PRODUCT':
      await api.products.update(action.payload);
      break;
    case 'DELETE_PRODUCT':
      await api.products.remove(action.payload);
      break;

    // ── Routine items ─────────────────────────────────────────────────────────
    case 'ADD_ROUTINE_ITEM':
      await api.routineItems.create(action.payload);
      break;
    case 'UPDATE_ROUTINE_ITEM':
      await api.routineItems.update(action.payload.id, action.payload.changes);
      break;
    case 'REMOVE_ROUTINE_ITEM':
      await api.routineItems.remove(action.payload.id);
      break;

    // ── Logs ──────────────────────────────────────────────────────────────────
    case 'ADD_LOG':
      await api.logs.upsert(action.payload);
      break;
    case 'REMOVE_LOG':
      await api.logs.remove(
        action.payload.date,
        action.payload.routineItemId,
        action.payload.period,
      );
      break;
    case 'SKIP_TODAY':
      await api.logs.upsert({ ...action.payload, completed: false, skipped: true });
      break;
    case 'UNSKIP_TODAY':
      await api.logs.remove(
        action.payload.date,
        action.payload.routineItemId,
        action.payload.period,
      );
      break;
    case 'CLEAR_LOGS':
      await api.logs.clear();
      break;

    // ── Patch tests ───────────────────────────────────────────────────────────
    case 'ADD_PATCH_TEST':
      await api.patchTests.create(action.payload);
      break;
    case 'UPDATE_PATCH_TEST':
      await api.patchTests.update(action.payload);
      break;
    case 'DELETE_PATCH_TEST':
      await api.patchTests.remove(action.payload);
      break;

    // ── Reactions ─────────────────────────────────────────────────────────────
    case 'ADD_REACTION':
      await api.reactions.create(action.payload);
      break;
    case 'UPDATE_REACTION':
      await api.reactions.update(action.payload);
      break;
    case 'DELETE_REACTION':
      await api.reactions.remove(action.payload);
      break;

    // Local-only — no API sync needed:
    // SET_DARK_MODE, LOGOUT, LOAD_STORE
  }
}
