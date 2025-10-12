/**
 * Custom Error Classes for Camping Scraper System
 */

/**
 * Base Application Error
 */
export class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR', isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    this.timestamp = new Date().toISOString();

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Authentication Errors
 */
export class AuthenticationError extends AppError {
  constructor(message, code = 'AUTH_FAILED') {
    super(message, 401, code);
  }
}

export class TokenExpiredError extends AuthenticationError {
  constructor(message = 'Authentication token has expired') {
    super(message, 'AUTH_TOKEN_EXPIRED');
  }
}

export class InvalidTokenError extends AuthenticationError {
  constructor(message = 'Invalid authentication token') {
    super(message, 'AUTH_INVALID_TOKEN');
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'You are not authorized to perform this action') {
    super(message, 403, 'AUTH_UNAUTHORIZED');
  }
}

/**
 * Database Errors
 */
export class DatabaseError extends AppError {
  constructor(message, code = 'DB_ERROR') {
    super(message, 503, code);
  }
}

export class DatabaseConnectionError extends DatabaseError {
  constructor(message = 'Database connection failed') {
    super(message, 'DB_CONNECTION_ERROR');
  }
}

export class DatabaseQueryError extends DatabaseError {
  constructor(message = 'Database query failed') {
    super(message, 'DB_QUERY_FAILED');
  }
}

export class DocumentNotFoundError extends AppError {
  constructor(resource = 'Document', id = '') {
    const message = id ? `${resource} with id '${id}' not found` : `${resource} not found`;
    super(message, 404, 'DB_NOT_FOUND');
  }
}

/**
 * Scraper Errors
 */
export class ScraperError extends AppError {
  constructor(message, code = 'SCRAPER_ERROR') {
    super(message, 500, code);
  }
}

export class ScraperNetworkError extends ScraperError {
  constructor(message = 'Network error during scraping') {
    super(message, 'SCRAPER_NETWORK_ERROR');
  }
}

export class ScraperParseError extends ScraperError {
  constructor(message = 'Failed to parse scraped data') {
    super(message, 'SCRAPER_PARSE_ERROR');
  }
}

export class ScraperTimeoutError extends ScraperError {
  constructor(message = 'Scraping operation timed out') {
    super(message, 'SCRAPER_TIMEOUT');
  }
}

/**
 * Email Errors
 */
export class EmailError extends AppError {
  constructor(message = 'Email operation failed', code = 'EMAIL_ERROR') {
    super(message, 500, code);
  }
}

export class EmailSendError extends EmailError {
  constructor(message = 'Failed to send email') {
    super(message, 'EMAIL_SEND_FAILED');
  }
}

export class EmailConfigError extends EmailError {
  constructor(message = 'Email configuration error') {
    super(message, 'EMAIL_CONFIG_ERROR');
  }
}

/**
 * Validation Errors
 */
export class ValidationError extends AppError {
  constructor(message, fields = []) {
    super(message, 400, 'VALIDATION_ERROR');
    this.fields = fields;
  }
}

export class MissingParameterError extends ValidationError {
  constructor(paramName) {
    super(`Missing required parameter: ${paramName}`, [paramName]);
    this.code = 'MISSING_PARAMETER';
  }
}

export class InvalidParameterError extends ValidationError {
  constructor(paramName, reason = '') {
    const message = reason
      ? `Invalid parameter '${paramName}': ${reason}`
      : `Invalid parameter: ${paramName}`;
    super(message, [paramName]);
    this.code = 'INVALID_PARAMETER';
  }
}

/**
 * Rate Limit Error
 */
export class RateLimitError extends AppError {
  constructor(message = 'Too many requests, please try again later') {
    super(message, 429, 'RATE_LIMIT_EXCEEDED');
  }
}

/**
 * Error Code Reference
 */
export const ERROR_CODES = {
  // Authentication (401)
  AUTH_FAILED: { status: 401, message: 'Authentication failed' },
  AUTH_TOKEN_EXPIRED: { status: 401, message: 'Token expired' },
  AUTH_INVALID_TOKEN: { status: 401, message: 'Invalid token' },
  AUTH_NO_TOKEN: { status: 401, message: 'No token provided' },

  // Authorization (403)
  AUTH_UNAUTHORIZED: { status: 403, message: 'Unauthorized access' },

  // Not Found (404)
  DB_NOT_FOUND: { status: 404, message: 'Resource not found' },

  // Validation (400)
  VALIDATION_ERROR: { status: 400, message: 'Validation error' },
  MISSING_PARAMETER: { status: 400, message: 'Missing required parameter' },
  INVALID_PARAMETER: { status: 400, message: 'Invalid parameter' },

  // Rate Limit (429)
  RATE_LIMIT_EXCEEDED: { status: 429, message: 'Rate limit exceeded' },

  // Server Errors (500)
  INTERNAL_ERROR: { status: 500, message: 'Internal server error' },
  DB_ERROR: { status: 500, message: 'Database error' },
  DB_QUERY_FAILED: { status: 500, message: 'Database query failed' },
  SCRAPER_ERROR: { status: 500, message: 'Scraper error' },
  SCRAPER_PARSE_ERROR: { status: 500, message: 'Failed to parse data' },
  EMAIL_ERROR: { status: 500, message: 'Email error' },
  EMAIL_SEND_FAILED: { status: 500, message: 'Failed to send email' },
  EMAIL_CONFIG_ERROR: { status: 500, message: 'Email configuration error' },

  // Service Unavailable (503)
  DB_CONNECTION_ERROR: { status: 503, message: 'Database unavailable' },
  SCRAPER_NETWORK_ERROR: { status: 503, message: 'Network error' },
  SCRAPER_TIMEOUT: { status: 503, message: 'Operation timed out' }
};

/**
 * Check if error is operational (expected)
 */
export function isOperationalError(error) {
  if (error instanceof AppError) {
    return error.isOperational;
  }
  return false;
}

/**
 * Format error for API response
 */
export function formatErrorResponse(error) {
  if (error instanceof AppError) {
    return {
      error: error.message,
      code: error.code,
      statusCode: error.statusCode,
      timestamp: error.timestamp,
      ...(error instanceof ValidationError && { fields: error.fields })
    };
  }

  // Unknown error
  return {
    error: 'Internal server error',
    code: 'INTERNAL_ERROR',
    statusCode: 500,
    timestamp: new Date().toISOString()
  };
}
