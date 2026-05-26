import { createListenerMiddleware } from '@reduxjs/toolkit';

/**
 * Bare middleware instance. Listeners are registered in `store/index.ts`
 * AFTER `configureStore` returns — that's the only point where every slice
 * module is guaranteed to be fully evaluated, so referencing
 * `slice.actions.X` from a listener can't hit the TDZ.
 */
export const listenerMiddleware = createListenerMiddleware();
