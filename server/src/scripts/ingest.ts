/**
 * One-shot ingestion script:
 *   1. Read curated cars JSON from disk.
 *   2. Upsert each car into MongoDB.
 *   3. Compute embeddings for description + specs.
 *   4. Persist embeddings on the Car doc AND on the on-disk vector index.
 *
 * Run with: `npm run ingest --workspace server`
 */
import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import { connectDB, disconnectDB } from '../config/db';
import { Car } from '../models/Car';
import { embedBatch } from '../rag/embeddings';
import { vectorStore, type VectorRecord } from '../rag/vectorStore';
import { logger } from '../utils/logger';
import type { CarSpec } from '../types/car';

function buildEmbeddingText(car: CarSpec): string {
  return [
    `${car.year} ${car.make} ${car.model}`,
    `Body type: ${car.bodyType}`,
    `Fuel type: ${car.fuelType}`,
    `Transmission: ${car.transmission}`,
    `Horsepower: ${car.horsepower}hp`,
    `Seats: ${car.seats}`,
    car.fuelType === 'Electric' && car.rangeKm ? `Range: ${car.rangeKm}km` : '',
    car.mileage ? `Mileage: ${car.mileage} km/l` : '',
    `Price: $${car.price}`,
    `Color: ${car.color}`,
    `Description: ${car.description}`,
    `Pros: ${car.pros.join(', ')}`,
    `Cons: ${car.cons.join(', ')}`,
  ]
    .filter(Boolean)
    .join('\n');
}

function buildSnippet(car: CarSpec): string {
  return `${car.year} ${car.make} ${car.model} — ${car.bodyType}, ${car.fuelType}, ${
    car.horsepower
  }hp, $${car.price.toLocaleString()}. ${car.description.slice(0, 180)}`;
}

async function run() {
  const dataPath = path.resolve(process.cwd(), 'data/cars.json');
  if (!fs.existsSync(dataPath)) {
    throw new Error(`Dataset not found at ${dataPath}`);
  }
  const cars = JSON.parse(fs.readFileSync(dataPath, 'utf-8')) as CarSpec[];
  logger.info(`Loaded ${cars.length} cars from disk`);

  await connectDB();

  // Upsert basic fields first (without embeddings) so the DB is queryable
  // even if embedding generation fails partway through.
  logger.info('Upserting cars into MongoDB...');
  await Promise.all(
    cars.map((c) =>
      Car.updateOne(
        { carId: c.carId },
        { $set: { ...c } },
        { upsert: true },
      ),
    ),
  );

  logger.info('Generating embeddings...');
  const texts = cars.map(buildEmbeddingText);
  const embeddings = await embedBatch(texts);

  const records: VectorRecord[] = [];
  for (let i = 0; i < cars.length; i++) {
    const car = cars[i];
    const embedding = embeddings[i];
    await Car.updateOne({ carId: car.carId }, { $set: { embedding } });
    records.push({
      carId: car.carId,
      embedding,
      meta: {
        make: car.make,
        model: car.model,
        year: car.year,
        price: car.price,
        bodyType: car.bodyType,
        fuelType: car.fuelType,
        snippet: buildSnippet(car),
      },
    });
  }

  vectorStore.load(records);
  vectorStore.persist();

  logger.info(`Ingestion complete. Indexed ${records.length} cars.`);
  await disconnectDB();
}

run()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    logger.error('Ingestion failed', err);
    mongoose.connection.close().finally(() => process.exit(1));
  });
