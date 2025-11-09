import express from 'express';
import authRoutes from './authRoutes.js';
import userRoutes from './userRoutes.js';
import institutionRoutes from './institutionRoutes.js';
import courseRoutes from './courseRoutes.js';
import applicationRoutes from './applicationRoutes.js';
import jobRoutes from './jobRoutes.js';
import transcriptRoutes from './transcriptRoutes.js';
import adminRoutes from './adminRoutes.js';
import emailRoutes from './emailRoutes.js';

const router = express.Router();

// API routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/institutions', institutionRoutes);
router.use('/courses', courseRoutes);
router.use('/applications', applicationRoutes);
router.use('/jobs', jobRoutes);
router.use('/transcripts', transcriptRoutes);
router.use('/admin', adminRoutes);
router.use('/email', emailRoutes);

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Career Guidance Platform API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// API documentation endpoint
router.get('/docs', (req, res) => {
  res.json({
    success: true,
    message: 'Career Guidance Platform API Documentation',
    endpoints: {
      auth: {
        'POST /api/auth/register': 'Register a new user',
        'POST /api/auth/login': 'User login',
        'POST /api/auth/verify-email': 'Verify email address',
        'POST /api/auth/forgot-password': 'Request password reset',
        'POST /api/auth/reset-password': 'Reset password',
        'GET /api/auth/profile': 'Get user profile (authenticated)',
        'PUT /api/auth/profile': 'Update user profile (authenticated)'
      },
      users: {
        'GET /api/users/profile': 'Get user profile',
        'PUT /api/users/profile': 'Update user profile',
        'GET /api/users/notifications': 'Get user notifications',
        'GET /api/users/stats': 'Get user statistics'
      },
      institutions: {
        'GET /api/institutions': 'Get all institutions',
        'GET /api/institutions/:id': 'Get institution details',
        'GET /api/institutions/:id/courses': 'Get institution courses',
        'POST /api/institutions': 'Create institution (admin only)'
      },
      courses: {
        'GET /api/courses': 'Get all courses',
        'GET /api/courses/:id': 'Get course details',
        'GET /api/courses/popular': 'Get popular courses',
        'POST /api/courses/:id/check-eligibility': 'Check course eligibility (student)'
      },
      applications: {
        'POST /api/applications': 'Submit application (student)',
        'GET /api/applications/my-applications': 'Get student applications',
        'GET /api/applications/:id': 'Get application details',
        'PATCH /api/applications/:id/status': 'Update application status (institution)'
      },
      jobs: {
        'GET /api/jobs': 'Get all jobs',
        'GET /api/jobs/:id': 'Get job details',
        'POST /api/jobs': 'Create job (company)',
        'POST /api/jobs/:id/apply': 'Apply for job (student)'
      },
      transcripts: {
        'POST /api/transcripts/upload': 'Upload transcript (student)',
        'GET /api/transcripts/my-transcripts': 'Get student transcripts',
        'GET /api/transcripts/stats': 'Get transcript statistics'
      },
      admin: {
        'GET /api/admin/dashboard/stats': 'Get dashboard statistics',
        'GET /api/admin/users': 'Get all users',
        'GET /api/admin/institutions': 'Get all institutions',
        'GET /api/admin/companies': 'Get all companies'
      }
    }
  });
});

export default router;