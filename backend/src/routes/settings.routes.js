import express from 'express';
import { authenticateUser } from '../middleware/auth.middleware.js';
import { firestoreService } from '../services/firestore.service.js';

const router = express.Router();

// Get all user settings
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

// Create new setting
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

// Update setting
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

// Delete setting
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
