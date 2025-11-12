import React, { useState, useEffect } from 'react'
import { collection, query, where, getDocs, doc, getDoc, orderBy, updateDoc } from 'firebase/firestore'
import { db } from '../../firebase-config'
import { useAuth } from '../../hooks/useAuth'

// Debug: Check if component is loading
console.log('🎯 MyApplications component is loading...')

const MyApplications = () => {
  const { userData } = useAuth()
  const [applications, setApplications] = useState([])
  const [filteredApplications, setFilteredApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [selectedApplication, setSelectedApplication] = useState(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)

  console.log('🎯 MyApplications component is rendering for user:', userData?.uid)

  useEffect(() => {
    console.log('🔍 useEffect triggered, userData:', userData)
    if (userData) {
      fetchApplications()
    }
  }, [userData])

  useEffect(() => {
    console.log('🔍 Filter useEffect triggered')
    filterApplications()
  }, [applications, searchTerm, statusFilter, typeFilter])

  const fetchApplications = async () => {
    try {
      setLoading(true)
      console.log('📡 Starting to fetch applications...')
      
      // Fetch student's applications
      const applicationsQuery = query(
        collection(db, 'applications'),
        where('studentId', '==', userData.uid),
        orderBy('appliedAt', 'desc')
      )
      const applicationsSnapshot = await getDocs(applicationsQuery)
      const applicationsData = applicationsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))

      console.log('📄 Raw applications found:', applicationsData)

      // Fetch details for each application based on type
      const applicationsWithDetails = await Promise.all(
        applicationsData.map(async (application) => {
          try {
            let details = {}
            let applicationType = 'unknown'

            // Check if it's a job application
            if (application.jobId && typeof application.jobId === 'string') {
              applicationType = 'job'
              try {
                const jobDoc = await getDoc(doc(db, 'jobs', application.jobId))
                if (jobDoc.exists()) {
                  details = {
                    ...jobDoc.data(),
                    id: jobDoc.id
                  }
                } else {
                  details = {
                    title: 'Job no longer available',
                    companyName: 'Unknown Company',
                    location: 'Unknown',
                    jobType: 'Unknown'
                  }
                }
              } catch (jobError) {
                console.error('Error fetching job:', jobError)
                details = {
                  title: 'Error loading job details',
                  companyName: 'Unknown',
                  location: 'Unknown',
                  jobType: 'Unknown'
                }
              }
            }
            // Check if it's a course application
            else if (application.courseId && typeof application.courseId === 'string') {
              applicationType = 'course'
              try {
                const courseDoc = await getDoc(doc(db, 'courses', application.courseId))
                const courseData = courseDoc.exists() ? courseDoc.data() : { name: 'Course not found' }
                
                let institutionData = {}
                if (courseData.institutionId) {
                  const institutionDoc = await getDoc(doc(db, 'institutions', courseData.institutionId))
                  institutionData = institutionDoc.exists() ? institutionDoc.data() : { name: 'Institution not found' }
                }

                details = {
                  course: courseData,
                  institution: institutionData
                }
              } catch (courseError) {
                console.error('Error fetching course:', courseError)
                details = {
                  course: { name: 'Error loading course details' },
                  institution: { name: 'Error loading institution details' }
                }
              }
            }

            return {
              ...application,
              ...details,
              applicationType
            }
          } catch (error) {
            console.error('Error processing application:', error)
            return {
              ...application,
              applicationType: 'unknown',
              title: 'Error loading application details'
            }
          }
        })
      )

      console.log('✅ Applications with details:', applicationsWithDetails)
      setApplications(applicationsWithDetails)
    } catch (error) {
      console.error('❌ Error fetching applications:', error)
    } finally {
      setLoading(false)
      console.log('🏁 Fetch applications completed')
    }
  }

  const filterApplications = () => {
    let filtered = applications

    console.log('🔍 Filtering applications:', {
      total: applications.length,
      searchTerm,
      statusFilter,
      typeFilter
    })

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(app =>
        app.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.jobTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.course?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.institution?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(app => app.status === statusFilter)
    }

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(app => app.applicationType === typeFilter)
    }

    console.log('✅ Filtered applications count:', filtered.length)
    setFilteredApplications(filtered)
  }

  // View Details Handler
  const handleViewDetails = (application) => {
    console.log('🔍 Viewing details for application:', application.id)
    setSelectedApplication(application)
    setShowDetailsModal(true)
  }

  // Accept Offer Handler
  const handleAcceptOffer = async (application) => {
    try {
      console.log('✅ Accepting offer for application:', application.id)
      
      // Update application status in Firestore
      const applicationRef = doc(db, 'applications', application.id)
      await updateDoc(applicationRef, {
        status: 'accepted',
        acceptedAt: new Date()
      })

      // Show success message
      alert('Offer accepted successfully!')
      
      // Refresh applications
      await fetchApplications()
      
    } catch (error) {
      console.error('❌ Error accepting offer:', error)
      alert('Error accepting offer. Please try again.')
    }
  }

  // Contact Handler
  const handleContact = (application) => {
    console.log('📞 Contact for application:', application.id)
    
    // You can implement different contact methods based on application type
    if (application.applicationType === 'job') {
      // For jobs, you might want to show company contact info
      alert(`Contact the company at: ${application.companyEmail || 'No contact email available'}`)
    } else if (application.applicationType === 'course') {
      // For courses, show institution contact info
      alert(`Contact the institution at: ${application.institution?.contactEmail || 'No contact email available'}`)
    } else {
      alert('Contact information not available.')
    }
  }

  // Close Modal Handler
  const handleCloseModal = () => {
    setShowDetailsModal(false)
    setSelectedApplication(null)
  }

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', label: 'Under Review' },
      under_review: { color: 'bg-blue-100 text-blue-800', label: 'Under Review' },
      admitted: { color: 'bg-green-100 text-green-800', label: 'Admitted' },
      accepted: { color: 'bg-green-100 text-green-800', label: 'Accepted' },
      rejected: { color: 'bg-red-100 text-red-800', label: 'Not Selected' },
      hired: { color: 'bg-green-100 text-green-800', label: 'Hired' }
    }
    
    const config = statusConfig[status] || { color: 'bg-gray-100 text-gray-800', label: status }
    
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
        {config.label}
      </span>
    )
  }

  const getApplicationTitle = (application) => {
    if (application.applicationType === 'job') {
      return application.title || application.jobTitle || 'Job Application'
    } else if (application.applicationType === 'course') {
      return application.course?.name || 'Course Application'
    }
    return 'Application'
  }

  const getOrganizationName = (application) => {
    if (application.applicationType === 'job') {
      return application.companyName || 'Company'
    } else if (application.applicationType === 'course') {
      return application.institution?.name || 'Institution'
    }
    return 'Organization'
  }

  const getStatusDescription = (status, applicationType) => {
    const jobDescriptions = {
      pending: 'Your job application is being reviewed by the company.',
      under_review: 'Your application is under review by the hiring team.',
      rejected: 'Unfortunately, you were not selected for this position.',
      hired: 'Congratulations! You have been hired for this position.'
    }

    const courseDescriptions = {
      pending: 'Your course application is being reviewed by the institution.',
      admitted: 'Congratulations! You have been admitted to this program.',
      rejected: 'Unfortunately, you were not admitted to this program.'
    }

    if (applicationType === 'job') {
      return jobDescriptions[status] || 'Status information not available.'
    } else {
      return courseDescriptions[status] || 'Status information not available.'
    }
  }

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A'
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })
    } catch (error) {
      return 'Invalid Date'
    }
  }

  if (loading) {
    console.log('⏳ Showing loading state...')
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-slate-200 rounded w-1/4 mb-6"></div>
            <div className="h-12 bg-slate-200 rounded mb-6"></div>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-32 bg-slate-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  console.log('🎨 Rendering main component with', filteredApplications.length, 'applications')

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800">My Applications</h1>
          <p className="text-slate-600 mt-2">
            Track the status of your course and job applications
          </p>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Search by job title, company, or course..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex space-x-4">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Types</option>
                <option value="job">Job Applications</option>
                <option value="course">Course Applications</option>
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="pending">Under Review</option>
                <option value="under_review">Under Review</option>
                <option value="admitted">Admitted</option>
                <option value="accepted">Accepted</option>
                <option value="rejected">Not Selected</option>
                <option value="hired">Hired</option>
              </select>
            </div>
          </div>
        </div>

        {/* Applications List */}
        <div className="space-y-6">
          {filteredApplications.map((application) => (
            <div key={application.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between">
                <div className="flex-1">
                  {/* Application Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center space-x-2 mb-2">
                        <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                          application.applicationType === 'job' 
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {application.applicationType === 'job' ? 'Job' : 'Course'}
                        </span>
                        <h3 className="text-xl font-semibold text-slate-800">
                          {getApplicationTitle(application)}
                        </h3>
                      </div>
                      <div className="flex items-center space-x-4 mt-2">
                        <div className="flex items-center text-sm text-slate-600">
                          <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                          {getOrganizationName(application)}
                        </div>
                        {application.location && (
                          <div className="flex items-center text-sm text-slate-600">
                            <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            {application.location}
                          </div>
                        )}
                        {application.jobType && (
                          <div className="flex items-center text-sm text-slate-600">
                            <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {application.jobType}
                          </div>
                        )}
                      </div>
                    </div>
                    {getStatusBadge(application.status)}
                  </div>

                  {/* Status Description */}
                  <div className={`p-4 rounded-lg mb-4 ${
                    application.status === 'admitted' || application.status === 'accepted' || application.status === 'hired'
                      ? 'bg-green-50 border border-green-200'
                      : application.status === 'rejected'
                      ? 'bg-red-50 border border-red-200'
                      : 'bg-blue-50 border border-blue-200'
                  }`}>
                    <p className={`text-sm ${
                      application.status === 'admitted' || application.status === 'accepted' || application.status === 'hired'
                        ? 'text-green-800'
                        : application.status === 'rejected'
                        ? 'text-red-800'
                        : 'text-blue-800'
                    }`}>
                      {getStatusDescription(application.status, application.applicationType)}
                    </p>
                    
                    {application.appliedAt && (
                      <div className="mt-2 flex items-center text-sm text-slate-600">
                        <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Applied on {formatDate(application.appliedAt)}
                      </div>
                    )}
                  </div>

                  {/* Cover Letter Preview */}
                  {application.coverLetter && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-slate-700 mb-2">Cover Letter</h4>
                      <p className="text-sm text-slate-600 line-clamp-2">
                        {application.coverLetter}
                      </p>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex lg:flex-col space-x-2 lg:space-x-0 lg:space-y-2 mt-4 lg:mt-0 lg:ml-6">
                  <button 
                    onClick={() => handleViewDetails(application)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    View Details
                  </button>
                  
                  {/* Special actions based on status and type */}
                  {(application.status === 'admitted' || application.status === 'accepted') && (
                    <button 
                      onClick={() => handleAcceptOffer(application)}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                    >
                      Accept Offer
                    </button>
                  )}
                  
                  {(application.status === 'pending' || application.status === 'under_review') && (
                    <button 
                      onClick={() => handleContact(application)}
                      className="bg-slate-600 text-white px-4 py-2 rounded-lg hover:bg-slate-700 transition-colors text-sm font-medium"
                    >
                      Contact
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredApplications.length === 0 && (
          <div className="text-center py-12">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 max-w-md mx-auto">
              <div className="h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="h-8 w-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-800 mb-2">No Applications Found</h3>
              <p className="text-slate-600 mb-6">
                {applications.length === 0 
                  ? "You haven't submitted any applications yet." 
                  : 'Try changing your filters.'
                }
              </p>
              {applications.length === 0 && (
                <div className="flex gap-3 justify-center">
                  <a
                    href="/#/courses"
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Browse Courses
                  </a>
                  <a
                    href="/#/jobs"
                    className="bg-slate-600 text-white px-6 py-2 rounded-lg hover:bg-slate-700 transition-colors"
                  >
                    Browse Jobs
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Application Statistics */}
        {applications.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mt-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Application Statistics</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-700">{applications.length}</div>
                <div className="text-blue-600">Total</div>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-700">
                  {applications.filter(app => app.status === 'pending' || app.status === 'under_review').length}
                </div>
                <div className="text-yellow-600">Under Review</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-700">
                  {applications.filter(app => app.status === 'admitted' || app.status === 'accepted' || app.status === 'hired').length}
                </div>
                <div className="text-green-600">Successful</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-700">
                  {applications.filter(app => app.status === 'rejected').length}
                </div>
                <div className="text-red-600">Not Selected</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Details Modal */}
      {showDetailsModal && selectedApplication && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-slate-800">Application Details</h3>
                <button 
                  onClick={handleCloseModal}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-slate-700">Application Type</h4>
                  <p className="text-slate-600 capitalize">{selectedApplication.applicationType}</p>
                </div>
                
                <div>
                  <h4 className="font-medium text-slate-700">Title</h4>
                  <p className="text-slate-600">{getApplicationTitle(selectedApplication)}</p>
                </div>
                
                <div>
                  <h4 className="font-medium text-slate-700">Organization</h4>
                  <p className="text-slate-600">{getOrganizationName(selectedApplication)}</p>
                </div>
                
                <div>
                  <h4 className="font-medium text-slate-700">Status</h4>
                  <div className="mt-1">{getStatusBadge(selectedApplication.status)}</div>
                </div>
                
                <div>
                  <h4 className="font-medium text-slate-700">Applied Date</h4>
                  <p className="text-slate-600">{formatDate(selectedApplication.appliedAt)}</p>
                </div>
                
                {selectedApplication.coverLetter && (
                  <div>
                    <h4 className="font-medium text-slate-700">Cover Letter</h4>
                    <p className="text-slate-600 mt-1 whitespace-pre-wrap">{selectedApplication.coverLetter}</p>
                  </div>
                )}
                
                {selectedApplication.resumeUrl && (
                  <div>
                    <h4 className="font-medium text-slate-700">Resume</h4>
                    <a 
                      href={selectedApplication.resumeUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800"
                    >
                      View Resume
                    </a>
                  </div>
                )}
              </div>
              
              <div className="mt-6 flex justify-end space-x-3">
                <button 
                  onClick={handleCloseModal}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50"
                >
                  Close
                </button>
                {(selectedApplication.status === 'admitted' || selectedApplication.status === 'accepted') && (
                  <button 
                    onClick={() => {
                      handleAcceptOffer(selectedApplication)
                      handleCloseModal()
                    }}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Accept Offer
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MyApplications