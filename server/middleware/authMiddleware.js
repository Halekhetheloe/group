import { db } from '../config/firebase-admin.js';
import { collections } from '../config/database.js';

// Verify JWT token and attach user to request
export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'ACCESS_TOKEN_REQUIRED',
        message: 'Access token is required'
      });
    }

    // For development - mock user data
    // In production, you would verify the actual JWT token
    const mockUsers = {
      'student-001': { userId: 'student-001', role: 'student', email: 'student@example.com' },
      'institution-001': { userId: 'institution-001', role: 'institution', email: 'institution@example.com' },
      'admin-001': { userId: 'admin-001', role: 'admin', email: 'admin@example.com' },
      'company-001': { userId: 'company-001', role: 'company', email: 'company@example.com' }
    };

    // Simple token verification for development
    let user;
    if (token.startsWith('student_')) {
      user = mockUsers['student-001'];
    } else if (token.startsWith('institution_')) {
      user = mockUsers['institution-001'];
    } else if (token.startsWith('admin_')) {
      user = mockUsers['admin-001'];
    } else if (token.startsWith('company_')) {
      user = mockUsers['company-001'];
    } else {
      // Try to extract user ID from token (for development)
      user = mockUsers['student-001']; // Default to student for development
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'INVALID_TOKEN',
        message: 'Invalid or expired token'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({
      success: false,
      error: 'AUTHENTICATION_FAILED',
      message: 'Authentication failed'
    });
  }
};

// Require student role
export const requireStudent = (req, res, next) => {
  if (req.user && req.user.role === 'student') {
    next();
  } else {
    res.status(403).json({
      success: false,
      error: 'FORBIDDEN',
      message: 'Student access required'
    });
  }
};

// Require institution role
export const requireInstitution = (req, res, next) => {
  if (req.user && req.user.role === 'institution') {
    next();
  } else {
    res.status(403).json({
      success: false,
      error: 'FORBIDDEN',
      message: 'Institution access required'
    });
  }
};

// Require admin role
export const requireAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({
      success: false,
      error: 'FORBIDDEN',
      message: 'Admin access required'
    });
  }
};

// Require company role
export const requireCompany = (req, res, next) => {
  if (req.user && req.user.role === 'company') {
    next();
  } else {
    res.status(403).json({
      success: false,
      error: 'FORBIDDEN',
      message: 'Company access required'
    });
  }
};

// Require either admin or institution role
export const requireAdminOrInstitution = (req, res, next) => {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'institution')) {
    next();
  } else {
    res.status(403).json({
      success: false,
      error: 'FORBIDDEN',
      message: 'Admin or institution access required'
    });
  }
};

// Require either admin or student role
export const requireAdminOrStudent = (req, res, next) => {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'student')) {
    next();
  } else {
    res.status(403).json({
      success: false,
      error: 'FORBIDDEN',
      message: 'Admin or student access required'
    });
  }
};

// Require either admin or company role
export const requireAdminOrCompany = (req, res, next) => {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'company')) {
    next();
  } else {
    res.status(403).json({
      success: false,
      error: 'FORBIDDEN',
      message: 'Admin or company access required'
    });
  }
};

// Optional authentication - doesn't fail if no token, but attaches user if present
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      // Use the same logic as authenticateToken but don't fail if no token
      const mockUsers = {
        'student-001': { userId: 'student-001', role: 'student', email: 'student@example.com' },
        'institution-001': { userId: 'institution-001', role: 'institution', email: 'institution@example.com' },
        'admin-001': { userId: 'admin-001', role: 'admin', email: 'admin@example.com' },
        'company-001': { userId: 'company-001', role: 'company', email: 'company@example.com' }
      };

      let user;
      if (token.startsWith('student_')) {
        user = mockUsers['student-001'];
      } else if (token.startsWith('institution_')) {
        user = mockUsers['institution-001'];
      } else if (token.startsWith('admin_')) {
        user = mockUsers['admin-001'];
      } else if (token.startsWith('company_')) {
        user = mockUsers['company-001'];
      } else {
        user = mockUsers['student-001'];
      }

      if (user) {
        req.user = user;
      }
    }
    
    next();
  } catch (error) {
    // Don't fail the request for optional auth errors
    console.error('Optional auth error:', error);
    next();
  }
};

export default {
  authenticateToken,
  requireStudent,
  requireInstitution,
  requireAdmin,
  requireCompany,
  requireAdminOrInstitution,
  requireAdminOrStudent,
  requireAdminOrCompany,
  optionalAuth
};