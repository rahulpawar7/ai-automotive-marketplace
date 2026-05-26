import type { Request, Response } from 'express';
import { z } from 'zod';
import { User } from '../models/User';
import { AppError } from '../utils/AppError';
import { signToken } from '../middleware/auth';

export const RegisterSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email().toLowerCase(),
  password: z.string().min(8).max(100),
});

export const LoginSchema = z.object({
  email: z.string().email().toLowerCase(),
  password: z.string().min(1),
});

export async function registerHandler(req: Request, res: Response) {
  const { name, email, password } = req.body as z.infer<typeof RegisterSchema>;

  const existing = await User.findOne({ email });
  if (existing) throw AppError.conflict('Email is already registered');

  const passwordHash = await User.hashPassword(password);
  const user = await User.create({ name, email, passwordHash });
  const token = signToken({ userId: user._id.toString(), email: user.email });

  res.status(201).json({
    token,
    user: { id: user._id.toString(), name: user.name, email: user.email },
  });
}

export async function loginHandler(req: Request, res: Response) {
  const { email, password } = req.body as z.infer<typeof LoginSchema>;

  const user = await User.findOne({ email }).select('+passwordHash');
  if (!user) throw AppError.unauthorized('Invalid email or password');

  const ok = await user.comparePassword(password);
  if (!ok) throw AppError.unauthorized('Invalid email or password');

  const token = signToken({ userId: user._id.toString(), email: user.email });
  res.json({
    token,
    user: { id: user._id.toString(), name: user.name, email: user.email },
  });
}

export async function meHandler(req: Request, res: Response) {
  if (!req.user) throw AppError.unauthorized();
  const user = await User.findById(req.user.userId);
  if (!user) throw AppError.notFound('User not found');
  res.json({ user: { id: user._id.toString(), name: user.name, email: user.email } });
}
