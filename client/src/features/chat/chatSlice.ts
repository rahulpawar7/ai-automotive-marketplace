/**
 * Chat slice — owns the conversation, streaming state, and the SSE wire to
 * the agent. UI-mutating events (`ui_update`) are forwarded to the marketplace
 * slice so there's still exactly one source of truth for filters/selection.
 *
 * Non-serializable runtime values (AbortController) live in module scope, not
 * in the store, so the state stays serializable for time-travel / devtools.
 */
import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { streamChat } from '../../api/chat';
import type { ChatMessage, ToolCallTrace } from '../../types/chat';
import { applyAgentUpdate } from '../marketplace/marketplaceSlice';
import type { RootState } from '../../store';

interface ChatState {
  messages: ChatMessage[];
  isStreaming: boolean;
}

const WELCOME: ChatMessage = {
  id: 'welcome',
  role: 'assistant',
  content:
    "Hi! I'm your AI car shopping assistant. Ask me to filter cars (\"Show me electric SUVs under $50,000\"), pick a car (\"Open the cheapest one\"), or compare options (\"Compare the BMW X5 and Audi Q7\").",
};

const initialState: ChatState = {
  messages: [WELCOME],
  isStreaming: false,
};

/** Module-level so we can cancel without putting it in the store. */
let currentController: AbortController | null = null;

function genId(): string {
  return Math.random().toString(36).slice(2, 10);
}

/* -------------------------- thunks -------------------------- */

export const sendMessage = createAsyncThunk<void, string, { state: RootState }>(
  'chat/sendMessage',
  async (text, { dispatch, getState }) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    const userMsgId = genId();
    const assistantId = genId();

    dispatch(
      _conversationAppended([
        { id: userMsgId, role: 'user', content: trimmed },
        { id: assistantId, role: 'assistant', content: '', toolCalls: [], pending: true },
      ]),
    );
    dispatch(_streamingSet(true));

    // Build context for the agent: prior messages + currently visible cars.
    const history = getState()
      .chat.messages.filter(
        (m) => m.id !== 'welcome' && m.id !== userMsgId && m.id !== assistantId,
      )
      .map((m) => ({ role: m.role, content: m.content }));
    const visibleCarIds = getState().marketplace.cars.map((c) => c.carId);

    const controller = new AbortController();
    currentController = controller;

    try {
      await streamChat({
        message: trimmed,
        history,
        visibleCarIds,
        signal: controller.signal,
        onEvent: (event) => {
          switch (event.type) {
            case 'token':
              dispatch(_tokenAppended({ id: assistantId, delta: event.delta }));
              break;
            case 'tool_call_start':
              dispatch(
                _toolCallUpserted({
                  id: assistantId,
                  trace: {
                    id: event.toolCallId,
                    name: event.name,
                    args: event.args,
                    status: 'running',
                  },
                }),
              );
              break;
            case 'tool_call_result':
              dispatch(
                _toolCallUpserted({
                  id: assistantId,
                  trace: {
                    id: event.toolCallId,
                    name: event.name,
                    args: undefined,
                    status: 'success',
                    result: event.result,
                  },
                }),
              );
              break;
            case 'tool_call_error':
              dispatch(
                _toolCallUpserted({
                  id: assistantId,
                  trace: {
                    id: event.toolCallId,
                    name: event.name,
                    args: undefined,
                    status: 'error',
                    error: event.error,
                  },
                }),
              );
              break;
            case 'ui_update':
              void dispatch(applyAgentUpdate(event.payload));
              break;
            case 'done':
              dispatch(_messageFinished({ id: assistantId }));
              break;
            case 'error':
              dispatch(_messageErrored({ id: assistantId, message: event.message }));
              break;
          }
        },
      });
    } catch (err) {
      const aborted = controller.signal.aborted;
      dispatch(
        _messageErrored({
          id: assistantId,
          message: aborted ? 'Cancelled.' : (err as Error)?.message ?? 'Chat failed',
        }),
      );
    } finally {
      dispatch(_streamingSet(false));
      if (currentController === controller) currentController = null;
    }
  },
);

export function cancelStreaming() {
  if (currentController) currentController.abort();
}

/* -------------------------- slice -------------------------- */

const slice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    chatReset(state) {
      state.messages = [
        {
          id: 'welcome',
          role: 'assistant',
          content: 'Conversation cleared. What would you like to do next?',
        },
      ];
      state.isStreaming = false;
    },
    _conversationAppended(state, action: PayloadAction<ChatMessage[]>) {
      state.messages.push(...action.payload);
    },
    _streamingSet(state, action: PayloadAction<boolean>) {
      state.isStreaming = action.payload;
    },
    _tokenAppended(state, action: PayloadAction<{ id: string; delta: string }>) {
      const m = state.messages.find((x) => x.id === action.payload.id);
      if (m) m.content += action.payload.delta;
    },
    _toolCallUpserted(state, action: PayloadAction<{ id: string; trace: ToolCallTrace }>) {
      const m = state.messages.find((x) => x.id === action.payload.id);
      if (!m) return;
      m.toolCalls = m.toolCalls ?? [];
      const idx = m.toolCalls.findIndex((t) => t.id === action.payload.trace.id);
      if (idx === -1) {
        m.toolCalls.push(action.payload.trace);
      } else {
        // Merge: preserve previous args if the new event omits them
        m.toolCalls[idx] = { ...m.toolCalls[idx], ...action.payload.trace };
      }
    },
    _messageFinished(state, action: PayloadAction<{ id: string }>) {
      const m = state.messages.find((x) => x.id === action.payload.id);
      if (m) m.pending = false;
    },
    _messageErrored(state, action: PayloadAction<{ id: string; message: string }>) {
      const m = state.messages.find((x) => x.id === action.payload.id);
      if (m) {
        m.error = action.payload.message;
        m.pending = false;
      }
    },
  },
});

export const {
  chatReset,
  _conversationAppended,
  _streamingSet,
  _tokenAppended,
  _toolCallUpserted,
  _messageFinished,
  _messageErrored,
} = slice.actions;

export default slice.reducer;
