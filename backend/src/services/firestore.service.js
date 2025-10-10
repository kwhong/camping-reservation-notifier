import { getFirestore } from '../config/firebase.js';
import { logger } from '../utils/logger.js';

const COLLECTIONS = {
  USERS: 'users',
  USER_SETTINGS: 'userSettings',
  AVAILABILITY: 'availability',
  NOTIFICATIONS: 'notifications',
  SCRAPING_LOGS: 'scrapingLogs'
};

export class FirestoreService {
  constructor() {
    this.db = null;
  }

  getDb() {
    if (!this.db) {
      this.db = getFirestore();
    }
    return this.db;
  }

  // User Settings
  async createUserSetting(userId, settingData) {
    try {
      const docRef = await this.getDb().collection(COLLECTIONS.USER_SETTINGS).add({
        userId,
        ...settingData,
        isActive: true,
        createdAt: new Date()
      });
      logger.info(`User setting created: ${docRef.id}`);
      return { id: docRef.id, ...settingData };
    } catch (error) {
      logger.error('Error creating user setting:', error);
      throw error;
    }
  }

  async getUserSettings(userId) {
    try {
      const snapshot = await this.getDb().collection(COLLECTIONS.USER_SETTINGS)
        .where('userId', '==', userId)
        .get();

      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      logger.error('Error getting user settings:', error);
      throw error;
    }
  }

  async getAllActiveSettings() {
    try {
      const snapshot = await this.getDb().collection(COLLECTIONS.USER_SETTINGS)
        .where('isActive', '==', true)
        .get();

      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      logger.error('Error getting active settings:', error);
      throw error;
    }
  }

  async updateUserSetting(settingId, updateData) {
    try {
      await this.getDb().collection(COLLECTIONS.USER_SETTINGS).doc(settingId).update(updateData);
      logger.info(`User setting updated: ${settingId}`);
    } catch (error) {
      logger.error('Error updating user setting:', error);
      throw error;
    }
  }

  async deleteUserSetting(settingId) {
    try {
      await this.getDb().collection(COLLECTIONS.USER_SETTINGS).doc(settingId).delete();
      logger.info(`User setting deleted: ${settingId}`);
    } catch (error) {
      logger.error('Error deleting user setting:', error);
      throw error;
    }
  }

  // Availability
  async saveAvailability(availabilityData) {
    try {
      await this.getDb().collection(COLLECTIONS.AVAILABILITY).add({
        ...availabilityData,
        scrapedAt: new Date()
      });
    } catch (error) {
      logger.error('Error saving availability:', error);
      throw error;
    }
  }

  async getAvailability(filters = {}) {
    try {
      let query = this.getDb().collection(COLLECTIONS.AVAILABILITY);

      // If we have campingName, use it as the primary filter
      if (filters.campingName) {
        query = query.where('campingName', '==', filters.campingName);

        // For now, avoid complex composite queries that need indexes
        // Just use simple orderBy and filter in memory if needed
        query = query.orderBy('date', 'desc').limit(500);
      } else if (filters.region) {
        query = query.where('region', '==', filters.region)
          .orderBy('date', 'desc')
          .limit(500);
      } else {
        // No filters, just get recent records
        query = query.orderBy('scrapedAt', 'desc').limit(100);
      }

      const snapshot = await query.get();
      let results = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Apply additional filters in memory to avoid needing composite indexes
      if (filters.dateFrom) {
        results = results.filter(item => item.date >= filters.dateFrom);
      }
      if (filters.dateTo) {
        results = results.filter(item => item.date <= filters.dateTo);
      }
      if (filters.region && filters.campingName) {
        results = results.filter(item => item.region === filters.region);
      }

      return results;
    } catch (error) {
      logger.error('Error getting availability:', error);
      throw error;
    }
  }

  // Notifications
  async saveNotification(notificationData) {
    try {
      await this.getDb().collection(COLLECTIONS.NOTIFICATIONS).add({
        ...notificationData,
        sentAt: new Date()
      });
      logger.info(`Notification saved for user: ${notificationData.userId}`);
    } catch (error) {
      logger.error('Error saving notification:', error);
      throw error;
    }
  }

  async getNotifications(limit = 50) {
    try {
      const snapshot = await this.getDb().collection(COLLECTIONS.NOTIFICATIONS)
        .orderBy('sentAt', 'desc')
        .limit(limit)
        .get();

      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      logger.error('Error getting notifications:', error);
      throw error;
    }
  }

  // Scraping Logs
  async createScrapingLog(logData) {
    try {
      const docRef = await this.getDb().collection(COLLECTIONS.SCRAPING_LOGS).add({
        ...logData,
        startedAt: new Date()
      });
      return docRef.id;
    } catch (error) {
      logger.error('Error creating scraping log:', error);
      throw error;
    }
  }

  async updateScrapingLog(logId, updateData) {
    try {
      await this.getDb().collection(COLLECTIONS.SCRAPING_LOGS).doc(logId).update({
        ...updateData,
        completedAt: new Date()
      });
    } catch (error) {
      logger.error('Error updating scraping log:', error);
      throw error;
    }
  }

  async getScrapingLogs(limit = 50) {
    try {
      const snapshot = await this.getDb().collection(COLLECTIONS.SCRAPING_LOGS)
        .orderBy('startedAt', 'desc')
        .limit(limit)
        .get();

      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      logger.error('Error getting scraping logs:', error);
      throw error;
    }
  }

  // User
  async getOrCreateUser(userId, userData) {
    try {
      const userDoc = await this.getDb().collection(COLLECTIONS.USERS).doc(userId).get();

      if (!userDoc.exists) {
        await this.getDb().collection(COLLECTIONS.USERS).doc(userId).set({
          ...userData,
          createdAt: new Date()
        });
        logger.info(`New user created: ${userId}`);
      }

      return userDoc.exists ? userDoc.data() : userData;
    } catch (error) {
      logger.error('Error getting or creating user:', error);
      throw error;
    }
  }

  async updateUser(userId, updateData) {
    try {
      await this.getDb().collection(COLLECTIONS.USERS).doc(userId).update(updateData);
      logger.info(`User updated: ${userId}`);
    } catch (error) {
      logger.error('Error updating user:', error);
      throw error;
    }
  }
}

export const firestoreService = new FirestoreService();
