import { sendEmail } from '../config/email.js';
import { logger } from '../utils/logger.js';
import { firestoreService } from './firestore.service.js';
import { retryStrategies } from '../utils/retry.js';

/**
 * 알림 서비스
 * @class
 * @description 캠핑장 예약 가능 시 사용자에게 이메일 알림을 발송하는 서비스
 */
export class NotificationService {
  /**
   * 새로운 예약 가능 현황을 확인하고 알림 발송
   * @async
   * @param {Array} newAvailability - 스크래핑된 예약 가능 현황 배열
   * @returns {Promise<void>}
   * @description
   * - 모든 활성 사용자 설정을 조회
   * - 각 설정의 조건(캠핑장, 지역, 구역, 날짜)과 매칭
   * - 조건 일치 시 이메일 알림 발송 및 설정 비활성화
   */
  async checkAndNotify(newAvailability) {
    try {
      logger.info('🔔 Checking for notification triggers...');

      // Get all active user settings
      const activeSettings = await firestoreService.getAllActiveSettings();

      for (const setting of activeSettings) {
        // Check if this availability matches user's criteria
        const matches = this.matchesCriteria(newAvailability, setting);

        if (matches.length > 0) {
          await this.sendNotifications(setting, matches);
        }
      }
    } catch (error) {
      logger.error('Error in checkAndNotify:', error);
      throw error;
    }
  }

  /**
   * 예약 가능 현황이 사용자 설정 조건과 일치하는지 확인
   * @param {Array} availabilityList - 예약 가능 현황 목록
   * @param {Object} setting - 사용자 설정 객체
   * @returns {Array} 조건에 일치하는 예약 가능 항목 배열
   * @description
   * - 캠핑장명, 지역, 구역(OR 조건), 날짜 범위 확인
   * - availableCount > 0인 항목만 반환
   */
  matchesCriteria(availabilityList, setting) {
    const matches = [];

    for (const item of availabilityList) {
      // Check camping name
      if (setting.campingName && item.campingName !== setting.campingName) {
        continue;
      }

      // Check region
      if (setting.region && item.region !== setting.region) {
        continue;
      }

      // Check area (if user specified specific areas)
      if (setting.area && setting.area.length > 0) {
        if (!setting.area.includes(item.area)) {
          continue;
        }
      }

      // Check date range
      const itemDate = new Date(item.date);
      const dateFrom = setting.dateFrom ? new Date(setting.dateFrom) : null;
      const dateTo = setting.dateTo ? new Date(setting.dateTo) : null;

      if (dateFrom && itemDate < dateFrom) {
        continue;
      }

      if (dateTo && itemDate > dateTo) {
        continue;
      }

      // Check if there's availability
      if (item.availableCount > 0) {
        matches.push(item);
      }
    }

    return matches;
  }

  /**
   * 알림 발송 (중복 방지 포함)
   * @async
   * @param {Object} setting - 사용자 설정 객체
   * @param {Array} matches - 조건에 일치하는 예약 가능 항목 배열
   * @returns {Promise<void>}
   * @description
   * - 이미 알림을 발송한 설정인지 확인 (중복 방지)
   * - 첫 번째 매칭 항목에 대해 이메일 알림 발송
   * - Firestore에 알림 기록 저장
   * - 알림 발송 후 설정을 자동으로 비활성화 (1회성 알림)
   */
  async sendNotifications(setting, matches) {
    try {
      // Get user info
      const userId = setting.userId;

      // Check if this setting has already triggered a notification
      const hasNotified = await this.hasSettingNotified(setting.id);

      if (hasNotified) {
        logger.info(
          `Setting ${setting.id} has already triggered notification, ensuring it's deactivated`
        );

        // Ensure the setting is deactivated (in case deactivation failed before)
        await firestoreService.updateUserSetting(setting.id, { isActive: false });
        logger.info(`🔕 Setting ${setting.id} deactivated (already notified)`);
        return;
      }

      // Send notification for the first match only (to avoid spam)
      if (matches.length > 0) {
        const match = matches[0]; // Send only for the first available match
        const notificationKey = `${match.campingName}-${match.area}-${match.date}`;

        // Send email notification
        await this.sendEmailNotification(userId, setting, match);

        // TODO: Send push notification if user has pushToken

        // Save notification record
        await firestoreService.saveNotification({
          userId,
          settingId: setting.id,
          campingName: match.campingName,
          area: match.area,
          date: match.date,
          availableCount: match.availableCount,
          notificationType: 'email'
        });

        logger.info(`✅ Notification sent to user ${userId} for ${notificationKey}`);

        // Deactivate the setting after sending notification
        await firestoreService.updateUserSetting(setting.id, { isActive: false });
        logger.info(`🔕 Setting ${setting.id} deactivated after sending notification`);
      }
    } catch (error) {
      logger.error('Error sending notifications:', error);
      throw error;
    }
  }

  /**
   * 이메일 알림 발송
   * @async
   * @param {string} userId - 사용자 ID
   * @param {Object} setting - 사용자 설정 객체
   * @param {Object} match - 매칭된 예약 가능 정보
   * @returns {Promise<void>}
   * @throws {Error} 이메일 발송 실패 시
   * @description
   * - Firestore에서 사용자 정보 조회 (notificationEmail 우선, 없으면 email 사용)
   * - HTML 형식의 이메일 생성 (캠핑장 정보, 날짜, 예약 가능 수 포함)
   * - Retry 전략을 적용하여 이메일 발송
   */
  async sendEmailNotification(userId, setting, match) {
    try {
      // Get user info from Firestore
      const db = firestoreService.getDb();
      const userDoc = await db.collection('users').doc(userId).get();

      let userEmail = 'user@example.com';
      if (userDoc.exists) {
        const userData = userDoc.data();
        // Use notificationEmail if available, otherwise use email
        userEmail = userData.notificationEmail || userData.email;
      }

      if (!userEmail || userEmail === 'user@example.com') {
        logger.warn(`No valid email found for user ${userId}`);
        return;
      }

      const subject = `🏕️ 캠핑장 예약 가능! - ${match.campingName}`;

      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2ecc71;">🏕️ 캠핑장 예약이 가능합니다!</h2>

          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">예약 정보</h3>
            <p><strong>캠핑장:</strong> ${match.campingName}</p>
            <p><strong>지역:</strong> ${match.region}</p>
            <p><strong>구역:</strong> ${match.area}</p>
            <p><strong>날짜:</strong> ${match.date}</p>
            <p><strong>예약 가능 수:</strong> <span style="color: #e74c3c; font-size: 18px; font-weight: bold;">${match.availableCount}</span></p>
          </div>

          <p style="color: #e74c3c; font-weight: bold;">⚠️ 빠르게 예약하세요! 자리가 곧 마감될 수 있습니다.</p>

          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; font-size: 12px; color: #7f8c8d;">
            <p>이 알림은 회원님의 설정에 따라 자동으로 발송되었습니다.</p>
            <p>알림을 중지하려면 설정에서 해당 조건을 비활성화하세요.</p>
          </div>
        </div>
      `;

      // Send email with retry logic
      await retryStrategies.email(() => sendEmail(userEmail, subject, html));
    } catch (error) {
      logger.error('Error sending email notification:', error);
      throw error;
    }
  }

  /**
   * 설정에 대한 알림 발송 이력 확인
   * @async
   * @param {string} settingId - 사용자 설정 ID
   * @returns {Promise<boolean>} 알림 발송 이력이 있으면 true, 없으면 false
   * @description 중복 알림 방지를 위해 notifications 컬렉션에서 settingId로 조회
   */
  async hasSettingNotified(settingId) {
    try {
      const db = firestoreService.getDb();
      const snapshot = await db
        .collection('notifications')
        .where('settingId', '==', settingId)
        .limit(1)
        .get();

      return !snapshot.empty;
    } catch (error) {
      logger.error('Error checking if setting has notified:', error);
      return false;
    }
  }
}

export const notificationService = new NotificationService();
