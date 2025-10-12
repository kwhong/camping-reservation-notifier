import cron from 'node-cron';
import { logger } from '../utils/logger.js';
import { isSleepTime, getRandomDelay, getKoreaDate } from '../utils/date.js';
import { scraperService } from './scraper.service.js';
import { notificationService } from './notification.service.js';
import { firestoreService } from './firestore.service.js';

let schedulerTask = null;

export const startScheduler = () => {
  if (schedulerTask) {
    logger.warn('Scheduler is already running');
    return;
  }

  // Run every 10 minutes
  schedulerTask = cron.schedule('*/10 * * * *', async () => {
    try {
      // Add random delay (30-120 seconds)
      const delay = getRandomDelay(30, 120);
      logger.info(`⏰ Scheduler triggered. Waiting ${delay / 1000}s before execution...`);

      await new Promise(resolve => setTimeout(resolve, delay));

      // Check if it's sleep time (01:00 - 08:00 KST)
      if (isSleepTime()) {
        logger.info('😴 Sleep time (01:00-08:00 KST). Skipping scraping.');
        return;
      }

      // Check if there are any active user settings with future dates
      const hasActiveSettings = await checkForActiveSettings();

      if (!hasActiveSettings) {
        logger.info('⏭️ No active user settings with future dates. Skipping scraping.');
        return;
      }

      // Execute scraping
      logger.info('🚀 Starting scheduled scraping...');
      await executeScraping();
    } catch (error) {
      logger.error('❌ Scheduler error:', error);
    }
  });

  logger.info(
    '✅ Scheduler started successfully (runs every 10 minutes with 30-120s random delay)'
  );
};

export const stopScheduler = () => {
  if (schedulerTask) {
    schedulerTask.stop();
    schedulerTask = null;
    logger.info('⏹️ Scheduler stopped');
  }
};

async function checkForActiveSettings() {
  try {
    const activeSettings = await firestoreService.getAllActiveSettings();

    if (activeSettings.length === 0) {
      return false;
    }

    // Check if any setting has a future date
    const today = getKoreaDate();
    today.setHours(0, 0, 0, 0);

    const hasFutureDates = activeSettings.some(setting => {
      const dateFrom = setting.dateFrom ? new Date(setting.dateFrom) : null;
      const dateTo = setting.dateTo ? new Date(setting.dateTo) : null;

      // If no dates specified, consider it as active
      if (!dateFrom && !dateTo) return true;

      // If dateTo exists and is in the future
      if (dateTo && dateTo >= today) return true;

      // If only dateFrom exists and is in the future
      if (dateFrom && !dateTo && dateFrom >= today) return true;

      return false;
    });

    return hasFutureDates;
  } catch (error) {
    logger.error('Error checking active settings:', error);
    return false;
  }
}

async function executeScraping() {
  try {
    // Get all active settings to determine which months to scrape
    const activeSettings = await firestoreService.getAllActiveSettings();

    // Run the scraper with active settings
    const itemsScraped = await scraperService.scrapeCampingSite(activeSettings);

    if (itemsScraped > 0) {
      logger.info(`✅ Scraping completed: ${itemsScraped} items scraped`);

      // Get latest availability data to check for notifications
      const latestAvailability = await firestoreService.getAvailability({ limit: 100 });

      // Check if we need to send any notifications
      await notificationService.checkAndNotify(latestAvailability);
    } else {
      logger.warn('⚠️ No items scraped');
    }
  } catch (error) {
    logger.error('Error executing scraping:', error);
    throw error;
  }
}

// For manual testing
export const runScrapingNow = async () => {
  logger.info('🔧 Manual scraping triggered');
  await executeScraping();
};
