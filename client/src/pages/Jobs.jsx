import React, { useState, useEffect } from 'react'
import { useJobs } from '../hooks/useJobs'
import { useAuth } from '../hooks/useAuth'
import { Link } from 'react-router-dom'
import { 
  Search, 
  Filter, 
  Briefcase, 
  MapPin, 
  Clock, 
  DollarSign,
  Building,
  Star,
  Users
} from 'lucide-react'
import LoadingSpinner from '../components/shared/UI/LoadingSpinner'

const Jobs = () => {
  const { user, userData } = useAuth()
  const { getJobs, loading } = useJobs()
  const [jobs, setJobs] = useState([])
  const [filteredJobs, setFilteredJobs] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [companyFilter, setCompanyFilter] = useState('all')
  const [jobTypeFilter, setJobTypeFilter] = useState('all')
  const [experienceFilter, setExperienceFilter] = useState('all')
  const [companies, setCompanies] = useState([])

  useEffect(() => {
    fetchJobs()
  }, [])

  useEffect(() => {
    filterJobs()
  }, [jobs, searchTerm, companyFilter, jobTypeFilter, experienceFilter])

  const fetchJobs = async () => {
    try {
      const jobsData = await getJobs()
      setJobs(jobsData)
      
      // Extract unique companies
      const uniqueCompanies = jobsData
        .map(job => job.company)
        .filter((company, index, self) => 
          company && self.findIndex(c => c?.uid === company?.uid) === index
        )
      setCompanies(uniqueCompanies)
    } catch (error) {
      console.error('Error fetching jobs:', error)
    }
  }

  const filterJobs = () => {
    let filtered = jobs

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(job =>
        job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.company?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.requirements?.some(req => req.toLowerCase().includes(searchTerm.toLowerCase()))
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

    setFilteredJobs(filtered)
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

  const getExperienceLabel = (experience) => {
    const labels = {
      'entry': 'Entry Level',
      'mid': 'Mid Level',
      'senior': 'Senior Level',
      'executive': 'Executive'
    }
    return labels[experience] || experience
  }

  const isJobExpired = (job) => {
    if (!job.applicationDeadline) return false
    const deadline = job.applicationDeadline?.toDate?.() || new Date(job.applicationDeadline)
    return deadline < new Date()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <LoadingSpinner size="large" text="Loading jobs..." />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Find Your Dream Job
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Discover career opportunities from top companies in Lesotho and beyond
            </p>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            <div className="lg:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Search jobs, companies, or skills..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            
            {/* Company Filter - FIXED */}
            <div>
              <select
                value={companyFilter}
                onChange={(e) => setCompanyFilter(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Companies</option>
                {companies.map((company, index) => (
                  <option key={company?.uid || `company-${index}`} value={company?.uid}>
                    {company?.name}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Job Type Filter - FIXED */}
            <div>
              <select
                value={jobTypeFilter}
                onChange={(e) => setJobTypeFilter(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Job Types</option>
                <option value="full-time">Full Time</option>
                <option value="part-time">Part Time</option>
                <option value="contract">Contract</option>
                <option value="internship">Internship</option>
                <option value="remote">Remote</option>
              </select>
            </div>
            
            {/* Experience Filter - FIXED */}
            <div>
              <select
                value={experienceFilter}
                onChange={(e) => setExperienceFilter(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Experience</option>
                <option value="entry">Entry Level</option>
                <option value="mid">Mid Level</option>
                <option value="senior">Senior Level</option>
                <option value="executive">Executive</option>
              </select>
            </div>
          </div>
        </div>

        {/* Jobs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredJobs.map((job) => {
            const expired = isJobExpired(job)
            
            return (
              <div key={job.id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
                {/* Job Header */}
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                        {job.title}
                      </h3>
                      <div className="flex items-center text-sm text-gray-600 mt-1">
                        <Building className="h-4 w-4 mr-1" />
                        <span>{job.company?.name}</span>
                      </div>
                    </div>
                    {expired && (
                      <div className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-medium">
                        Expired
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
                      {getJobTypeLabel(job.jobType)}
                    </span>
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">
                      {getExperienceLabel(job.experience)}
                    </span>
                    {job.vacancy > 1 && (
                      <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs font-medium">
                        {job.vacancy} positions
                      </span>
                    )}
                  </div>
                </div>

                {/* Job Details */}
                <div className="p-6 space-y-3">
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="h-4 w-4 mr-2" />
                    <span>{job.location || 'Remote'}</span>
                  </div>
                  
                  {job.salary && (
                    <div className="flex items-center text-sm text-gray-600">
                      <DollarSign className="h-4 w-4 mr-2" />
                      <span>{job.salary}</span>
                    </div>
                  )}
                  
                  {job.applicationDeadline && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Clock className="h-4 w-4 mr-2" />
                      <span className={expired ? 'text-red-600' : ''}>
                        Deadline: {new Date(job.applicationDeadline?.toDate?.() || job.applicationDeadline).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>

                {/* Job Description */}
                <div className="px-6 pb-4">
                  <p className="text-sm text-gray-600 line-clamp-3">
                    {job.description}
                  </p>
                </div>

                {/* Requirements Preview */}
                {job.requirements && job.requirements.length > 0 && (
                  <div className="px-6 pb-4">
                    <p className="text-xs text-gray-500 mb-2">Key Requirements:</p>
                    <div className="flex flex-wrap gap-1">
                      {job.requirements.slice(0, 3).map((req, index) => (
                        <span 
                          key={`req-${job.id}-${index}`}
                          className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded"
                        >
                          {req}
                        </span>
                      ))}
                      {job.requirements.length > 3 && (
                        <span className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded">
                          +{job.requirements.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="px-6 pb-6 pt-4 border-t border-gray-200">
                  <div className="flex space-x-3">
                    <Link
                      to={`/jobs/${job.id}`}
                      className="flex-1 bg-gray-100 text-gray-700 hover:bg-gray-200 px-4 py-2 rounded-lg text-sm font-medium text-center transition-colors"
                    >
                      View Details
                    </Link>
                    {userData?.role === 'student' && !expired && (
                      <Link
                        to={`/jobs/${job.id}/apply`}
                        className="flex-1 bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-lg text-sm font-medium text-center transition-colors"
                      >
                        Apply Now
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Empty State */}
        {filteredJobs.length === 0 && (
          <div className="text-center py-12">
            <Briefcase className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No jobs found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {jobs.length === 0 ? 'No jobs available at the moment.' : 'Try changing your filters.'}
            </p>
            {userData?.role === 'company' && (
              <Link
                to="/company/jobs/post"
                className="btn-primary mt-4"
              >
                Post a Job
              </Link>
            )}
          </div>
        )}

        {/* Results Count */}
        {filteredJobs.length > 0 && (
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Showing {filteredJobs.length} of {jobs.length} jobs
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default Jobs