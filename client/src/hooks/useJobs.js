import { useState, useCallback } from 'react'
import { useFirestore } from './useFirestore'
import { useAuth } from './useAuth'
import { useNotifications } from './useNotifications'
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore'
import { db } from '../firebase-config'

export const useJobs = () => {
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

  // Get all jobs with filters
  const getJobs = useCallback(async (filters = {}) => {
    setLoading(true)
    
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
      
      const jobs = await getDocuments('jobs', constraints)
      
      // Fetch company details for each job
      const jobsWithCompanies = await Promise.all(
        jobs.map(async (job) => {
          const companyDoc = await getDoc(doc(db, 'companies', job.companyId))
          return {
            ...job,
            company: companyDoc.data()
          }
        })
      )
      
      return jobsWithCompanies
    } catch (error) {
      notifyError('Failed to fetch jobs', error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [getDocuments, notifyError])

  // Get job by ID with full details
  const getJobDetails = useCallback(async (jobId) => {
    setLoading(true)
    
    try {
      const job = await getDocuments('jobs', [
        [where('__name__', '==', jobId)]
      ])
      
      if (job.length === 0) {
        throw new Error('Job not found')
      }
      
      const jobData = job[0]
      
      // Fetch company details
      const companyDoc = await getDoc(doc(db, 'companies', jobData.companyId))
      
      return {
        ...jobData,
        company: companyDoc.data()
      }
    } catch (error) {
      notifyError('Failed to fetch job details', error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [getDocuments, notifyError])

  // Create new job (for companies)
  const createJob = useCallback(async (jobData) => {
    if (!user || userData?.role !== 'company') {
      throw new Error('Only companies can create jobs')
    }

    setLoading(true)
    
    try {
      const job = {
        ...jobData,
        companyId: user.uid,
        createdAt: new Date(),
        updatedAt: new Date()
      }
      
      const jobId = await addDocument('jobs', job)
      notifySuccess('Job posted successfully')
      
      return jobId
    } catch (error) {
      notifyError('Failed to post job', error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [user, userData, addDocument, notifySuccess, notifyError])

  // Update job (for companies)
  const updateJob = useCallback(async (jobId, jobData) => {
    if (!user || userData?.role !== 'company') {
      throw new Error('Only companies can update jobs')
    }

    setLoading(true)
    
    try {
      await updateDocument('jobs', jobId, jobData)
      notifySuccess('Job updated successfully')
    } catch (error) {
      notifyError('Failed to update job', error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [user, userData, updateDocument, notifySuccess, notifyError])

  // Delete job (for companies)
  const deleteJob = useCallback(async (jobId) => {
    if (!user || userData?.role !== 'company') {
      throw new Error('Only companies can delete jobs')
    }

    setLoading(true)
    
    try {
      // Check if job has any applications
      const applications = await getDocuments('jobApplications', [
        [where('jobId', '==', jobId)],
        [where('status', 'in', ['pending', 'interview'])]
      ])
      
      if (applications.length > 0) {
        throw new Error('Cannot delete job with active applications')
      }
      
      await deleteDocument('jobs', jobId)
      notifySuccess('Job deleted successfully')
    } catch (error) {
      notifyError('Failed to delete job', error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [user, userData, deleteDocument, getDocuments, notifySuccess, notifyError])

  // Get company's jobs
  const getCompanyJobs = useCallback(async () => {
    if (!user || userData?.role !== 'company') {
      throw new Error('Only companies can view their jobs')
    }

    return getJobs({ companyId: user.uid })
  }, [user, userData, getJobs])

  // Search jobs
  const searchJobs = useCallback(async (searchTerm, filters = {}) => {
    setLoading(true)
    
    try {
      let jobs = await getJobs(filters)
      
      // Apply search filter
      if (searchTerm) {
        const term = searchTerm.toLowerCase()
        jobs = jobs.filter(job =>
          job.title.toLowerCase().includes(term) ||
          job.description.toLowerCase().includes(term) ||
          job.company?.name?.toLowerCase().includes(term) ||
          job.requirements?.some(req => req.toLowerCase().includes(term))
        )
      }
      
      return jobs
    } catch (error) {
      notifyError('Failed to search jobs', error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [getJobs, notifyError])

  // Get jobs by category
  const getJobsByCategory = useCallback(async (category) => {
    // This would use a category field in the job document
    return getJobs({ category })
  }, [getJobs])

  // Real-time jobs subscription
  const useJobsSubscription = (filters = {}) => {
    const constraints = []
    
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
    }
    
    return useCollection('jobs', constraints, [
      filters.companyId, 
      filters.jobType, 
      filters.experience, 
      filters.status
    ])
  }

  // Get featured jobs (recent and high priority)
  const getFeaturedJobs = useCallback(async (limit = 10) => {
    setLoading(true)
    
    try {
      const jobs = await getJobs()
      
      // Filter and sort featured jobs
      const featuredJobs = jobs
        .filter(job => {
          // Jobs posted in the last 7 days
          const oneWeekAgo = new Date()
          oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
          const jobDate = job.createdAt?.toDate?.() || new Date(job.createdAt)
          return jobDate > oneWeekAgo
        })
        .sort((a, b) => {
          // Sort by creation date (newest first)
          const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt)
          const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt)
          return dateB - dateA
        })
        .slice(0, limit)
      
      return featuredJobs
    } catch (error) {
      notifyError('Failed to fetch featured jobs', error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [getJobs, notifyError])

  // Check if job application deadline has passed
  const isJobExpired = useCallback((job) => {
    if (!job.applicationDeadline) return false
    
    const deadline = job.applicationDeadline?.toDate?.() || new Date(job.applicationDeadline)
    return deadline < new Date()
  }, [])

  return {
    loading,
    getJobs,
    getJobDetails,
    createJob,
    updateJob,
    deleteJob,
    getCompanyJobs,
    searchJobs,
    getJobsByCategory,
    useJobsSubscription,
    getFeaturedJobs,
    isJobExpired
  }
}

export default useJobs