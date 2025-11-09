import express from 'express';
import {
  getDashboardStats,
  getAllUsers,
  updateUserStatus,
  getAllInstitutions,
  updateInstitutionStatus,
  getAllCompanies,
  updateCompanyStatus,
  getSystemReports
} from '../controllers/adminController.js';
import {
  authenticateToken,
  requireAdmin
} from '../middleware/authMiddleware.js';
import { validatePagination, validateDateRange } from '../middleware/validationMiddleware.js';

const router = express.Router();

// All routes require admin authentication
router.use(authenticateToken, requireAdmin);

// Dashboard and statistics
router.get('/dashboard/stats', getDashboardStats);
router.get('/reports', validateDateRange, getSystemReports);

// User management
router.get('/users', validatePagination, getAllUsers);
router.patch('/users/:id/status', updateUserStatus);

// Institution management
router.get('/institutions', validatePagination, getAllInstitutions);
router.patch('/institutions/:id/status', updateInstitutionStatus);

// Company management
router.get('/companies', validatePagination, getAllCompanies);
router.patch('/companies/:id/status', updateCompanyStatus);

export default router;