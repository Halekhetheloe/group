import express from 'express';
import {
  uploadTranscript,
  getStudentTranscripts,
  getTranscriptById,
  verifyTranscript,
  deleteTranscript,
  getTranscriptStats
} from '../controllers/transcriptController.js';
import {
  authenticateToken,
  requireStudent,
  requireAdmin
} from '../middleware/authMiddleware.js';
import { collections } from '../config/database.js'; // Add this import
import { uploadTranscript as uploadMiddleware } from '../middleware/uploadMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Student routes
router.post('/upload', 
  requireStudent, 
  uploadMiddleware, // This already includes file validation
  uploadTranscript
);
router.get('/my-transcripts', requireStudent, getStudentTranscripts);
router.get('/stats', requireStudent, getTranscriptStats);
router.get('/:id', requireStudent, getTranscriptById);
router.delete('/:id', requireStudent, deleteTranscript);

// Admin routes
router.get('/admin/student/:studentId', requireAdmin, getStudentTranscripts);
router.get('/admin/:id', requireAdmin, getTranscriptById);
router.patch('/admin/:id/verify', requireAdmin, verifyTranscript);

// Institution/Company access
router.get('/access/:studentId', requireAdmin, getStudentTranscripts);

export default router;