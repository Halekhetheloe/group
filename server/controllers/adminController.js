import { db, auth } from '../config/firebase-admin.js';
import { collections } from '../config/database.js';

export const getDashboardStats = async (req, res) => {
  try {
    // Only admin can access dashboard stats
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'FORBIDDEN',
        message: 'Only administrators can access dashboard statistics'
      });
    }

    // Get total counts
    const [
      usersSnapshot,
      institutionsSnapshot,
      companiesSnapshot,
      coursesSnapshot,
      applicationsSnapshot,
      jobsSnapshot,
      transcriptsSnapshot
    ] = await Promise.all([
      db.collection(collections.USERS).get(),
      db.collection(collections.INSTITUTIONS).get(),
      db.collection(collections.COMPANIES).get(),
      db.collection(collections.COURSES).get(),
      db.collection(collections.APPLICATIONS).get(),
      db.collection(collections.JOBS).get(),
      db.collection(collections.TRANSCRIPTS).get()
    ]);

    // Count by user roles
    const userRoles = {
      student: 0,
      institution: 0,
      company: 0,
      admin: 0
    };

    usersSnapshot.forEach(doc => {
      const userData = doc.data();
      userRoles[userData.role] = (userRoles[userData.role] || 0) + 1;
    });

    // Count application statuses
    const applicationStatuses = {
      pending: 0,
      approved: 0,
      rejected: 0,
      waitlisted: 0
    };

    applicationsSnapshot.forEach(doc => {
      const applicationData = doc.data();
      applicationStatuses[applicationData.status] = (applicationStatuses[applicationData.status] || 0) + 1;
    });

    // Count job statuses
    const jobStatuses = {
      active: 0,
      closed: 0,
      draft: 0
    };

    jobsSnapshot.forEach(doc => {
      const jobData = doc.data();
      jobStatuses[jobData.status] = (jobStatuses[jobData.status] || 0) + 1;
    });

    // Recent activity (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentUsersSnapshot = await db.collection(collections.USERS)
      .where('createdAt', '>=', thirtyDaysAgo)
      .get();

    const recentApplicationsSnapshot = await db.collection(collections.APPLICATIONS)
      .where('appliedAt', '>=', thirtyDaysAgo)
      .get();

    const stats = {
      totals: {
        users: usersSnapshot.size,
        institutions: institutionsSnapshot.size,
        companies: companiesSnapshot.size,
        courses: coursesSnapshot.size,
        applications: applicationsSnapshot.size,
        jobs: jobsSnapshot.size,
        transcripts: transcriptsSnapshot.size
      },
      userRoles,
      applicationStatuses,
      jobStatuses,
      recentActivity: {
        newUsers: recentUsersSnapshot.size,
        newApplications: recentApplicationsSnapshot.size
      }
    };

    res.json({
      success: true,
      stats
    });

  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({
      success: false,
      error: 'STATS_FETCH_FAILED',
      message: 'Failed to fetch dashboard statistics'
    });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    // Only admin can access all users
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'FORBIDDEN',
        message: 'Only administrators can access user list'
      });
    }

    const { role, status, search, page = 1, limit = 20 } = req.query;

    let query = db.collection(collections.USERS);

    // Apply filters
    if (role) {
      query = query.where('role', '==', role);
    }

    if (status) {
      query = query.where('status', '==', status);
    }

    if (search) {
      // Basic search implementation
      query = query.where('email', '>=', search).where('email', '<=', search + '\uf8ff');
    }

    // Get total count
    const countSnapshot = await query.get();
    const total = countSnapshot.size;

    // Apply pagination
    const startAfter = (page - 1) * limit;
    const snapshot = await query
      .orderBy('createdAt', 'desc')
      .offset(startAfter)
      .limit(parseInt(limit))
      .get();

    const users = [];
    snapshot.forEach(doc => {
      const userData = doc.data();
      
      // Remove sensitive data
      const { password, ...user } = userData;
      users.push({
        id: doc.id,
        ...user
      });
    });

    res.json({
      success: true,
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({
      success: false,
      error: 'USERS_FETCH_FAILED',
      message: 'Failed to fetch users'
    });
  }
};

export const updateUserStatus = async (req, res) => {
  try {
    // Only admin can update user status
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'FORBIDDEN',
        message: 'Only administrators can update user status'
      });
    }

    const { id } = req.params;
    const { status, reason } = req.body;

    if (!status || !['active', 'suspended', 'banned'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_STATUS',
        message: 'Valid status is required (active, suspended, or banned)'
      });
    }

    const userDoc = await db.collection(collections.USERS).doc(id).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'USER_NOT_FOUND',
        message: 'User not found'
      });
    }

    const userData = userDoc.data();

    // Cannot modify other admins
    if (userData.role === 'admin' && id !== req.user.userId) {
      return res.status(403).json({
        success: false,
        error: 'FORBIDDEN',
        message: 'Cannot modify other administrator accounts'
      });
    }

    const updateData = {
      status,
      updatedAt: new Date()
    };

    if (reason) {
      updateData.statusReason = reason;
    }

    // Update in Firestore
    await db.collection(collections.USERS).doc(id).update(updateData);

    // Update in Firebase Auth if suspending/banning
    if (status === 'suspended' || status === 'banned') {
      await auth.updateUser(id, {
        disabled: true
      });
    } else if (status === 'active') {
      await auth.updateUser(id, {
        disabled: false
      });
    }

    res.json({
      success: true,
      message: `User ${status} successfully`
    });

  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({
      success: false,
      error: 'USER_STATUS_UPDATE_FAILED',
      message: 'Failed to update user status'
    });
  }
};

export const getAllInstitutions = async (req, res) => {
  try {
    // Only admin can access all institutions
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'FORBIDDEN',
        message: 'Only administrators can access institution list'
      });
    }

    const { status, type, page = 1, limit = 20 } = req.query;

    let query = db.collection(collections.INSTITUTIONS);

    // Apply filters
    if (status) {
      query = query.where('status', '==', status);
    }

    if (type) {
      query = query.where('type', '==', type);
    }

    // Get total count
    const countSnapshot = await query.get();
    const total = countSnapshot.size;

    // Apply pagination
    const startAfter = (page - 1) * limit;
    const snapshot = await query
      .orderBy('createdAt', 'desc')
      .offset(startAfter)
      .limit(parseInt(limit))
      .get();

    const institutions = [];
    
    for (const doc of snapshot.docs) {
      const institutionData = doc.data();
      
      // Get admin user details
      let adminUser = null;
      if (institutionData.adminId) {
        const adminDoc = await db.collection(collections.USERS).doc(institutionData.adminId).get();
        if (adminDoc.exists) {
          const adminData = adminDoc.data();
          adminUser = {
            id: adminData.id,
            email: adminData.email,
            firstName: adminData.firstName,
            lastName: adminData.lastName
          };
        }
      }

      institutions.push({
        id: doc.id,
        ...institutionData,
        adminUser
      });
    }

    res.json({
      success: true,
      institutions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get all institutions error:', error);
    res.status(500).json({
      success: false,
      error: 'INSTITUTIONS_FETCH_FAILED',
      message: 'Failed to fetch institutions'
    });
  }
};

export const updateInstitutionStatus = async (req, res) => {
  try {
    // Only admin can update institution status
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'FORBIDDEN',
        message: 'Only administrators can update institution status'
      });
    }

    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['active', 'suspended'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_STATUS',
        message: 'Valid status is required (active or suspended)'
      });
    }

    const institutionDoc = await db.collection(collections.INSTITUTIONS).doc(id).get();
    
    if (!institutionDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'INSTITUTION_NOT_FOUND',
        message: 'Institution not found'
      });
    }

    await db.collection(collections.INSTITUTIONS).doc(id).update({
      status,
      updatedAt: new Date()
    });

    res.json({
      success: true,
      message: `Institution ${status} successfully`
    });

  } catch (error) {
    console.error('Update institution status error:', error);
    res.status(500).json({
      success: false,
      error: 'INSTITUTION_STATUS_UPDATE_FAILED',
      message: 'Failed to update institution status'
    });
  }
};

export const getAllCompanies = async (req, res) => {
  try {
    // Only admin can access all companies
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'FORBIDDEN',
        message: 'Only administrators can access company list'
      });
    }

    const { status, industry, page = 1, limit = 20 } = req.query;

    let query = db.collection(collections.COMPANIES);

    // Apply filters
    if (status) {
      query = query.where('status', '==', status);
    }

    if (industry) {
      query = query.where('industry', '==', industry);
    }

    // Get total count
    const countSnapshot = await query.get();
    const total = countSnapshot.size;

    // Apply pagination
    const startAfter = (page - 1) * limit;
    const snapshot = await query
      .orderBy('createdAt', 'desc')
      .offset(startAfter)
      .limit(parseInt(limit))
      .get();

    const companies = [];
    
    for (const doc of snapshot.docs) {
      const companyData = doc.data();
      
      // Get admin user details
      let adminUser = null;
      if (companyData.adminId) {
        const adminDoc = await db.collection(collections.USERS).doc(companyData.adminId).get();
        if (adminDoc.exists) {
          const adminData = adminDoc.data();
          adminUser = {
            id: adminData.id,
            email: adminData.email,
            firstName: adminData.firstName,
            lastName: adminData.lastName
          };
        }
      }

      // Get job count
      const jobsSnapshot = await db.collection(collections.JOBS)
        .where('companyId', '==', doc.id)
        .get();

      companies.push({
        id: doc.id,
        ...companyData,
        adminUser,
        jobCount: jobsSnapshot.size
      });
    }

    res.json({
      success: true,
      companies,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get all companies error:', error);
    res.status(500).json({
      success: false,
      error: 'COMPANIES_FETCH_FAILED',
      message: 'Failed to fetch companies'
    });
  }
};

export const updateCompanyStatus = async (req, res) => {
  try {
    // Only admin can update company status
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'FORBIDDEN',
        message: 'Only administrators can update company status'
      });
    }

    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['pending', 'approved', 'rejected', 'suspended'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_STATUS',
        message: 'Valid status is required (pending, approved, rejected, or suspended)'
      });
    }

    const companyDoc = await db.collection(collections.COMPANIES).doc(id).get();
    
    if (!companyDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'COMPANY_NOT_FOUND',
        message: 'Company not found'
      });
    }

    await db.collection(collections.COMPANIES).doc(id).update({
      status,
      updatedAt: new Date()
    });

    res.json({
      success: true,
      message: `Company ${status} successfully`
    });

  } catch (error) {
    console.error('Update company status error:', error);
    res.status(500).json({
      success: false,
      error: 'COMPANY_STATUS_UPDATE_FAILED',
      message: 'Failed to update company status'
    });
  }
};

export const getSystemReports = async (req, res) => {
  try {
    // Only admin can access system reports
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'FORBIDDEN',
        message: 'Only administrators can access system reports'
      });
    }

    const { reportType, startDate, endDate } = req.query;

    // Basic report generation - in production, you might want to use BigQuery or similar
    let report = {};

    switch (reportType) {
      case 'user-registration':
        // User registration report
        let userQuery = db.collection(collections.USERS);
        
        if (startDate && endDate) {
          userQuery = userQuery
            .where('createdAt', '>=', new Date(startDate))
            .where('createdAt', '<=', new Date(endDate));
        }

        const usersSnapshot = await userQuery.get();
        
        const registrationData = {
          total: usersSnapshot.size,
          byRole: {},
          byDate: {}
        };

        usersSnapshot.forEach(doc => {
          const userData = doc.data();
          const role = userData.role;
          const date = userData.createdAt.toDate().toISOString().split('T')[0];

          registrationData.byRole[role] = (registrationData.byRole[role] || 0) + 1;
          registrationData.byDate[date] = (registrationData.byDate[date] || 0) + 1;
        });

        report = registrationData;
        break;

      case 'application-stats':
        // Application statistics report
        let applicationQuery = db.collection(collections.APPLICATIONS);
        
        if (startDate && endDate) {
          applicationQuery = applicationQuery
            .where('appliedAt', '>=', new Date(startDate))
            .where('appliedAt', '<=', new Date(endDate));
        }

        const applicationsSnapshot = await applicationQuery.get();
        
        const applicationStats = {
          total: applicationsSnapshot.size,
          byStatus: {},
          byInstitution: {},
          byCourse: {}
        };

        for (const doc of applicationsSnapshot.docs) {
          const applicationData = doc.data();
          const status = applicationData.status;
          const institutionId = applicationData.institutionId;
          const courseId = applicationData.courseId;

          applicationStats.byStatus[status] = (applicationStats.byStatus[status] || 0) + 1;
          applicationStats.byInstitution[institutionId] = (applicationStats.byInstitution[institutionId] || 0) + 1;
          applicationStats.byCourse[courseId] = (applicationStats.byCourse[courseId] || 0) + 1;
        }

        report = applicationStats;
        break;

      default:
        return res.status(400).json({
          success: false,
          error: 'INVALID_REPORT_TYPE',
          message: 'Valid report type is required'
        });
    }

    res.json({
      success: true,
      report,
      metadata: {
        generatedAt: new Date(),
        reportType,
        dateRange: { startDate, endDate }
      }
    });

  } catch (error) {
    console.error('Get system reports error:', error);
    res.status(500).json({
      success: false,
      error: 'REPORTS_FETCH_FAILED',
      message: 'Failed to generate system reports'
    });
  }
};