import { api } from './axios';
import type { Car, CarFilters, Facets, SortField } from '@/types/car';

function buildParams(filters: CarFilters, sort?: SortField) {
  const params: Record<string, string> = {};
  if (filters.make) params.make = filters.make;
  if (filters.model) params.model = filters.model;
  if (filters.bodyType) {
    params.bodyType = Array.isArray(filters.bodyType)
      ? filters.bodyType.join(',')
      : filters.bodyType;
  }
  if (filters.fuelType) {
    params.fuelType = Array.isArray(filters.fuelType)
      ? filters.fuelType.join(',')
      : filters.fuelType;
  }
  if (filters.minPrice != null) params.minPrice = String(filters.minPrice);
  if (filters.maxPrice != null) params.maxPrice = String(filters.maxPrice);
  if (filters.minYear != null) params.minYear = String(filters.minYear);
  if (filters.maxYear != null) params.maxYear = String(filters.maxYear);
  if (filters.search) params.search = filters.search;
  if (sort) params.sort = sort;
  return params;
}

export async function fetchCars(filters: CarFilters, sort?: SortField): Promise<Car[]> {
  const { data } = await api.get<{ cars: Car[]; count: number }>('/cars', {
    params: buildParams(filters, sort),
  });
  return data.cars;
}

export async function fetchCar(carId: string): Promise<Car> {
  const { data } = await api.get<{ car: Car }>(`/cars/${carId}`);
  return data.car;
}

export async function fetchFacets(): Promise<Facets> {
  const { data } = await api.get<Facets>('/cars/facets');
  return data;
}
