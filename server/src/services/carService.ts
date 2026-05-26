import { Car } from '../models/Car';
import type { CarFilters, SortField } from '../types/car';

/** Builds a Mongo query object from the structured filter input. */
export function buildCarQuery(filters: CarFilters): Record<string, unknown> {
  const query: Record<string, unknown> = {};

  if (filters.make) query.make = new RegExp(`^${escape(filters.make)}$`, 'i');
  if (filters.model) query.model = new RegExp(escape(filters.model), 'i');

  if (filters.bodyType) {
    query.bodyType = Array.isArray(filters.bodyType)
      ? { $in: filters.bodyType }
      : filters.bodyType;
  }
  if (filters.fuelType) {
    query.fuelType = Array.isArray(filters.fuelType)
      ? { $in: filters.fuelType }
      : filters.fuelType;
  }

  if (filters.minPrice != null || filters.maxPrice != null) {
    const range: Record<string, number> = {};
    if (filters.minPrice != null) range.$gte = filters.minPrice;
    if (filters.maxPrice != null) range.$lte = filters.maxPrice;
    query.price = range;
  }
  if (filters.minYear != null || filters.maxYear != null) {
    const range: Record<string, number> = {};
    if (filters.minYear != null) range.$gte = filters.minYear;
    if (filters.maxYear != null) range.$lte = filters.maxYear;
    query.year = range;
  }
  if (filters.search) {
    query.$or = [
      { make: new RegExp(escape(filters.search), 'i') },
      { model: new RegExp(escape(filters.search), 'i') },
      { description: new RegExp(escape(filters.search), 'i') },
    ];
  }
  return query;
}

export function buildSort(sort?: SortField): Record<string, 1 | -1> {
  switch (sort) {
    case 'price_asc':
      return { price: 1 };
    case 'price_desc':
      return { price: -1 };
    case 'year_asc':
      return { year: 1 };
    case 'year_desc':
      return { year: -1 };
    case 'mileage_desc':
      return { mileage: -1 };
    case 'horsepower_desc':
      return { horsepower: -1 };
    default:
      return { price: 1 };
  }
}

export async function listCars(filters: CarFilters, sort?: SortField) {
  const query = buildCarQuery(filters);
  return Car.find(query).sort(buildSort(sort)).lean();
}

export async function getCarById(carId: string) {
  return Car.findOne({ carId }).lean();
}

export async function getCarsByIds(carIds: string[]) {
  return Car.find({ carId: { $in: carIds } }).lean();
}

function escape(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
