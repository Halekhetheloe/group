import { firestoreService, courseService } from './firestore'
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '../firebase-config'

export const coursesService = {
  // Get courses with advanced filtering
  async getCourses(filters = {}) {
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
      
      if (filters.duration) {
        // Duration filtering would be more complex in production
        // This is a simplified version
      }
      
      const courses = await firestoreService.getDocuments('courses', constraints)
      
      // Fetch institution details for each course
      const coursesWithInstitutions = await Promise.all(
        courses.map(async (course) => {
          try {
            const institutionDoc = await getDoc(doc(db, 'institutions', course.institutionId))
            const institutionData = institutionDoc.data()
            
            let facultyData = null
            if (course.facultyId) {
              const facultyDoc = await getDoc(doc(db, 'faculties', course.facultyId))
              facultyData = facultyDoc.data()
            }
            
            return {
              ...course,
              institution: institutionData,
              faculty: facultyData
            }
          } catch (error) {
            console.error('Error fetching course details:', error)
            return course
          }
        })
      )
      
      return coursesWithInstitutions
    } catch (error) {
      console.error('Error getting courses:', error)
      throw error
    }
  },

  // Search courses with multiple criteria
  async searchCourses(searchCriteria) {
    try {
      const {
        query: searchQuery,
        institutionId,
        facultyId,
        duration,
        minFees,
        maxFees,
        jobType,
        sortBy = 'title',
        sortOrder = 'asc'
      } = searchCriteria

      let courses = await this.getCourses({ institutionId, facultyId })

      // Apply search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        courses = courses.filter(course =>
          course.title.toLowerCase().includes(query) ||
          course.description.toLowerCase().includes(query) ||
          course.institution?.name?.toLowerCase().includes(query) ||
          course.code.toLowerCase().includes(query) ||
          course.requirements?.some(req => req.toLowerCase().includes(query))
        )
      }

      // Apply fee filters
      if (minFees !== undefined) {
        courses = courses.filter(course => course.fees >= minFees)
      }
      if (maxFees !== undefined) {
        courses = courses.filter(course => course.fees <= maxFees)
      }

      // Apply duration filter
      if (duration) {
        courses = courses.filter(course => {
          const courseDuration = course.duration || 0
          if (duration === 'short') return courseDuration <= 12
          if (duration === 'medium') return courseDuration > 12 && courseDuration <= 36
          if (duration === 'long') return courseDuration > 36
          return true
        })
      }

      // Sort courses
      courses.sort((a, b) => {
        let aValue = a[sortBy]
        let bValue = b[sortBy]
        
        if (sortBy === 'institution') {
          aValue = a.institution?.name
          bValue = b.institution?.name
        }
        
        if (typeof aValue === 'string') {
          aValue = aValue.toLowerCase()
          bValue = bValue.toLowerCase()
        }
        
        if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1
        if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1
        return 0
      })

      return courses
    } catch (error) {
      console.error('Error searching courses:', error)
      throw error
    }
  },

  // Get course recommendations for a student
  async getCourseRecommendations(studentId, limit = 10) {
    try {
      // In a real application, this would use machine learning or sophisticated matching
      // For now, we'll return popular courses and courses matching student's interests
      
      const studentDoc = await getDoc(doc(db, 'students', studentId))
      const studentData = studentDoc.data()
      
      // Get all active courses
      const allCourses = await this.getCourses()
      
      // Simple recommendation algorithm based on:
      // 1. Popularity (application count)
      // 2. Match with student's stated interests
      // 3. Institution reputation
      
      const scoredCourses = await Promise.all(
        allCourses.map(async (course) => {
          let score = 0
          
          // Base score for active courses
          score += 10
          
          // Boost for popular courses (based on application count)
          const applicationsQuery = query(
            collection(db, 'applications'),
            where('courseId', '==', course.id)
          )
          const applicationsSnapshot = await getDocs(applicationsQuery)
          score += Math.min(applicationsSnapshot.size * 2, 50) // Cap at 50
          
          // Boost if course matches student's interests
          if (studentData?.interests) {
            const courseTitle = course.title.toLowerCase()
            const courseDescription = course.description.toLowerCase()
            const matches = studentData.interests.filter(interest =>
              courseTitle.includes(interest.toLowerCase()) ||
              courseDescription.includes(interest.toLowerCase())
            )
            score += matches.length * 15
          }
          
          // Boost for accredited institutions
          if (course.institution?.accreditationStatus) {
            score += 20
          }
          
          return { ...course, recommendationScore: score }
        })
      )
      
      // Sort by recommendation score and return top courses
      return scoredCourses
        .sort((a, b) => b.recommendationScore - a.recommendationScore)
        .slice(0, limit)
    } catch (error) {
      console.error('Error getting course recommendations:', error)
      throw error
    }
  },

  // Get courses by faculty
  async getCoursesByFaculty(facultyId) {
    try {
      return await courseService.getCoursesByInstitution(facultyId)
    } catch (error) {
      console.error('Error getting courses by faculty:', error)
      throw error
    }
  },

  // Create new course with validation
  async createCourse(courseData, institutionId) {
    try {
      // Validate course data
      const validation = this.validateCourseData(courseData)
      if (!validation.valid) {
        throw new Error(`Invalid course data: ${validation.errors.join(', ')}`)
      }
      
      const courseWithInstitution = {
        ...courseData,
        institutionId,
        createdAt: new Date(),
        updatedAt: new Date()
      }
      
      const courseId = await courseService.createCourse(courseWithInstitution)
      return { success: true, courseId }
    } catch (error) {
      console.error('Error creating course:', error)
      throw error
    }
  },

  // Update course with validation
  async updateCourse(courseId, courseData, institutionId) {
    try {
      // Verify the course belongs to the institution
      const course = await courseService.getCourse(courseId)
      if (course.institutionId !== institutionId) {
        throw new Error('UNAUTHORIZED')
      }
      
      // Validate course data
      const validation = this.validateCourseData(courseData)
      if (!validation.valid) {
        throw new Error(`Invalid course data: ${validation.errors.join(', ')}`)
      }
      
      await courseService.updateCourse(courseId, courseData)
      return { success: true }
    } catch (error) {
      console.error('Error updating course:', error)
      throw error
    }
  },

  // Delete course with checks
  async deleteCourse(courseId, institutionId) {
    try {
      // Verify the course belongs to the institution
      const course = await courseService.getCourse(courseId)
      if (course.institutionId !== institutionId) {
        throw new Error('UNAUTHORIZED')
      }
      
      // Check if course has active applications
      const applicationsQuery = query(
        collection(db, 'applications'),
        where('courseId', '==', courseId),
        where('status', 'in', ['pending', 'accepted'])
      )
      const applicationsSnapshot = await getDocs(applicationsQuery)
      
      if (applicationsSnapshot.size > 0) {
        throw new Error('COURSE_HAS_ACTIVE_APPLICATIONS')
      }
      
      await courseService.deleteCourse(courseId)
      return { success: true }
    } catch (error) {
      console.error('Error deleting course:', error)
      throw error
    }
  },

  // Validate course data
  validateCourseData(courseData) {
    const errors = []
    
    if (!courseData.title || courseData.title.trim().length < 5) {
      errors.push('Course title must be at least 5 characters long')
    }
    
    if (!courseData.code || courseData.code.trim().length < 3) {
      errors.push('Course code is required and must be at least 3 characters long')
    }
    
    if (!courseData.description || courseData.description.trim().length < 50) {
      errors.push('Course description must be at least 50 characters long')
    }
    
    if (!courseData.facultyId) {
      errors.push('Faculty is required')
    }
    
    if (!courseData.duration || courseData.duration < 1) {
      errors.push('Duration must be at least 1 month')
    }
    
    if (!courseData.intakeCapacity || courseData.intakeCapacity < 1) {
      errors.push('Intake capacity must be at least 1')
    }
    
    return {
      valid: errors.length === 0,
      errors
    }
  },

  // Get course statistics
  async getCourseStats(courseId) {
    try {
      const applicationsQuery = query(
        collection(db, 'applications'),
        where('courseId', '==', courseId)
      )
      const applicationsSnapshot = await getDocs(applicationsQuery)
      const applications = applicationsSnapshot.docs.map(doc => doc.data())
      
      const stats = {
        totalApplications: applications.length,
        pending: applications.filter(app => app.status === 'pending').length,
        accepted: applications.filter(app => app.status === 'accepted').length,
        rejected: applications.filter(app => app.status === 'rejected').length,
        waitlisted: applications.filter(app => app.status === 'waitlisted').length
      }
      
      return stats
    } catch (error) {
      console.error('Error getting course stats:', error)
      throw error
    }
  }
}

export default coursesService