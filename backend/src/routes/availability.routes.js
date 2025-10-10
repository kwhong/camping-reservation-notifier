import express from 'express';
import { authenticateUser } from '../middleware/auth.middleware.js';
import { firestoreService } from '../services/firestore.service.js';

const router = express.Router();

// Get available camping sites based on user's active settings
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

// Helper function to check if availability item matches setting criteria
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
