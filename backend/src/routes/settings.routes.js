import express from 'express';
import { authenticateUser } from '../middleware/auth.middleware.js';
import { firestoreService } from '../services/firestore.service.js';

const router = express.Router();

/**
 * 사용자 설정 목록 조회
 * @route GET /api/settings
 * @group 설정 - 사용자 알림 설정 관리
 * @param {string} Authorization.header.required - Firebase ID Token (Bearer 형식)
 * @returns {Array} 200 - 사용자 설정 목록
 * @returns {Object} 401 - 인증 실패
 * @description 로그인한 사용자의 모든 캠핑 알림 설정 조회
 */
router.get('/', authenticateUser, async (req, res, next) => {
  try {
    const { uid } = req.user;
    const settings = await firestoreService.getUserSettings(uid);

    res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    next(error);
  }
});

/**
 * 새 설정 생성
 * @route POST /api/settings
 * @group 설정 - 사용자 알림 설정 관리
 * @param {string} Authorization.header.required - Firebase ID Token (Bearer 형식)
 * @param {string} campingName.body - 캠핑장 이름 (기본값: '다리안계곡캠핑장')
 * @param {string} region.body - 지역 (기본값: '충북 단양')
 * @param {Array<string>} area.body - 구역 목록 (빈 배열이면 모든 구역)
 * @param {string} dateFrom.body.required - 시작 날짜 (YYYY-MM-DD)
 * @param {string} dateTo.body - 종료 날짜 (YYYY-MM-DD, 기본값: dateFrom)
 * @returns {Object} 201 - 생성된 설정 정보
 * @returns {Object} 400 - 필수 필드 누락
 * @returns {Object} 401 - 인증 실패
 * @description 새로운 캠핑 알림 설정 생성 (기본적으로 활성화 상태)
 */
router.post('/', authenticateUser, async (req, res, next) => {
  try {
    const { uid } = req.user;
    const { campingName, region, area, dateFrom, dateTo } = req.body;

    // Validation
    if (!dateFrom) {
      return res.status(400).json({ error: 'dateFrom is required' });
    }

    const setting = await firestoreService.createUserSetting(uid, {
      campingName: campingName || '다리안계곡캠핑장',
      region: region || '충북 단양',
      area: area || [],
      dateFrom,
      dateTo: dateTo || dateFrom
    });

    res.status(201).json({
      success: true,
      data: setting
    });
  } catch (error) {
    next(error);
  }
});

/**
 * 설정 업데이트
 * @route PUT /api/settings/:id
 * @group 설정 - 사용자 알림 설정 관리
 * @param {string} Authorization.header.required - Firebase ID Token (Bearer 형식)
 * @param {string} id.path.required - 설정 ID
 * @param {string} campingName.body - 캠핑장 이름
 * @param {string} region.body - 지역
 * @param {Array<string>} area.body - 구역 목록
 * @param {string} dateFrom.body - 시작 날짜 (YYYY-MM-DD)
 * @param {string} dateTo.body - 종료 날짜 (YYYY-MM-DD)
 * @param {boolean} isActive.body - 활성화 상태
 * @returns {Object} 200 - 성공 메시지
 * @returns {Object} 403 - 권한 없음 (다른 사용자의 설정)
 * @returns {Object} 404 - 설정을 찾을 수 없음
 * @description 기존 캠핑 알림 설정 업데이트 (본인 설정만 수정 가능)
 */
router.put('/:id', authenticateUser, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { uid } = req.user;
    const { campingName, region, area, dateFrom, dateTo, isActive } = req.body;

    // Check if setting exists and belongs to the user
    const setting = await firestoreService.getUserSetting(id);

    if (!setting) {
      return res.status(404).json({ error: 'Setting not found' });
    }

    if (setting.userId !== uid) {
      return res.status(403).json({ error: 'Unauthorized: You can only update your own settings' });
    }

    const updateData = {};
    if (campingName !== undefined) updateData.campingName = campingName;
    if (region !== undefined) updateData.region = region;
    if (area !== undefined) updateData.area = area;
    if (dateFrom !== undefined) updateData.dateFrom = dateFrom;
    if (dateTo !== undefined) updateData.dateTo = dateTo;
    if (isActive !== undefined) updateData.isActive = isActive;

    await firestoreService.updateUserSetting(id, updateData);

    res.json({
      success: true,
      message: 'Setting updated successfully'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * 설정 삭제
 * @route DELETE /api/settings/:id
 * @group 설정 - 사용자 알림 설정 관리
 * @param {string} Authorization.header.required - Firebase ID Token (Bearer 형식)
 * @param {string} id.path.required - 설정 ID
 * @returns {Object} 200 - 성공 메시지
 * @returns {Object} 403 - 권한 없음 (다른 사용자의 설정)
 * @returns {Object} 404 - 설정을 찾을 수 없음
 * @description 캠핑 알림 설정 삭제 (본인 설정만 삭제 가능)
 */
router.delete('/:id', authenticateUser, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { uid } = req.user;

    // Check if setting exists and belongs to the user
    const setting = await firestoreService.getUserSetting(id);

    if (!setting) {
      return res.status(404).json({ error: 'Setting not found' });
    }

    if (setting.userId !== uid) {
      return res.status(403).json({ error: 'Unauthorized: You can only delete your own settings' });
    }

    await firestoreService.deleteUserSetting(id);

    res.json({
      success: true,
      message: 'Setting deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

export default router;
