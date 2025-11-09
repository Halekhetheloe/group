import { db } from '../config/firebase-admin.js';
import { collections } from '../config/database.js';
import { emailService } from '../config/email.js';
import { validateApplication, validateApplicationStatusUpdate } from '../validators/applicationValidators.js';

export const submitApplication = async (req, res) => {
  try {
    const studentId = req.user.userId;
    const { error, value } = validateApplication(req.body);
    
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: error.details[0].message,
        details: error.details
      });
    }

    const { courseId, institutionId, personalStatement, preferences, documents } = value;

    // Check if course exists and is active
    const courseDoc = await db.collection(collections.COURSES).doc(courseId).get();
    if (!courseDoc.exists || courseDoc.data().status !== 'active') {
      return res.status(404).json({
        success: false,
        error: 'COURSE_NOT_FOUND',
        message: 'Course not found or not accepting applications'
      });
    }

    // Check if institution exists
    const institutionDoc = await db.collection(collections.INSTITUTIONS).doc(institutionId).get();
    if (!institutionDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'INSTITUTION_NOT_FOUND',
        message: 'Institution not found'
      });
    }

    // Check application limits (max 2 courses per institution)
    const existingApplicationsSnapshot = await db.collection(collections.APPLICATIONS)
      .where('studentId', '==', studentId)
      .where('institutionId', '==', institutionId)
      .get();

    if (existingApplicationsSnapshot.size >= 2) {
      return res.status(400).json({
        success: false,
        error: 'APPLICATION_LIMIT_EXCEEDED',
        message: 'You can only apply to a maximum of 2 courses per institution'
      });
    }

    // Check for duplicate application
    const duplicateApplicationSnapshot = await db.collection(collections.APPLICATIONS)
      .where('studentId', '==', studentId)
      .where('courseId', '==', courseId)
      .get();

    if (!duplicateApplicationSnapshot.empty) {
      return res.status(409).json({
        success: false,
        error: 'DUPLICATE_APPLICATION',
        message: 'You have already applied to this course'
      });
    }

    // Create application
    const applicationId = db.collection(collections.APPLICATIONS).doc().id;
    
    const applicationData = {
      id: applicationId,
      studentId,
      courseId,
      institutionId,
      personalStatement: personalStatement || '',
      preferences: preferences || {
        intakePeriod: 'January',
        studyMode: 'full-time'
      },
      documents: documents || {},
      status: 'pending',
      appliedAt: new Date(),
      updatedAt: new Date()
    };

    await db.collection(collections.APPLICATIONS).doc(applicationId).set(applicationData);

    // Update student's applications count
    const studentRef = db.collection(collections.USERS).doc(studentId);
    const studentDoc = await studentRef.get();
    const studentData = studentDoc.data();

    await studentRef.update({
      totalApplications: (studentData.totalApplications || 0) + 1,
      updatedAt: new Date()
    });

    // Send confirmation email
    try {
      await emailService.sendTemplateEmail(req.user.email, 'applicationSubmitted', {
        user: studentData,
        application: {
          courseName: courseDoc.data().name,
          institutionName: institutionDoc.data().name,
          appliedAt: applicationData.appliedAt
        }
      });
    } catch (emailError) {
      console.error('Failed to send application confirmation email:', emailError);
      // Don't fail the request if email fails
    }

    res.status(201).json({
      success: true,
      message: 'Application submitted successfully',
      applicationId,
      application: applicationData
    });

  } catch (error) {
    console.error('Submit application error:', error);
    res.status(500).json({
      success: false,
      error: 'APPLICATION_SUBMISSION_FAILED',
      message: 'Failed to submit application'
    });
  }
};

export const getStudentApplications = async (req, res) => {
  try {
    const studentId = req.user.userId;
    const { status, page = 1, limit = 10 } = req.query;

    let query = db.collection(collections.APPLICATIONS)
      .where('studentId', '==', studentId);

    if (status) {
      query = query.where('status', '==', status);
    }

    // Get total count
    const countSnapshot = await query.get();
    const total = countSnapshot.size;

    // Apply pagination
    const startAfter = (page - 1) * limit;
    const snapshot = await query
      .orderBy('appliedAt', 'desc')
      .offset(startAfter)
      .limit(parseInt(limit))
      .get();

    const applications = [];
    
    for (const doc of snapshot.docs) {
      const applicationData = doc.data();
      
      // Get course details
      const courseDoc = await db.collection(collections.COURSES).doc(applicationData.courseId).get();
      const courseData = courseDoc.data();

      // Get institution details
      const institutionDoc = await db.collection(collections.INSTITUTIONS)
        .doc(applicationData.institutionId)
        .get();
      const institutionData = institutionDoc.data();

      applications.push({
        id: doc.id,
        ...applicationData,
        course: {
          id: courseData.id,
          name: courseData.name,
          faculty: courseData.faculty,
          duration: courseData.duration
        },
        institution: {
          id: institutionData.id,
          name: institutionData.name,
          location: institutionData.location
        }
      });
    }

    res.json({
      success: true,
      applications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get student applications error:', error);
    res.status(500).json({
      success: false,
      error: 'APPLICATIONS_FETCH_FAILED',
      message: 'Failed to fetch applications'
    });
  }
};

export const getApplicationById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const userRole = req.user.role;

    const applicationDoc = await db.collection(collections.APPLICATIONS).doc(id).get();
    
    if (!applicationDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'APPLICATION_NOT_FOUND',
        message: 'Application not found'
      });
    }

    const applicationData = applicationDoc.data();

    // Check permissions
    if (userRole === 'student' && applicationData.studentId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'FORBIDDEN',
        message: 'Not authorized to view this application'
      });
    }

    if (userRole === 'institution' && applicationData.institutionId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'FORBIDDEN',
        message: 'Not authorized to view this application'
      });
    }

    // Get course details
    const courseDoc = await db.collection(collections.COURSES).doc(applicationData.courseId).get();
    const courseData = courseDoc.data();

    // Get institution details
    const institutionDoc = await db.collection(collections.INSTITUTIONS)
      .doc(applicationData.institutionId)
      .get();
    const institutionData = institutionDoc.data();

    // Get student details (for institution/admin)
    let studentData = null;
    if (userRole !== 'student') {
      const studentDoc = await db.collection(collections.USERS).doc(applicationData.studentId).get();
      studentData = studentDoc.data();
    }

    const application = {
      id: applicationDoc.id,
      ...applicationData,
      course: {
        id: courseData.id,
        name: courseData.name,
        faculty: courseData.faculty,
        duration: courseData.duration,
        requirements: courseData.requirements
      },
      institution: {
        id: institutionData.id,
        name: institutionData.name,
        location: institutionData.location,
        contact: institutionData.contact
      }
    };

    if (studentData) {
      application.student = {
        id: studentData.id,
        firstName: studentData.firstName,
        lastName: studentData.lastName,
        email: studentData.email,
        phone: studentData.phone
      };
    }

    res.json({
      success: true,
      application
    });

  } catch (error) {
    console.error('Get application error:', error);
    res.status(500).json({
      success: false,
      error: 'APPLICATION_FETCH_FAILED',
      message: 'Failed to fetch application details'
    });
  }
};

export const updateApplicationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate request body
    const { error, value } = validateApplicationStatusUpdate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: error.details[0].message,
        details: error.details
      });
    }

    const { status, feedback, decisionDate } = value;
    const userRole = req.user.role;

    const applicationDoc = await db.collection(collections.APPLICATIONS).doc(id).get();
    
    if (!applicationDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'APPLICATION_NOT_FOUND',
        message: 'Application not found'
      });
    }

    const applicationData = applicationDoc.data();

    // Check permissions (institution admin or system admin)
    if (userRole === 'institution' && applicationData.institutionId !== req.user.userId) {
      return res.status(403).json({
        success: false,
        error: 'FORBIDDEN',
        message: 'Not authorized to update this application'
      });
    }

    if (userRole !== 'admin' && userRole !== 'institution') {
      return res.status(403).json({
        success: false,
        error: 'FORBIDDEN',
        message: 'Not authorized to update application status'
      });
    }

    const updateData = {
      status,
      updatedAt: new Date()
    };

    if (feedback) {
      updateData.feedback = feedback;
    }

    if (decisionDate) {
      updateData.decisionDate = decisionDate;
    }

    if (status === 'accepted' || status === 'rejected') {
      updateData.reviewedAt = new Date();
      updateData.reviewedBy = req.user.userId;
      if (!decisionDate) {
        updateData.decisionDate = new Date();
      }
    }

    await db.collection(collections.APPLICATIONS).doc(id).update(updateData);

    // Get updated application
    const updatedDoc = await db.collection(collections.APPLICATIONS).doc(id).get();
    const updatedApplication = updatedDoc.data();

    // Send notification email to student
    try {
      const studentDoc = await db.collection(collections.USERS).doc(applicationData.studentId).get();
      const studentData = studentDoc.data();

      const courseDoc = await db.collection(collections.COURSES).doc(applicationData.courseId).get();
      const courseData = courseDoc.data();

      const institutionDoc = await db.collection(collections.INSTITUTIONS)
        .doc(applicationData.institutionId)
        .get();
      const institutionData = institutionDoc.data();

      await emailService.sendTemplateEmail(studentData.email, 'admissionDecision', {
        user: studentData,
        application: {
          courseName: courseData.name,
          institutionName: institutionData.name,
          status: status,
          feedback: feedback
        }
      });
    } catch (emailError) {
      console.error('Failed to send status update email:', emailError);
    }

    res.json({
      success: true,
      message: `Application status updated to ${status} successfully`,
      application: updatedApplication
    });

  } catch (error) {
    console.error('Update application status error:', error);
    res.status(500).json({
      success: false,
      error: 'APPLICATION_UPDATE_FAILED',
      message: 'Failed to update application status'
    });
  }
};

export const withdrawApplication = async (req, res) => {
  try {
    const { id } = req.params;
    const studentId = req.user.userId;

    const applicationDoc = await db.collection(collections.APPLICATIONS).doc(id).get();
    
    if (!applicationDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'APPLICATION_NOT_FOUND',
        message: 'Application not found'
      });
    }

    const applicationData = applicationDoc.data();

    // Check if application belongs to student
    if (applicationData.studentId !== studentId) {
      return res.status(403).json({
        success: false,
        error: 'FORBIDDEN',
        message: 'Not authorized to withdraw this application'
      });
    }

    // Check if application can be withdrawn
    if (applicationData.status !== 'pending') {
      return res.status(400).json({
        success: false,
        error: 'CANNOT_WITHDRAW',
        message: 'Cannot withdraw application that is already processed'
      });
    }

    await db.collection(collections.APPLICATIONS).doc(id).update({
      status: 'withdrawn',
      withdrawnAt: new Date(),
      updatedAt: new Date()
    });

    res.json({
      success: true,
      message: 'Application withdrawn successfully'
    });

  } catch (error) {
    console.error('Withdraw application error:', error);
    res.status(500).json({
      success: false,
      error: 'APPLICATION_WITHDRAWAL_FAILED',
      message: 'Failed to withdraw application'
    });
  }
};

// Additional controller methods that might be needed
export const getInstitutionApplications = async (req, res) => {
  try {
    const institutionId = req.user.role === 'institution' ? req.user.userId : req.params.institutionId;
    const { status, page = 1, limit = 20 } = req.query;

    let query = db.collection(collections.APPLICATIONS)
      .where('institutionId', '==', institutionId);

    if (status) {
      query = query.where('status', '==', status);
    }

    // Get total count
    const countSnapshot = await query.get();
    const total = countSnapshot.size;

    // Apply pagination
    const startAfter = (page - 1) * limit;
    const snapshot = await query
      .orderBy('appliedAt', 'desc')
      .offset(startAfter)
      .limit(parseInt(limit))
      .get();

    const applications = [];
    
    for (const doc of snapshot.docs) {
      const applicationData = doc.data();
      
      // Get course details
      const courseDoc = await db.collection(collections.COURSES).doc(applicationData.courseId).get();
      const courseData = courseDoc.data();

      // Get student details
      const studentDoc = await db.collection(collections.USERS).doc(applicationData.studentId).get();
      const studentData = studentDoc.data();

      applications.push({
        id: doc.id,
        ...applicationData,
        course: {
          id: courseData.id,
          name: courseData.name,
          faculty: courseData.faculty
        },
        student: {
          id: studentData.id,
          firstName: studentData.firstName,
          lastName: studentData.lastName,
          email: studentData.email,
          phone: studentData.phone
        }
      });
    }

    res.json({
      success: true,
      applications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get institution applications error:', error);
    res.status(500).json({
      success: false,
      error: 'APPLICATIONS_FETCH_FAILED',
      message: 'Failed to fetch institution applications'
    });
  }
};

export const getApplicationStats = async (req, res) => {
  try {
    const { institutionId, courseId, startDate, endDate, groupBy = 'month' } = req.query;
    const userRole = req.user.role;
    const userId = req.user.userId;

    let query = db.collection(collections.APPLICATIONS);

    // Apply filters based on user role and query params
    if (userRole === 'institution') {
      query = query.where('institutionId', '==', userId);
    } else if (userRole === 'student') {
      query = query.where('studentId', '==', userId);
    } else if (institutionId) {
      query = query.where('institutionId', '==', institutionId);
    }

    if (courseId) {
      query = query.where('courseId', '==', courseId);
    }

    if (startDate) {
      query = query.where('appliedAt', '>=', new Date(startDate));
    }

    if (endDate) {
      query = query.where('appliedAt', '<=', new Date(endDate));
    }

    const snapshot = await query.get();
    const applications = snapshot.docs.map(doc => doc.data());

    // Calculate basic stats
    const stats = {
      total: applications.length,
      pending: applications.filter(app => app.status === 'pending').length,
      under_review: applications.filter(app => app.status === 'under_review').length,
      accepted: applications.filter(app => app.status === 'accepted').length,
      rejected: applications.filter(app => app.status === 'rejected').length,
      waiting_list: applications.filter(app => app.status === 'waiting_list').length,
      withdrawn: applications.filter(app => app.status === 'withdrawn').length
    };

    res.json({
      success: true,
      stats
    });

  } catch (error) {
    console.error('Get application stats error:', error);
    res.status(500).json({
      success: false,
      error: 'STATS_FETCH_FAILED',
      message: 'Failed to fetch application statistics'
    });
  }
};