import { firestoreService } from './firestore'
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '../firebase-config'

export const institutionsService = {
  // Get institutions with filtering
  async getInstitutions(filters = {}) {
    try {
      const constraints = []
      
      // Apply filters
      if (filters.status) {
        constraints.push([where('status', '==', filters.status)])
      } else {
        // Default to approved institutions
        constraints.push([where('status', '==', 'approved')])
      }
      
      if (filters.type) {
        constraints.push([where('type', '==', filters.type)])
      }
      
      const institutions = await firestoreService.getDocuments('institutions', constraints)
      
      // Fetch additional statistics for each institution
      const institutionsWithStats = await Promise.all(
        institutions.map(async (institution) => {
          try {
            // Get course count
            const coursesQuery = query(
              collection(db, 'courses'),
              where('institutionId', '==', institution.id),
              where('status', '==', 'active')
            )
            const coursesSnapshot = await getDocs(coursesQuery)
            
            // Get student count (accepted applications)
            const studentsQuery = query(
              collection(db, 'applications'),
              where('institutionId', '==', institution.id),
              where('status', '==', 'accepted')
            )
            const studentsSnapshot = await getDocs(studentsQuery)
            
            return {
              ...institution,
              courseCount: coursesSnapshot.size,
              studentCount: studentsSnapshot.size
            }
          } catch (error) {
            console.error('Error fetching institution stats:', error)
            return institution
          }
        })
      )
      
      return institutionsWithStats
    } catch (error) {
      console.error('Error getting institutions:', error)
      throw error
    }
  },

  // Get institution by ID with full details
  async getInstitutionDetails(institutionId) {
    try {
      const institution = await firestoreService.getDocument('institutions', institutionId)
      
      if (!institution) {
        throw new Error('Institution not found')
      }
      
      // Get courses
      const courses = await firestoreService.getDocuments('courses', [
        [where('institutionId', '==', institutionId)],
        [where('status', '==', 'active')],
        [orderBy('createdAt', 'desc')]
      ])
      
      // Get faculties
      const faculties = await firestoreService.getDocuments('faculties', [
        [where('institutionId', '==', institutionId)],
        [orderBy('name', 'asc')]
      ])
      
      // Get application statistics
      const applicationsQuery = query(
        collection(db, 'applications'),
        where('institutionId', '==', institutionId)
      )
      const applicationsSnapshot = await getDocs(applicationsQuery)
      const applications = applicationsSnapshot.docs.map(doc => doc.data())
      
      const stats = {
        totalCourses: courses.length,
        totalFaculties: faculties.length,
        totalApplications: applications.length,
        pendingApplications: applications.filter(app => app.status === 'pending').length,
        acceptedApplications: applications.filter(app => app.status === 'accepted').length
      }
      
      return {
        ...institution,
        courses,
        faculties,
        stats
      }
    } catch (error) {
      console.error('Error getting institution details:', error)
      throw error
    }
  },

  // Search institutions
  async searchInstitutions(searchCriteria) {
    try {
      const {
        query: searchQuery,
        type,
        location,
        hasAccreditation,
        sortBy = 'name',
        sortOrder = 'asc'
      } = searchCriteria

      let institutions = await this.getInstitutions({ type })

      // Apply search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        institutions = institutions.filter(institution =>
          institution.name.toLowerCase().includes(query) ||
          institution.description?.toLowerCase().includes(query) ||
          institution.address?.toLowerCase().includes(query) ||
          institution.specializations?.some(spec => spec.toLowerCase().includes(query))
        )
      }

      // Apply location filter
      if (location) {
        institutions = institutions.filter(institution =>
          institution.address?.toLowerCase().includes(location.toLowerCase())
        )
      }

      // Apply accreditation filter
      if (hasAccreditation) {
        institutions = institutions.filter(institution => institution.accreditationStatus)
      }

      // Sort institutions
      institutions.sort((a, b) => {
        let aValue = a[sortBy]
        let bValue = b[sortBy]
        
        if (sortBy === 'popularity') {
          aValue = a.studentCount || 0
          bValue = b.studentCount || 0
        }
        
        if (typeof aValue === 'string') {
          aValue = aValue.toLowerCase()
          bValue = bValue.toLowerCase()
        }
        
        if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1
        if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1
        return 0
      })

      return institutions
    } catch (error) {
      console.error('Error searching institutions:', error)
      throw error
    }
  },

  // Get popular institutions (based on student count)
  async getPopularInstitutions(limit = 10) {
    try {
      const institutions = await this.getInstitutions()
      
      return institutions
        .sort((a, b) => (b.studentCount || 0) - (a.studentCount || 0))
        .slice(0, limit)
    } catch (error) {
      console.error('Error getting popular institutions:', error)
      throw error
    }
  },

  // Update institution profile
  async updateInstitutionProfile(institutionId, profileData) {
    try {
      // Validate profile data
      const validation = this.validateInstitutionProfile(profileData)
      if (!validation.valid) {
        throw new Error(`Invalid profile data: ${validation.errors.join(', ')}`)
      }
      
      await firestoreService.updateDocument('institutions', institutionId, {
        ...profileData,
        updatedAt: new Date(),
        profileCompleted: true
      })
      
      return { success: true }
    } catch (error) {
      console.error('Error updating institution profile:', error)
      throw error
    }
  },

  // Validate institution profile data
  validateInstitutionProfile(profileData) {
    const errors = []
    
    if (!profileData.name || profileData.name.trim().length < 3) {
      errors.push('Institution name must be at least 3 characters long')
    }
    
    if (!profileData.description || profileData.description.trim().length < 100) {
      errors.push('Institution description must be at least 100 characters long')
    }
    
    if (!profileData.address) {
      errors.push('Address is required')
    }
    
    if (!profileData.contactEmail) {
      errors.push('Contact email is required')
    }
    
    if (!profileData.contactPhone) {
      errors.push('Contact phone is required')
    }
    
    return {
      valid: errors.length === 0,
      errors
    }
  },

  // Get institution statistics for dashboard
  async getInstitutionStats(institutionId, timeRange = 'all') {
    try {
      let dateConstraint = []
      
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
        
        dateConstraint = [where('appliedAt', '>=', startDate)]
      }
      
      // Get applications
      const applications = await firestoreService.getDocuments('applications', [
        [where('institutionId', '==', institutionId)],
        ...dateConstraint
      ])
      
      // Get courses
      const courses = await firestoreService.getDocuments('courses', [
        [where('institutionId', '==', institutionId)]
      ])
      
      // Get faculties
      const faculties = await firestoreService.getDocuments('faculties', [
        [where('institutionId', '==', institutionId)]
      ])
      
      const stats = {
        totalCourses: courses.length,
        totalFaculties: faculties.length,
        totalApplications: applications.length,
        pendingApplications: applications.filter(app => app.status === 'pending').length,
        acceptedApplications: applications.filter(app => app.status === 'accepted').length,
        rejectedApplications: applications.filter(app => app.status === 'rejected').length,
        applicationRate: applications.length > 0 ? 
          (applications.filter(app => app.status === 'accepted').length / applications.length) * 100 : 0
      }
      
      return stats
    } catch (error) {
      console.error('Error getting institution stats:', error)
      throw error
    }
  },

  // Get institutions needing approval (for admin)
  async getPendingInstitutions() {
    try {
      return await firestoreService.getDocuments('institutions', [
        [where('status', '==', 'pending')],
        [orderBy('createdAt', 'desc')]
      ])
    } catch (error) {
      console.error('Error getting pending institutions:', error)
      throw error
    }
  },

  // Approve or reject institution (for admin)
  async updateInstitutionStatus(institutionId, status, notes = '') {
    try {
      const updateData = {
        status,
        updatedAt: new Date()
      }
      
      if (notes) {
        updateData.adminNotes = notes
      }
      
      if (status === 'approved') {
        updateData.approvedAt = new Date()
      }
      
      await firestoreService.updateDocument('institutions', institutionId, updateData)
      
      // Send notification email would go here
      
      return { success: true }
    } catch (error) {
      console.error('Error updating institution status:', error)
      throw error
    }
  }
}

export default institutionsService