import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { carSelected } from '@/features/marketplace/marketplaceSlice';
import { Drawer } from '@/components/ui/Drawer';
import { Chip } from '@/components/ui/Chip';
import { Spinner } from '@/components/ui/Spinner';
import { fetchCar } from '@/api/cars';
import { formatPrice, formatNumber } from '@/utils/format';
import type { Car } from '@/types/car';

export function CarDetailDrawer() {
  const dispatch = useAppDispatch();
  const selectedCarId = useAppSelector((s) => s.marketplace.selectedCarId);
  const cars = useAppSelector((s) => s.marketplace.cars);
  const [car, setCar] = useState<Car | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!selectedCarId) {
      setCar(null);
      return;
    }
    const cached = cars.find((c) => c.carId === selectedCarId);
    if (cached) {
      setCar(cached);
      return;
    }
    let cancelled = false;
    setIsLoading(true);
    fetchCar(selectedCarId)
      .then((c) => {
        if (!cancelled) setCar(c);
      })
      .catch(() => {
        if (!cancelled) setCar(null);
      })
      .finally(() => !cancelled && setIsLoading(false));
    return () => {
      cancelled = true;
    };
  }, [selectedCarId, cars]);

  const open = Boolean(selectedCarId);

  return (
    <Drawer
      open={open}
      onClose={() => dispatch(carSelected(null))}
      title={car ? `${car.year} ${car.make} ${car.model}` : 'Loading…'}
    >
      {isLoading && (
        <div className="flex items-center justify-center py-16 text-slate-500">
          <Spinner size={24} />
        </div>
      )}
      {!isLoading && car && (
        <div className="p-6">
          <div className="overflow-hidden rounded-xl border border-slate-200">
            <img
              src={car.imageUrl}
              alt={`${car.year} ${car.make} ${car.model}`}
              className="h-72 w-full object-cover"
            />
          </div>

          <div className="mt-5 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <div className="text-3xl font-bold text-brand-700">{formatPrice(car.price)}</div>
            <div className="text-sm text-slate-500">{car.color}</div>
            <div className="ml-auto flex gap-2">
              <Chip variant={car.fuelType === 'Electric' ? 'success' : 'brand'}>
                {car.fuelType}
              </Chip>
              <Chip>{car.bodyType}</Chip>
            </div>
          </div>

          <p className="mt-4 text-sm leading-6 text-slate-700">{car.description}</p>

          <h3 className="mt-6 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Specifications
          </h3>
          <dl className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <SpecRow label="Horsepower" value={`${car.horsepower} hp`} />
            <SpecRow label="Transmission" value={car.transmission} />
            <SpecRow label="Seats" value={String(car.seats)} />
            <SpecRow
              label={car.fuelType === 'Electric' ? 'Range' : 'Mileage'}
              value={
                car.fuelType === 'Electric' && car.rangeKm
                  ? `${formatNumber(car.rangeKm)} km`
                  : `${car.mileage} km/l`
              }
            />
            <SpecRow label="Year" value={String(car.year)} />
            <SpecRow label="Color" value={car.color} />
          </dl>

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                Pros
              </h4>
              <ul className="mt-2 space-y-1 text-sm text-slate-700">
                {car.pros.map((p) => (
                  <li key={p} className="flex items-start gap-2">
                    <span className="mt-1.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                    {p}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wide text-amber-700">
                Cons
              </h4>
              <ul className="mt-2 space-y-1 text-sm text-slate-700">
                {car.cons.map((p) => (
                  <li key={p} className="flex items-start gap-2">
                    <span className="mt-1.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </Drawer>
  );
}

function SpecRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 px-3 py-2">
      <dt className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
        {label}
      </dt>
      <dd className="text-sm font-semibold text-slate-900">{value}</dd>
    </div>
  );
}
