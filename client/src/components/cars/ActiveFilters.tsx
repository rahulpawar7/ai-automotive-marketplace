import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { filtersPatched } from '@/features/marketplace/marketplaceSlice';
import { Chip } from '@/components/ui/Chip';
import { formatPrice } from '@/utils/format';
import type { CarFilters } from '@/types/car';

type FilterChip = { key: string; label: string; remove: () => void };

export function ActiveFilters() {
  const dispatch = useAppDispatch();
  const filters = useAppSelector((s) => s.marketplace.filters);
  const cars = useAppSelector((s) => s.marketplace.cars);

  const patchFilters = (patch: Partial<CarFilters>) => dispatch(filtersPatched(patch));

  const chips: FilterChip[] = [];

  if (filters.search) {
    chips.push({
      key: 'search',
      label: `Search: "${filters.search}"`,
      remove: () => void patchFilters({ search: undefined }),
    });
  }
  if (filters.minPrice != null) {
    chips.push({
      key: 'minPrice',
      label: `Min ${formatPrice(filters.minPrice)}`,
      remove: () => void patchFilters({ minPrice: undefined }),
    });
  }
  if (filters.maxPrice != null) {
    chips.push({
      key: 'maxPrice',
      label: `Max ${formatPrice(filters.maxPrice)}`,
      remove: () => void patchFilters({ maxPrice: undefined }),
    });
  }
  if (filters.minYear != null) {
    chips.push({
      key: 'minYear',
      label: `≥ ${filters.minYear}`,
      remove: () => void patchFilters({ minYear: undefined }),
    });
  }
  if (filters.maxYear != null) {
    chips.push({
      key: 'maxYear',
      label: `≤ ${filters.maxYear}`,
      remove: () => void patchFilters({ maxYear: undefined }),
    });
  }
  if (filters.bodyType) {
    const values = Array.isArray(filters.bodyType) ? filters.bodyType : [filters.bodyType];
    values.forEach((v) =>
      chips.push({
        key: `body-${v}`,
        label: v,
        remove: () => {
          const next = values.filter((x) => x !== v);
          void patchFilters({
            bodyType: next.length === 0 ? undefined : next.length === 1 ? next[0] : next,
          });
        },
      }),
    );
  }
  if (filters.fuelType) {
    const values = Array.isArray(filters.fuelType) ? filters.fuelType : [filters.fuelType];
    values.forEach((v) =>
      chips.push({
        key: `fuel-${v}`,
        label: v,
        remove: () => {
          const next = values.filter((x) => x !== v);
          void patchFilters({
            fuelType: next.length === 0 ? undefined : next.length === 1 ? next[0] : next,
          });
        },
      }),
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm text-slate-500">
        Showing <span className="font-semibold text-slate-700">{cars.length}</span>{' '}
        {cars.length === 1 ? 'car' : 'cars'}
      </span>
      {chips.length > 0 && (
        <>
          <span className="text-slate-300">·</span>
          {chips.map((c) => (
            <Chip key={c.key} variant="brand" onRemove={c.remove}>
              {c.label}
            </Chip>
          ))}
        </>
      )}
    </div>
  );
}
