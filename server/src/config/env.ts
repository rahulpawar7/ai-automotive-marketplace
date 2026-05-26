import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined || value === '') {
    throw new Error(`Missing required env variable: ${name}`);
  }
  return value;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 4000),
  clientOrigin: process.env.CLIENT_ORIGIN ?? 'http://localhost:5173',

  mongoUri: required('MONGODB_URI', 'mongodb://localhost:27017/ai-automotive-marketplace'),

  jwtSecret: required('JWT_SECRET', 'dev-only-insecure-secret-change-me'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '7d',

  openaiApiKey: process.env.OPENAI_API_KEY ?? '',
  openaiChatModel: process.env.OPENAI_CHAT_MODEL ?? 'gpt-4o-mini',
  openaiEmbeddingModel: process.env.OPENAI_EMBEDDING_MODEL ?? 'text-embedding-3-small',

  vectorIndexPath: process.env.VECTOR_INDEX_PATH ?? './data/vector-index.json',
} as const;

export const isProduction = env.nodeEnv === 'production';
