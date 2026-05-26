import { z } from 'zod';

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

export const FiltersSchema = z
  .object({
    make: z.string().optional(),
    model: z.string().optional(),
    bodyType: z.union([BodyTypeEnum, z.array(BodyTypeEnum)]).optional(),
    fuelType: z.union([FuelTypeEnum, z.array(FuelTypeEnum)]).optional(),
    minPrice: z.number().nonnegative().optional(),
    maxPrice: z.number().nonnegative().optional(),
    minYear: z.number().int().optional(),
    maxYear: z.number().int().optional(),
  })
  .strict();

export type FiltersInput = z.infer<typeof FiltersSchema>;

export const SearchCatalogInput = z.object({
  query: z.string().min(1, 'query is required'),
  top_k: z.number().int().min(1).max(20).default(5),
  /** Optional: scope the search to a candidate set – e.g. "cars currently visible". */
  candidate_car_ids: z.array(z.string()).optional(),
});
export type SearchCatalogInput = z.infer<typeof SearchCatalogInput>;

export const FilterCarsInput = z.object({
  filters: FiltersSchema,
});
export type FilterCarsInput = z.infer<typeof FilterCarsInput>;

export const UpdateUIInput = z
  .object({
    filters: FiltersSchema.optional(),
    selected_car_id: z.string().nullable().optional(),
    sort: SortEnum.optional(),
  })
  .refine(
    (v) => v.filters !== undefined || v.selected_car_id !== undefined || v.sort !== undefined,
    { message: 'At least one of filters, selected_car_id, or sort must be provided' },
  );
export type UpdateUIInput = z.infer<typeof UpdateUIInput>;

export const GetCarDetailsInput = z.object({
  car_id: z.string().min(1),
});
export type GetCarDetailsInput = z.infer<typeof GetCarDetailsInput>;

export const MockLivePricingInput = z.object({
  car_id: z.string().min(1),
  zip_code: z.string().optional(),
});
export type MockLivePricingInput = z.infer<typeof MockLivePricingInput>;
