import express from 'express';
import { authenticateUser } from '../middleware/auth.middleware.js';
import { firestoreService } from '../services/firestore.service.js';

const router = express.Router();

// Verify token and get/create user
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

// Update user profile
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
