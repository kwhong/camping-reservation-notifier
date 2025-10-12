import express from 'express';
import { healthService } from '../services/health.service.js';

const router = express.Router();

/**
 * Basic health check
 * GET /health
 */
router.get('/', async (req, res) => {
  try {
    const health = await healthService.checkHealth();

    const statusCode = health.status === 'healthy' ? 200 : 503;

    res.status(statusCode).json(health);
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

/**
 * Detailed health check with metrics
 * GET /health/detailed
 */
router.get('/detailed', async (req, res) => {
  try {
    const [health, metrics] = await Promise.all([
      healthService.checkHealth(),
      healthService.getMetrics()
    ]);

    const statusCode = health.status === 'healthy' ? 200 : 503;

    res.status(statusCode).json({
      ...health,
      metrics
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

/**
 * Liveness probe (for Kubernetes/Docker)
 * GET /health/live
 */
router.get('/live', (req, res) => {
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString()
  });
});

/**
 * Readiness probe (for Kubernetes/Docker)
 * GET /health/ready
 */
router.get('/ready', async (req, res) => {
  try {
    const health = await healthService.checkHealth();

    if (health.status === 'healthy') {
      res.status(200).json({
        status: 'ready',
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(503).json({
        status: 'not_ready',
        timestamp: new Date().toISOString(),
        checks: health.checks
      });
    }
  } catch (error) {
    res.status(503).json({
      status: 'not_ready',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

export default router;
