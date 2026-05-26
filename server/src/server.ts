import { createApp } from './app';
import { connectDB } from './config/db';
import { env } from './config/env';
import { vectorStore } from './rag/vectorStore';
import { logger } from './utils/logger';

async function bootstrap() {
  await connectDB();

  // Try to hydrate the vector index from disk so chat is queryable on cold start.
  const loaded = vectorStore.loadFromDisk();
  if (!loaded) {
    logger.warn(
      `Vector index not found at ${env.vectorIndexPath}. Run "npm run ingest --workspace server" to build it.`,
    );
  }

  const app = createApp();
  app.listen(env.port, () => {
    logger.info(`Server listening on http://localhost:${env.port} (env=${env.nodeEnv})`);
  });
}

bootstrap().catch((err) => {
  logger.error('Server failed to bootstrap', err);
  process.exit(1);
});
