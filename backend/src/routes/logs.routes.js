import express from 'express';
import { authenticateUser } from '../middleware/auth.middleware.js';
import { firestoreService } from '../services/firestore.service.js';

const router = express.Router();

// Get notification logs
router.get('/notifications', authenticateUser, async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const notifications = await firestoreService.getNotifications(limit);

    // Get unique user IDs
    const userIds = [...new Set(notifications.map(n => n.userId))];

    // Fetch user data for all users
    const db = firestoreService.getDb();
    const userPromises = userIds.map(userId =>
      db.collection('users').doc(userId).get()
    );
    const userDocs = await Promise.all(userPromises);

    // Create user map
    const userMap = {};
    userDocs.forEach((doc, index) => {
      if (doc.exists) {
        userMap[userIds[index]] = doc.data();
      }
    });

    // Convert Firestore timestamps to ISO strings and add user info
    const formattedNotifications = notifications.map(notification => ({
      ...notification,
      sentAt: notification.sentAt?.toDate ? notification.sentAt.toDate().toISOString() : notification.sentAt,
      userName: userMap[notification.userId]?.displayName || userMap[notification.userId]?.email || 'Unknown'
    }));

    res.json({
      success: true,
      data: formattedNotifications
    });
  } catch (error) {
    next(error);
  }
});

// Get scraping logs
router.get('/scraping', authenticateUser, async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const scrapingLogs = await firestoreService.getScrapingLogs(limit);

    // Convert Firestore timestamps to ISO strings
    const formattedLogs = scrapingLogs.map(log => ({
      ...log,
      startedAt: log.startedAt?.toDate ? log.startedAt.toDate().toISOString() : log.startedAt,
      completedAt: log.completedAt?.toDate ? log.completedAt.toDate().toISOString() : log.completedAt
    }));

    res.json({
      success: true,
      data: formattedLogs
    });
  } catch (error) {
    next(error);
  }
});

export default router;
