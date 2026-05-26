/**
 * Lightweight structured logger. Avoids pulling a heavy logger lib for a take-home
 * project, but provides a single seam to swap in pino/winston later.
 */
type Level = 'debug' | 'info' | 'warn' | 'error';

function format(level: Level, msg: string, meta?: unknown): string {
  const time = new Date().toISOString();
  const base = `[${time}] ${level.toUpperCase()} ${msg}`;
  if (meta === undefined) return base;
  try {
    return `${base} ${typeof meta === 'string' ? meta : JSON.stringify(meta)}`;
  } catch {
    return base;
  }
}

export const logger = {
  debug: (msg: string, meta?: unknown) => {
    if (process.env.NODE_ENV !== 'production') {
      console.debug(format('debug', msg, meta));
    }
  },
  info: (msg: string, meta?: unknown) => console.log(format('info', msg, meta)),
  warn: (msg: string, meta?: unknown) => console.warn(format('warn', msg, meta)),
  error: (msg: string, meta?: unknown) => console.error(format('error', msg, meta)),
};
