/**
 * Minimal seam between the api layer and the auth slice.
 *
 * The store calls `configureAuthAdapter` once, right after `configureStore`
 * returns. Until then both functions are safe no-ops. This pattern lets
 * `api/axios.ts` and `api/chat.ts` read the current token (and report 401s)
 * without ever importing the Redux store — which would cause a module cycle
 * (api → store → slice → api).
 */

type AuthAdapter = {
  getToken: () => string | null;
  onUnauthorized: () => void;
};

let adapter: AuthAdapter = {
  getToken: () => null,
  onUnauthorized: () => undefined,
};

export function configureAuthAdapter(next: AuthAdapter): void {
  adapter = next;
}

export function getAuthToken(): string | null {
  return adapter.getToken();
}

export function notifyUnauthorized(): void {
  adapter.onUnauthorized();
}
