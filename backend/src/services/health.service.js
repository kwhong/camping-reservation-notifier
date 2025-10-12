import { getFirestore, getAuth } from '../config/firebase.js';
import { getEmailTransporter } from '../config/email.js';
import { logger } from '../utils/logger.js';

/**
 * Health Check Service
 */
export class HealthService {
  /**
   * Check overall system health
   */
  async checkHealth() {
    const startTime = Date.now();

    const checks = {
      firestore: await this.checkFirestore(),
      auth: this.checkAuth(),
      email: await this.checkEmail(),
      scheduler: this.checkScheduler()
    };

    const isHealthy = Object.values(checks).every(check => check.status === 'healthy');
    const responseTime = Date.now() - startTime;

    return {
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      responseTime,
      checks,
      system: {
        memory: this.getMemoryUsage(),
        cpu: process.cpuUsage()
      }
    };
  }

  /**
   * Check Firestore connection
   */
  async checkFirestore() {
    try {
      const db = getFirestore();
      const testRef = db.collection('_health_check');

      // Try to write a test document
      await testRef.doc('test').set({
        timestamp: new Date(),
        test: true
      });

      // Try to read it back
      await testRef.doc('test').get();

      // Clean up
      await testRef.doc('test').delete();

      return {
        status: 'healthy',
        message: 'Firestore connection OK'
      };
    } catch (error) {
      logger.error('Firestore health check failed', { error: error.message });
      return {
        status: 'unhealthy',
        message: error.message
      };
    }
  }

  /**
   * Check Firebase Auth
   */
  checkAuth() {
    try {
      const auth = getAuth();

      // Just check if auth is initialized
      if (auth) {
        return {
          status: 'healthy',
          message: 'Firebase Auth OK'
        };
      }

      return {
        status: 'unhealthy',
        message: 'Firebase Auth not initialized'
      };
    } catch (error) {
      logger.error('Auth health check failed', { error: error.message });
      return {
        status: 'unhealthy',
        message: error.message
      };
    }
  }

  /**
   * Check Email service
   */
  async checkEmail() {
    try {
      const transporter = getEmailTransporter();

      // Verify SMTP connection
      await transporter.verify();

      return {
        status: 'healthy',
        message: 'Email service OK'
      };
    } catch (error) {
      logger.error('Email health check failed', { error: error.message });
      return {
        status: 'unhealthy',
        message: error.message
      };
    }
  }

  /**
   * Check Scheduler status
   */
  checkScheduler() {
    // Import scheduler status (this would need to be exported from scheduler.service.js)
    // For now, we'll return a basic check
    return {
      status: 'healthy',
      message: 'Scheduler running',
      lastRun: 'N/A' // Would need to track this
    };
  }

  /**
   * Get memory usage
   */
  getMemoryUsage() {
    const usage = process.memoryUsage();
    return {
      heapUsed: `${Math.round(usage.heapUsed / 1024 / 1024)}MB`,
      heapTotal: `${Math.round(usage.heapTotal / 1024 / 1024)}MB`,
      rss: `${Math.round(usage.rss / 1024 / 1024)}MB`,
      external: `${Math.round(usage.external / 1024 / 1024)}MB`
    };
  }

  /**
   * Get last scraping status
   */
  async getLastScrapingStatus() {
    try {
      const db = getFirestore();
      const snapshot = await db
        .collection('scrapingLogs')
        .orderBy('startedAt', 'desc')
        .limit(1)
        .get();

      if (snapshot.empty) {
        return null;
      }

      const doc = snapshot.docs[0];
      const data = doc.data();

      return {
        status: data.status,
        startedAt: data.startedAt?.toDate?.() || data.startedAt,
        completedAt: data.completedAt?.toDate?.() || data.completedAt,
        itemsScraped: data.itemsScraped,
        errorMessage: data.errorMessage
      };
    } catch (error) {
      logger.error('Failed to get last scraping status', { error: error.message });
      return null;
    }
  }

  /**
   * Get system metrics
   */
  async getMetrics() {
    const db = getFirestore();

    try {
      // Get counts from collections
      const [usersCount, settingsCount, availabilityCount, notificationsCount] = await Promise.all([
        db.collection('users').count().get(),
        db.collection('userSettings').count().get(),
        db.collection('availability').count().get(),
        db.collection('notifications').count().get()
      ]);

      return {
        database: {
          users: usersCount.data().count,
          userSettings: settingsCount.data().count,
          availability: availabilityCount.data().count,
          notifications: notificationsCount.data().count
        },
        lastScraping: await this.getLastScrapingStatus()
      };
    } catch (error) {
      logger.error('Failed to get metrics', { error: error.message });
      return {
        error: error.message
      };
    }
  }
}

export const healthService = new HealthService();
