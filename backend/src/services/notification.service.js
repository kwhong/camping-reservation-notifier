import { sendEmail } from '../config/email.js';
import { logger } from '../utils/logger.js';
import { firestoreService } from './firestore.service.js';
import { retryStrategies } from '../utils/retry.js';

export class NotificationService {
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
