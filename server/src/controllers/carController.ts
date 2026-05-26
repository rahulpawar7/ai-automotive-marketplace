import type { Request, Response } from 'express';
import { z } from 'zod';
import { AppError } from '../utils/AppError';
import { getCarById, listCars } from '../services/carService';
import type { CarFilters, SortField } from '../types/car';

const BodyTypeEnum = z.enum([
  'Sedan',
  'SUV',
  'Hatchback',
  'Coupe',
  'Convertible',
  'Truck',
  'Wagon',
  'Van',
]);
const FuelTypeEnum = z.enum(['Petrol', 'Diesel', 'Hybrid', 'Electric', 'Plug-in Hybrid']);
const SortEnum = z.enum([
  'price_asc',
  'price_desc',
  'year_asc',
  'year_desc',
  'mileage_desc',
  'horsepower_desc',
]);

// Coerce query params (strings) into typed filters.
const csv = (v: unknown) => (typeof v === 'string' ? v.split(',').filter(Boolean) : v);

export const ListCarsQuery = z.object({
  make: z.string().optional(),
  model: z.string().optional(),
  bodyType: z.preprocess(csv, z.array(BodyTypeEnum)).optional(),
  fuelType: z.preprocess(csv, z.array(FuelTypeEnum)).optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  minYear: z.coerce.number().int().optional(),
  maxYear: z.coerce.number().int().optional(),
  search: z.string().optional(),
  sort: SortEnum.optional(),
});

export async function listCarsHandler(req: Request, res: Response) {
  const q = req.query as z.infer<typeof ListCarsQuery>;
  const filters: CarFilters = {
    make: q.make,
    model: q.model,
    bodyType: q.bodyType,
    fuelType: q.fuelType,
    minPrice: q.minPrice,
    maxPrice: q.maxPrice,
    minYear: q.minYear,
    maxYear: q.maxYear,
    search: q.search,
  };
  const cars = await listCars(filters, q.sort as SortField | undefined);
  res.json({ count: cars.length, cars });
}

export async function getCarHandler(req: Request, res: Response) {
  const carId = String(req.params.carId);
  const car = await getCarById(carId);
  if (!car) throw AppError.notFound(`Car '${carId}' not found`);
  res.json({ car });
}

export async function getFacetsHandler(_req: Request, res: Response) {
  res.json({
    bodyTypes: BodyTypeEnum.options,
    fuelTypes: FuelTypeEnum.options,
    sortOptions: SortEnum.options,
  });
}
