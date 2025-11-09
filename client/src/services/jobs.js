import { firestoreService, jobService } from './firestore'
import { emailService } from './email'
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '../firebase-config'

export const jobsService = {
  // Get jobs with advanced filtering
  async getJobs(filters = {}) {
    try {
      const constraints = []
      
      // Apply filters
      if (filters.companyId) {
        constraints.push([where('companyId', '==', filters.companyId)])
      }
      
      if (filters.jobType) {
        constraints.push([where('jobType', '==', filters.jobType)])
      }
      
      if (filters.experience) {
        constraints.push([where('experience', '==', filters.experience)])
      }
      
      if (filters.status) {
        constraints.push([where('status', '==', filters.status)])
      } else {
        // Default to active jobs
        constraints.push([where('status', '==', 'active')])
      }
      
      if (filters.location) {
        constraints.push([where('location', '==', filters.location)])
      }
      
      const jobs = await firestoreService.getDocuments('jobs', constraints)
      
      // Fetch company details for each job
      const jobsWithCompanies = await Promise.all(
        jobs.map(async (job) => {
          try {
            const companyDoc = await getDoc(doc(db, 'companies', job.companyId))
            const companyData = companyDoc.data()
            
            return {
              ...job,
              company: companyData
            }
          } catch (error) {
            console.error('Error fetching company details:', error)
            return job
          }
        })
      )
      
      return jobsWithCompanies
    } catch (error) {
      console.error('Error getting jobs:', error)
      throw error
    }
  },

  // Search jobs with multiple criteria
  async searchJobs(searchCriteria) {
    try {
      const {
        query: searchQuery,
        companyId,
        jobType,
        experience,
        location,
        minSalary,
        maxSalary,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = searchCriteria

      let jobs = await this.getJobs({ companyId, jobType, experience, location })

      // Apply search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        jobs = jobs.filter(job =>
          job.title.toLowerCase().includes(query) ||
          job.description.toLowerCase().includes(query) ||
          job.company?.name?.toLowerCase().includes(query) ||
          job.requirements?.some(req => req.toLowerCase().includes(query)) ||
          job.responsibilities?.some(resp => resp.toLowerCase().includes(query))
        )
      }

      // Apply salary filters (basic implementation)
      if (minSalary || maxSalary) {
        jobs = jobs.filter(job => {
          if (!job.salary) return true
          
          // Extract numeric value from salary string (basic parsing)
          const salaryMatch = job.salary.match(/\d+/)
          if (!salaryMatch) return true
          
          const salary = parseInt(salaryMatch[0])
          if (minSalary && salary < minSalary) return false
          if (maxSalary && salary > maxSalary) return false
          return true
        })
      }

      // Sort jobs
      jobs.sort((a, b) => {
        let aValue = a[sortBy]
        let bValue = b[sortBy]
        
        if (sortBy === 'company') {
          aValue = a.company?.name
          bValue = b.company?.name
        }
        
        if (sortBy === 'salary') {
          // Basic salary parsing for sorting
          aValue = this.parseSalary(a.salary)
          bValue = this.parseSalary(b.salary)
        }
        
        if (typeof aValue === 'string') {
          aValue = aValue.toLowerCase()
          bValue = bValue.toLowerCase()
        }
        
        if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1
        if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1
        return 0
      })

      return jobs
    } catch (error) {
      console.error('Error searching jobs:', error)
      throw error
    }
  },

  // Parse salary string to numeric value for sorting
  parseSalary(salaryString) {
    if (!salaryString) return 0
    const match = salaryString.match(/\d+/)
    return match ? parseInt(match[0]) : 0
  },

  // Get job recommendations for a student
  async getJobRecommendations(studentId, limit = 10) {
    try {
      // Get student profile
      const studentDoc = await getDoc(doc(db, 'students', studentId))
      const studentData = studentDoc.data()
      
      // Get all active jobs
      const allJobs = await this.getJobs()
      
      // Simple recommendation algorithm based on:
      // 1. Student skills match with job requirements
      // 2. Experience level match
      // 3. Education level match
      // 4. Company reputation
      
      const scoredJobs = await Promise.all(
        allJobs.map(async (job) => {
          let score = 0
          
          // Base score for active jobs
          score += 10
          
          // Skill matching
          if (studentData?.skills && job.requirements) {
            const studentSkills = studentData.skills.map(skill => skill.toLowerCase())
            const jobRequirements = job.requirements.map(req => req.toLowerCase())
            
            const matchingSkills = studentSkills.filter(skill =>
              jobRequirements.some(req => req.includes(skill))
            )
            score += matchingSkills.length * 20
          }
          
          // Experience level matching
          if (studentData?.experienceLevel && job.experience) {
            const experienceLevels = ['entry', 'mid', 'senior', 'executive']
            const studentLevel = experienceLevels.indexOf(studentData.experienceLevel)
            const jobLevel = experienceLevels.indexOf(job.experience)
            
            if (studentLevel >= jobLevel) {
              score += 30
            } else if (studentLevel >= jobLevel - 1) {
              score += 15
            }
          }
          
          // Education level matching (simplified)
          if (studentData?.educationLevel) {
            score += 10
          }
          
          // Boost for reputable companies
          if (job.company?.status === 'approved' && job.company?.reputationScore) {
            score += job.company.reputationScore
          }
          
          // Penalty for expired deadlines
          if (this.isJobExpired(job)) {
            score -= 100
          }
          
          return { ...job, recommendationScore: score }
        })
      )
      
      // Sort by recommendation score and return top jobs
      return scoredJobs
        .filter(job => job.recommendationScore > 0)
        .sort((a, b) => b.recommendationScore - a.recommendationScore)
        .slice(0, limit)
    } catch (error) {
      console.error('Error getting job recommendations:', error)
      throw error
    }
  },

  // Check if job application deadline has passed
  isJobExpired(job) {
    if (!job.applicationDeadline) return false
    const deadline = job.applicationDeadline.toDate ? job.applicationDeadline.toDate() : new Date(job.applicationDeadline)
    return deadline < new Date()
  },

  // Create new job with validation
  async createJob(jobData, companyId) {
    try {
      // Validate job data
      const validation = this.validateJobData(jobData)
      if (!validation.valid) {
        throw new Error(`Invalid job data: ${validation.errors.join(', ')}`)
      }
      
      const jobWithCompany = {
        ...jobData,
        companyId,
        createdAt: new Date(),
        updatedAt: new Date()
      }
      
      const jobId = await jobService.createJob(jobWithCompany)
      return { success: true, jobId }
    } catch (error) {
      console.error('Error creating job:', error)
      throw error
    }
  },

  // Update job with validation
  async updateJob(jobId, jobData, companyId) {
    try {
      // Verify the job belongs to the company
      const job = await jobService.getJob(jobId)
      if (job.companyId !== companyId) {
        throw new Error('UNAUTHORIZED')
      }
      
      // Validate job data
      const validation = this.validateJobData(jobData)
      if (!validation.valid) {
        throw new Error(`Invalid job data: ${validation.errors.join(', ')}`)
      }
      
      await jobService.updateJob(jobId, jobData)
      return { success: true }
    } catch (error) {
      console.error('Error updating job:', error)
      throw error
    }
  },

  // Delete job with checks
  async deleteJob(jobId, companyId) {
    try {
      // Verify the job belongs to the company
      const job = await jobService.getJob(jobId)
      if (job.companyId !== companyId) {
        throw new Error('UNAUTHORIZED')
      }
      
      // Check if job has active applications
      const applicationsQuery = query(
        collection(db, 'jobApplications'),
        where('jobId', '==', jobId),
        where('status', 'in', ['pending', 'interview'])
      )
      const applicationsSnapshot = await getDocs(applicationsQuery)
      
      if (applicationsSnapshot.size > 0) {
        throw new Error('JOB_HAS_ACTIVE_APPLICATIONS')
      }
      
      await jobService.deleteJob(jobId)
      return { success: true }
    } catch (error) {
      console.error('Error deleting job:', error)
      throw error
    }
  },

  // Validate job data
  validateJobData(jobData) {
    const errors = []
    
    if (!jobData.title || jobData.title.trim().length < 3) {
      errors.push('Job title must be at least 3 characters long')
    }
    
    if (!jobData.description || jobData.description.trim().length < 50) {
      errors.push('Job description must be at least 50 characters long')
    }
    
    if (!jobData.jobType) {
      errors.push('Job type is required')
    }
    
    if (!jobData.experience) {
      errors.push('Experience level is required')
    }
    
    if (!jobData.location) {
      errors.push('Location is required')
    }
    
    if (!jobData.vacancy || jobData.vacancy < 1) {
      errors.push('Vacancy must be at least 1')
    }
    
    if (jobData.requirements && (!Array.isArray(jobData.requirements) || jobData.requirements.length === 0)) {
      errors.push('At least one requirement is needed')
    }
    
    return {
      valid: errors.length === 0,
      errors
    }
  },

  // Get job statistics
  async getJobStats(jobId) {
    try {
      const applicationsQuery = query(
        collection(db, 'jobApplications'),
        where('jobId', '==', jobId)
      )
      const applicationsSnapshot = await getDocs(applicationsQuery)
      const applications = applicationsSnapshot.docs.map(doc => doc.data())
      
      const stats = {
        totalApplications: applications.length,
        pending: applications.filter(app => app.status === 'pending').length,
        interview: applications.filter(app => app.status === 'interview').length,
        accepted: applications.filter(app => app.status === 'accepted').length,
        rejected: applications.filter(app => app.status === 'rejected').length
      }
      
      return stats
    } catch (error) {
      console.error('Error getting job stats:', error)
      throw error
    }
  },

  // Get featured jobs (recent and high priority)
  async getFeaturedJobs(limit = 10) {
    try {
      const jobs = await this.getJobs()
      
      // Filter and score featured jobs
      const featuredJobs = jobs
        .filter(job => {
          // Jobs posted in the last 30 days
          const oneMonthAgo = new Date()
          oneMonthAgo.setDate(oneMonthAgo.getDate() - 30)
          const jobDate = job.createdAt?.toDate?.() || new Date(job.createdAt)
          return jobDate > oneMonthAgo && !this.isJobExpired(job)
        })
        .map(job => {
          let score = 0
          
          // Score based on recency
          const jobDate = job.createdAt?.toDate?.() || new Date(job.createdAt)
          const daysAgo = Math.floor((new Date() - jobDate) / (1000 * 60 * 60 * 24))
          score += Math.max(0, 30 - daysAgo) // More recent = higher score
          
          // Score based on company reputation
          if (job.company?.reputationScore) {
            score += job.company.reputationScore
          }
          
          // Score based on vacancy
          if (job.vacancy > 1) {
            score += (job.vacancy - 1) * 5
          }
          
          return { ...job, featureScore: score }
        })
        .sort((a, b) => b.featureScore - a.featureScore)
        .slice(0, limit)
      
      return featuredJobs
    } catch (error) {
      console.error('Error getting featured jobs:', error)
      throw error
    }
  }
}

export default jobsService