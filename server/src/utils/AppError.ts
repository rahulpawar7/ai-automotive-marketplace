/**
 * Operational error with HTTP status. Thrown anywhere and centrally translated
 * to a JSON response by the error middleware.
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly details?: unknown;

  constructor(message: string, statusCode = 500, details?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.details = details;
    Object.setPrototypeOf(this, AppError.prototype);
  }

  static badRequest(message = 'Bad request', details?: unknown) {
    return new AppError(message, 400, details);
  }
  static unauthorized(message = 'Unauthorized') {
    return new AppError(message, 401);
  }
  static forbidden(message = 'Forbidden') {
    return new AppError(message, 403);
  }
  static notFound(message = 'Not found') {
    return new AppError(message, 404);
  }
  static conflict(message = 'Conflict') {
    return new AppError(message, 409);
  }
}
