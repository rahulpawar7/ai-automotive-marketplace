import { env } from '../config/env';
import { getOpenAI, hasOpenAIKey } from '../services/openaiClient';
import { logger } from '../utils/logger';

const EMBED_DIM = 384; // dimension used for the deterministic mock fallback

/**
 * Generates an embedding for the input text. Uses OpenAI when configured;
 * otherwise falls back to a deterministic hash-based vector so the demo runs
 * without an API key (search still works, just less semantically).
 */
export async function embedText(text: string): Promise<number[]> {
  if (!hasOpenAIKey()) return deterministicEmbedding(text);

  try {
    const client = getOpenAI();
    const res = await client.embeddings.create({
      model: env.openaiEmbeddingModel,
      input: text,
    });
    return res.data[0]!.embedding;
  } catch (err) {
    logger.warn('Embedding API call failed, using deterministic fallback', err);
    return deterministicEmbedding(text);
  }
}

export async function embedBatch(texts: string[]): Promise<number[][]> {
  if (!hasOpenAIKey()) return texts.map(deterministicEmbedding);
  try {
    const client = getOpenAI();
    const res = await client.embeddings.create({
      model: env.openaiEmbeddingModel,
      input: texts,
    });
    return res.data.map((d) => d.embedding);
  } catch (err) {
    logger.warn('Batch embedding API call failed, using deterministic fallback', err);
    return texts.map(deterministicEmbedding);
  }
}

/**
 * Deterministic, content-aware "embedding" so the demo works offline.
 * Hashes word n-grams into a fixed-size vector and L2-normalises it.
 */
export function deterministicEmbedding(text: string): number[] {
  const v = new Array<number>(EMBED_DIM).fill(0);
  const tokens = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);

  for (const token of tokens) {
    const h = hash(token) % EMBED_DIM;
    v[h] += 1;
  }
  for (let i = 0; i < tokens.length - 1; i++) {
    const bigram = `${tokens[i]}_${tokens[i + 1]}`;
    const h = hash(bigram) % EMBED_DIM;
    v[h] += 0.5;
  }

  let norm = 0;
  for (const x of v) norm += x * x;
  norm = Math.sqrt(norm) || 1;
  return v.map((x) => x / norm);
}

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}
