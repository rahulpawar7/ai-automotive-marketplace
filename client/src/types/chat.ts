import type { CarFilters, SortField } from './car';

export type Role = 'user' | 'assistant';

export interface ToolCallTrace {
  id: string;
  name: string;
  args: unknown;
  status: 'running' | 'success' | 'error';
  result?: unknown;
  error?: string;
}

export interface ChatMessage {
  id: string;
  role: Role;
  content: string;
  /** Tool-call traces this message produced (assistant messages only). */
  toolCalls?: ToolCallTrace[];
  pending?: boolean;
  error?: string;
}

export type AgentEvent =
  | { type: 'token'; delta: string }
  | { type: 'tool_call_start'; toolCallId: string; name: string; args: unknown }
  | { type: 'tool_call_result'; toolCallId: string; name: string; result: unknown }
  | { type: 'tool_call_error'; toolCallId: string; name: string; error: string }
  | {
      type: 'ui_update';
      payload: {
        filters?: CarFilters;
        selectedCarId?: string | null;
        sort?: SortField;
      };
    }
  | { type: 'done'; finalText: string }
  | { type: 'error'; message: string };
