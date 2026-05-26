import { getAuthToken } from './authAdapter';
import type { AgentEvent, ChatMessage } from '@/types/chat';

interface ChatStreamArgs {
  message: string;
  history: { role: 'user' | 'assistant'; content: string }[];
  visibleCarIds?: string[];
  onEvent: (event: AgentEvent) => void;
  signal?: AbortSignal;
}

/**
 * Streams the chat agent response over the same HTTP connection.
 *
 * We can't use EventSource because it doesn't allow custom headers (no Auth)
 * and only supports GET. Instead we POST and parse the SSE wire format
 * ourselves from the fetch response stream.
 */
export async function streamChat({
  message,
  history,
  visibleCarIds,
  onEvent,
  signal,
}: ChatStreamArgs): Promise<void> {
  const token = getAuthToken();

  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ message, history, visibleCarIds }),
    signal,
  });

  if (!res.ok || !res.body) {
    const errBody = await res.text().catch(() => '');
    throw new Error(errBody || `Chat request failed with status ${res.status}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let separatorIdx: number;
    while ((separatorIdx = buffer.indexOf('\n\n')) !== -1) {
      const rawEvent = buffer.slice(0, separatorIdx);
      buffer = buffer.slice(separatorIdx + 2);
      const dataLine = rawEvent
        .split('\n')
        .find((l) => l.startsWith('data:'))
        ?.slice(5)
        .trim();
      if (!dataLine) continue;
      try {
        const parsed = JSON.parse(dataLine) as AgentEvent;
        onEvent(parsed);
      } catch {
        // Swallow malformed frames — keeps stream resilient.
      }
    }
  }
}

export type { ChatMessage };
