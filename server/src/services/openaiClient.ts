import OpenAI from 'openai';
import { env } from '../config/env';
import { logger } from '../utils/logger';

let _client: OpenAI | null = null;

export function getOpenAI(): OpenAI {
  if (_client) return _client;
  if (!env.openaiApiKey) {
    logger.warn(
      'OPENAI_API_KEY is not set. Agent/chat and embeddings will fall back to deterministic mocks.',
    );
  }
  _client = new OpenAI({ apiKey: env.openaiApiKey || 'sk-missing' });
  return _client;
}

export function hasOpenAIKey(): boolean {
  return Boolean(env.openaiApiKey);
}
