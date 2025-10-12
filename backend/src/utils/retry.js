import { logger } from './logger.js';

/**
 * Retry a function with exponential backoff
 * @param {Function} fn - Async function to retry
 * @param {Object} options - Retry options
 * @returns {Promise} - Result of function
 */
export async function retryWithBackoff(fn, options = {}) {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    factor = 2,
    onRetry = null
  } = options;

  let lastError;
  let delay = initialDelay;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt === maxRetries) {
        logger.error(`All ${maxRetries} retry attempts failed`, { error: error.message });
        throw error;
      }

      // Calculate delay with exponential backoff
      const currentDelay = Math.min(delay, maxDelay);
      logger.warn(`Attempt ${attempt}/${maxRetries} failed. Retrying in ${currentDelay}ms...`, {
        error: error.message
      });

      // Call onRetry callback if provided
      if (onRetry) {
        await onRetry(error, attempt, currentDelay);
      }

      // Wait before retrying
      await sleep(currentDelay);

      // Increase delay for next retry
      delay *= factor;
    }
  }

  throw lastError;
}

/**
 * Retry a function with fixed delay
 * @param {Function} fn - Async function to retry
 * @param {Object} options - Retry options
 * @returns {Promise} - Result of function
 */
export async function retryWithFixedDelay(fn, options = {}) {
  const { maxRetries = 3, delay = 5000, onRetry = null } = options;

  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt === maxRetries) {
        logger.error(`All ${maxRetries} retry attempts failed`, { error: error.message });
        throw error;
      }

      logger.warn(`Attempt ${attempt}/${maxRetries} failed. Retrying in ${delay}ms...`, {
        error: error.message
      });

      if (onRetry) {
        await onRetry(error, attempt, delay);
      }

      await sleep(delay);
    }
  }

  throw lastError;
}

/**
 * Retry specific operations with predefined strategies
 */
export const retryStrategies = {
  /**
   * Scraping operations: 3 retries with exponential backoff
   */
  scraping: fn =>
    retryWithBackoff(fn, {
      maxRetries: 3,
      initialDelay: 2000,
      maxDelay: 30000,
      factor: 2,
      onRetry: (error, attempt, delay) => {
        logger.info(`Scraping retry ${attempt}: waiting ${delay}ms`);
      }
    }),

  /**
   * Email sending: 2 retries with fixed 5-second delay
   */
  email: fn =>
    retryWithFixedDelay(fn, {
      maxRetries: 2,
      delay: 5000,
      onRetry: (error, attempt) => {
        logger.info(`Email retry ${attempt}: network or SMTP issue`);
      }
    }),

  /**
   * Firestore operations: 3 retries with exponential backoff
   */
  firestore: fn =>
    retryWithBackoff(fn, {
      maxRetries: 3,
      initialDelay: 1000,
      maxDelay: 10000,
      factor: 2,
      onRetry: (error, attempt, delay) => {
        logger.info(`Firestore retry ${attempt}: waiting ${delay}ms`);
      }
    }),

  /**
   * Network requests: 3 retries with exponential backoff
   */
  network: fn =>
    retryWithBackoff(fn, {
      maxRetries: 3,
      initialDelay: 1000,
      maxDelay: 15000,
      factor: 2,
      onRetry: (error, attempt, delay) => {
        logger.info(`Network retry ${attempt}: waiting ${delay}ms`);
      }
    })
};

/**
 * Sleep utility
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise}
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Check if error is retryable
 * @param {Error} error
 * @returns {boolean}
 */
export function isRetryableError(error) {
  // Network errors
  if (
    error.code === 'ECONNRESET' ||
    error.code === 'ETIMEDOUT' ||
    error.code === 'ENOTFOUND' ||
    error.code === 'ECONNREFUSED'
  ) {
    return true;
  }

  // HTTP errors (5xx)
  if (error.response?.status >= 500 && error.response?.status < 600) {
    return true;
  }

  // Firestore errors
  if (error.code === 'unavailable' || error.code === 'deadline-exceeded') {
    return true;
  }

  // Playwright errors
  if (
    error.message?.includes('Target closed') ||
    error.message?.includes('Navigation timeout') ||
    error.message?.includes('net::ERR_')
  ) {
    return true;
  }

  return false;
}

/**
 * Retry only if error is retryable
 * @param {Function} fn
 * @param {Object} options
 * @returns {Promise}
 */
export async function retryIfRetryable(fn, options = {}) {
  try {
    return await fn();
  } catch (error) {
    if (isRetryableError(error)) {
      logger.info('Retryable error detected, attempting retry', {
        error: error.message,
        code: error.code
      });
      return retryWithBackoff(fn, options);
    }
    throw error;
  }
}
