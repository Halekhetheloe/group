import React, { useState, useEffect } from 'react'
import { collection, query, where, getDocs, orderBy, doc, getDoc, addDoc } from 'firebase/firestore'
import { db } from '../../firebase-config'
import { useAuth } from '../../hooks/useAuth'
import { Search, Filter, Briefcase, MapPin, Clock, DollarSign, Building, Heart, Share2, Eye, Users } from 'lucide-react'
import toast from 'react-hot-toast'

const JobBrowser = () => {
  const { userData } = useAuth()
  const [jobs, setJobs] = useState([])
  const [filteredJobs, setFilteredJobs] = useState([])
  const [companies, setCompanies] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [companyFilter, setCompanyFilter] = useState('all')
  const [jobTypeFilter, setJobTypeFilter] = useState('all')
  const [experienceFilter, setExperienceFilter] = useState('all')
  const [sortBy, setSortBy] = useState('newest')
  const [appliedJobs, setAppliedJobs] = useState(new Set())
  const [savedJobs, setSavedJobs] = useState(new Set())

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    filterAndSortJobs()
  }, [jobs, searchTerm, companyFilter, jobTypeFilter, experienceFilter, sortBy])

  useEffect(() => {
    if (userData) {
      fetchAppliedJobs()
      fetchSavedJobs()
    }
  }, [userData])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // Fetch all active jobs
      const jobsQuery = query(
        collection(db, 'jobs'),
        where('status', '==', 'active'),
        orderBy('createdAt', 'desc')
      )
      const jobsSnapshot = await getDocs(jobsQuery)
      const jobsData = jobsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))

      // Fetch company details for each job
      const jobsWithCompanies = await Promise.all(
        jobsData.map(async (job) => {
          const companyDoc = await getDoc(doc(db, 'companies', job.companyId))
          const companyData = companyDoc.data()
          return {
            ...job,
            company: companyData
          }
        })
      )

      setJobs(jobsWithCompanies)

      // Get unique companies for filter
      const uniqueCompanies = [...new Set(jobsData.map(job => job.companyId))]
      const companyDetails = await Promise.all(
        uniqueCompanies.map(async (id) => {
          const companyDoc = await getDoc(doc(db, 'companies', id))
          return {
            id,
            ...companyDoc.data()
          }
        })
      )
      setCompanies(companyDetails)

    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAppliedJobs = async () => {
    try {
      const applicationsQuery = query(
        collection(db, 'jobApplications'),
        where('studentId', '==', userData.uid)
      )
      const applicationsSnapshot = await getDocs(applicationsQuery)
      const appliedJobIds = applicationsSnapshot.docs.map(doc => doc.data().jobId)
      setAppliedJobs(new Set(appliedJobIds))
    } catch (error) {
      console.error('Error fetching job applications:', error)
    }
  }

  const fetchSavedJobs = async () => {
    try {
      const savedQuery = query(
        collection(db, 'savedJobs'),
        where('studentId', '==', userData.uid)
      )
      const savedSnapshot = await getDocs(savedQuery)
      const savedJobIds = savedSnapshot.docs.map(doc => doc.data().jobId)
      setSavedJobs(new Set(savedJobIds))
    } catch (error) {
      console.error('Error fetching saved jobs:', error)
    }
  }

  const filterAndSortJobs = () => {
    let filtered = jobs

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(job =>
        job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.company?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.requirements.some(req => req.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }

    // Company filter
    if (companyFilter !== 'all') {
      filtered = filtered.filter(job => job.companyId === companyFilter)
    }

    // Job type filter
    if (jobTypeFilter !== 'all') {
      filtered = filtered.filter(job => job.jobType === jobTypeFilter)
    }

    // Experience filter
    if (experienceFilter !== 'all') {
      filtered = filtered.filter(job => job.experience === experienceFilter)
    }

    // Sort jobs
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return b.createdAt - a.createdAt
        case 'oldest':
          return a.createdAt - b.createdAt
        case 'title':
          return a.title.localeCompare(b.title)
        case 'deadline':
          return a.deadline - b.deadline
        case 'company':
          return a.company?.name?.localeCompare(b.company?.name)
        default:
          return 0
      }
    })

    setFilteredJobs(filtered)
  }

  const applyForJob = async (jobId) => {
    if (!userData) {
      toast.error('Please log in to apply for jobs')
      return
    }

    // Check if already applied
    if (appliedJobs.has(jobId)) {
      toast.error('You have already applied for this job')
      return
    }

    try {
      const applicationData = {
        studentId: userData.uid,
        jobId: jobId,
        companyId: jobs.find(j => j.id === jobId)?.companyId,
        status: 'pending',
        appliedAt: new Date(),
        // Student profile information
        studentName: userData.displayName,
        studentEmail: userData.email
      }

      await addDoc(collection(db, 'jobApplications'), applicationData)
      
      // Update local state
      setAppliedJobs(prev => new Set([...prev, jobId]))
      toast.success('Job application submitted successfully!')
    } catch (error) {
      console.error('Error applying for job:', error)
      toast.error('Failed to submit application. Please try again.')
    }
  }

  const toggleSaveJob = async (jobId) => {
    if (!userData) {
      toast.error('Please log in to save jobs')
      return
    }

    try {
      if (savedJobs.has(jobId)) {
        // Remove from saved jobs
        const savedQuery = query(
          collection(db, 'savedJobs'),
          where('studentId', '==', userData.uid),
          where('jobId', '==', jobId)
        )
        const savedSnapshot = await getDocs(savedQuery)
        
        if (!savedSnapshot.empty) {
          await deleteDoc(doc(db, 'savedJobs', savedSnapshot.docs[0].id))
        }
        
        setSavedJobs(prev => {
          const newSet = new Set(prev)
          newSet.delete(jobId)
          return newSet
        })
        
        toast.success('Job removed from saved jobs')
      } else {
        // Add to saved jobs
        const saveData = {
          studentId: userData.uid,
          jobId: jobId,
          savedAt: new Date()
        }

        await addDoc(collection(db, 'savedJobs'), saveData)
        
        setSavedJobs(prev => new Set([...prev, jobId]))
        toast.success('Job saved successfully!')
      }
    } catch (error) {
      console.error('Error toggling save job:', error)
      toast.error('Failed to update saved jobs. Please try again.')
    }
  }

  const isDeadlinePassed = (deadline) => {
    if (!deadline) return true
    const deadlineDate = deadline.toDate ? deadline.toDate() : new Date(deadline)
    return deadlineDate < new Date()
  }

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A'
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    return date.toLocaleDateString()
  }

  const getExperienceLabel = (experience) => {
    const labels = {
      'entry': 'Entry Level',
      'mid': 'Mid Level',
      'senior': 'Senior Level',
      'executive': 'Executive'
    }
    return labels[experience] || experience
  }

  const getJobTypeLabel = (jobType) => {
    const labels = {
      'full-time': 'Full Time',
      'part-time': 'Part Time',
      'contract': 'Contract',
      'internship': 'Internship',
      'remote': 'Remote'
    }
    return labels[jobType] || jobType
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="h-12 bg-gray-200 rounded mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-96 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Browse Jobs</h1>
          <p className="text-gray-600 mt-2">
            Discover career opportunities from partner companies
          </p>
        </div>

        {/* Filters and Search */}
        <div className="card mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search jobs, companies, or skills..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input-field pl-10"
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-4">
              <select
                value={companyFilter}
                onChange={(e) => setCompanyFilter(e.target.value)}
                className="input-field"
              >
                <option value="all">All Companies</option>
                {companies.map(company => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </select>
              <select
                value={jobTypeFilter}
                onChange={(e) => setJobTypeFilter(e.target.value)}
                className="input-field"
              >
                <option value="all">All Job Types</option>
                <option value="full-time">Full Time</option>
                <option value="part-time">Part Time</option>
                <option value="contract">Contract</option>
                <option value="internship">Internship</option>
                <option value="remote">Remote</option>
              </select>
              <select
                value={experienceFilter}
                onChange={(e) => setExperienceFilter(e.target.value)}
                className="input-field"
              >
                <option value="all">All Experience Levels</option>
                <option value="entry">Entry Level</option>
                <option value="mid">Mid Level</option>
                <option value="senior">Senior Level</option>
                <option value="executive">Executive</option>
              </select>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="input-field"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="title">Job Title A-Z</option>
                <option value="company">Company Name</option>
                <option value="deadline">Application Deadline</option>
              </select>
            </div>
          </div>
        </div>

        {/* Jobs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredJobs.map((job) => {
            const hasApplied = appliedJobs.has(job.id)
            const isSaved = savedJobs.has(job.id)
            const deadlinePassed = isDeadlinePassed(job.deadline)
            
            return (
              <div key={job.id} className="card group hover:shadow-lg transition-shadow duration-300">
                {/* Job Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors duration-200">
                      {job.title}
                    </h3>
                    <div className="flex items-center space-x-2 mt-1">
                      <Building className="h-4 w-4 text-gray-400" />
                      <p className="text-sm text-gray-600">{job.company?.name}</p>
                    </div>
                  </div>
                  <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <button 
                      onClick={() => toggleSaveJob(job.id)}
                      className={`p-1 rounded transition-colors duration-200 ${
                        isSaved 
                          ? 'text-red-500 hover:text-red-600 hover:bg-red-50' 
                          : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
                      }`}
                    >
                      <Heart className={`h-4 w-4 ${isSaved ? 'fill-current' : ''}`} />
                    </button>
                    <button className="p-1 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded transition-colors duration-200">
                      <Share2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Job Description */}
                <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                  {job.description}
                </p>

                {/* Job Details */}
                <div className="space-y-3 mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="h-4 w-4 mr-2" />
                    {job.location || 'Remote'}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Clock className="h-4 w-4 mr-2" />
                    {getJobTypeLabel(job.jobType)}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Users className="h-4 w-4 mr-2" />
                    {getExperienceLabel(job.experience)}
                  </div>
                  {job.salary && (
                    <div className="flex items-center text-sm text-gray-600">
                      <DollarSign className="h-4 w-4 mr-2" />
                      {job.salary}
                    </div>
                  )}
                </div>

                {/* Application Deadline */}
                <div className={`p-3 rounded-lg mb-4 ${
                  deadlinePassed 
                    ? 'bg-red-50 border border-red-200' 
                    : 'bg-blue-50 border border-blue-200'
                }`}>
                  <div className="flex justify-between items-center text-sm">
                    <span className={deadlinePassed ? 'text-red-700' : 'text-blue-700'}>
                      Application Deadline
                    </span>
                    <span className={`font-medium ${deadlinePassed ? 'text-red-800' : 'text-blue-800'}`}>
                      {formatDate(job.deadline)}
                    </span>
                  </div>
                  {deadlinePassed && (
                    <p className="text-xs text-red-600 mt-1">Applications closed</p>
                  )}
                </div>

                {/* Requirements Preview */}
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Key Requirements:</h4>
                  <div className="flex flex-wrap gap-1">
                    {job.requirements.slice(0, 3).map((requirement, index) => (
                      <span key={index} className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded">
                        {requirement}
                      </span>
                    ))}
                    {job.requirements.length > 3 && (
                      <span className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded">
                        +{job.requirements.length - 3} more
                      </span>
                    )}
                  </div>
                </div>

                {/* Qualifications Preview */}
                {job.qualifications && job.qualifications.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Qualifications:</h4>
                    <div className="flex flex-wrap gap-1">
                      {job.qualifications.slice(0, 2).map((qualification, index) => (
                        <span key={index} className="inline-block bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded">
                          {qualification}
                        </span>
                      ))}
                      {job.qualifications.length > 2 && (
                        <span className="inline-block bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded">
                          +{job.qualifications.length - 2} more
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex space-x-2">
                  <button className="btn-secondary flex-1 text-sm flex items-center justify-center">
                    <Eye className="h-4 w-4 mr-1" />
                    View Details
                  </button>
                  <button
                    onClick={() => applyForJob(job.id)}
                    disabled={hasApplied || deadlinePassed || !userData}
                    className={`flex-1 text-sm flex items-center justify-center ${
                      hasApplied 
                        ? 'btn-secondary cursor-not-allowed' 
                        : deadlinePassed
                        ? 'btn-secondary cursor-not-allowed'
                        : 'btn-primary'
                    }`}
                  >
                    {hasApplied ? 'Applied' : deadlinePassed ? 'Closed' : 'Apply Now'}
                  </button>
                </div>

                {/* Application Status */}
                {hasApplied && (
                  <div className="mt-2 text-center">
                    <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                      ✓ Application Submitted
                    </span>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {filteredJobs.length === 0 && (
          <div className="text-center py-12">
            <Briefcase className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No jobs found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {jobs.length === 0 ? 'No jobs available at the moment.' : 'Try changing your filters.'}
            </p>
          </div>
        )}

        {/* Results Count */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Showing {filteredJobs.length} of {jobs.length} jobs
          </p>
        </div>

        {/* Job Search Tips */}
        <div className="card mt-6 bg-blue-50 border-blue-200">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">Job Search Tips</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
            <div>
              <ul className="space-y-2">
                <li>• Tailor your resume for each job application</li>
                <li>• Highlight relevant skills and experience</li>
                <li>• Research the company before applying</li>
              </ul>
            </div>
            <div>
              <ul className="space-y-2">
                <li>• Keep your student profile updated</li>
                <li>• Save interesting jobs for later review</li>
                <li>• Apply early before deadlines</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default JobBrowser