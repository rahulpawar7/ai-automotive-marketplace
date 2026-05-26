/**
 * Agent tools.
 *
 * Each tool:
 *   • declares a JSON schema (for the LLM)
 *   • declares a Zod schema (for runtime validation)
 *   • has a single, focused `execute()` implementation
 *
 * Tools are split into two categories:
 *   • READ tools (search_catalog, filter_cars, get_car_details, mock_get_live_pricing)
 *   • WRITE tools (update_ui) — these mutate UI state on the client.
 *
 * Because tools execute server-side, the "UI mutation" is communicated back
 * by emitting a typed event over the SSE channel; the client applies it to
 * the Zustand store. The tool's return value is what the LLM sees next.
 */
import type { ZodSchema } from 'zod';
import {
  FilterCarsInput,
  GetCarDetailsInput,
  MockLivePricingInput,
  SearchCatalogInput,
  UpdateUIInput,
} from './schemas';
import { embedText } from '../rag/embeddings';
import { vectorStore } from '../rag/vectorStore';
import { getCarById, listCars } from '../services/carService';
import type { CarFilters, SortField } from '../types/car';

export interface AgentToolEvent {
  type: 'ui_update';
  payload: {
    filters?: CarFilters;
    selectedCarId?: string | null;
    sort?: SortField;
  };
}

export interface ToolContext {
  /** Sink for client-bound UI events. Populated by the chat handler. */
  emit: (event: AgentToolEvent) => void;
}

export interface ToolDefinition<TInput = unknown, TOutput = unknown> {
  name: string;
  description: string;
  /** JSON schema in the shape the OpenAI tools API expects. */
  parameters: Record<string, unknown>;
  /** Runtime validator — keeps us honest if the model invents arguments. */
  schema: ZodSchema<TInput>;
  /** Whether this tool mutates client UI state. Used purely for logging. */
  isWriteTool?: boolean;
  execute: (args: TInput, ctx: ToolContext) => Promise<TOutput>;
}

/* ------------------------ search_catalog (RAG) ------------------------ */
export const searchCatalogTool: ToolDefinition = {
  name: 'search_catalog',
  description:
    'Semantic search over the car catalog (RAG). Use for fuzzy or natural-language ' +
    'questions about cars in the marketplace, e.g. "fuel-efficient family SUVs". ' +
    'Returns car IDs with short snippets describing each match.',
  parameters: {
    type: 'object',
    properties: {
      query: { type: 'string', description: 'Natural-language search query.' },
      top_k: {
        type: 'integer',
        minimum: 1,
        maximum: 20,
        default: 5,
        description: 'How many results to return.',
      },
      candidate_car_ids: {
        type: 'array',
        items: { type: 'string' },
        description:
          'Optional: restrict the search to these car IDs (e.g. the cars currently visible).',
      },
    },
    required: ['query'],
    additionalProperties: false,
  },
  schema: SearchCatalogInput,
  async execute(args) {
    const input = args as { query: string; top_k?: number; candidate_car_ids?: string[] };
    const queryEmbedding = await embedText(input.query);
    const hits = vectorStore.search(queryEmbedding, input.top_k ?? 5, input.candidate_car_ids);
    return {
      query: input.query,
      results: hits.map((h) => ({
        car_id: h.carId,
        score: Number(h.score.toFixed(4)),
        ...h.meta,
      })),
    };
  },
};

/* ------------------------ filter_cars ------------------------ */
export const filterCarsTool: ToolDefinition = {
  name: 'filter_cars',
  description:
    'Apply a STRUCTURED filter to the catalog. Use when the user gives concrete constraints ' +
    '(price range, body type, fuel type, year). Returns car IDs that match the filter. ' +
    'This does NOT change what the user sees — call update_ui to actually apply the filter.',
  parameters: {
    type: 'object',
    properties: {
      filters: {
        type: 'object',
        properties: {
          make: { type: 'string' },
          model: { type: 'string' },
          bodyType: {
            anyOf: [
              {
                type: 'string',
                enum: ['Sedan', 'SUV', 'Hatchback', 'Coupe', 'Convertible', 'Truck', 'Wagon', 'Van'],
              },
              {
                type: 'array',
                items: {
                  type: 'string',
                  enum: ['Sedan', 'SUV', 'Hatchback', 'Coupe', 'Convertible', 'Truck', 'Wagon', 'Van'],
                },
              },
            ],
          },
          fuelType: {
            anyOf: [
              {
                type: 'string',
                enum: ['Petrol', 'Diesel', 'Hybrid', 'Electric', 'Plug-in Hybrid'],
              },
              {
                type: 'array',
                items: {
                  type: 'string',
                  enum: ['Petrol', 'Diesel', 'Hybrid', 'Electric', 'Plug-in Hybrid'],
                },
              },
            ],
          },
          minPrice: { type: 'number', minimum: 0 },
          maxPrice: { type: 'number', minimum: 0 },
          minYear: { type: 'integer' },
          maxYear: { type: 'integer' },
        },
        additionalProperties: false,
      },
    },
    required: ['filters'],
    additionalProperties: false,
  },
  schema: FilterCarsInput,
  async execute(args) {
    const input = args as { filters: CarFilters };
    const cars = await listCars(input.filters);
    return {
      count: cars.length,
      cars: cars.map((c) => ({
        car_id: c.carId,
        make: c.make,
        model: c.model,
        year: c.year,
        price: c.price,
        bodyType: c.bodyType,
        fuelType: c.fuelType,
      })),
    };
  },
};

/* ------------------------ update_ui (WRITE) ------------------------ */
export const updateUiTool: ToolDefinition = {
  name: 'update_ui',
  description:
    'Update the marketplace UI: apply filters, select a specific car for the detail panel, ' +
    'or change sort order. THIS IS THE BRIDGE FROM THE AGENT TO THE UI. Call it after ' +
    'filter_cars/search_catalog when the user wants to actually see the change.',
  parameters: {
    type: 'object',
    properties: {
      filters: {
        type: 'object',
        properties: {
          make: { type: 'string' },
          model: { type: 'string' },
          bodyType: { type: 'string' },
          fuelType: { type: 'string' },
          minPrice: { type: 'number' },
          maxPrice: { type: 'number' },
          minYear: { type: 'integer' },
          maxYear: { type: 'integer' },
        },
      },
      selected_car_id: {
        type: ['string', 'null'],
        description: 'Car ID to open in the detail panel. Pass null to deselect.',
      },
      sort: {
        type: 'string',
        enum: [
          'price_asc',
          'price_desc',
          'year_asc',
          'year_desc',
          'mileage_desc',
          'horsepower_desc',
        ],
      },
    },
    additionalProperties: false,
  },
  schema: UpdateUIInput,
  isWriteTool: true,
  async execute(args, ctx) {
    const input = args as {
      filters?: CarFilters;
      selected_car_id?: string | null;
      sort?: SortField;
    };

    ctx.emit({
      type: 'ui_update',
      payload: {
        filters: input.filters,
        selectedCarId: input.selected_car_id ?? undefined,
        sort: input.sort,
      },
    });

    return {
      applied: true,
      ...(input.filters ? { filters: input.filters } : {}),
      ...(input.selected_car_id !== undefined ? { selected_car_id: input.selected_car_id } : {}),
      ...(input.sort ? { sort: input.sort } : {}),
    };
  },
};

/* ------------------------ get_car_details ------------------------ */
export const getCarDetailsTool: ToolDefinition = {
  name: 'get_car_details',
  description:
    'Fetch the full record for a single car by ID. Use this when answering questions about ' +
    'a specific car (pros/cons, full spec sheet). Designed so a live pricing/spec API ' +
    'could be plugged in here.',
  parameters: {
    type: 'object',
    properties: {
      car_id: { type: 'string' },
    },
    required: ['car_id'],
    additionalProperties: false,
  },
  schema: GetCarDetailsInput,
  async execute(args) {
    const input = args as { car_id: string };
    const car = await getCarById(input.car_id);
    if (!car) return { error: 'Car not found', car_id: input.car_id };
    return { car };
  },
};

/* ------------------------ mock_get_live_pricing (stub) ------------------------ */
// TODO: Replace with real pricing provider (e.g. Edmunds API, CarGurus market value).
// The signature is kept stable so the agent doesn't have to change when we switch.
export const mockLivePricingTool: ToolDefinition = {
  name: 'mock_get_live_pricing',
  description:
    'Returns mock "live" market pricing for a car. Demonstrates where a real ' +
    'pricing/spec API would plug in. Always responds with a small price band ' +
    'derived from the listed price plus a deterministic spread.',
  parameters: {
    type: 'object',
    properties: {
      car_id: { type: 'string' },
      zip_code: { type: 'string', description: 'US/ZIP for regional pricing variation (mock).' },
    },
    required: ['car_id'],
    additionalProperties: false,
  },
  schema: MockLivePricingInput,
  async execute(args) {
    const input = args as { car_id: string; zip_code?: string };
    const car = await getCarById(input.car_id);
    if (!car) return { error: 'Car not found', car_id: input.car_id };

    // Deterministic mock spread of ±4% around list price.
    const base = car.price;
    const low = Math.round(base * 0.96);
    const high = Math.round(base * 1.04);
    return {
      car_id: input.car_id,
      currency: 'USD',
      list_price: base,
      market_low: low,
      market_high: high,
      zip_code: input.zip_code ?? null,
      provider: 'mock',
      disclaimer: 'Mocked live pricing for demo purposes only.',
    };
  },
};

export const allTools: ToolDefinition[] = [
  searchCatalogTool,
  filterCarsTool,
  updateUiTool,
  getCarDetailsTool,
  mockLivePricingTool,
];

export const toolsByName: Record<string, ToolDefinition> = Object.fromEntries(
  allTools.map((t) => [t.name, t]),
);
