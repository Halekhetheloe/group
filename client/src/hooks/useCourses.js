import { useState, useCallback } from 'react'
import { useFirestore } from './useFirestore'
import { useAuth } from './useAuth'
import { useNotifications } from './useNotifications'
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore'
import { db } from '../firebase-config'

export const useCourses = () => {
  const { user, userData } = useAuth()
  const { 
    addDocument, 
    updateDocument, 
    deleteDocument, 
    getDocuments,
    useCollection 
  } = useFirestore()
  const { notifySuccess, notifyError } = useNotifications()
  
  const [loading, setLoading] = useState(false)

  // Get all courses with filters
  const getCourses = useCallback(async (filters = {}) => {
    setLoading(true)
    
    try {
      const constraints = []
      
      // Apply filters
      if (filters.institutionId) {
        constraints.push([where('institutionId', '==', filters.institutionId)])
      }
      
      if (filters.facultyId) {
        constraints.push([where('facultyId', '==', filters.facultyId)])
      }
      
      if (filters.status) {
        constraints.push([where('status', '==', filters.status)])
      } else {
        // Default to active courses
        constraints.push([where('status', '==', 'active')])
      }
      
      const courses = await getDocuments('courses', constraints)
      
      // Fetch institution details for each course
      const coursesWithInstitutions = await Promise.all(
        courses.map(async (course) => {
          const institutionDoc = await getDoc(doc(db, 'institutions', course.institutionId))
          return {
            ...course,
            institution: institutionDoc.data()
          }
        })
      )
      
      return coursesWithInstitutions
    } catch (error) {
      notifyError('Failed to fetch courses', error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [getDocuments, notifyError])

  // Get course by ID with full details
  const getCourseDetails = useCallback(async (courseId) => {
    setLoading(true)
    
    try {
      const course = await getDocuments('courses', [
        [where('__name__', '==', courseId)]
      ])
      
      if (course.length === 0) {
        throw new Error('Course not found')
      }
      
      const courseData = course[0]
      
      // Fetch institution and faculty details
      const [institutionDoc, facultyDoc] = await Promise.all([
        getDoc(doc(db, 'institutions', courseData.institutionId)),
        courseData.facultyId ? getDoc(doc(db, 'faculties', courseData.facultyId)) : Promise.resolve(null)
      ])
      
      return {
        ...courseData,
        institution: institutionDoc.data(),
        faculty: facultyDoc?.data() || null
      }
    } catch (error) {
      notifyError('Failed to fetch course details', error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [getDocuments, notifyError])

  // Create new course (for institutions)
  const createCourse = useCallback(async (courseData) => {
    if (!user || userData?.role !== 'institution') {
      throw new Error('Only institutions can create courses')
    }

    setLoading(true)
    
    try {
      const course = {
        ...courseData,
        institutionId: user.uid,
        createdAt: new Date(),
        updatedAt: new Date()
      }
      
      const courseId = await addDocument('courses', course)
      notifySuccess('Course created successfully')
      
      return courseId
    } catch (error) {
      notifyError('Failed to create course', error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [user, userData, addDocument, notifySuccess, notifyError])

  // Update course (for institutions)
  const updateCourse = useCallback(async (courseId, courseData) => {
    if (!user || userData?.role !== 'institution') {
      throw new Error('Only institutions can update courses')
    }

    setLoading(true)
    
    try {
      await updateDocument('courses', courseId, courseData)
      notifySuccess('Course updated successfully')
    } catch (error) {
      notifyError('Failed to update course', error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [user, userData, updateDocument, notifySuccess, notifyError])

  // Delete course (for institutions)
  const deleteCourse = useCallback(async (courseId) => {
    if (!user || userData?.role !== 'institution') {
      throw new Error('Only institutions can delete courses')
    }

    setLoading(true)
    
    try {
      // Check if course has any applications
      const applications = await getDocuments('applications', [
        [where('courseId', '==', courseId)],
        [where('status', 'in', ['pending', 'accepted'])]
      ])
      
      if (applications.length > 0) {
        throw new Error('Cannot delete course with active applications')
      }
      
      await deleteDocument('courses', courseId)
      notifySuccess('Course deleted successfully')
    } catch (error) {
      notifyError('Failed to delete course', error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [user, userData, deleteDocument, getDocuments, notifySuccess, notifyError])

  // Get institution's courses
  const getInstitutionCourses = useCallback(async () => {
    if (!user || userData?.role !== 'institution') {
      throw new Error('Only institutions can view their courses')
    }

    return getCourses({ institutionId: user.uid })
  }, [user, userData, getCourses])

  // Search courses
  const searchCourses = useCallback(async (searchTerm, filters = {}) => {
    setLoading(true)
    
    try {
      let courses = await getCourses(filters)
      
      // Apply search filter
      if (searchTerm) {
        const term = searchTerm.toLowerCase()
        courses = courses.filter(course =>
          course.title.toLowerCase().includes(term) ||
          course.description.toLowerCase().includes(term) ||
          course.institution?.name?.toLowerCase().includes(term) ||
          course.code.toLowerCase().includes(term)
        )
      }
      
      return courses
    } catch (error) {
      notifyError('Failed to search courses', error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [getCourses, notifyError])

  // Get courses by faculty
  const getCoursesByFaculty = useCallback(async (facultyId) => {
    return getCourses({ facultyId })
  }, [getCourses])

  // Real-time courses subscription
  const useCoursesSubscription = (filters = {}) => {
    const constraints = []
    
    if (filters.institutionId) {
      constraints.push([where('institutionId', '==', filters.institutionId)])
    }
    
    if (filters.facultyId) {
      constraints.push([where('facultyId', '==', filters.facultyId)])
    }
    
    if (filters.status) {
      constraints.push([where('status', '==', filters.status)])
    }
    
    return useCollection('courses', constraints, [
      filters.institutionId, 
      filters.facultyId, 
      filters.status
    ])
  }

  // Get popular courses (based on application count)
  const getPopularCourses = useCallback(async (limit = 10) => {
    setLoading(true)
    
    try {
      const courses = await getCourses()
      
      // Get application counts for each course
      const coursesWithApplicationCount = await Promise.all(
        courses.map(async (course) => {
          const applications = await getDocuments('applications', [
            [where('courseId', '==', course.id)]
          ])
          
          return {
            ...course,
            applicationCount: applications.length
          }
        })
      )
      
      // Sort by application count and limit
      return coursesWithApplicationCount
        .sort((a, b) => b.applicationCount - a.applicationCount)
        .slice(0, limit)
    } catch (error) {
      notifyError('Failed to fetch popular courses', error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [getCourses, getDocuments, notifyError])

  return {
    loading,
    getCourses,
    getCourseDetails,
    createCourse,
    updateCourse,
    deleteCourse,
    getInstitutionCourses,
    searchCourses,
    getCoursesByFaculty,
    useCoursesSubscription,
    getPopularCourses
  }
}

export default useCourses