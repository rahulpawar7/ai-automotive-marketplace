# AutoMarket — AI-Powered Automotive Marketplace

A full-stack MERN + TypeScript marketplace where shoppers browse cars in a grid (≈75% of the screen) and chat with a tool-using AI agent (≈25% of the screen). The agent can:

1. **Mutate the UI** — apply filters, select a car, change sort order — by calling an `update_ui` tool that writes to the same Redux store the user controls.
2. **Answer questions via RAG** — `search_catalog` runs cosine-similarity retrieval over an in-memory vector index built from car descriptions + specs.
3. **Stream tokens** back to the chat panel over Server-Sent Events.

> Built for the *Full-Stack + GenAI Engineer* take-home assignment. The UI is the single source of truth; the agent is just another writer to that store.

---

## Stack

| Layer        | Choice                                                  |
| ------------ | ------------------------------------------------------- |
| Frontend     | React 18 · Vite · TypeScript · TailwindCSS · Redux Toolkit + React-Redux |
| Backend      | Node 18 · Express · TypeScript · Mongoose · Helmet      |
| Database     | MongoDB                                                 |
| AI           | OpenAI Chat Completions + Embeddings (`gpt-4o-mini` / `text-embedding-3-small`) |
| Vector store | In-memory cosine-similarity index, persisted to disk    |
| Auth         | JWT + bcrypt (optional — guest browsing works fine)     |
| Streaming    | Server-Sent Events over `POST /api/chat`                |

Workspaces (`npm workspaces`):

```
FullStack-GenAi/
├── server/   # Express + agent + RAG + ingestion
├── client/   # React + Tailwind + Redux Toolkit
└── package.json   (root: orchestration only)
```

---

## Quick start

### 1. Prerequisites

- Node.js ≥ 18
- MongoDB running locally on `mongodb://localhost:27017` (or set `MONGODB_URI`)
- An OpenAI API key (optional — without it the agent runs in a deterministic pattern-matched fallback mode so reviewers can still exercise the UI)

### 2. Install

```bash
npm install
```

This installs both workspaces.

### 3. Configure environment

```bash
cp server/.env.example server/.env
# Edit server/.env:
#   - MONGODB_URI (default works if Mongo is on localhost)
#   - OPENAI_API_KEY (optional; recommended)
#   - JWT_SECRET (change for anything beyond local dev)
```

### 4. Ingest the dataset

This is a one-shot script — it does NOT need to run on every server start.

```bash
npm run ingest
```

It will:
1. Read `server/data/cars.json` (52 hand-curated cars across body types & fuel types).
2. Upsert into MongoDB.
3. Generate embeddings for `description + specs`.
4. Persist a vector index to `server/data/vector-index.json` for fast cold starts.

### 5. Run dev servers

```bash
npm run dev
```

Spawns both:
- API on `http://localhost:4000`
- Web on `http://localhost:5173` (proxies `/api` to the backend)

Or run individually:

```bash
npm run dev:server
npm run dev:client
```

---

## Demo flows (the three from the brief)

1. **Filter via chat**
   `"Show me electric SUVs under $50,000."`
   → Agent calls `filter_cars` then `update_ui` → grid updates → assistant confirms in plain English.

2. **Knowledge question (RAG)**
   `"Among the cars currently visible, which has the best range and why?"`
   → Agent passes the visible car IDs as `candidate_car_ids` to `search_catalog` → grounds its answer on the retrieved snippets, never on pretraining.

3. **Cross-layer interaction**
   `"Open the cheapest one and tell me its main pros and cons."`
   → Agent uses prior tool results to find the cheapest car ID → calls `update_ui({selected_car_id: …})` to open the detail drawer → calls `get_car_details` to ground pros/cons → streams the final answer.

---

## Agent tools

Each tool has a JSON-schema (sent to the model) **and** a Zod schema (runtime-validated server-side, so we don't trust the LLM's arguments).

| Tool                       | Type   | Purpose                                                                  |
| -------------------------- | ------ | ------------------------------------------------------------------------ |
| `search_catalog`           | read   | Semantic RAG over the vector index. Optional `candidate_car_ids` scope.  |
| `filter_cars`              | read   | Apply structured filter (price, year, body, fuel). Returns matching IDs. |
| `update_ui`                | write  | Mutate UI state (filters / selected car / sort). The agent→UI bridge.    |
| `get_car_details`          | read   | Full record for one car. Designed so a live API can swap in here.        |
| `mock_get_live_pricing`    | read   | Stubbed live-pricing tool with deterministic mock spread (±4%). TODO: real provider. |

Read/write split is enforced at the tool definition (`isWriteTool` flag) and observable in the UI — write tools show a different badge color in the tool-call trace.

---

## API surface

| Method | Path                  | Description                                   |
| ------ | --------------------- | --------------------------------------------- |
| GET    | `/api/health`         | Liveness + vector index status                |
| GET    | `/api/cars`           | List cars (supports all filter query params)  |
| GET    | `/api/cars/facets`    | Enumerations for filter UI                    |
| GET    | `/api/cars/:carId`    | Single car detail                             |
| POST   | `/api/chat`           | SSE stream of agent events                    |
| POST   | `/api/auth/register`  | Create account                                |
| POST   | `/api/auth/login`     | Sign in                                       |
| GET    | `/api/auth/me`        | Current user (requires bearer token)          |

Validation is centralised in `middleware/validate.ts` against Zod schemas; errors are translated by `middleware/errorHandler.ts`.

---

## Project layout

```
server/
  src/
    config/         env, db
    models/         User, Car (Mongoose)
    middleware/     auth (JWT), validate (Zod), errorHandler
    controllers/    car, chat (SSE), auth
    services/       carService (Mongo query builder), openaiClient
    routes/         carRoutes, chatRoutes, authRoutes
    rag/            embeddings, vectorStore (in-memory cosine)
    agent/          schemas (Zod), tools, prompts, agent (loop)
    scripts/        ingest.ts
    utils/          logger, AppError, asyncHandler
  data/
    cars.json       curated dataset (52 cars)
    vector-index.json   (generated by ingest)

client/
  src/
    api/            axios client, cars, auth, chat (SSE consumer), authAdapter (store seam)
    store/          index (configureStore), hooks (typed), listenerMiddleware
    features/
      marketplace/  marketplaceSlice (state + thunks + listener)
      chat/         chatSlice (state + SSE streaming thunk)
      auth/         authSlice (state + login/register/hydrate thunks)
    components/
      ui/           Button, Chip, Drawer, Spinner, EmptyState
      layout/       Header
      filters/      FiltersPanel
      cars/         CarCard, CarGrid, CarDetailDrawer, ActiveFilters
      chat/         ChatPanel, ChatMessage, ChatComposer, ToolCallBadge
    pages/          MarketplacePage, LoginPage, RegisterPage
    types/          car, chat, auth
    utils/          format
    styles/         index.css (Tailwind + design tokens)
```