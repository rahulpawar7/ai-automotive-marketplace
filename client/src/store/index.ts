/**
 * Root Redux store.
 *
 * Architecture:
 *  - Each feature owns a slice in `src/features/<feature>/<feature>Slice.ts`.
 *  - Slices export their reducer and thunks; the store wires them together.
 *  - A listener middleware reacts to filter / sort changes by re-fetching cars,
 *    keeping the "filter UI ↔ car grid" causality declarative.
 *  - Auth state is mirrored to localStorage on every change so the user stays
 *    signed in across reloads (manual persistence — no extra deps).
 *
 * Module load ordering matters here:
 *  - We register listeners AFTER `configureStore` returns. By that point every
 *    slice module has finished evaluation, so referencing their action
 *    creators can't hit the TDZ even when api files trigger a circular
 *    import (api/* → store → slice → api/*).
 *  - The api package never imports the store directly; instead `store/index`
 *    hands it a tiny `{getToken, onUnauthorized}` adapter, breaking the cycle.
 */
import {
  configureStore,
  isAnyOf,
  type TypedStartListening,
} from '@reduxjs/toolkit';
import marketplaceReducer, {
  filtersReplaced,
  filtersPatched,
  filtersCleared,
  sortChanged,
  loadCars,
} from '../features/marketplace/marketplaceSlice';
import chatReducer from '../features/chat/chatSlice';
import authReducer, {
  loadPersistedAuth,
  persistAuth,
  _tokenInvalidated,
} from '../features/auth/authSlice';
import { listenerMiddleware } from './listenerMiddleware';
import { configureAuthAdapter } from '../api/authAdapter';

export const store = configureStore({
  reducer: {
    marketplace: marketplaceReducer,
    chat: chatReducer,
    auth: authReducer,
  },
  preloadedState: {
    auth: loadPersistedAuth(),
  },
  middleware: (getDefault) =>
    getDefault({
      serializableCheck: {
        // The chat slice intentionally stores tool-call arguments and results
        // as `unknown` JSON values for inspection in the UI. These are always
        // structurally cloneable but TS can't prove that — silence the warning.
        ignoredPaths: ['chat.messages'],
        ignoredActionPaths: ['payload.args', 'payload.result', 'payload.error'],
      },
    }).prepend(listenerMiddleware.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

/* ---------- post-construction wiring (no TDZ risk past this line) ---------- */

// Hand the api package a read-only view into auth state so axios interceptors
// never have to `import { store }` (which would create a cycle).
configureAuthAdapter({
  getToken: () => store.getState().auth.token,
  onUnauthorized: () => store.dispatch(_tokenInvalidated()),
});

const startAppListening = listenerMiddleware.startListening as TypedStartListening<
  RootState,
  AppDispatch
>;

startAppListening({
  matcher: isAnyOf(filtersReplaced, filtersPatched, filtersCleared, sortChanged),
  effect: async (_action, api) => {
    await api.dispatch(loadCars());
  },
});

// Persist auth on every change. Cheap subscriber — only writes when the slice's
// reference identity changes (Redux Toolkit gives us referential stability).
let lastAuthRef = store.getState().auth;
store.subscribe(() => {
  const next = store.getState().auth;
  if (next !== lastAuthRef) {
    lastAuthRef = next;
    persistAuth(next);
  }
});
