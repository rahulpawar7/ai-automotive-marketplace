import fs from 'fs';
import path from 'path';
import { env } from '../config/env';
import { logger } from '../utils/logger';

export interface VectorRecord {
  carId: string;
  embedding: number[];
  /** Lightweight metadata so we can surface snippets without DB hits */
  meta: {
    make: string;
    model: string;
    year: number;
    price: number;
    bodyType: string;
    fuelType: string;
    snippet: string;
  };
}

export interface SearchHit {
  carId: string;
  score: number;
  meta: VectorRecord['meta'];
}

/**
 * Tiny in-memory vector index. For ~50–1k cars this is plenty fast,
 * deterministic, and dependency-free. Swap in pgvector / pinecone /
 * qdrant by replacing this module — the public surface is stable.
 */
class InMemoryVectorStore {
  private records: VectorRecord[] = [];
  private loaded = false;

  load(records: VectorRecord[]): void {
    this.records = records.filter(
      (r) => Array.isArray(r.embedding) && r.embedding.length > 0,
    );
    this.loaded = true;
    logger.info(`Vector store loaded with ${this.records.length} records`);
  }

  size(): number {
    return this.records.length;
  }

  isReady(): boolean {
    return this.loaded;
  }

  upsert(record: VectorRecord): void {
    const idx = this.records.findIndex((r) => r.carId === record.carId);
    if (idx >= 0) this.records[idx] = record;
    else this.records.push(record);
  }

  /**
   * Cosine similarity search.
   * @param candidateIds optional whitelist – useful when scoping search to the
   * currently visible/filtered cars.
   */
  search(queryEmbedding: number[], topK = 5, candidateIds?: string[]): SearchHit[] {
    const candidateSet = candidateIds ? new Set(candidateIds) : null;
    const queryNorm = norm(queryEmbedding);
    if (queryNorm === 0) return [];

    const scored: SearchHit[] = [];
    for (const r of this.records) {
      if (candidateSet && !candidateSet.has(r.carId)) continue;
      const dot = dotProduct(queryEmbedding, r.embedding);
      const recNorm = norm(r.embedding) || 1;
      const score = dot / (queryNorm * recNorm);
      scored.push({ carId: r.carId, score, meta: r.meta });
    }
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, topK);
  }

  persist(filePath = env.vectorIndexPath): void {
    const absolute = path.resolve(filePath);
    fs.mkdirSync(path.dirname(absolute), { recursive: true });
    fs.writeFileSync(absolute, JSON.stringify(this.records));
    logger.info(`Vector index persisted to ${absolute}`);
  }

  loadFromDisk(filePath = env.vectorIndexPath): boolean {
    const absolute = path.resolve(filePath);
    if (!fs.existsSync(absolute)) return false;
    try {
      const raw = fs.readFileSync(absolute, 'utf-8');
      const parsed = JSON.parse(raw) as VectorRecord[];
      this.load(parsed);
      return true;
    } catch (err) {
      logger.warn(`Failed to load vector index from ${absolute}`, err);
      return false;
    }
  }
}

function dotProduct(a: number[], b: number[]): number {
  const len = Math.min(a.length, b.length);
  let sum = 0;
  for (let i = 0; i < len; i++) sum += a[i] * b[i];
  return sum;
}

function norm(v: number[]): number {
  let s = 0;
  for (const x of v) s += x * x;
  return Math.sqrt(s);
}

export const vectorStore = new InMemoryVectorStore();
