import { logger } from '../utils/logger.js';
import {
  AppError,
  isOperationalError,
  formatErrorResponse,
  TokenExpiredError,
  InvalidTokenError
} from '../utils/errors.js';

/**
 * Global error handler middleware
 */
export const errorHandler = (err, req, res, _next) => {
  // Log error
  const logContext = {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userId: req.user?.uid
  };

  if (isOperationalError(err)) {
    logger.warn('Operational error occurred', { error: err.message, ...logContext });
  } else {
    logger.error('Unexpected error occurred', { error: err, ...logContext });
  }

  // Handle specific Firebase Auth errors
  if (err.code === 'auth/id-token-expired') {
    const tokenError = new TokenExpiredError();
    return res.status(tokenError.statusCode).json(formatErrorResponse(tokenError));
  }

  if (err.code === 'auth/argument-error' || err.code === 'auth/invalid-id-token') {
    const tokenError = new InvalidTokenError();
    return res.status(tokenError.statusCode).json(formatErrorResponse(tokenError));
  }

  // Handle Firestore errors
  if (err.code?.startsWith('FIRESTORE_') || err.code?.includes('firestore')) {
    const response = {
      error: 'Database operation failed',
      code: 'DB_ERROR',
      statusCode: 503
    };

    if (process.env.NODE_ENV === 'development') {
      response.details = err.message;
    }

    return res.status(503).json(response);
  }

  // Handle our custom errors
  if (err instanceof AppError) {
    const response = formatErrorResponse(err);

    if (process.env.NODE_ENV === 'development') {
      response.stack = err.stack;
    }

    return res.status(err.statusCode).json(response);
  }

  // Handle unknown errors
  const statusCode = err.statusCode || 500;
  const response = {
    error:
      process.env.NODE_ENV === 'production'
        ? 'Internal server error'
        : err.message || 'Internal server error',
    code: err.code || 'INTERNAL_ERROR',
    statusCode
  };

  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
};

/**
 * Handle 404 errors
 */
export const notFoundHandler = (req, res, next) => {
  const error = new AppError(`Route not found: ${req.originalUrl}`, 404, 'ROUTE_NOT_FOUND');
  next(error);
};

/**
 * Async handler wrapper to catch errors in async route handlers
 */
export const asyncHandler = fn => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
