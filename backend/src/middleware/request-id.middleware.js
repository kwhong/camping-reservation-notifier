import { randomUUID } from 'crypto';

/**
 * Add unique request ID to each request for tracing
 */
export const requestIdMiddleware = (req, res, next) => {
  // Check if request already has an ID (from load balancer, etc.)
  const requestId = req.headers['x-request-id'] || randomUUID();

  // Add to request object
  req.id = requestId;

  // Add to response headers
  res.setHeader('X-Request-ID', requestId);

  next();
};

/**
 * Add request ID to logger context
 */
export const logRequestMiddleware = (req, res, next) => {
  const startTime = Date.now();

  // Log request
  req.logger = {
    requestId: req.id,
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.headers['user-agent']
  };

  // Log response on finish
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const logLevel = res.statusCode >= 400 ? 'warn' : 'info';

    // Import logger dynamically to avoid circular dependency
    import('../utils/logger.js').then(({ logger }) => {
      logger[logLevel]('HTTP Request', {
        ...req.logger,
        statusCode: res.statusCode,
        duration: `${duration}ms`
      });
    });
  });

  next();
};
