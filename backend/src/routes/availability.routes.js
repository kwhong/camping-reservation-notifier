import express from 'express';
import { authenticateUser } from '../middleware/auth.middleware.js';
import { firestoreService } from '../services/firestore.service.js';

const router = express.Router();

/**
 * 예약 가능 캠핑장 조회
 * @route GET /api/availability
 * @group 예약현황 - 캠핑장 예약 가능 현황 조회
 * @param {string} Authorization.header.required - Firebase ID Token (Bearer 형식)
 * @returns {Array} 200 - 사용자의 활성 설정에 매칭되는 예약 가능 현황 목록
 * @returns {Object} 401 - 인증 실패
 * @description
 * - 사용자의 활성 설정을 기반으로 예약 가능 현황 필터링
 * - 캠핑장, 지역, 구역, 날짜 범위가 일치하는 항목만 반환
 * - availableCount > 0인 항목만 포함
 * - 활성 설정이 없으면 빈 배열 반환
 */
router.get('/', authenticateUser, async (req, res, next) => {
  try {
    const userId = req.user.uid;

    // Get user's active settings
    const userSettings = await firestoreService.getUserSettings(userId);
    const activeSettings = userSettings.filter(s => s.isActive);

    if (activeSettings.length === 0) {
      // No active settings, return empty array
      return res.json({
        success: true,
        data: []
      });
    }

    // Get all availability data
    const allAvailability = await firestoreService.getAvailability({});

    // Filter based on user's active settings
    const matchedAvailability = [];
    const addedKeys = new Set(); // To avoid duplicates

    for (const setting of activeSettings) {
      for (const item of allAvailability) {
        // Skip if already added
        const key = `${item.campingName}-${item.area}-${item.date}`;
        if (addedKeys.has(key)) continue;

        // Check if item matches this setting
        if (!matchesSetting(item, setting)) continue;

        // Only include items with available count > 0
        if (item.availableCount > 0) {
          matchedAvailability.push(item);
          addedKeys.add(key);
        }
      }
    }

    res.json({
      success: true,
      data: matchedAvailability
    });
  } catch (error) {
    next(error);
  }
});

/**
 * 예약 가능 항목이 설정 조건과 일치하는지 확인하는 헬퍼 함수
 * @function
 * @param {Object} item - 예약 가능 항목
 * @param {Object} setting - 사용자 설정
 * @returns {boolean} 조건 일치 시 true
 * @description 캠핑장명, 지역, 구역(OR), 날짜 범위 조건 검증
 */
function matchesSetting(item, setting) {
  // Check camping name
  if (setting.campingName && item.campingName !== setting.campingName) {
    return false;
  }

  // Check region
  if (setting.region && item.region !== setting.region) {
    return false;
  }

  // Check area (if user specified specific areas)
  if (setting.area && setting.area.length > 0) {
    if (!setting.area.includes(item.area)) {
      return false;
    }
  }

  // Check date range
  const itemDate = new Date(item.date);
  const dateFrom = setting.dateFrom ? new Date(setting.dateFrom) : null;
  const dateTo = setting.dateTo ? new Date(setting.dateTo) : null;

  if (dateFrom && itemDate < dateFrom) {
    return false;
  }

  if (dateTo && itemDate > dateTo) {
    return false;
  }

  return true;
}

export default router;
