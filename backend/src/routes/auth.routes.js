import express from 'express';
import { authenticateUser } from '../middleware/auth.middleware.js';
import { firestoreService } from '../services/firestore.service.js';

const router = express.Router();

/**
 * 토큰 검증 및 사용자 생성/조회
 * @route POST /api/auth/verify
 * @group 인증 - 사용자 인증 관련 API
 * @param {string} Authorization.header.required - Firebase ID Token (Bearer 형식)
 * @returns {Object} 200 - 사용자 정보
 * @returns {Object} 401 - 인증 실패
 * @description Firebase ID 토큰을 검증하고, 사용자가 없으면 생성
 */
router.post('/verify', authenticateUser, async (req, res, next) => {
  try {
    const { uid, email } = req.user;

    const user = await firestoreService.getOrCreateUser(uid, {
      email,
      displayName: email.split('@')[0]
    });

    res.json({
      success: true,
      user: {
        uid,
        email,
        ...user
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * 사용자 프로필 업데이트
 * @route PUT /api/auth/profile
 * @group 인증 - 사용자 인증 관련 API
 * @param {string} Authorization.header.required - Firebase ID Token (Bearer 형식)
 * @param {string} displayName.body - 표시 이름
 * @param {string} notificationEmail.body - 알림 받을 이메일 주소
 * @param {string} pushToken.body - 푸시 알림 토큰
 * @returns {Object} 200 - 성공 메시지
 * @returns {Object} 401 - 인증 실패
 * @description 사용자 프로필 정보를 업데이트 (선택적 필드만 업데이트)
 */
router.put('/profile', authenticateUser, async (req, res, next) => {
  try {
    const { uid } = req.user;
    const { displayName, notificationEmail, pushToken } = req.body;

    await firestoreService.updateUser(uid, {
      ...(displayName && { displayName }),
      ...(notificationEmail && { notificationEmail }),
      ...(pushToken && { pushToken })
    });

    res.json({
      success: true,
      message: 'Profile updated successfully'
    });
  } catch (error) {
    next(error);
  }
});

export default router;
