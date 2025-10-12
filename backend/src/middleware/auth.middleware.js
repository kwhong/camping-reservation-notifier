import { getAuth } from '../config/firebase.js';
import { logger } from '../utils/logger.js';

export const authenticateUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split('Bearer ')[1];
    const auth = getAuth();

    try {
      const decodedToken = await auth.verifyIdToken(token);
      req.user = {
        uid: decodedToken.uid,
        email: decodedToken.email
      };
      next();
    } catch (error) {
      logger.warn('Token verification error', { error: error.message });
      return res.status(401).json({ error: 'Invalid token' });
    }
  } catch (error) {
    logger.error('Authentication error', { error: error.message });
    return res.status(500).json({ error: 'Authentication failed' });
  }
};
