/**
 * Marketplace slice — single source of truth for what the user sees.
 *
 * Read/write paths:
 *   - User actions (chips, dropdown, search box) dispatch `filtersPatched` /
 *     `filtersCleared` / `sortChanged`. The listener middleware reacts by
 *     calling `loadCars`.
 *   - Agent tool calls (`update_ui`) dispatch `applyAgentUpdate`, which merges
 *     filters/sort/selection in one shot. Same listener fires `loadCars`.
 *
 * The reducer itself is intentionally pure — no thunks dispatched from within.
 * That keeps state transitions trivially testable and lets the listener
 * middleware own the "filters changed ⇒ refetch" causality.
 */
import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { fetchCars, fetchFacets } from '../../api/cars';
import type { Car, CarFilters, Facets, SortField } from '../../types/car';

interface MarketplaceState {
  cars: Car[];
  isLoading: boolean;
  loadError: string | null;
  filters: CarFilters;
  sort: SortField;
  selectedCarId: string | null;
  facets: Facets | null;
}

const initialState: MarketplaceState = {
  cars: [],
  isLoading: false,
  loadError: null,
  filters: {},
  sort: 'price_asc',
  selectedCarId: null,
  facets: null,
};

/* -------------------------- thunks -------------------------- */

export const loadCars = createAsyncThunk<Car[], void, { state: { marketplace: MarketplaceState } }>(
  'marketplace/loadCars',
  async (_, { getState }) => {
    const { filters, sort } = getState().marketplace;
    return fetchCars(filters, sort);
  },
);

export const loadFacets = createAsyncThunk<Facets>('marketplace/loadFacets', async () =>
  fetchFacets(),
);

/**
 * Applies an agent-driven UI update in one atomic dispatch and reloads the
 * grid. Used by the chat slice when an SSE `ui_update` event arrives.
 */
export const applyAgentUpdate = createAsyncThunk<
  void,
  {
    filters?: CarFilters;
    selectedCarId?: string | null;
    sort?: SortField;
  },
  { state: { marketplace: MarketplaceState } }
>('marketplace/applyAgentUpdate', async (payload, { dispatch, getState }) => {
  let didTouchFilters = false;
  let didTouchSort = false;

  if (payload.filters !== undefined) {
    const isReset = Object.keys(payload.filters).length === 0;
    const next = isReset ? {} : { ...getState().marketplace.filters, ...payload.filters };
    // Use the silent "agentMerged" action so we only trigger ONE refetch even
    // if the agent sends filters + sort + selection together.
    dispatch(_agentFiltersMerged(next));
    didTouchFilters = true;
  }
  if (payload.sort !== undefined) {
    dispatch(_agentSortSet(payload.sort));
    didTouchSort = true;
  }
  if (payload.selectedCarId !== undefined) {
    dispatch(carSelected(payload.selectedCarId));
  }
  if (didTouchFilters || didTouchSort) {
    await dispatch(loadCars()).unwrap();
  }
});

/* -------------------------- slice -------------------------- */

const slice = createSlice({
  name: 'marketplace',
  initialState,
  reducers: {
    /** Replace the entire filters object. Listener triggers a reload. */
    filtersReplaced(state, action: PayloadAction<CarFilters>) {
      state.filters = action.payload;
    },
    /** Merge a partial patch into the filters. Listener triggers a reload. */
    filtersPatched(state, action: PayloadAction<Partial<CarFilters>>) {
      state.filters = { ...state.filters, ...action.payload };
    },
    /** Clear all filters. Listener triggers a reload. */
    filtersCleared(state) {
      state.filters = {};
    },
    sortChanged(state, action: PayloadAction<SortField>) {
      state.sort = action.payload;
    },
    carSelected(state, action: PayloadAction<string | null>) {
      state.selectedCarId = action.payload;
    },
    /**
     * Internal: agent-driven merges. Same shape as a user filter change but
     * NOT matched by the listener — `applyAgentUpdate` owns the single
     * refetch after batching all changes together.
     */
    _agentFiltersMerged(state, action: PayloadAction<CarFilters>) {
      state.filters = action.payload;
    },
    _agentSortSet(state, action: PayloadAction<SortField>) {
      state.sort = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadCars.pending, (state) => {
        state.isLoading = true;
        state.loadError = null;
      })
      .addCase(loadCars.fulfilled, (state, action) => {
        state.isLoading = false;
        state.cars = action.payload;
      })
      .addCase(loadCars.rejected, (state, action) => {
        state.isLoading = false;
        state.loadError = action.error.message ?? 'Failed to load cars';
      })
      .addCase(loadFacets.fulfilled, (state, action) => {
        state.facets = action.payload;
      });
  },
});

export const {
  filtersReplaced,
  filtersPatched,
  filtersCleared,
  sortChanged,
  carSelected,
  _agentFiltersMerged,
  _agentSortSet,
} = slice.actions;

export default slice.reducer;
