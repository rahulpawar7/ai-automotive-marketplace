/**
 * Auth slice — token, user, login/register/hydrate flows.
 *
 * Persistence: we mirror just `{token, user}` to localStorage via the
 * `persistAuth` helper. The store calls it via a subscriber so the slice
 * itself stays pure and easy to test.
 */
import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { fetchMe, loginRequest, registerRequest } from '../../api/auth';
import type { AuthUser } from '../../types/auth';

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  token: null,
  user: null,
  isLoading: false,
  error: null,
};

const STORAGE_KEY = 'automarket-auth';

/* -------------------------- persistence -------------------------- */

export function loadPersistedAuth(): AuthState {
  if (typeof window === 'undefined') return initialState;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return initialState;
    const parsed = JSON.parse(raw) as { token?: string; user?: AuthUser };
    return {
      ...initialState,
      token: parsed.token ?? null,
      user: parsed.user ?? null,
    };
  } catch {
    return initialState;
  }
}

export function persistAuth(state: AuthState): void {
  if (typeof window === 'undefined') return;
  try {
    if (!state.token) {
      window.localStorage.removeItem(STORAGE_KEY);
      return;
    }
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ token: state.token, user: state.user }),
    );
  } catch {
    /* localStorage may be full / blocked — failing here is non-critical */
  }
}

/* -------------------------- thunks -------------------------- */

function extractError(err: unknown, fallback: string): string {
  const anyErr = err as { response?: { data?: { error?: string } }; message?: string };
  return anyErr?.response?.data?.error ?? anyErr?.message ?? fallback;
}

export const login = createAsyncThunk<
  { token: string; user: AuthUser },
  { email: string; password: string },
  { rejectValue: string }
>('auth/login', async ({ email, password }, { rejectWithValue }) => {
  try {
    return await loginRequest(email, password);
  } catch (err) {
    return rejectWithValue(extractError(err, 'Login failed'));
  }
});

export const register = createAsyncThunk<
  { token: string; user: AuthUser },
  { name: string; email: string; password: string },
  { rejectValue: string }
>('auth/register', async ({ name, email, password }, { rejectWithValue }) => {
  try {
    return await registerRequest(name, email, password);
  } catch (err) {
    return rejectWithValue(extractError(err, 'Registration failed'));
  }
});

export const hydrate = createAsyncThunk<AuthUser | null, void, { state: { auth: AuthState } }>(
  'auth/hydrate',
  async (_, { getState }) => {
    if (!getState().auth.token) return null;
    return fetchMe();
  },
);

/* -------------------------- slice -------------------------- */

const slice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loggedOut(state) {
      state.token = null;
      state.user = null;
      state.error = null;
    },
    errorCleared(state) {
      state.error = null;
    },
    _tokenInvalidated(state) {
      // Soft logout when an API call gets 401. Keeps the UI navigable.
      state.token = null;
      state.user = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (s) => {
        s.isLoading = true;
        s.error = null;
      })
      .addCase(login.fulfilled, (s, a: PayloadAction<{ token: string; user: AuthUser }>) => {
        s.isLoading = false;
        s.token = a.payload.token;
        s.user = a.payload.user;
      })
      .addCase(login.rejected, (s, a) => {
        s.isLoading = false;
        s.error = a.payload ?? 'Login failed';
      })
      .addCase(register.pending, (s) => {
        s.isLoading = true;
        s.error = null;
      })
      .addCase(register.fulfilled, (s, a: PayloadAction<{ token: string; user: AuthUser }>) => {
        s.isLoading = false;
        s.token = a.payload.token;
        s.user = a.payload.user;
      })
      .addCase(register.rejected, (s, a) => {
        s.isLoading = false;
        s.error = a.payload ?? 'Registration failed';
      })
      .addCase(hydrate.fulfilled, (s, a) => {
        s.user = a.payload;
      })
      .addCase(hydrate.rejected, (s) => {
        s.token = null;
        s.user = null;
      });
  },
});

export const { loggedOut, errorCleared, _tokenInvalidated } = slice.actions;
export default slice.reducer;
