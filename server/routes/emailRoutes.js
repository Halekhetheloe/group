import express from 'express';
import {
  sendBulkNotifications,
  sendCustomEmail,
  getEmailTemplates,
  testEmailService,
  getEmailStats
} from '../controllers/emailController.js';
import {
  authenticateToken,
  requireAdmin
} from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes require admin authentication
router.use(authenticateToken, requireAdmin);

// Email management
router.post('/bulk-notifications', sendBulkNotifications);
router.post('/send-custom', sendCustomEmail);
router.get('/templates', getEmailTemplates);
router.post('/test', testEmailService);
router.get('/stats', getEmailStats);

export default router;