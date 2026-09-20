import { Request, Response, NextFunction } from 'express';

export interface AppError extends Error {
  statusCode?: number;
  details?: unknown;
}

export function errorHandler(err: AppError & { code?: string }, _req: Request, res: Response, _next: NextFunction): void {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';

  // Handle PostgreSQL invalid input syntax for type uuid (code 22P02)
  if (err.code === '22P02') {
    statusCode = 400;
    message = 'Invalid UUID format in database query identifier.';
  }

  console.error(`[ERROR] ${statusCode} - ${message}`, err.stack);

  res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
}

export function createError(message: string, statusCode: number = 500, details?: unknown): AppError {
  const error = new Error(message) as AppError;
  error.statusCode = statusCode;
  error.details = details;
  return error;
}
