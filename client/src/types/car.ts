export type BodyType =
  | 'Sedan'
  | 'SUV'
  | 'Hatchback'
  | 'Coupe'
  | 'Convertible'
  | 'Truck'
  | 'Wagon'
  | 'Van';

export type FuelType = 'Petrol' | 'Diesel' | 'Hybrid' | 'Electric' | 'Plug-in Hybrid';

export type Transmission = 'Automatic' | 'Manual' | 'CVT' | 'Dual-Clutch';

export type SortField =
  | 'price_asc'
  | 'price_desc'
  | 'year_asc'
  | 'year_desc'
  | 'mileage_desc'
  | 'horsepower_desc';

export interface Car {
  carId: string;
  make: string;
  model: string;
  year: number;
  price: number;
  bodyType: BodyType;
  fuelType: FuelType;
  transmission: Transmission;
  mileage: number;
  rangeKm?: number;
  horsepower: number;
  seats: number;
  color: string;
  imageUrl: string;
  description: string;
  pros: string[];
  cons: string[];
}

export interface CarFilters {
  make?: string;
  model?: string;
  bodyType?: BodyType | BodyType[];
  fuelType?: FuelType | FuelType[];
  minPrice?: number;
  maxPrice?: number;
  minYear?: number;
  maxYear?: number;
  search?: string;
}

export interface Facets {
  bodyTypes: BodyType[];
  fuelTypes: FuelType[];
  sortOptions: SortField[];
}
