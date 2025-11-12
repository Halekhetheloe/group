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

  // Get all courses with filters and eligibility checking
  const getCourses = useCallback(async (filters = {}, checkEligibility = true) => {
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

      // Apply eligibility filtering if requested and user is a student
      if (checkEligibility && user && userData?.role === 'student') {
        const eligibleCourses = await filterCoursesByEligibility(coursesWithInstitutions, user.uid)
        return eligibleCourses
      }
      
      return coursesWithInstitutions
    } catch (error) {
      notifyError('Failed to fetch courses', error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [getDocuments, user, userData, notifyError])

  // Filter courses by student eligibility
  const filterCoursesByEligibility = useCallback(async (courses, studentId) => {
    try {
      // Get student grades
      const studentDoc = await getDoc(doc(db, 'students', studentId))
      if (!studentDoc.exists()) {
        console.warn('Student document not found')
        return courses
      }

      const studentData = studentDoc.data()
      const studentGrades = studentData.grades || studentData.academicRecords

      if (!studentGrades) {
        console.warn('No grade information found for student')
        return courses
      }

      // Filter courses based on eligibility
      return courses.filter(course => {
        const eligibility = checkCourseEligibility(course, studentGrades)
        course.eligibility = eligibility
        return eligibility.eligible
      })
    } catch (error) {
      console.error('Error filtering courses by eligibility:', error)
      return courses
    }
  }, [])

  // Check course eligibility
  const checkCourseEligibility = useCallback((course, studentGrades) => {
    if (!course.requirements) {
      return { eligible: true, missingRequirements: [], meetsRequirements: ['No requirements specified'] }
    }
    
    const requirements = course.requirements
    const eligibility = {
      eligible: true,
      missingRequirements: [],
      meetsRequirements: []
    }

    // Check minimum grade requirement
    if (requirements.minGrade) {
      const gradeOrder = { 'A': 5, 'B': 4, 'C': 3, 'D': 2, 'E': 1, 'F': 0 }
      const studentOverallGrade = studentGrades.overall || 'F'
      
      if (gradeOrder[studentOverallGrade] < gradeOrder[requirements.minGrade]) {
        eligibility.eligible = false
        eligibility.missingRequirements.push(`Minimum grade of ${requirements.minGrade} required`)
      } else {
        eligibility.meetsRequirements.push(`Meets grade requirement (${requirements.minGrade})`)
      }
    }

    // Check subject requirements
    if (requirements.subjects && requirements.subjects.length > 0) {
      const missingSubjects = requirements.subjects.filter(subject => 
        !studentGrades.subjects || !studentGrades.subjects[subject]
      )

      if (missingSubjects.length > 0) {
        eligibility.eligible = false
        eligibility.missingRequirements.push(`Missing required subjects: ${missingSubjects.join(', ')}`)
      } else {
        eligibility.meetsRequirements.push('Meets all subject requirements')
      }
    }

    // Check minimum points
    if (requirements.minPoints) {
      const studentPoints = studentGrades.points || 0
      if (studentPoints < requirements.minPoints) {
        eligibility.eligible = false
        eligibility.missingRequirements.push(`Minimum ${requirements.minPoints} points required`)
      } else {
        eligibility.meetsRequirements.push(`Meets points requirement (${requirements.minPoints})`)
      }
    }

    return eligibility
  }, [])

  // Get courses that student is eligible for
  const getEligibleCourses = useCallback(async (filters = {}) => {
    return getCourses(filters, true)
  }, [getCourses])

  // Get all courses without eligibility filtering
  const getAllCourses = useCallback(async (filters = {}) => {
    return getCourses(filters, false)
  }, [getCourses])

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

  // Check eligibility for a specific course
  const checkCourseEligibilityForStudent = useCallback(async (courseId) => {
    if (!user || userData?.role !== 'student') {
      throw new Error('Only students can check course eligibility')
    }

    setLoading(true)
    
    try {
      const [course, studentDoc] = await Promise.all([
        getCourseDetails(courseId),
        getDoc(doc(db, 'students', user.uid))
      ])

      if (!studentDoc.exists()) {
        throw new Error('Student data not found')
      }

      const studentData = studentDoc.data()
      const studentGrades = studentData.grades || studentData.academicRecords

      if (!studentGrades) {
        throw new Error('No grade information found')
      }

      return checkCourseEligibility(course, studentGrades)
    } catch (error) {
      notifyError('Failed to check course eligibility', error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [user, userData, getCourseDetails, checkCourseEligibility, notifyError])

  // ... rest of your existing methods remain the same
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

    return getCourses({ institutionId: user.uid }, false)
  }, [user, userData, getCourses])

  // Search courses
  const searchCourses = useCallback(async (searchTerm, filters = {}, checkEligibility = true) => {
    setLoading(true)
    
    try {
      let courses = await getCourses(filters, checkEligibility)
      
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

  // Search eligible courses for students
  const searchEligibleCourses = useCallback(async (searchTerm, filters = {}) => {
    return searchCourses(searchTerm, filters, true)
  }, [searchCourses])

  // Get courses by faculty
  const getCoursesByFaculty = useCallback(async (facultyId) => {
    return getCourses({ facultyId })
  }, [getCourses])

  // Real-time courses subscription
  const useCoursesSubscription = (filters = {}, checkEligibility = true) => {
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
    
    const courses = useCollection('courses', constraints, [
      filters.institutionId, 
      filters.facultyId, 
      filters.status
    ])

    // Note: Real-time eligibility filtering would need additional handling
    return courses
  }

  // Get popular courses (based on application count)
  const getPopularCourses = useCallback(async (limit = 10, checkEligibility = true) => {
    setLoading(true)
    
    try {
      const courses = await getCourses({}, checkEligibility)
      
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

  // Get popular eligible courses for students
  const getPopularEligibleCourses = useCallback(async (limit = 10) => {
    return getPopularCourses(limit, true)
  }, [getPopularCourses])

  return {
    loading,
    getCourses,
    getEligibleCourses,
    getAllCourses,
    getCourseDetails,
    createCourse,
    updateCourse,
    deleteCourse,
    getInstitutionCourses,
    searchCourses,
    searchEligibleCourses,
    getCoursesByFaculty,
    useCoursesSubscription,
    getPopularCourses,
    getPopularEligibleCourses,
    checkCourseEligibilityForStudent
  }
}

export default useCourses