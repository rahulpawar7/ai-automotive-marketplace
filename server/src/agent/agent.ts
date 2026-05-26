/**
 * Agent loop.
 *
 * Implements a tool-using assistant on top of OpenAI Chat Completions:
 *   1. Send {system, history, user} + tool definitions.
 *   2. If the model emits tool calls, execute them server-side, validate args
 *      with Zod, append the results, and loop.
 *   3. When the model finally returns plain text, stream the tokens back.
 *
 * Events flow back to the client via the `emit` callback as discriminated-union
 * JSON objects. The HTTP layer turns these into Server-Sent Events.
 *
 * Provides a deterministic fallback when no OPENAI_API_KEY is configured so
 * the demo can be exercised offline (filter / select / search still work).
 */
import { env } from '../config/env';
import { getOpenAI, hasOpenAIKey } from '../services/openaiClient';
import { logger } from '../utils/logger';
import { SYSTEM_PROMPT } from './prompts';
import { allTools, toolsByName, type AgentToolEvent } from './tools';
import type {
  ChatCompletionMessageParam,
  ChatCompletionMessageToolCall,
  ChatCompletionTool,
} from 'openai/resources/chat/completions';

export type AgentEvent =
  | { type: 'token'; delta: string }
  | { type: 'tool_call_start'; toolCallId: string; name: string; args: unknown }
  | { type: 'tool_call_result'; toolCallId: string; name: string; result: unknown }
  | { type: 'tool_call_error'; toolCallId: string; name: string; error: string }
  | { type: 'ui_update'; payload: AgentToolEvent['payload'] }
  | { type: 'done'; finalText: string }
  | { type: 'error'; message: string };

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface RunAgentOptions {
  message: string;
  /** Conversation history (excluding the current user message). */
  history?: ChatMessage[];
  /** Currently visible/filtered cars — used to scope RAG queries. */
  visibleCarIds?: string[];
  /** Sink for streaming events to the client. */
  emit: (event: AgentEvent) => void;
}

const MAX_TOOL_ITERATIONS = 6;

function buildToolDefs(): ChatCompletionTool[] {
  return allTools.map((t) => ({
    type: 'function',
    function: {
      name: t.name,
      description: t.description,
      // The OpenAI SDK types want FunctionParameters; ours is JSON-schema-shaped.
      parameters: t.parameters as ChatCompletionTool['function']['parameters'],
    },
  }));
}

export async function runAgent(opts: RunAgentOptions): Promise<void> {
  if (!hasOpenAIKey()) {
    await runFallbackAgent(opts);
    return;
  }

  const client = getOpenAI();
  const tools = buildToolDefs();

  let contextHint = '';
  if (opts.visibleCarIds && opts.visibleCarIds.length > 0) {
    contextHint =
      `\n\n[UI CONTEXT] The user currently sees ${opts.visibleCarIds.length} cars in the grid. ` +
      `Their IDs are: ${opts.visibleCarIds.join(', ')}. ` +
      `When the user says "these cars" or "the ones I can see", pass these IDs as ` +
      `candidate_car_ids to search_catalog.`;
  }

  const messages: ChatCompletionMessageParam[] = [
    { role: 'system', content: SYSTEM_PROMPT + contextHint },
    ...(opts.history ?? []).map((m) => ({ role: m.role, content: m.content }) as ChatCompletionMessageParam),
    { role: 'user', content: opts.message },
  ];

  let finalText = '';

  for (let iteration = 0; iteration < MAX_TOOL_ITERATIONS; iteration++) {
    // Step 1: ask the model what to do next. We do NOT stream during the
    // planning phase because we need the full tool_calls payload before
    // dispatching tools. The FINAL text response is streamed (Step 3).
    const planning = await client.chat.completions.create({
      model: env.openaiChatModel,
      messages,
      tools,
      tool_choice: 'auto',
      temperature: 0.3,
    });

    const choice = planning.choices[0];
    const msg = choice.message;

    if (msg.tool_calls && msg.tool_calls.length > 0) {
      // Persist the assistant message verbatim so the conversation stays valid.
      messages.push({
        role: 'assistant',
        content: msg.content ?? '',
        tool_calls: msg.tool_calls,
      });

      for (const call of msg.tool_calls) {
        await dispatchToolCall(call, messages, opts.emit);
      }
      continue;
    }

    // Step 2: no tool calls — stream the assistant's final answer.
    finalText = await streamFinalAnswer(client, messages, opts.emit);
    break;
  }

  if (!finalText) {
    // Hit the iteration cap without a textual reply. Force one final attempt.
    finalText = await streamFinalAnswer(client, messages, opts.emit);
  }

  opts.emit({ type: 'done', finalText });
}

async function dispatchToolCall(
  call: ChatCompletionMessageToolCall,
  messages: ChatCompletionMessageParam[],
  emit: (e: AgentEvent) => void,
): Promise<void> {
  const name = call.function.name;
  const tool = toolsByName[name];

  let rawArgs: unknown;
  try {
    rawArgs = JSON.parse(call.function.arguments || '{}');
  } catch (err) {
    const error = `Tool ${name} received unparseable JSON arguments.`;
    logger.warn(error, err);
    emit({ type: 'tool_call_error', toolCallId: call.id, name, error });
    messages.push({
      role: 'tool',
      tool_call_id: call.id,
      content: JSON.stringify({ error }),
    });
    return;
  }

  emit({ type: 'tool_call_start', toolCallId: call.id, name, args: rawArgs });

  if (!tool) {
    const error = `Unknown tool: ${name}`;
    emit({ type: 'tool_call_error', toolCallId: call.id, name, error });
    messages.push({
      role: 'tool',
      tool_call_id: call.id,
      content: JSON.stringify({ error }),
    });
    return;
  }

  const parsed = tool.schema.safeParse(rawArgs);
  if (!parsed.success) {
    const error = `Invalid arguments for ${name}: ${parsed.error.message}`;
    emit({ type: 'tool_call_error', toolCallId: call.id, name, error });
    messages.push({
      role: 'tool',
      tool_call_id: call.id,
      content: JSON.stringify({ error, details: parsed.error.flatten() }),
    });
    return;
  }

  try {
    const result = await tool.execute(parsed.data, {
      emit: (ev) => {
        if (ev.type === 'ui_update') emit({ type: 'ui_update', payload: ev.payload });
      },
    });
    emit({ type: 'tool_call_result', toolCallId: call.id, name, result });
    messages.push({
      role: 'tool',
      tool_call_id: call.id,
      content: JSON.stringify(result),
    });
  } catch (err) {
    const error = (err as Error)?.message ?? 'Tool execution failed';
    logger.error(`Tool ${name} threw`, err);
    emit({ type: 'tool_call_error', toolCallId: call.id, name, error });
    messages.push({
      role: 'tool',
      tool_call_id: call.id,
      content: JSON.stringify({ error }),
    });
  }
}

async function streamFinalAnswer(
  client: ReturnType<typeof getOpenAI>,
  messages: ChatCompletionMessageParam[],
  emit: (e: AgentEvent) => void,
): Promise<string> {
  const stream = await client.chat.completions.create({
    model: env.openaiChatModel,
    messages,
    temperature: 0.4,
    stream: true,
  });

  let full = '';
  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta?.content;
    if (delta) {
      full += delta;
      emit({ type: 'token', delta });
    }
  }
  return full;
}

/* ---------------------------------------------------------------------------
 * Offline fallback "agent".
 *
 * Activates when OPENAI_API_KEY is missing. Pattern-matches a handful of
 * common intents so reviewers can still exercise the UI/tool wiring without
 * burning API credits. NOT production-grade — clearly inferior to the real
 * agent, but the architecture (tool emit, SSE protocol) is identical.
 * ------------------------------------------------------------------------- */
async function runFallbackAgent(opts: RunAgentOptions): Promise<void> {
  const { message, emit } = opts;
  const msg = message.toLowerCase();

  emit({
    type: 'token',
    delta: '(Demo mode — no OPENAI_API_KEY set, using pattern-matched fallback.) ',
  });

  try {
    // Heuristic 1: filter intent
    const maxPriceMatch = msg.match(/under\s*\$?(\d[\d,]*)/);
    const minPriceMatch = msg.match(/over\s*\$?(\d[\d,]*)/);
    const wantsElectric = /\belectric|\bev\b/.test(msg);
    const wantsHybrid = /\bhybrid\b/.test(msg);
    const wantsSuv = /\bsuv|crossover\b/.test(msg);
    const wantsSedan = /\bsedan\b/.test(msg);

    if (maxPriceMatch || wantsElectric || wantsHybrid || wantsSuv || wantsSedan) {
      const filters: Record<string, unknown> = {};
      if (maxPriceMatch) filters.maxPrice = Number(maxPriceMatch[1].replace(/,/g, ''));
      if (minPriceMatch) filters.minPrice = Number(minPriceMatch[1].replace(/,/g, ''));
      if (wantsElectric) filters.fuelType = 'Electric';
      else if (wantsHybrid) filters.fuelType = 'Hybrid';
      if (wantsSuv) filters.bodyType = 'SUV';
      else if (wantsSedan) filters.bodyType = 'Sedan';

      const filterTool = toolsByName['filter_cars'];
      const uiTool = toolsByName['update_ui'];

      const filterArgs = { filters };
      emit({ type: 'tool_call_start', toolCallId: 'fb-1', name: 'filter_cars', args: filterArgs });
      const filterResult = await filterTool.execute(filterArgs, { emit: () => {} });
      emit({ type: 'tool_call_result', toolCallId: 'fb-1', name: 'filter_cars', result: filterResult });

      emit({ type: 'tool_call_start', toolCallId: 'fb-2', name: 'update_ui', args: { filters } });
      await uiTool.execute({ filters }, { emit: (ev) => emit({ type: 'ui_update', payload: ev.payload }) });
      emit({ type: 'tool_call_result', toolCallId: 'fb-2', name: 'update_ui', result: { applied: true } });

      const count = (filterResult as { count: number }).count;
      const final = `I applied the filter${
        Object.keys(filters).length ? ` (${JSON.stringify(filters)})` : ''
      }. Found ${count} matching cars.`;
      for (const w of final.split(' ')) emit({ type: 'token', delta: w + ' ' });
      emit({ type: 'done', finalText: final });
      return;
    }

    // Heuristic 2: semantic question
    const searchTool = toolsByName['search_catalog'];
    const args = { query: message, top_k: 3, candidate_car_ids: opts.visibleCarIds };
    emit({ type: 'tool_call_start', toolCallId: 'fb-s', name: 'search_catalog', args });
    const result = (await searchTool.execute(args, { emit: () => {} })) as {
      results: { car_id: string; year: number; make: string; model: string; snippet: string }[];
    };
    emit({ type: 'tool_call_result', toolCallId: 'fb-s', name: 'search_catalog', result });

    const final =
      result.results.length === 0
        ? "I couldn't find anything relevant in the catalog."
        : 'Top matches: ' +
          result.results
            .map((r) => `${r.year} ${r.make} ${r.model} — ${r.snippet.slice(0, 100)}…`)
            .join(' | ');
    for (const w of final.split(' ')) emit({ type: 'token', delta: w + ' ' });
    emit({ type: 'done', finalText: final });
  } catch (err) {
    const message = (err as Error)?.message ?? 'Fallback agent failed';
    emit({ type: 'error', message });
  }
}
