import express from 'express';
import {
  submitApplication,
  getStudentApplications,
  getApplicationById,
  updateApplicationStatus,
  withdrawApplication
} from '../controllers/applicationController.js';
import {
  authenticateToken,
  requireStudent,
  requireAdminOrInstitution
} from '../middleware/authMiddleware.js';
import {
  checkResourceOwnership,
  checkApplicationLimits,
  checkCourseAvailability
} from '../middleware/roleMiddleware.js';
import { validatePagination } from '../middleware/validationMiddleware.js';
import { collections } from '../config/database.js'; // ADD THIS IMPORT

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Student routes
router.post('/', requireStudent, checkApplicationLimits, checkCourseAvailability, submitApplication);
router.get('/my-applications', requireStudent, validatePagination, getStudentApplications);
router.get('/:id', requireStudent, checkResourceOwnership(collections.APPLICATIONS), getApplicationById);
router.patch('/:id/withdraw', requireStudent, checkResourceOwnership(collections.APPLICATIONS), withdrawApplication);

// Institution admin routes
router.get('/institution/:institutionId', requireAdminOrInstitution, validatePagination, getStudentApplications);
router.get('/:id/details', requireAdminOrInstitution, getApplicationById);
router.patch('/:id/status', requireAdminOrInstitution, updateApplicationStatus);

export default router;