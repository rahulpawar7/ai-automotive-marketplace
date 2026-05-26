import { useId } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  filtersCleared,
  filtersPatched,
  sortChanged,
} from '@/features/marketplace/marketplaceSlice';
import type { BodyType, FuelType, SortField } from '@/types/car';
import { Button } from '@/components/ui/Button';

const sortLabels: Record<SortField, string> = {
  price_asc: 'Price: Low to High',
  price_desc: 'Price: High to Low',
  year_asc: 'Year: Oldest First',
  year_desc: 'Year: Newest First',
  mileage_desc: 'Best Mileage',
  horsepower_desc: 'Most Power',
};

export function FiltersPanel() {
  const dispatch = useAppDispatch();
  const facets = useAppSelector((s) => s.marketplace.facets);
  const filters = useAppSelector((s) => s.marketplace.filters);
  const sort = useAppSelector((s) => s.marketplace.sort);

  const patchFilters = (patch: Parameters<typeof filtersPatched>[0]) =>
    dispatch(filtersPatched(patch));
  const clearFilters = () => dispatch(filtersCleared());
  const setSort = (next: SortField) => dispatch(sortChanged(next));

  // Unique IDs so the same FiltersPanel can be mounted in two places (sidebar
  // and mobile drawer) without colliding label[for]/input[id] associations.
  const uid = useId();
  const id = (suffix: string) => `${uid}-${suffix}`;

  const toggleArrayValue = <T extends string>(
    current: T | T[] | undefined,
    value: T,
  ): T | T[] | undefined => {
    const set = new Set(
      current === undefined ? [] : Array.isArray(current) ? current : [current],
    );
    if (set.has(value)) set.delete(value);
    else set.add(value);
    const arr = Array.from(set);
    if (arr.length === 0) return undefined;
    if (arr.length === 1) return arr[0];
    return arr;
  };

  const isActive = <T extends string>(current: T | T[] | undefined, value: T): boolean => {
    if (current === undefined) return false;
    return Array.isArray(current) ? current.includes(value) : current === value;
  };

  return (
    <div className="card lg:sticky lg:top-2 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-800">Filters</h3>
        <button
          type="button"
          onClick={() => void clearFilters()}
          className="text-xs font-medium text-brand-600 hover:text-brand-700"
        >
          Clear all
        </button>
      </div>

      <div className="space-y-5">
        <div>
          <label htmlFor={id('sort')} className="label">
            Sort by
          </label>
          <select
            id={id('sort')}
            className="input"
            value={sort}
            onChange={(e) => void setSort(e.target.value as SortField)}
          >
            {(facets?.sortOptions ?? Object.keys(sortLabels)).map((s) => (
              <option key={s} value={s}>
                {sortLabels[s as SortField] ?? s}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor={id('search')} className="label">
            Search
          </label>
          <input
            id={id('search')}
            type="search"
            className="input"
            placeholder="Make, model, or keywords"
            value={filters.search ?? ''}
            onChange={(e) => void patchFilters({ search: e.target.value || undefined })}
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label htmlFor={id('minPrice')} className="label">
              Min Price
            </label>
            <input
              id={id('minPrice')}
              type="number"
              className="input"
              placeholder="0"
              value={filters.minPrice ?? ''}
              onChange={(e) =>
                void patchFilters({
                  minPrice: e.target.value ? Number(e.target.value) : undefined,
                })
              }
            />
          </div>
          <div>
            <label htmlFor={id('maxPrice')} className="label">
              Max Price
            </label>
            <input
              id={id('maxPrice')}
              type="number"
              className="input"
              placeholder="200,000"
              value={filters.maxPrice ?? ''}
              onChange={(e) =>
                void patchFilters({
                  maxPrice: e.target.value ? Number(e.target.value) : undefined,
                })
              }
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label htmlFor={id('minYear')} className="label">
              Min Year
            </label>
            <input
              id={id('minYear')}
              type="number"
              className="input"
              placeholder="2018"
              value={filters.minYear ?? ''}
              onChange={(e) =>
                void patchFilters({
                  minYear: e.target.value ? Number(e.target.value) : undefined,
                })
              }
            />
          </div>
          <div>
            <label htmlFor={id('maxYear')} className="label">
              Max Year
            </label>
            <input
              id={id('maxYear')}
              type="number"
              className="input"
              placeholder="2024"
              value={filters.maxYear ?? ''}
              onChange={(e) =>
                void patchFilters({
                  maxYear: e.target.value ? Number(e.target.value) : undefined,
                })
              }
            />
          </div>
        </div>

        <fieldset>
          <legend className="label">Body Type</legend>
          <div className="flex flex-wrap gap-1.5">
            {(facets?.bodyTypes ?? []).map((bt) => (
              <button
                key={bt}
                type="button"
                aria-pressed={isActive(filters.bodyType, bt)}
                onClick={() =>
                  void patchFilters({
                    bodyType: toggleArrayValue<BodyType>(filters.bodyType, bt) as
                      | BodyType
                      | BodyType[]
                      | undefined,
                  })
                }
                className={
                  'rounded-full px-3 py-1 text-xs font-medium transition-colors ' +
                  (isActive(filters.bodyType, bt)
                    ? 'bg-brand-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200')
                }
              >
                {bt}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="label">Fuel Type</legend>
          <div className="flex flex-wrap gap-1.5">
            {(facets?.fuelTypes ?? []).map((ft) => (
              <button
                key={ft}
                type="button"
                aria-pressed={isActive(filters.fuelType, ft)}
                onClick={() =>
                  void patchFilters({
                    fuelType: toggleArrayValue<FuelType>(filters.fuelType, ft) as
                      | FuelType
                      | FuelType[]
                      | undefined,
                  })
                }
                className={
                  'rounded-full px-3 py-1 text-xs font-medium transition-colors ' +
                  (isActive(filters.fuelType, ft)
                    ? 'bg-brand-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200')
                }
              >
                {ft}
              </button>
            ))}
          </div>
        </fieldset>

        <Button variant="secondary" className="w-full" onClick={() => void clearFilters()}>
          Reset filters
        </Button>
      </div>
    </div>
  );
}
