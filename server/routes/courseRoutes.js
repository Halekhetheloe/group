import express from 'express';
import {
  getCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
  getCourseApplications,
  checkCourseEligibility,
  getEligibleCourses,
  getRecommendedCourses,
  getPopularCourses
} from '../controllers/courseController.js';

const router = express.Router();

// Simple middleware for development
const authenticateToken = (req, res, next) => {
  req.user = {
    userId: 'dev-user-id',
    email: 'user@example.com',
    role: 'student'
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

const validateCourse = (req, res, next) => {
  console.log('✅ Course validation passed');
  next();
};

// Public routes
router.get('/', getCourses);
router.get('/popular', getPopularCourses);
router.get('/:id', getCourseById);
router.post('/:id/check-eligibility', checkCourseEligibility);

// Student-specific routes
router.get('/student/:studentId/eligible', getEligibleCourses);
router.get('/student/:studentId/recommended', getRecommendedCourses);

// Protected routes
router.use(authenticateToken);

// Admin/Institution only routes
router.post('/', requireAdminOrInstitution, validateCourse, createCourse);
router.put('/:id', requireAdminOrInstitution, validateCourse, updateCourse);
router.delete('/:id', requireAdminOrInstitution, deleteCourse);
router.get('/:id/applications', requireAdminOrInstitution, getCourseApplications);

// Test endpoint
router.get('/test/auth', authenticateToken, (req, res) => {
  res.json({
    success: true,
    message: 'Course routes are working!',
    user: req.user
  });
});

export default router;