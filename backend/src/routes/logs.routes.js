import express from 'express';
import { authenticateUser } from '../middleware/auth.middleware.js';
import { firestoreService } from '../services/firestore.service.js';

const router = express.Router();

/**
 * 알림 전송 기록 조회
 * @route GET /api/logs/notifications
 * @group 로그 - 시스템 로그 조회
 * @param {string} Authorization.header.required - Firebase ID Token (Bearer 형식)
 * @param {number} limit.query - 조회할 최대 개수 (기본값: 50)
 * @returns {Array} 200 - 알림 전송 기록 목록 (사용자명 포함)
 * @returns {Object} 401 - 인증 실패
 * @description
 * - 최근 알림 전송 기록 조회 (전체 사용자)
 * - Firestore timestamp를 ISO 문자열로 변환
 * - 사용자 정보(displayName, email)와 조인하여 반환
 */
router.get('/notifications', authenticateUser, async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const notifications = await firestoreService.getNotifications(limit);

    // Get unique user IDs
    const userIds = [...new Set(notifications.map(n => n.userId))];

    // Fetch user data for all users
    const db = firestoreService.getDb();
    const userPromises = userIds.map(userId => db.collection('users').doc(userId).get());
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
      sentAt: notification.sentAt?.toDate
        ? notification.sentAt.toDate().toISOString()
        : notification.sentAt,
      userName:
        userMap[notification.userId]?.displayName ||
        userMap[notification.userId]?.email ||
        'Unknown'
    }));

    res.json({
      success: true,
      data: formattedNotifications
    });
  } catch (error) {
    next(error);
  }
});

/**
 * 스크래핑 실행 기록 조회
 * @route GET /api/logs/scraping
 * @group 로그 - 시스템 로그 조회
 * @param {string} Authorization.header.required - Firebase ID Token (Bearer 형식)
 * @param {number} limit.query - 조회할 최대 개수 (기본값: 50)
 * @returns {Array} 200 - 스크래핑 실행 기록 목록
 * @returns {Object} 401 - 인증 실패
 * @description
 * - 최근 스크래핑 실행 기록 조회
 * - 실행 상태(success, error, running), 항목 수, 에러 메시지 포함
 * - Firestore timestamp를 ISO 문자열로 변환
 */
router.get('/scraping', authenticateUser, async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const scrapingLogs = await firestoreService.getScrapingLogs(limit);

    // Convert Firestore timestamps to ISO strings
    const formattedLogs = scrapingLogs.map(log => ({
      ...log,
      startedAt: log.startedAt?.toDate ? log.startedAt.toDate().toISOString() : log.startedAt,
      completedAt: log.completedAt?.toDate
        ? log.completedAt.toDate().toISOString()
        : log.completedAt
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
