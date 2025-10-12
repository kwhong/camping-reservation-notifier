import { chromium } from 'playwright';
import { logger } from '../utils/logger.js';
import { getMonthsToScrape, getMonthsFromSettings, formatDate } from '../utils/date.js';
import { firestoreService } from './firestore.service.js';

const BASE_URL = 'https://mirihae.com/camping/calendar.do';
const BASE_PARAMS = 'checkType=&device=pc&tocken=20251009233437-4cb6fa5d-17f6-471d-8830-3b10d580e648&pageId=G24526799&groupCode=dytc&selectStartDate=&selectEndDate=&selectItemId=&selectTicketId=&cnt=&infoType=&approvalId=&txId=';

const CAMPING_INFO = {
  name: '다리안계곡캠핑장',
  region: '충북 단양'
};

export class ScraperService {
  async scrapeCampingSite(activeSettings = []) {
    const logId = await firestoreService.createScrapingLog({
      status: 'running',
      itemsScraped: 0
    });

    let browser;
    let totalItemsScraped = 0;

    try {
      logger.info('🔍 Starting camping site scraping...');

      browser = await chromium.launch({ headless: true });
      const context = await browser.newContext();
      const page = await context.newPage();

      // Get months from active settings, or fall back to default 3 months
      let months = [];
      if (activeSettings.length > 0) {
        months = getMonthsFromSettings(activeSettings);
        if (months.length === 0) {
          // If no valid dates in settings, use default
          months = getMonthsToScrape();
          logger.info('No valid dates in settings, using default months');
        } else {
          logger.info(`Scraping months from active settings: ${months.join(', ')}`);
        }
      } else {
        months = getMonthsToScrape();
        logger.info(`No active settings, using default months: ${months.join(', ')}`);
      }

      // Collect all data first
      const allAvailabilityData = [];

      for (const month of months) {
        logger.info(`Scraping month: ${month}`);
        const url = `${BASE_URL}?${BASE_PARAMS}&selectMonth=${month}`;

        await page.goto(url, { waitUntil: 'networkidle' });
        await page.waitForTimeout(2000); // Wait for dynamic content

        // Parse the page
        const availabilityData = await this.parsePage(page, month);
        totalItemsScraped += availabilityData.length;

        // Add camping info and collect
        const dataWithInfo = availabilityData.map(item => ({
          ...item,
          campingName: CAMPING_INFO.name,
          region: CAMPING_INFO.region
        }));

        allAvailabilityData.push(...dataWithInfo);

        logger.info(`Scraped ${availabilityData.length} items for ${month}`);
      }

      // Batch save all data at once (more efficient)
      if (allAvailabilityData.length > 0) {
        logger.info(`Saving ${allAvailabilityData.length} items to Firestore...`);
        await firestoreService.batchSaveAvailability(allAvailabilityData);
        logger.info('✅ All data saved successfully');
      }

      await browser.close();

      await firestoreService.updateScrapingLog(logId, {
        status: 'success',
        itemsScraped: totalItemsScraped
      });

      logger.info(`✅ Scraping completed successfully. Total items: ${totalItemsScraped}`);
      return totalItemsScraped;

    } catch (error) {
      logger.error('❌ Scraping error:', error);

      if (browser) {
        await browser.close();
      }

      await firestoreService.updateScrapingLog(logId, {
        status: 'error',
        errorMessage: error.message,
        itemsScraped: totalItemsScraped
      });

      throw error;
    }
  }

  async parsePage(page, month) {
    const availabilityData = [];

    try {
      // Get all date divs - structure: <div id="YYYY-MM-DD">
      const datePattern = /^\d{4}-\d{2}-\d{2}$/;

      // Get all divs and filter by date pattern in ID
      const allDivs = await page.$$('div[id]');

      for (const dateDiv of allDivs) {
        const dateId = await dateDiv.getAttribute('id');

        // Check if ID matches date pattern (YYYY-MM-DD)
        if (!dateId || !datePattern.test(dateId)) continue;

        const fullDate = dateId;
        logger.debug(`Processing date: ${fullDate}`);

        // Within each date div, find all <dl class="schedule"> elements
        // Structure: <div class="element"> > <div class="district"> > <dl class="schedule">
        const dlElements = await dateDiv.$$('dl.schedule');

        for (const dl of dlElements) {
          // Get availability count from <dt> tag
          const dtElement = await dl.$('dt');
          if (!dtElement) continue;

          const countText = await dtElement.textContent();
          const availableCount = parseInt(countText?.trim() || '0');

          // Get area name from <dd> tag
          const ddElement = await dl.$('dd');
          if (!ddElement) continue;

          const areaName = await ddElement.textContent();
          if (!areaName) continue;

          availabilityData.push({
            area: areaName.trim(),
            date: fullDate,
            availableCount: availableCount
          });

          logger.debug(`  Area: ${areaName.trim()}, Available: ${availableCount}`);
        }
      }

      return availabilityData;

    } catch (error) {
      logger.error('Error parsing page:', error);
      throw error;
    }
  }
}

export const scraperService = new ScraperService();
