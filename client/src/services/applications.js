import { firestoreService, applicationService } from './firestore'
import { emailService } from './email'
import { doc, getDoc, query, where, getDocs, collection } from 'firebase/firestore'
import { db } from '../firebase-config'

export const applicationsService = {
  // Submit a course application
  async submitCourseApplication(applicationData) {
    try {
      // Check application limits (max 2 courses per institution)
      const existingApplications = await firestoreService.getDocuments('applications', [
        [where('studentId', '==', applicationData.studentId)],
        [where('institutionId', '==', applicationData.institutionId)],
        [where('status', 'in', ['pending', 'accepted', 'waitlisted'])]
      ])

      if (existingApplications.length >= 2) {
        throw new Error('APPLICATION_LIMIT_EXCEEDED')
      }

      // Check if already applied to this course
      const existingCourseApplication = existingApplications.find(
        app => app.courseId === applicationData.courseId
      )

      if (existingCourseApplication) {
        throw new Error('DUPLICATE_APPLICATION')
      }

      // Create application
      const applicationId = await applicationService.createApplication(applicationData)
      
      // Send confirmation email
      try {
        const courseDoc = await getDoc(doc(db, 'courses', applicationData.courseId))
        const courseData = courseDoc.data()
        
        const institutionDoc = await getDoc(doc(db, 'institutions', applicationData.institutionId))
        const institutionData = institutionDoc.data()
        
        await emailService.sendApplicationConfirmation(
          applicationData.studentEmail,
          applicationData.studentName,
          courseData.title,
          institutionData.name
        )
      } catch (emailError) {
        console.error('Failed to send confirmation email:', emailError)
        // Don't throw error - application was still created successfully
      }

      return { success: true, applicationId }
    } catch (error) {
      console.error('Error submitting application:', error)
      throw error
    }
  },

  // Update application status (for institutions)
  async updateApplicationStatus(applicationId, status, notes = '') {
    try {
      await applicationService.updateApplicationStatus(applicationId, status, notes)
      
      // Send notification email
      try {
        const application = await applicationService.getApplication(applicationId)
        const courseDoc = await getDoc(doc(db, 'courses', application.courseId))
        const courseData = courseDoc.data()
        
        const institutionDoc = await getDoc(doc(db, 'institutions', application.institutionId))
        const institutionData = institutionDoc.data()
        
        await emailService.sendAdmissionDecision(
          application.studentEmail,
          application.studentName,
          courseData.title,
          institutionData.name,
          status,
          notes
        )
      } catch (emailError) {
        console.error('Failed to send admission decision email:', emailError)
      }

      return { success: true }
    } catch (error) {
      console.error('Error updating application status:', error)
      throw error
    }
  },

  // Withdraw application (for students)
  async withdrawApplication(applicationId, studentId) {
    try {
      // Verify the application belongs to the student
      const application = await applicationService.getApplication(applicationId)
      if (application.studentId !== studentId) {
        throw new Error('UNAUTHORIZED')
      }

      await applicationService.updateApplicationStatus(applicationId, 'withdrawn')
      return { success: true }
    } catch (error) {
      console.error('Error withdrawing application:', error)
      throw error
    }
  },

  // Get application statistics
  async getApplicationStats(institutionId = null, timeRange = 'all') {
    try {
      let constraints = []
      
      if (institutionId) {
        constraints.push([where('institutionId', '==', institutionId)])
      }
      
      // Apply time range filter
      if (timeRange !== 'all') {
        const now = new Date()
        let startDate = new Date()
        
        switch (timeRange) {
          case 'week':
            startDate.setDate(now.getDate() - 7)
            break
          case 'month':
            startDate.setMonth(now.getMonth() - 1)
            break
          case 'quarter':
            startDate.setMonth(now.getMonth() - 3)
            break
          case 'year':
            startDate.setFullYear(now.getFullYear() - 1)
            break
        }
        
        constraints.push([where('appliedAt', '>=', startDate)])
      }
      
      const applications = await firestoreService.getDocuments('applications', constraints)
      
      const stats = {
        total: applications.length,
        pending: applications.filter(app => app.status === 'pending').length,
        accepted: applications.filter(app => app.status === 'accepted').length,
        rejected: applications.filter(app => app.status === 'rejected').length,
        waitlisted: applications.filter(app => app.status === 'waitlisted').length,
        withdrawn: applications.filter(app => app.status === 'withdrawn').length
      }
      
      return stats
    } catch (error) {
      console.error('Error getting application stats:', error)
      throw error
    }
  },

  // Check application eligibility
  async checkEligibility(studentId, courseId, institutionId) {
    try {
      // Check existing applications to this institution
      const existingApplications = await firestoreService.getDocuments('applications', [
        [where('studentId', '==', studentId)],
        [where('institutionId', '==', institutionId)],
        [where('status', 'in', ['pending', 'accepted', 'waitlisted'])]
      ])

      if (existingApplications.length >= 2) {
        return { 
          eligible: false, 
          reason: 'APPLICATION_LIMIT_EXCEEDED',
          message: 'You can only apply to a maximum of 2 courses per institution' 
        }
      }

      // Check if already applied to this course
      const existingCourseApplication = existingApplications.find(
        app => app.courseId === courseId
      )

      if (existingCourseApplication) {
        return { 
          eligible: false, 
          reason: 'DUPLICATE_APPLICATION',
          message: 'You have already applied to this course' 
        }
      }

      // Check course requirements (this would be more sophisticated in production)
      const course = await firestoreService.getDocument('courses', courseId)
      if (course.status !== 'active') {
        return { 
          eligible: false, 
          reason: 'COURSE_NOT_ACTIVE',
          message: 'This course is not currently accepting applications' 
        }
      }

      // Check application deadline
      if (course.applicationDeadline) {
        const deadline = course.applicationDeadline.toDate ? course.applicationDeadline.toDate() : new Date(course.applicationDeadline)
        if (deadline < new Date()) {
          return { 
            eligible: false, 
            reason: 'DEADLINE_PASSED',
            message: 'The application deadline for this course has passed' 
          }
        }
      }

      return { eligible: true }
    } catch (error) {
      console.error('Error checking eligibility:', error)
      return { 
        eligible: false, 
        reason: 'ERROR',
        message: 'Error checking eligibility' 
      }
    }
  },

  // Get popular courses based on application count
  async getPopularCourses(limit = 10) {
    try {
      const applications = await firestoreService.getDocuments('applications')
      
      // Count applications per course
      const courseCounts = applications.reduce((acc, app) => {
        acc[app.courseId] = (acc[app.courseId] || 0) + 1
        return acc
      }, {})
      
      // Get course details for top courses
      const popularCourseIds = Object.entries(courseCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, limit)
        .map(([courseId]) => courseId)
      
      const popularCourses = await Promise.all(
        popularCourseIds.map(courseId => 
          firestoreService.getDocument('courses', courseId)
        )
      )
      
      return popularCourses.filter(course => course).map(course => ({
        ...course,
        applicationCount: courseCounts[course.id]
      }))
    } catch (error) {
      console.error('Error getting popular courses:', error)
      throw error
    }
  }
}

export default applicationsService