import cron from 'node-cron';
import { logger } from '../utils/logger.js';
import { isSleepTime, getRandomDelay, getKoreaDate } from '../utils/date.js';
import { scraperService } from './scraper.service.js';
import { notificationService } from './notification.service.js';
import { firestoreService } from './firestore.service.js';

let schedulerTask = null;

/**
 * 스케줄러 시작
 * @function
 * @description
 * - 10분마다 실행되는 Cron 작업 등록
 * - 실행 전 30-120초 랜덤 딜레이 추가 (서버 부하 분산)
 * - 수면 시간(01:00-08:00 KST) 체크하여 스킵
 * - 활성 설정이 있고 미래 날짜가 있을 때만 스크래핑 실행
 */
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

/**
 * 스케줄러 중지
 * @function
 * @description 실행 중인 Cron 작업을 중지하고 null로 초기화
 */
export const stopScheduler = () => {
  if (schedulerTask) {
    schedulerTask.stop();
    schedulerTask = null;
    logger.info('⏹️ Scheduler stopped');
  }
};

/**
 * 활성 설정 존재 여부 확인
 * @async
 * @function
 * @returns {Promise<boolean>} 미래 날짜를 포함한 활성 설정이 있으면 true
 * @description
 * - 모든 활성 사용자 설정 조회
 * - 각 설정의 dateFrom 또는 dateTo가 오늘 이후인지 확인
 * - 날짜가 지정되지 않은 설정도 활성으로 간주
 */
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

/**
 * 스크래핑 실행 및 알림 체크
 * @async
 * @function
 * @returns {Promise<void>}
 * @throws {Error} 스크래핑 또는 알림 발송 실패 시
 * @description
 * - 활성 설정 기반으로 스크래핑 실행
 * - 스크래핑된 항목 수 로깅
 * - 최신 예약 가능 현황 조회
 * - 사용자 설정과 매칭하여 알림 발송
 */
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

/**
 * 수동 스크래핑 실행 (테스트용)
 * @async
 * @function
 * @returns {Promise<void>}
 * @description 스케줄러 대기 없이 즉시 스크래핑 실행 (개발/테스트 용도)
 */
export const runScrapingNow = async () => {
  logger.info('🔧 Manual scraping triggered');
  await executeScraping();
};
