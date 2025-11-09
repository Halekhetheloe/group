import { useState, useCallback } from 'react'
import { useFirestore } from './useFirestore'
import { useAuth } from './useAuth'
import { useNotifications } from './useNotifications'
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore'
import { db } from '../firebase-config'

export const useApplications = () => {
  const { user, userData } = useAuth()
  const { addDocument, updateDocument, getDocuments } = useFirestore()
  const { 
    notifyApplicationSubmitted, 
    notifyApplicationStatusChange,
    notifyError 
  } = useNotifications()
  
  const [loading, setLoading] = useState(false)

  // Submit a course application
  const submitApplication = useCallback(async (applicationData) => {
    if (!user || userData?.role !== 'student') {
      throw new Error('Only students can submit applications')
    }

    setLoading(true)
    
    try {
      // Check if student has already applied to 2 courses in this institution
      const existingApplications = await getDocuments('applications', [
        [where('studentId', '==', user.uid)],
        [where('institutionId', '==', applicationData.institutionId)],
        [where('status', 'in', ['pending', 'accepted', 'waitlisted'])]
      ])

      if (existingApplications.length >= 2) {
        throw new Error('You can only apply to a maximum of 2 courses per institution')
      }

      // Check if student has already applied to this specific course
      const existingCourseApplications = existingApplications.filter(
        app => app.courseId === applicationData.courseId
      )

      if (existingCourseApplications.length > 0) {
        throw new Error('You have already applied to this course')
      }

      // Create application
      const application = {
        studentId: user.uid,
        studentName: userData.displayName,
        studentEmail: user.email,
        ...applicationData,
        status: 'pending',
        appliedAt: new Date(),
        updatedAt: new Date()
      }

      const applicationId = await addDocument('applications', application)
      
      // Get course details for notification
      const courseDoc = await getDoc(doc(db, 'courses', applicationData.courseId))
      const courseData = courseDoc.data()
      
      notifyApplicationSubmitted(courseData.title)
      
      return applicationId
    } catch (error) {
      notifyError(error.message, error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [user, userData, addDocument, getDocuments, notifyApplicationSubmitted, notifyError])

  // Update application status (for institutions)
  const updateApplicationStatus = useCallback(async (applicationId, status, notes = '') => {
    if (!user || userData?.role !== 'institution') {
      throw new Error('Only institutions can update application status')
    }

    setLoading(true)
    
    try {
      const updateData = {
        status,
        updatedAt: new Date()
      }
      
      if (notes) {
        updateData.notes = notes
      }
      
      if (status === 'accepted') {
        updateData.admittedAt = new Date()
      }

      await updateDocument('applications', applicationId, updateData)
      
      // Get application and course details for notification
      const application = await getDocuments('applications', [
        [where('__name__', '==', applicationId)]
      ])
      
      if (application.length > 0) {
        const app = application[0]
        const courseDoc = await getDoc(doc(db, 'courses', app.courseId))
        const courseData = courseDoc.data()
        
        // This would typically trigger an email notification
        console.log(`Application status updated for ${app.studentName}: ${status}`)
      }
      
    } catch (error) {
      notifyError('Failed to update application status', error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [user, userData, updateDocument, getDocuments, notifyError])

  // Withdraw application (for students)
  const withdrawApplication = useCallback(async (applicationId) => {
    if (!user || userData?.role !== 'student') {
      throw new Error('Only students can withdraw applications')
    }

    setLoading(true)
    
    try {
      await updateDocument('applications', applicationId, {
        status: 'withdrawn',
        withdrawnAt: new Date(),
        updatedAt: new Date()
      })
    } catch (error) {
      notifyError('Failed to withdraw application', error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [user, userData, updateDocument, notifyError])

  // Get student's applications
  const getStudentApplications = useCallback(async () => {
    if (!user || userData?.role !== 'student') {
      throw new Error('Only students can view their applications')
    }

    setLoading(true)
    
    try {
      const applications = await getDocuments('applications', [
        [where('studentId', '==', user.uid)],
        [where('status', '!=', 'withdrawn')]
      ])

      // Fetch course and institution details for each application
      const applicationsWithDetails = await Promise.all(
        applications.map(async (app) => {
          const [courseDoc, institutionDoc] = await Promise.all([
            getDoc(doc(db, 'courses', app.courseId)),
            getDoc(doc(db, 'institutions', app.institutionId))
          ])
          
          return {
            ...app,
            course: courseDoc.data(),
            institution: institutionDoc.data()
          }
        })
      )

      return applicationsWithDetails
    } catch (error) {
      notifyError('Failed to fetch applications', error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [user, userData, getDocuments, notifyError])

  // Get institution's applications
  const getInstitutionApplications = useCallback(async (status = null) => {
    if (!user || userData?.role !== 'institution') {
      throw new Error('Only institutions can view their applications')
    }

    setLoading(true)
    
    try {
      const constraints = [
        [where('institutionId', '==', user.uid)]
      ]
      
      if (status) {
        constraints.push([where('status', '==', status)])
      }

      const applications = await getDocuments('applications', constraints)

      // Fetch course and student details for each application
      const applicationsWithDetails = await Promise.all(
        applications.map(async (app) => {
          const [courseDoc, studentDoc] = await Promise.all([
            getDoc(doc(db, 'courses', app.courseId)),
            getDoc(doc(db, 'students', app.studentId))
          ])
          
          return {
            ...app,
            course: courseDoc.data(),
            student: studentDoc.data()
          }
        })
      )

      return applicationsWithDetails
    } catch (error) {
      notifyError('Failed to fetch applications', error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [user, userData, getDocuments, notifyError])

  // Check application eligibility
  const checkApplicationEligibility = useCallback(async (courseId, institutionId) => {
    if (!user || userData?.role !== 'student') {
      return { eligible: false, reason: 'Only students can apply' }
    }

    try {
      // Check existing applications to this institution
      const existingApplications = await getDocuments('applications', [
        [where('studentId', '==', user.uid)],
        [where('institutionId', '==', institutionId)],
        [where('status', 'in', ['pending', 'accepted', 'waitlisted'])]
      ])

      if (existingApplications.length >= 2) {
        return { 
          eligible: false, 
          reason: 'You can only apply to a maximum of 2 courses per institution' 
        }
      }

      // Check if already applied to this course
      const existingCourseApplication = existingApplications.find(
        app => app.courseId === courseId
      )

      if (existingCourseApplication) {
        return { 
          eligible: false, 
          reason: 'You have already applied to this course' 
        }
      }

      return { eligible: true }
    } catch (error) {
      console.error('Error checking eligibility:', error)
      return { eligible: false, reason: 'Error checking eligibility' }
    }
  }, [user, userData, getDocuments])

  return {
    loading,
    submitApplication,
    updateApplicationStatus,
    withdrawApplication,
    getStudentApplications,
    getInstitutionApplications,
    checkApplicationEligibility
  }
}

export default useApplications