import React, { useState, useEffect } from 'react'
import { collection, query, where, getDocs, updateDoc, doc, orderBy } from 'firebase/firestore'
import { db } from '../../firebase-config'
import { useAuth } from '../../hooks/useAuth'
import { useNavigate } from 'react-router-dom'

const JobManagement = () => {
  const { userData } = useAuth()
  const navigate = useNavigate()
  const [jobs, setJobs] = useState([])
  const [filteredJobs, setFilteredJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    if (userData) {
      fetchJobs()
    }
  }, [userData])

  useEffect(() => {
    filterJobs()
  }, [jobs, searchTerm, statusFilter])

  const fetchJobs = async () => {
    try {
      setLoading(true)
      const jobsQuery = query(
        collection(db, 'jobs'),
        where('companyId', '==', userData.uid),
        orderBy('createdAt', 'desc')
      )
      const jobsSnapshot = await getDocs(jobsQuery)
      const jobsData = jobsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      setJobs(jobsData)
    } catch (error) {
      console.error('Error fetching jobs:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterJobs = () => {
    let filtered = jobs

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(job =>
        job.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.location?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(job => job.status === statusFilter)
    }

    setFilteredJobs(filtered)
  }

  const updateJobStatus = async (jobId, status) => {
    try {
      const jobRef = doc(db, 'jobs', jobId)
      await updateDoc(jobRef, {
        status,
        updatedAt: new Date()
      })
      
      // Update local state
      setJobs(jobs.map(job => 
        job.id === jobId ? { ...job, status } : job
      ))
      
      // Show success message based on action
      if (status === 'closed') {
        alert('Job closed successfully')
      } else if (status === 'active') {
        alert('Job activated successfully')
      }
    } catch (error) {
      console.error('Error updating job status:', error)
      alert('Error updating job status')
    }
  }

  const handleViewApplicants = (jobId) => {
    navigate(`/company/applicants?jobId=${jobId}`)
  }

  const handleViewDetails = (jobId) => {
    navigate(`/company/jobs/${jobId}`)
  }

  const handleEditJob = (jobId) => {
    navigate(`/company/edit-job/${jobId}`)
  }

  const handleViewJob = (jobId) => {
    navigate(`/jobs/${jobId}`)
  }

  const getStatusBadge = (status) => {
    const statusConfig = {
      active: { color: 'bg-green-100 text-green-800 border border-green-200', label: 'Active' },
      closed: { color: 'bg-gray-100 text-gray-800 border border-gray-200', label: 'Closed' },
      draft: { color: 'bg-yellow-100 text-yellow-800 border border-yellow-200', label: 'Draft' }
    }
    const config = statusConfig[status] || { color: 'bg-gray-100 text-gray-800 border border-gray-200', label: status }
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${config.color}`}>
        {config.label}
      </span>
    )
  }

  const getJobTypeBadge = (jobType) => {
    const typeConfig = {
      'full-time': { color: 'bg-blue-100 text-blue-800 border border-blue-200', label: 'Full Time' },
      'part-time': { color: 'bg-purple-100 text-purple-800 border border-purple-200', label: 'Part Time' },
      contract: { color: 'bg-orange-100 text-orange-800 border border-orange-200', label: 'Contract' },
      internship: { color: 'bg-green-100 text-green-800 border border-green-200', label: 'Internship' },
      remote: { color: 'bg-indigo-100 text-indigo-800 border border-indigo-200', label: 'Remote' }
    }
    const config = typeConfig[jobType] || { color: 'bg-gray-100 text-gray-800 border border-gray-200', label: jobType }
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${config.color}`}>
        {config.label}
      </span>
    )
  }

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A'
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    })
  }

  const isDeadlinePassed = (deadline) => {
    if (!deadline) return false
    const deadlineDate = deadline.toDate ? deadline.toDate() : new Date(deadline)
    return deadlineDate < new Date()
  }

  // CSS Styles
  const styles = {
    container: "min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-6",
    headerContainer: "max-w-7xl mx-auto",
    header: "text-4xl font-bold text-gray-900 mb-3",
    subtitle: "text-lg text-gray-600 mb-8",
    
    // Card Styles
    card: "bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-300",
    filterCard: "bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6",
    
    // Input Styles
    inputField: "w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white text-gray-900 placeholder-gray-500",
    selectField: "px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white text-gray-900",
    
    // Button Styles
    btnPrimary: "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-xl font-semibold shadow-sm hover:shadow-md transition-all duration-200 transform hover:-translate-y-0.5 flex items-center justify-center",
    btnSecondary: "bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white px-6 py-3 rounded-xl font-semibold shadow-sm hover:shadow-md transition-all duration-200 transform hover:-translate-y-0.5 flex items-center justify-center",
    btnSuccess: "bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-6 py-3 rounded-xl font-semibold shadow-sm hover:shadow-md transition-all duration-200 transform hover:-translate-y-0.5 flex items-center justify-center",
    btnOutline: "border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 transform hover:-translate-y-0.5 flex items-center justify-center",
    
    // Icon Button Styles
    iconBtn: "p-2 rounded-lg transition-all duration-200 hover:scale-110",
    iconBtnPrimary: "text-blue-600 hover:bg-blue-50 hover:text-blue-700",
    iconBtnSecondary: "text-gray-600 hover:bg-gray-50 hover:text-gray-700",
    iconBtnDanger: "text-red-600 hover:bg-red-50 hover:text-red-700",
    
    // Badge Styles
    requirementBadge: "inline-block bg-gradient-to-r from-gray-50 to-gray-100 text-gray-700 text-xs px-3 py-2 rounded-lg border border-gray-200 font-medium",
    moreBadge: "inline-block bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 text-xs px-3 py-2 rounded-lg border border-blue-200 font-medium",
    
    // Text Styles
    jobTitle: "text-xl font-bold text-gray-900 mb-2",
    jobDescription: "text-gray-600 leading-relaxed mb-4 line-clamp-2",
    infoText: "text-sm text-gray-700 flex items-center",
    
    // Layout Styles
    grid: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4",
    flexCenter: "flex items-center justify-center",
    flexBetween: "flex items-center justify-between",
    
    // Empty State
    emptyState: "text-center py-16 bg-white rounded-2xl shadow-sm border-2 border-dashed border-gray-300",
    emptyIcon: "mx-auto h-16 w-16 text-gray-400 mb-4",
    emptyTitle: "text-lg font-semibold text-gray-900 mb-2",
    emptyText: "text-gray-600 mb-6 max-w-sm mx-auto"
  }

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.headerContainer}>
          <div className="animate-pulse">
            <div className="h-10 bg-gray-200 rounded-xl w-1/4 mb-6"></div>
            <div className="h-16 bg-gray-200 rounded-xl mb-8"></div>
            <div className="space-y-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded-2xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.headerContainer}>
        {/* Header */}
        <div className="mb-8">
          <div className={styles.flexBetween}>
            <div>
              <h1 className={styles.header}>Job Management</h1>
              <p className={styles.subtitle}>
                Manage your job postings and track applications
              </p>
            </div>
            <button 
              onClick={() => navigate('/company/post-job')}
              className={styles.btnPrimary}
            >
              <div className="h-5 w-5 bg-white rounded mr-2"></div>
              Post New Job
            </button>
          </div>
        </div>

        {/* Filters and Search */}
        <div className={styles.filterCard}>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex-1 max-w-2xl">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <div className="h-5 w-5 bg-gray-400 rounded"></div>
                </div>
                <input
                  type="text"
                  placeholder="Search jobs by title, description, or location..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`${styles.inputField} pl-12`}
                />
              </div>
            </div>
            <div className="flex gap-3">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <div className="h-4 w-4 bg-gray-400 rounded"></div>
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className={`${styles.selectField} pl-10 pr-8`}
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="closed">Closed</option>
                  <option value="draft">Draft</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Jobs Grid */}
        <div className="space-y-6">
          {filteredJobs.map((job) => (
            <div key={job.id} className={styles.card}>
              <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-6">
                {/* Job Content */}
                <div className="flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
                    <div className="flex-1">
                      <h3 className={styles.jobTitle}>{job.title}</h3>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {getStatusBadge(job.status)}
                        {getJobTypeBadge(job.jobType)}
                        {isDeadlinePassed(job.deadline) && job.status === 'active' && (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-200">
                            ⚠️ Expired
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={() => handleViewJob(job.id)}
                        className={`${styles.iconBtn} ${styles.iconBtnPrimary}`}
                        title="View Job"
                      >
                        <div className="h-4 w-4 bg-blue-600 rounded"></div>
                      </button>
                      <button 
                        onClick={() => handleEditJob(job.id)}
                        className={`${styles.iconBtn} ${styles.iconBtnPrimary}`}
                        title="Edit Job"
                      >
                        <div className="h-4 w-4 bg-blue-600 rounded"></div>
                      </button>
                      <button 
                        className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                        title="Delete Job"
                      >
                        <div className="h-4 w-4 bg-red-600 rounded"></div>
                      </button>
                    </div>
                  </div>

                  {/* Job Info Grid */}
                  <div className={styles.grid}>
                    <div className={styles.infoText}>
                      <div className="h-4 w-4 bg-blue-600 rounded mr-3"></div>
                      <span className="font-medium">Location:</span>
                      <span className="ml-2">{job.location || 'Remote'}</span>
                    </div>
                    <div className={styles.infoText}>
                      <div className="h-4 w-4 bg-green-600 rounded mr-3"></div>
                      <span className="font-medium">Deadline:</span>
                      <span className="ml-2">{formatDate(job.deadline)}</span>
                    </div>
                    <div className={styles.infoText}>
                      <div className="h-4 w-4 bg-purple-600 rounded mr-3"></div>
                      <span className="font-medium">Applications:</span>
                      <span className="ml-2 font-semibold">{job.applicationCount || 0}</span>
                    </div>
                  </div>

                  {/* Job Description */}
                  <p className={`${styles.jobDescription} line-clamp-2`}>
                    {job.description}
                  </p>

                  {/* Requirements Preview */}
                  {job.requirements && job.requirements.length > 0 && (
                    <div className="mt-6 pt-4 border-t border-gray-200">
                      <h4 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wide">
                        Key Requirements
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {job.requirements.slice(0, 4).map((requirement, index) => (
                          <span key={index} className={styles.requirementBadge}>
                            {requirement}
                          </span>
                        ))}
                        {job.requirements.length > 4 && (
                          <span className={styles.moreBadge}>
                            +{job.requirements.length - 4} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Buttons Sidebar */}
                <div className="flex xl:flex-col gap-3 xl:min-w-[200px]">
                  {job.status === 'active' ? (
                    <button
                      onClick={() => updateJobStatus(job.id, 'closed')}
                      className={styles.btnSecondary}
                    >
                      <div className="h-4 w-4 bg-white rounded mr-2"></div>
                      Close Job
                    </button>
                  ) : (
                    <button
                      onClick={() => updateJobStatus(job.id, 'active')}
                      className={styles.btnSuccess}
                    >
                      Activate Job
                    </button>
                  )}
                  <button 
                    onClick={() => handleViewApplicants(job.id)}
                    className={styles.btnPrimary}
                  >
                    <div className="h-4 w-4 bg-white rounded mr-2"></div>
                    View Applicants
                  </button>
                  <button 
                    onClick={() => handleViewDetails(job.id)}
                    className={styles.btnOutline}
                  >
                    View Details
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredJobs.length === 0 && (
          <div className={styles.emptyState}>
            <div className={`${styles.emptyIcon} bg-gray-400 rounded`}></div>
            <h3 className={styles.emptyTitle}>
              {jobs.length === 0 ? 'No Jobs Posted Yet' : 'No Jobs Found'}
            </h3>
            <p className={styles.emptyText}>
              {jobs.length === 0 
                ? 'Start building your team by posting your first job opening.'
                : 'Try adjusting your search terms or filters to find what you\'re looking for.'
              }
            </p>
            {jobs.length === 0 && (
              <button 
                onClick={() => navigate('/company/post-job')}
                className={styles.btnPrimary}
              >
                <div className="h-5 w-5 bg-white rounded mr-2"></div>
                Post Your First Job
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default JobManagement