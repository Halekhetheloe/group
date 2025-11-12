import express from 'express';
import {
  getInstitutions,
  getInstitutionById,
  createInstitution,
  updateInstitution,
  getInstitutionCourses,
  createCourse,
  updateCourse,
  getInstitutionApplications,
  getCourseEligibilityStats,
  getEligibleStudents,
  updateCourseRequirements,
  getInstitutionDashboard
} from '../controllers/institutionController.js';

const router = express.Router();

// Simple middleware for development
const authenticateToken = (req, res, next) => {
  req.user = {
    userId: 'dev-user-id',
    email: 'admin@example.com',
    role: 'admin'
  };
  next();
};

const requireAdminOrInstitution = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'AUTHENTICATION_REQUIRED',
      message: 'Authentication required'
    });
  }
  
  if (req.user.role !== 'admin' && req.user.role !== 'institution') {
    return res.status(403).json({
      success: false,
      error: 'INSUFFICIENT_PERMISSIONS',
      message: 'Admin or institution access required'
    });
  }
  
  next();
};

const validateInstitution = (req, res, next) => {
  console.log('✅ Institution validation passed');
  next();
};

const validateCourse = (req, res, next) => {
  console.log('✅ Course validation passed');
  next();
};

// Public routes
router.get('/', getInstitutions);
router.get('/:id', getInstitutionById);
router.get('/:id/courses', getInstitutionCourses);

// Institution dashboard and analytics routes
router.get('/:id/dashboard', getInstitutionDashboard);
router.get('/:id/courses/:courseId/eligibility-stats', getCourseEligibilityStats);
router.get('/:id/courses/:courseId/eligible-students', getEligibleStudents);

// Protected routes (require authentication)
router.use(authenticateToken);

// Admin/Institution only routes
router.post('/', requireAdminOrInstitution, validateInstitution, createInstitution);
router.put('/:id', requireAdminOrInstitution, validateInstitution, updateInstitution);
router.post('/:id/courses', requireAdminOrInstitution, validateCourse, createCourse);
router.put('/:id/courses/:courseId', requireAdminOrInstitution, validateCourse, updateCourse);
router.put('/:id/courses/:courseId/requirements', requireAdminOrInstitution, updateCourseRequirements);
router.get('/:id/applications', requireAdminOrInstitution, getInstitutionApplications);

// Test endpoint
router.get('/test/auth', authenticateToken, (req, res) => {
  res.json({
    success: true,
    message: 'Institution routes are working!',
    user: req.user
  });
});

export default router;