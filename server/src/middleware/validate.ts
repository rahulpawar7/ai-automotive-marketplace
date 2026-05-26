import type { NextFunction, Request, Response } from 'express';
import type { ZodSchema } from 'zod';

type Source = 'body' | 'query' | 'params';

/**
 * Validates a request section against a Zod schema. Parsed (and coerced) data
 * is written back to the request so downstream handlers see clean values.
 */
export function validate<T>(schema: ZodSchema<T>, source: Source = 'body') {
  return (req: Request, _res: Response, next: NextFunction) => {
    const parsed = schema.safeParse(req[source]);
    if (!parsed.success) {
      next(parsed.error);
      return;
    }
    (req as unknown as Record<Source, T>)[source] = parsed.data;
    next();
  };
}
