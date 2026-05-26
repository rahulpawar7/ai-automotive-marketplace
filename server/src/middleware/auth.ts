import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { AppError } from '../utils/AppError';

interface JwtPayload {
  userId: string;
  email: string;
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, env.jwtSecret, { expiresIn: env.jwtExpiresIn } as jwt.SignOptions);
}

/** Hard auth: 401 if missing/invalid token. */
export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const token = extractToken(req);
  if (!token) {
    next(AppError.unauthorized('Missing authentication token'));
    return;
  }
  try {
    const payload = jwt.verify(token, env.jwtSecret) as JwtPayload;
    req.user = { userId: payload.userId, email: payload.email };
    next();
  } catch {
    next(AppError.unauthorized('Invalid or expired token'));
  }
}

/** Soft auth: attaches `req.user` if a valid token is present, otherwise passes through. */
export function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const token = extractToken(req);
  if (!token) {
    next();
    return;
  }
  try {
    const payload = jwt.verify(token, env.jwtSecret) as JwtPayload;
    req.user = { userId: payload.userId, email: payload.email };
  } catch {
    /* ignore invalid token, treat as anonymous */
  }
  next();
}

function extractToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) {
    return header.slice('Bearer '.length).trim();
  }
  return null;
}
