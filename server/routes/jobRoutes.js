import express from 'express';
import {
  getJobs,
  getJobById,
  createJob,
  updateJob,
  applyForJob,
  getCompanyJobs
} from '../controllers/jobController.js';
import {
  authenticateToken,
  requireCompany,
  requireStudent,
  requireAdmin
} from '../middleware/authMiddleware.js';
import {
  checkResourceOwnership,
  checkJobAvailability
} from '../middleware/roleMiddleware.js';
import { validatePagination } from '../middleware/validationMiddleware.js';
import { collections } from '../config/database.js'; // ADD THIS IMPORT

const router = express.Router();

// Public routes
router.get('/', validatePagination, getJobs);
router.get('/:id', getJobById);

// Protected routes
router.use(authenticateToken);

// Job application (Students only)
router.post('/:id/apply', requireStudent, checkJobAvailability, applyForJob);

// Job management (Companies only)
router.post('/', requireCompany, createJob);
router.get('/company/my-jobs', requireCompany, validatePagination, getCompanyJobs);
router.put('/:id', requireCompany, checkResourceOwnership(collections.JOBS), updateJob);

// Admin routes
router.get('/admin/all', requireAdmin, validatePagination, getJobs);

export default router;