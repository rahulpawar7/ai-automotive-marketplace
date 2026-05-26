import { Schema, model, type InferSchemaType, type Model } from 'mongoose';

const CarSchema = new Schema(
  {
    carId: { type: String, required: true, unique: true, index: true },
    make: { type: String, required: true, index: true },
    model: { type: String, required: true, index: true },
    year: { type: Number, required: true, index: true },
    price: { type: Number, required: true, index: true },
    bodyType: {
      type: String,
      required: true,
      enum: ['Sedan', 'SUV', 'Hatchback', 'Coupe', 'Convertible', 'Truck', 'Wagon', 'Van'],
      index: true,
    },
    fuelType: {
      type: String,
      required: true,
      enum: ['Petrol', 'Diesel', 'Hybrid', 'Electric', 'Plug-in Hybrid'],
      index: true,
    },
    transmission: {
      type: String,
      required: true,
      enum: ['Automatic', 'Manual', 'CVT', 'Dual-Clutch'],
    },
    mileage: { type: Number, required: true },
    rangeKm: { type: Number },
    horsepower: { type: Number, required: true },
    seats: { type: Number, required: true },
    color: { type: String, required: true },
    imageUrl: { type: String, required: true },
    description: { type: String, required: true },
    pros: { type: [String], default: [] },
    cons: { type: [String], default: [] },
    /** Stored embedding so we don't recompute on every restart. */
    embedding: { type: [Number], default: undefined, select: false },
  },
  { timestamps: true },
);

CarSchema.index({ make: 'text', model: 'text', description: 'text' });

export type CarDoc = InferSchemaType<typeof CarSchema> & { _id: string };
export const Car: Model<CarDoc> = model<CarDoc>('Car', CarSchema);
