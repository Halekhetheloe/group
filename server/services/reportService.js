import { db } from '../config/firebase-admin.js';
import { collections } from '../config/database.js';

class ReportService {
  constructor() {
    this.db = db;
  }

  // Generate user registration report
  async generateUserRegistrationReport(startDate, endDate, groupBy = 'day') {
    try {
      let query = db.collection(collections.USERS);

      if (startDate && endDate) {
        query = query
          .where('createdAt', '>=', startDate)
          .where('createdAt', '<=', endDate);
      }

      const snapshot = await query.get();
      
      const report = {
        total: snapshot.size,
        byRole: {},
        byDate: {},
        byStatus: {}
      };

      snapshot.forEach(doc => {
        const userData = doc.data();
        const role = userData.role;
        const status = userData.status;
        const date = this.formatDate(userData.createdAt, groupBy);

        // Count by role
        report.byRole[role] = (report.byRole[role] || 0) + 1;

        // Count by date
        report.byDate[date] = (report.byDate[date] || 0) + 1;

        // Count by status
        report.byStatus[status] = (report.byStatus[status] || 0) + 1;
      });

      return report;
    } catch (error) {
      console.error('Error generating user registration report:', error);
      throw error;
    }
  }

  // Generate application statistics report
  async generateApplicationReport(startDate, endDate, institutionId = null) {
    try {
      let query = db.collection(collections.APPLICATIONS);

      if (startDate && endDate) {
        query = query
          .where('appliedAt', '>=', startDate)
          .where('appliedAt', '<=', endDate);
      }

      if (institutionId) {
        query = query.where('institutionId', '==', institutionId);
      }

      const snapshot = await query.get();
      
      const report = {
        total: snapshot.size,
        byStatus: {},
        byInstitution: {},
        byCourse: {},
        byMonth: {}
      };

      for (const doc of snapshot.docs) {
        const applicationData = doc.data();
        const status = applicationData.status;
        const institutionId = applicationData.institutionId;
        const courseId = applicationData.courseId;
        const month = this.formatDate(applicationData.appliedAt, 'month');

        // Count by status
        report.byStatus[status] = (report.byStatus[status] || 0) + 1;

        // Count by institution
        report.byInstitution[institutionId] = (report.byInstitution[institutionId] || 0) + 1;

        // Count by course
        report.byCourse[courseId] = (report.byCourse[courseId] || 0) + 1;

        // Count by month
        report.byMonth[month] = (report.byMonth[month] || 0) + 1;
      }

      // Get institution names
      for (const instId of Object.keys(report.byInstitution)) {
        const instDoc = await db.collection(collections.INSTITUTIONS).doc(instId).get();
        if (instDoc.exists) {
          report.byInstitution[instDoc.data().name] = report.byInstitution[instId];
          delete report.byInstitution[instId];
        }
      }

      // Get course names
      for (const courseId of Object.keys(report.byCourse)) {
        const courseDoc = await db.collection(collections.COURSES).doc(courseId).get();
        if (courseDoc.exists) {
          report.byCourse[courseDoc.data().name] = report.byCourse[courseId];
          delete report.byCourse[courseId];
        }
      }

      return report;
    } catch (error) {
      console.error('Error generating application report:', error);
      throw error;
    }
  }

  // Generate job statistics report
  async generateJobReport(startDate, endDate, companyId = null) {
    try {
      let query = db.collection(collections.JOBS);

      if (startDate && endDate) {
        query = query
          .where('createdAt', '>=', startDate)
          .where('createdAt', '<=', endDate);
      }

      if (companyId) {
        query = query.where('companyId', '==', companyId);
      }

      const snapshot = await query.get();
      
      const report = {
        total: snapshot.size,
        byStatus: {},
        byCompany: {},
        byType: {},
        byCategory: {},
        applicationStats: {
          total: 0,
          byStatus: {}
        }
      };

      for (const doc of snapshot.docs) {
        const jobData = doc.data();
        const status = jobData.status;
        const companyId = jobData.companyId;
        const type = jobData.type;
        const category = jobData.category;

        // Count job statistics
        report.byStatus[status] = (report.byStatus[status] || 0) + 1;
        report.byCompany[companyId] = (report.byCompany[companyId] || 0) + 1;
        report.byType[type] = (report.byType[type] || 0) + 1;
        report.byCategory[category] = (report.byCategory[category] || 0) + 1;

        // Get job applications
        const applicationsSnapshot = await db.collection(collections.JOB_APPLICATIONS)
          .where('jobId', '==', doc.id)
          .get();

        report.applicationStats.total += applicationsSnapshot.size;

        applicationsSnapshot.forEach(appDoc => {
          const appData = appDoc.data();
          const appStatus = appData.status;
          report.applicationStats.byStatus[appStatus] = (report.applicationStats.byStatus[appStatus] || 0) + 1;
        });
      }

      // Get company names
      for (const companyId of Object.keys(report.byCompany)) {
        const companyDoc = await db.collection(collections.COMPANIES).doc(companyId).get();
        if (companyDoc.exists) {
          report.byCompany[companyDoc.data().name] = report.byCompany[companyId];
          delete report.byCompany[companyId];
        }
      }

      return report;
    } catch (error) {
      console.error('Error generating job report:', error);
      throw error;
    }
  }

  // Generate institution performance report
  async generateInstitutionPerformanceReport(institutionId, startDate, endDate) {
    try {
      const institutionDoc = await db.collection(collections.INSTITUTIONS).doc(institutionId).get();
      if (!institutionDoc.exists) {
        throw new Error('Institution not found');
      }

      const institution = institutionDoc.data();

      // Get institution courses
      const coursesSnapshot = await db.collection(collections.COURSES)
        .where('institutionId', '==', institutionId)
        .get();

      // Get institution applications
      let applicationsQuery = db.collection(collections.APPLICATIONS)
        .where('institutionId', '==', institutionId);

      if (startDate && endDate) {
        applicationsQuery = applicationsQuery
          .where('appliedAt', '>=', startDate)
          .where('appliedAt', '<=', endDate);
      }

      const applicationsSnapshot = await applicationsQuery.get();

      const report = {
        institution: {
          id: institution.id,
          name: institution.name,
          type: institution.type,
          location: institution.location
        },
        courses: {
          total: coursesSnapshot.size,
          byFaculty: {}
        },
        applications: {
          total: applicationsSnapshot.size,
          byStatus: {},
          byCourse: {},
          byMonth: {},
          conversionRate: 0
        }
      };

      // Process courses
      coursesSnapshot.forEach(doc => {
        const courseData = doc.data();
        const faculty = courseData.faculty;

        report.courses.byFaculty[faculty] = (report.courses.byFaculty[faculty] || 0) + 1;
      });

      // Process applications
      let approvedApplications = 0;

      applicationsSnapshot.forEach(doc => {
        const applicationData = doc.data();
        const status = applicationData.status;
        const courseId = applicationData.courseId;
        const month = this.formatDate(applicationData.appliedAt, 'month');

        report.applications.byStatus[status] = (report.applications.byStatus[status] || 0) + 1;
        report.applications.byCourse[courseId] = (report.applications.byCourse[courseId] || 0) + 1;
        report.applications.byMonth[month] = (report.applications.byMonth[month] || 0) + 1;

        if (status === 'approved') {
          approvedApplications++;
        }
      });

      // Calculate conversion rate
      report.applications.conversionRate = applicationsSnapshot.size > 0 
        ? (approvedApplications / applicationsSnapshot.size) * 100 
        : 0;

      // Get course names
      for (const courseId of Object.keys(report.applications.byCourse)) {
        const courseDoc = await db.collection(collections.COURSES).doc(courseId).get();
        if (courseDoc.exists) {
          report.applications.byCourse[courseDoc.data().name] = report.applications.byCourse[courseId];
          delete report.applications.byCourse[courseId];
        }
      }

      return report;
    } catch (error) {
      console.error('Error generating institution performance report:', error);
      throw error;
    }
  }

  // Generate system overview report
  async generateSystemOverviewReport() {
    try {
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

      const report = {
        overview: {
          totalUsers: usersSnapshot.size,
          totalInstitutions: institutionsSnapshot.size,
          totalCompanies: companiesSnapshot.size,
          totalCourses: coursesSnapshot.size,
          totalApplications: applicationsSnapshot.size,
          totalJobs: jobsSnapshot.size,
          totalTranscripts: transcriptsSnapshot.size
        },
        userDistribution: {
          byRole: {},
          byStatus: {}
        },
        applicationMetrics: {
          byStatus: {},
          approvalRate: 0
        },
        jobMetrics: {
          byStatus: {},
          byType: {}
        }
      };

      // User distribution
      usersSnapshot.forEach(doc => {
        const userData = doc.data();
        const role = userData.role;
        const status = userData.status;

        report.userDistribution.byRole[role] = (report.userDistribution.byRole[role] || 0) + 1;
        report.userDistribution.byStatus[status] = (report.userDistribution.byStatus[status] || 0) + 1;
      });

      // Application metrics
      let approvedApplications = 0;
      applicationsSnapshot.forEach(doc => {
        const applicationData = doc.data();
        const status = applicationData.status;

        report.applicationMetrics.byStatus[status] = (report.applicationMetrics.byStatus[status] || 0) + 1;

        if (status === 'approved') {
          approvedApplications++;
        }
      });

      report.applicationMetrics.approvalRate = applicationsSnapshot.size > 0 
        ? (approvedApplications / applicationsSnapshot.size) * 100 
        : 0;

      // Job metrics
      jobsSnapshot.forEach(doc => {
        const jobData = doc.data();
        const status = jobData.status;
        const type = jobData.type;

        report.jobMetrics.byStatus[status] = (report.jobMetrics.byStatus[status] || 0) + 1;
        report.jobMetrics.byType[type] = (report.jobMetrics.byType[type] || 0) + 1;
      });

      return report;
    } catch (error) {
      console.error('Error generating system overview report:', error);
      throw error;
    }
  }

  // Helper method to format date for grouping
  formatDate(timestamp, groupBy) {
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    
    switch (groupBy) {
      case 'day':
        return date.toISOString().split('T')[0];
      case 'month':
        return date.toISOString().substring(0, 7); // YYYY-MM
      case 'year':
        return date.getFullYear().toString();
      default:
        return date.toISOString().split('T')[0];
    }
  }

  // Export report to CSV format
  exportToCSV(report, reportType) {
    let csv = '';
    
    switch (reportType) {
      case 'user_registration':
        csv = 'Date,Registrations\n';
        Object.entries(report.byDate).forEach(([date, count]) => {
          csv += `${date},${count}\n`;
        });
        break;
      
      case 'applications':
        csv = 'Status,Count\n';
        Object.entries(report.byStatus).forEach(([status, count]) => {
          csv += `${status},${count}\n`;
        });
        break;
      
      case 'jobs':
        csv = 'Type,Count\n';
        Object.entries(report.byType).forEach(([type, count]) => {
          csv += `${type},${count}\n`;
        });
        break;
      
      default:
        csv = 'Category,Value\n';
        Object.entries(report.overview).forEach(([category, value]) => {
          csv += `${category},${value}\n`;
        });
    }

    return csv;
  }
}

export default new ReportService();