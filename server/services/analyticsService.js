import { db } from '../config/firebase-admin.js';
import { collections } from '../config/database.js';

class AnalyticsService {
  constructor() {
    this.db = db;
  }

  // Get platform overview statistics
  async getPlatformOverview() {
    try {
      const [
        usersSnapshot,
        institutionsSnapshot,
        companiesSnapshot,
        coursesSnapshot,
        applicationsSnapshot,
        jobsSnapshot,
        jobApplicationsSnapshot
      ] = await Promise.all([
        db.collection(collections.USERS).get(),
        db.collection(collections.INSTITUTIONS).get(),
        db.collection(collections.COMPANIES).get(),
        db.collection(collections.COURSES).get(),
        db.collection(collections.APPLICATIONS).get(),
        db.collection(collections.JOBS).get(),
        db.collection(collections.JOB_APPLICATIONS).get()
      ]);

      // Calculate recent activity (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const recentUsers = await db.collection(collections.USERS)
        .where('createdAt', '>=', thirtyDaysAgo)
        .get();

      const recentApplications = await db.collection(collections.APPLICATIONS)
        .where('appliedAt', '>=', thirtyDaysAgo)
        .get();

      const recentJobs = await db.collection(collections.JOBS)
        .where('createdAt', '>=', thirtyDaysAgo)
        .get();

      return {
        totals: {
          users: usersSnapshot.size,
          institutions: institutionsSnapshot.size,
          companies: companiesSnapshot.size,
          courses: coursesSnapshot.size,
          applications: applicationsSnapshot.size,
          jobs: jobsSnapshot.size,
          jobApplications: jobApplicationsSnapshot.size
        },
        recentActivity: {
          newUsers: recentUsers.size,
          newApplications: recentApplications.size,
          newJobs: recentJobs.size
        },
        userDistribution: this.calculateUserDistribution(usersSnapshot),
        applicationMetrics: this.calculateApplicationMetrics(applicationsSnapshot),
        jobMetrics: this.calculateJobMetrics(jobsSnapshot, jobApplicationsSnapshot)
      };
    } catch (error) {
      console.error('Error getting platform overview:', error);
      throw error;
    }
  }

  // Calculate user distribution by role
  calculateUserDistribution(usersSnapshot) {
    const distribution = {
      student: 0,
      institution: 0,
      company: 0,
      admin: 0
    };

    usersSnapshot.forEach(doc => {
      const userData = doc.data();
      distribution[userData.role] = (distribution[userData.role] || 0) + 1;
    });

    return distribution;
  }

  // Calculate application metrics
  calculateApplicationMetrics(applicationsSnapshot) {
    const metrics = {
      byStatus: {
        pending: 0,
        approved: 0,
        rejected: 0,
        waitlisted: 0,
        withdrawn: 0
      },
      total: applicationsSnapshot.size,
      approvalRate: 0
    };

    let approvedCount = 0;

    applicationsSnapshot.forEach(doc => {
      const applicationData = doc.data();
      const status = applicationData.status;
      
      metrics.byStatus[status] = (metrics.byStatus[status] || 0) + 1;

      if (status === 'approved') {
        approvedCount++;
      }
    });

    metrics.approvalRate = applicationsSnapshot.size > 0 
      ? (approvedCount / applicationsSnapshot.size) * 100 
      : 0;

    return metrics;
  }

  // Calculate job metrics
  calculateJobMetrics(jobsSnapshot, jobApplicationsSnapshot) {
    const metrics = {
      byStatus: {
        active: 0,
        closed: 0,
        draft: 0
      },
      byType: {
        'full-time': 0,
        'part-time': 0,
        contract: 0,
        internship: 0,
        remote: 0
      },
      totalJobs: jobsSnapshot.size,
      totalApplications: jobApplicationsSnapshot.size,
      averageApplicationsPerJob: 0
    };

    jobsSnapshot.forEach(doc => {
      const jobData = doc.data();
      const status = jobData.status;
      const type = jobData.type;

      metrics.byStatus[status] = (metrics.byStatus[status] || 0) + 1;
      metrics.byType[type] = (metrics.byType[type] || 0) + 1;
    });

    metrics.averageApplicationsPerJob = jobsSnapshot.size > 0 
      ? jobApplicationsSnapshot.size / jobsSnapshot.size 
      : 0;

    return metrics;
  }

  // Get growth metrics over time
  async getGrowthMetrics(days = 30) {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const [
        userGrowth,
        applicationGrowth,
        jobGrowth
      ] = await Promise.all([
        this.getEntityGrowth(collections.USERS, 'createdAt', days),
        this.getEntityGrowth(collections.APPLICATIONS, 'appliedAt', days),
        this.getEntityGrowth(collections.JOBS, 'createdAt', days)
      ]);

      return {
        userGrowth,
        applicationGrowth,
        jobGrowth,
        period: {
          start: startDate,
          end: endDate,
          days
        }
      };
    } catch (error) {
      console.error('Error getting growth metrics:', error);
      throw error;
    }
  }

  // Get entity growth over time
  async getEntityGrowth(collectionName, dateField, days) {
    const data = [];
    const endDate = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const currentDate = new Date();
      currentDate.setDate(currentDate.getDate() - i);
      currentDate.setHours(0, 0, 0, 0);

      const nextDate = new Date(currentDate);
      nextDate.setDate(nextDate.getDate() + 1);

      const snapshot = await db.collection(collectionName)
        .where(dateField, '>=', currentDate)
        .where(dateField, '<', nextDate)
        .get();

      data.push({
        date: currentDate.toISOString().split('T')[0],
        count: snapshot.size
      });
    }

    return data;
  }

  // Get popular courses
  async getPopularCourses(limit = 10) {
    try {
      const applicationsSnapshot = await db.collection(collections.APPLICATIONS).get();

      // Count applications per course
      const courseApplicationCount = {};
      applicationsSnapshot.forEach(doc => {
        const applicationData = doc.data();
        const courseId = applicationData.courseId;
        courseApplicationCount[courseId] = (courseApplicationCount[courseId] || 0) + 1;
      });

      // Get top courses
      const popularCourseIds = Object.entries(courseApplicationCount)
        .sort(([, a], [, b]) => b - a)
        .slice(0, limit)
        .map(([courseId]) => courseId);

      const popularCourses = [];

      for (const courseId of popularCourseIds) {
        const courseDoc = await db.collection(collections.COURSES).doc(courseId).get();
        if (courseDoc.exists) {
          const courseData = courseDoc.data();
          const institutionDoc = await db.collection(collections.INSTITUTIONS)
            .doc(courseData.institutionId)
            .get();
          const institutionData = institutionDoc.data();

          popularCourses.push({
            id: courseId,
            name: courseData.name,
            institution: institutionData?.name,
            faculty: courseData.faculty,
            applicationCount: courseApplicationCount[courseId],
            approvalRate: await this.calculateCourseApprovalRate(courseId)
          });
        }
      }

      return popularCourses;
    } catch (error) {
      console.error('Error getting popular courses:', error);
      throw error;
    }
  }

  // Calculate course approval rate
  async calculateCourseApprovalRate(courseId) {
    try {
      const applicationsSnapshot = await db.collection(collections.APPLICATIONS)
        .where('courseId', '==', courseId)
        .get();

      if (applicationsSnapshot.size === 0) {
        return 0;
      }

      let approvedCount = 0;
      applicationsSnapshot.forEach(doc => {
        const applicationData = doc.data();
        if (applicationData.status === 'approved') {
          approvedCount++;
        }
      });

      return (approvedCount / applicationsSnapshot.size) * 100;
    } catch (error) {
      console.error('Error calculating course approval rate:', error);
      return 0;
    }
  }

  // Get institution performance ranking
  async getInstitutionRanking(limit = 10) {
    try {
      const institutionsSnapshot = await db.collection(collections.INSTITUTIONS).get();
      const rankings = [];

      for (const doc of institutionsSnapshot.docs) {
        const institutionData = doc.data();

        // Get institution courses
        const coursesSnapshot = await db.collection(collections.COURSES)
          .where('institutionId', '==', doc.id)
          .get();

        // Get institution applications
        const applicationsSnapshot = await db.collection(collections.APPLICATIONS)
          .where('institutionId', '==', doc.id)
          .get();

        // Calculate metrics
        let approvedApplications = 0;
        applicationsSnapshot.forEach(appDoc => {
          if (appDoc.data().status === 'approved') {
            approvedApplications++;
          }
        });

        const approvalRate = applicationsSnapshot.size > 0 
          ? (approvedApplications / applicationsSnapshot.size) * 100 
          : 0;

        // Calculate score (simplified)
        const score = (
          (coursesSnapshot.size * 0.3) +
          (applicationsSnapshot.size * 0.4) +
          (approvalRate * 0.3)
        );

        rankings.push({
          id: doc.id,
          name: institutionData.name,
          type: institutionData.type,
          location: institutionData.location,
          courses: coursesSnapshot.size,
          applications: applicationsSnapshot.size,
          approvalRate: Math.round(approvalRate * 100) / 100,
          score: Math.round(score * 100) / 100
        });
      }

      return rankings
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
    } catch (error) {
      console.error('Error getting institution ranking:', error);
      throw error;
    }
  }

  // Get student engagement metrics
  async getStudentEngagementMetrics() {
    try {
      const studentsSnapshot = await db.collection(collections.USERS)
        .where('role', '==', 'student')
        .where('status', '==', 'active')
        .get();

      const metrics = {
        totalStudents: studentsSnapshot.size,
        withApplications: 0,
        withTranscripts: 0,
        withJobApplications: 0,
        activeStudents: 0,
        engagementLevels: {
          high: 0,
          medium: 0,
          low: 0
        }
      };

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      for (const doc of studentsSnapshot.docs) {
        const studentData = doc.data();
        const studentId = doc.id;

        // Check applications
        const applicationsSnapshot = await db.collection(collections.APPLICATIONS)
          .where('studentId', '==', studentId)
          .get();

        if (applicationsSnapshot.size > 0) {
          metrics.withApplications++;
        }

        // Check transcripts
        const transcriptsSnapshot = await db.collection(collections.TRANSCRIPTS)
          .where('studentId', '==', studentId)
          .get();

        if (transcriptsSnapshot.size > 0) {
          metrics.withTranscripts++;
        }

        // Check job applications
        const jobApplicationsSnapshot = await db.collection(collections.JOB_APPLICATIONS)
          .where('studentId', '==', studentId)
          .get();

        if (jobApplicationsSnapshot.size > 0) {
          metrics.withJobApplications++;
        }

        // Check recent activity
        if (studentData.lastLogin && studentData.lastLogin.toDate() >= thirtyDaysAgo) {
          metrics.activeStudents++;
        }

        // Calculate engagement level
        const engagementScore = (
          (applicationsSnapshot.size > 0 ? 1 : 0) +
          (transcriptsSnapshot.size > 0 ? 1 : 0) +
          (jobApplicationsSnapshot.size > 0 ? 1 : 0) +
          (studentData.lastLogin && studentData.lastLogin.toDate() >= thirtyDaysAgo ? 1 : 0)
        );

        if (engagementScore >= 3) {
          metrics.engagementLevels.high++;
        } else if (engagementScore >= 2) {
          metrics.engagementLevels.medium++;
        } else {
          metrics.engagementLevels.low++;
        }
      }

      return metrics;
    } catch (error) {
      console.error('Error getting student engagement metrics:', error);
      throw error;
    }
  }

  // Get system health metrics
  async getSystemHealthMetrics() {
    try {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - (60 * 60 * 1000));
      const twentyFourHoursAgo = new Date(now.getTime() - (24 * 60 * 60 * 1000));

      const [
        recentUsers,
        recentApplications,
        recentJobs,
        errorLogs
      ] = await Promise.all([
        db.collection(collections.USERS)
          .where('createdAt', '>=', oneHourAgo)
          .get(),
        db.collection(collections.APPLICATIONS)
          .where('appliedAt', '>=', oneHourAgo)
          .get(),
        db.collection(collections.JOBS)
          .where('createdAt', '>=', oneHourAgo)
          .get(),
        db.collection('error_logs')
          .where('timestamp', '>=', twentyFourHoursAgo)
          .get()
      ]);

      return {
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        recentActivity: {
          users: recentUsers.size,
          applications: recentApplications.size,
          jobs: recentJobs.size
        },
        errorRate: {
          last24Hours: errorLogs.size,
          errorsByType: this.groupErrorsByType(errorLogs)
        },
        performance: {
          responseTime: 'Good', // This would come from monitoring in production
          availability: '99.9%' // This would come from monitoring in production
        }
      };
    } catch (error) {
      console.error('Error getting system health metrics:', error);
      throw error;
    }
  }

  // Group errors by type
  groupErrorsByType(errorLogs) {
    const errorsByType = {};

    errorLogs.forEach(doc => {
      const errorData = doc.data();
      const errorType = errorData.type || 'unknown';
      errorsByType[errorType] = (errorsByType[errorType] || 0) + 1;
    });

    return errorsByType;
  }
}

export default new AnalyticsService();