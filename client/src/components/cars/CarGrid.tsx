import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  carSelected,
  filtersCleared,
  loadCars,
} from '@/features/marketplace/marketplaceSlice';
import { CarCard } from './CarCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { Spinner } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';

export function CarGrid() {
  const dispatch = useAppDispatch();
  const cars = useAppSelector((s) => s.marketplace.cars);
  const isLoading = useAppSelector((s) => s.marketplace.isLoading);
  const loadError = useAppSelector((s) => s.marketplace.loadError);
  const selectedCarId = useAppSelector((s) => s.marketplace.selectedCarId);

  if (isLoading && cars.length === 0) {
    return (
      <div className="flex items-center justify-center py-24 text-slate-500">
        <Spinner size={28} />
        <span className="ml-2 text-sm">Loading cars…</span>
      </div>
    );
  }

  if (loadError) {
    return (
      <EmptyState
        title="Failed to load cars"
        description={loadError}
        action={
          <Button variant="secondary" onClick={() => void dispatch(loadCars())}>
            Retry
          </Button>
        }
      />
    );
  }

  if (cars.length === 0) {
    return (
      <EmptyState
        title="No cars match these filters"
        description="Try widening your price range or clearing filters."
        action={
          <Button variant="secondary" onClick={() => dispatch(filtersCleared())}>
            Reset filters
          </Button>
        }
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      {cars.map((car) => (
        <CarCard
          key={car.carId}
          car={car}
          selected={selectedCarId === car.carId}
          onClick={(id) => dispatch(carSelected(id))}
        />
      ))}
    </div>
  );
}
