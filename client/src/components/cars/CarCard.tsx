import type { Car } from '@/types/car';
import { formatPrice, formatNumber, cn } from '@/utils/format';
import { Chip } from '@/components/ui/Chip';

interface CarCardProps {
  car: Car;
  selected?: boolean;
  onClick: (carId: string) => void;
}

export function CarCard({ car, selected, onClick }: CarCardProps) {
  return (
    <button
      type="button"
      onClick={() => onClick(car.carId)}
      className={cn(
        'card group flex h-full flex-col overflow-hidden text-left transition-all hover:-translate-y-0.5 hover:shadow-md',
        selected && 'ring-2 ring-brand-500 shadow-lg -translate-y-0.5',
      )}
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
        <img
          src={car.imageUrl}
          alt={`${car.year} ${car.make} ${car.model}`}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          onError={(e) => {
            // graceful fallback if the Unsplash URL ever 404s
            (e.target as HTMLImageElement).src =
              'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 16 10%22%3E%3Crect fill=%22%23e2e8f0%22 width=%2216%22 height=%2210%22/%3E%3Ctext x=%228%22 y=%225.5%22 text-anchor=%22middle%22 font-family=%22sans-serif%22 font-size=%221%22 fill=%22%2394a3b8%22%3ENo image%3C/text%3E%3C/svg%3E';
          }}
        />
        <div className="absolute left-3 top-3 flex gap-1">
          <Chip variant={car.fuelType === 'Electric' ? 'success' : 'brand'}>
            {car.fuelType}
          </Chip>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-semibold leading-tight text-slate-900">
            {car.year} {car.make} {car.model}
          </h3>
          <span className="shrink-0 text-base font-bold text-brand-700">
            {formatPrice(car.price)}
          </span>
        </div>

        <div className="mt-1 text-xs text-slate-500">
          {car.bodyType} · {car.transmission}
        </div>

        <dl className="mt-3 grid grid-cols-3 gap-2 text-[11px] text-slate-600">
          <div>
            <dt className="text-slate-400">Power</dt>
            <dd className="font-medium text-slate-700">{car.horsepower} hp</dd>
          </div>
          <div>
            <dt className="text-slate-400">
              {car.fuelType === 'Electric' ? 'Range' : 'Mileage'}
            </dt>
            <dd className="font-medium text-slate-700">
              {car.fuelType === 'Electric' && car.rangeKm
                ? `${formatNumber(car.rangeKm)} km`
                : `${car.mileage} km/l`}
            </dd>
          </div>
          <div>
            <dt className="text-slate-400">Seats</dt>
            <dd className="font-medium text-slate-700">{car.seats}</dd>
          </div>
        </dl>
      </div>
    </button>
  );
}
