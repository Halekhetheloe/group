import { db } from '../config/firebase-admin.js';
import { collections } from '../config/database.js';

// Middleware to check if user owns the resource
export const checkResourceOwnership = (resourceType, idParam = 'id') => {
  return async (req, res, next) => {
    try {
      const resourceId = req.params[idParam];
      const userId = req.user.userId;

      if (!resourceId) {
        return res.status(400).json({
          success: false,
          error: 'RESOURCE_ID_REQUIRED',
          message: 'Resource ID is required'
        });
      }

      const resourceDoc = await db.collection(resourceType).doc(resourceId).get();
      
      if (!resourceDoc.exists) {
        return res.status(404).json({
          success: false,
          error: 'RESOURCE_NOT_FOUND',
          message: `${resourceType} not found`
        });
      }

      const resourceData = resourceDoc.data();

      // Check ownership based on resource type
      let isOwner = false;

      switch (resourceType) {
        case collections.USERS:
          isOwner = resourceData.id === userId;
          break;
        case collections.APPLICATIONS:
          isOwner = resourceData.studentId === userId;
          break;
        case collections.JOB_APPLICATIONS:
          isOwner = resourceData.studentId === userId;
          break;
        case collections.TRANSCRIPTS:
          isOwner = resourceData.studentId === userId;
          break;
        case collections.INSTITUTIONS:
          isOwner = resourceData.adminId === userId;
          break;
        case collections.COURSES:
          // For courses, check if user is admin of the institution
          const institutionDoc = await db.collection(collections.INSTITUTIONS)
            .doc(resourceData.institutionId)
            .get();
          isOwner = institutionDoc.exists && institutionDoc.data().adminId === userId;
          break;
        case collections.COMPANIES:
          isOwner = resourceData.adminId === userId;
          break;
        case collections.JOBS:
          isOwner = resourceData.companyId === userId;
          break;
        default:
          isOwner = false;
      }

      if (!isOwner && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: 'FORBIDDEN',
          message: 'You do not have permission to access this resource'
        });
      }

      // Attach resource data to request for use in subsequent middleware/controllers
      req.resource = resourceData;
      next();
    } catch (error) {
      console.error('Resource ownership check error:', error);
      res.status(500).json({
        success: false,
        error: 'OWNERSHIP_CHECK_FAILED',
        message: 'Failed to verify resource ownership'
      });
    }
  };
};

// Middleware to check if user can access student data
export const canAccessStudentData = async (req, res, next) => {
  try {
    const studentId = req.params.studentId || req.body.studentId;
    const userRole = req.user.role;

    if (!studentId) {
      return res.status(400).json({
        success: false,
        error: 'STUDENT_ID_REQUIRED',
        message: 'Student ID is required'
      });
    }

    // Students can always access their own data
    if (req.user.userId === studentId) {
      return next();
    }

    // Admins can access all student data
    if (userRole === 'admin') {
      return next();
    }

    // Institutions can access data of students who applied to their courses
    if (userRole === 'institution') {
      const applicationsSnapshot = await db.collection(collections.APPLICATIONS)
        .where('studentId', '==', studentId)
        .where('institutionId', '==', req.user.userId)
        .get();

      if (!applicationsSnapshot.empty) {
        return next();
      }
    }

    // Companies can access data of students who applied to their jobs
    if (userRole === 'company') {
      const jobApplicationsSnapshot = await db.collection(collections.JOB_APPLICATIONS)
        .where('studentId', '==', studentId)
        .where('companyId', '==', req.user.userId)
        .get();

      if (!jobApplicationsSnapshot.empty) {
        return next();
      }
    }

    return res.status(403).json({
      success: false,
      error: 'FORBIDDEN',
      message: 'Not authorized to access this student\'s data'
    });

  } catch (error) {
    console.error('Student data access check error:', error);
    res.status(500).json({
      success: false,
      error: 'ACCESS_CHECK_FAILED',
      message: 'Failed to verify student data access'
    });
  }
};

// Middleware to check if user can manage institution resources
export const canManageInstitution = async (req, res, next) => {
  try {
    const institutionId = req.params.institutionId || req.body.institutionId;
    const userRole = req.user.role;

    if (!institutionId) {
      return res.status(400).json({
        success: false,
        error: 'INSTITUTION_ID_REQUIRED',
        message: 'Institution ID is required'
      });
    }

    // Admins can manage all institutions
    if (userRole === 'admin') {
      return next();
    }

    // Check if user is the admin of the institution
    const institutionDoc = await db.collection(collections.INSTITUTIONS).doc(institutionId).get();
    
    if (!institutionDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'INSTITUTION_NOT_FOUND',
        message: 'Institution not found'
      });
    }

    const institutionData = institutionDoc.data();

    if (institutionData.adminId === req.user.userId) {
      return next();
    }

    return res.status(403).json({
      success: false,
      error: 'FORBIDDEN',
      message: 'Not authorized to manage this institution'
    });

  } catch (error) {
    console.error('Institution management check error:', error);
    res.status(500).json({
      success: false,
      error: 'MANAGEMENT_CHECK_FAILED',
      message: 'Failed to verify institution management permissions'
    });
  }
};

// Middleware to check if user can manage company resources
export const canManageCompany = async (req, res, next) => {
  try {
    const companyId = req.params.companyId || req.body.companyId;
    const userRole = req.user.role;

    if (!companyId) {
      return res.status(400).json({
        success: false,
        error: 'COMPANY_ID_REQUIRED',
        message: 'Company ID is required'
      });
    }

    // Admins can manage all companies
    if (userRole === 'admin') {
      return next();
    }

    // Check if user is the admin of the company
    const companyDoc = await db.collection(collections.COMPANIES).doc(companyId).get();
    
    if (!companyDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'COMPANY_NOT_FOUND',
        message: 'Company not found'
      });
    }

    const companyData = companyDoc.data();

    if (companyData.adminId === req.user.userId) {
      return next();
    }

    return res.status(403).json({
      success: false,
      error: 'FORBIDDEN',
      message: 'Not authorized to manage this company'
    });

  } catch (error) {
    console.error('Company management check error:', error);
    res.status(500).json({
      success: false,
      error: 'MANAGEMENT_CHECK_FAILED',
      message: 'Failed to verify company management permissions'
    });
  }
};

// Middleware to check application limits
export const checkApplicationLimits = async (req, res, next) => {
  try {
    const studentId = req.user.userId;
    const { institutionId } = req.body;

    if (!institutionId) {
      return next(); // Let the controller handle this validation
    }

    // Check if student has reached application limit for this institution
    const applicationsSnapshot = await db.collection(collections.APPLICATIONS)
      .where('studentId', '==', studentId)
      .where('institutionId', '==', institutionId)
      .where('status', 'in', ['pending', 'approved', 'waitlisted'])
      .get();

    if (applicationsSnapshot.size >= 2) {
      return res.status(400).json({
        success: false,
        error: 'APPLICATION_LIMIT_EXCEEDED',
        message: 'You can only apply to a maximum of 2 courses per institution'
      });
    }

    next();
  } catch (error) {
    console.error('Application limit check error:', error);
    res.status(500).json({
      success: false,
      error: 'LIMIT_CHECK_FAILED',
      message: 'Failed to check application limits'
    });
  }
};

// Middleware to check if course is accepting applications
export const checkCourseAvailability = async (req, res, next) => {
  try {
    const courseId = req.params.courseId || req.body.courseId;

    if (!courseId) {
      return next(); // Let the controller handle this validation
    }

    const courseDoc = await db.collection(collections.COURSES).doc(courseId).get();
    
    if (!courseDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'COURSE_NOT_FOUND',
        message: 'Course not found'
      });
    }

    const courseData = courseDoc.data();

    // Check if course is active
    if (courseData.status !== 'active') {
      return res.status(400).json({
        success: false,
        error: 'COURSE_NOT_ACTIVE',
        message: 'This course is not currently accepting applications'
      });
    }

    // Check application deadline
    if (courseData.intake?.deadline && new Date(courseData.intake.deadline) < new Date()) {
      return res.status(400).json({
        success: false,
        error: 'APPLICATION_DEADLINE_PASSED',
        message: 'Application deadline has passed for this course'
      });
    }

    next();
  } catch (error) {
    console.error('Course availability check error:', error);
    res.status(500).json({
      success: false,
      error: 'AVAILABILITY_CHECK_FAILED',
      message: 'Failed to check course availability'
    });
  }
};

// Middleware to check if job is accepting applications
export const checkJobAvailability = async (req, res, next) => {
  try {
    const jobId = req.params.jobId || req.body.jobId;

    if (!jobId) {
      return next(); // Let the controller handle this validation
    }

    const jobDoc = await db.collection(collections.JOBS).doc(jobId).get();
    
    if (!jobDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'JOB_NOT_FOUND',
        message: 'Job not found'
      });
    }

    const jobData = jobDoc.data();

    // Check if job is active
    if (jobData.status !== 'active') {
      return res.status(400).json({
        success: false,
        error: 'JOB_NOT_ACTIVE',
        message: 'This job is not currently accepting applications'
      });
    }

    // Check application deadline
    if (jobData.applicationDeadline && new Date(jobData.applicationDeadline) < new Date()) {
      return res.status(400).json({
        success: false,
        error: 'APPLICATION_DEADLINE_PASSED',
        message: 'Application deadline has passed for this job'
      });
    }

    next();
  } catch (error) {
    console.error('Job availability check error:', error);
    res.status(500).json({
      success: false,
      error: 'AVAILABILITY_CHECK_FAILED',
      message: 'Failed to check job availability'
    });
  }
};

// Export common role-based middleware
export default {
  checkResourceOwnership,
  canAccessStudentData,
  canManageInstitution,
  canManageCompany,
  checkApplicationLimits,
  checkCourseAvailability,
  checkJobAvailability
};