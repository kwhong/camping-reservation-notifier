/**
 * Get current date in Korea timezone (KST: UTC+9)
 */
export const getKoreaDate = () => {
  const now = new Date();
  const koreaTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Seoul' }));
  return koreaTime;
};

/**
 * Get current hour in Korea timezone (0-23)
 */
export const getKoreaHour = () => {
  return getKoreaDate().getHours();
};

/**
 * Check if current time is in sleep period (01:00 - 08:00 KST)
 */
export const isSleepTime = () => {
  const hour = getKoreaHour();
  return hour >= 1 && hour < 8;
};

/**
 * Format date to YYYY-MM-DD
 */
export const formatDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Format date to YYYY-MM (for URL parameter)
 */
export const formatYearMonth = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

/**
 * Get array of months to scrape [current, next, next+1]
 */
export const getMonthsToScrape = () => {
  const now = getKoreaDate();
  const months = [];

  for (let i = 0; i < 3; i++) {
    const date = new Date(now);
    date.setMonth(now.getMonth() + i);
    months.push(formatYearMonth(date));
  }

  return months;
};

/**
 * Get unique months from active user settings
 * @param {Array} activeSettings - Array of active user settings
 * @returns {Array} - Array of unique YYYY-MM strings sorted
 */
export const getMonthsFromSettings = (activeSettings) => {
  const monthsSet = new Set();

  for (const setting of activeSettings) {
    const dateFrom = setting.dateFrom ? new Date(setting.dateFrom) : null;
    const dateTo = setting.dateTo ? new Date(setting.dateTo) : null;

    // If no dates specified, skip this setting
    if (!dateFrom && !dateTo) continue;

    // If only dateFrom exists, add that month
    if (dateFrom && !dateTo) {
      monthsSet.add(formatYearMonth(dateFrom));
      continue;
    }

    // If only dateTo exists, add that month
    if (!dateFrom && dateTo) {
      monthsSet.add(formatYearMonth(dateTo));
      continue;
    }

    // If both exist, add all months in the range
    if (dateFrom && dateTo) {
      const start = new Date(dateFrom);
      const end = new Date(dateTo);

      const current = new Date(start.getFullYear(), start.getMonth(), 1);
      const endMonth = new Date(end.getFullYear(), end.getMonth(), 1);

      while (current <= endMonth) {
        monthsSet.add(formatYearMonth(current));
        current.setMonth(current.getMonth() + 1);
      }
    }
  }

  // Convert Set to Array and sort
  return Array.from(monthsSet).sort();
};

/**
 * Get random delay between min and max seconds
 */
export const getRandomDelay = (minSeconds = 5, maxSeconds = 20) => {
  return Math.floor(Math.random() * (maxSeconds - minSeconds + 1) + minSeconds) * 1000;
};
