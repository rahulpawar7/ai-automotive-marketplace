import { Schema, model, type InferSchemaType, type Model } from 'mongoose';
import bcrypt from 'bcryptjs';

const UserSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, index: true },
    passwordHash: { type: String, required: true, select: false },
  },
  { timestamps: true },
);

UserSchema.methods.comparePassword = async function (password: string): Promise<boolean> {
  return bcrypt.compare(password, this.passwordHash);
};

UserSchema.statics.hashPassword = async function (password: string): Promise<string> {
  return bcrypt.hash(password, 10);
};

export type UserDoc = InferSchemaType<typeof UserSchema> & {
  _id: string;
  comparePassword(password: string): Promise<boolean>;
};

interface UserModel extends Model<UserDoc> {
  hashPassword(password: string): Promise<string>;
}

export const User = model<UserDoc, UserModel>('User', UserSchema);
