import type { Request, Response } from 'express';
import { z } from 'zod';
import { runAgent, type AgentEvent, type ChatMessage } from '../agent/agent';
import { logger } from '../utils/logger';

export const ChatBodySchema = z.object({
  message: z.string().min(1, 'message is required').max(4000),
  history: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string(),
      }),
    )
    .max(50)
    .optional(),
  visibleCarIds: z.array(z.string()).max(500).optional(),
});

/**
 * Server-Sent Events stream of agent events.
 *
 * Wire format: one JSON object per event line, prefixed with `data: `.
 * See AgentEvent in agent.ts for the discriminated union.
 */
export async function chatHandler(req: Request, res: Response) {
  const { message, history, visibleCarIds } = req.body as z.infer<typeof ChatBodySchema>;
  console.log("req.body===>", req.body);
  

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();

  let closed = false;
  req.on('close', () => {
    closed = true;
  });

  const send = (event: AgentEvent) => {
    if (closed) return;
    res.write(`data: ${JSON.stringify(event)}\n\n`);
  };

  try {
    await runAgent({
      message,
      history: history as ChatMessage[] | undefined,
      visibleCarIds,
      emit: send,
    });
  } catch (err) {
    logger.error('Agent run failed', err);
    send({ type: 'error', message: (err as Error)?.message ?? 'Unknown agent error' });
  } finally {
    if (!closed) res.end();
  }
}
