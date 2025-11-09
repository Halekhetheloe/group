import React, { useState, useEffect } from 'react'
import { collection, query, where, getDocs, doc, getDoc, orderBy, updateDoc } from 'firebase/firestore'
import { db } from '../../firebase-config'
import { useAuth } from '../../hooks/useAuth'
import { Search, Filter, Eye, Download, Clock, CheckCircle, XCircle, Building, Briefcase, Calendar, Mail, Phone, MapPin } from 'lucide-react'
import toast from 'react-hot-toast'

const JobApplications = () => {
  const { user, userData } = useAuth()
  const [applications, setApplications] = useState([])
  const [filteredApplications, setFilteredApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedApplication, setSelectedApplication] = useState(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)

  useEffect(() => {
    if (userData) {
      fetchJobApplications()
    }
  }, [userData])

  useEffect(() => {
    filterApplications()
  }, [applications, searchTerm, statusFilter])

  const fetchJobApplications = async () => {
    try {
      setLoading(true)
      
      // Fetch student's job applications
      const applicationsQuery = query(
        collection(db, 'jobApplications'),
        where('studentId', '==', user.uid),
        orderBy('appliedAt', 'desc')
      )
      const applicationsSnapshot = await getDocs(applicationsQuery)
      const applicationsData = applicationsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))

      // Fetch job and company details for each application
      const applicationsWithDetails = await Promise.all(
        applicationsData.map(async (application) => {
          const jobDoc = await getDoc(doc(db, 'jobs', application.jobId))
          const jobData = jobDoc.data()
          
          const companyDoc = await getDoc(doc(db, 'companies', jobData.companyId))
          const companyData = companyDoc.data()
          
          return {
            ...application,
            job: jobData,
            company: companyData
          }
        })
      )

      setApplications(applicationsWithDetails)
    } catch (error) {
      console.error('Error fetching job applications:', error)
      toast.error('Failed to load job applications')
    } finally {
      setLoading(false)
    }
  }

  const filterApplications = () => {
    let filtered = applications

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(app =>
        app.job?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.company?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(app => app.status === statusFilter)
    }

    setFilteredApplications(filtered)
  }

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { 
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200', 
        icon: Clock, 
        label: 'Under Review' 
      },
      accepted: { 
        color: 'bg-green-100 text-green-800 border-green-200', 
        icon: CheckCircle, 
        label: 'Offer Received' 
      },
      rejected: { 
        color: 'bg-red-100 text-red-800 border-red-200', 
        icon: XCircle, 
        label: 'Not Selected' 
      },
      interview: { 
        color: 'bg-blue-100 text-blue-800 border-blue-200', 
        icon: Calendar, 
        label: 'Interview Stage' 
      },
      withdrawn: { 
        color: 'bg-gray-100 text-gray-800 border-gray-200', 
        icon: XCircle, 
        label: 'Withdrawn' 
      }
    }
    
    const config = statusConfig[status] || { 
      color: 'bg-gray-100 text-gray-800 border-gray-200', 
      icon: Clock, 
      label: status 
    }
    const Icon = config.icon
    
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${config.color}`}>
        <Icon className="h-4 w-4 mr-1" />
        {config.label}
      </span>
    )
  }

  const getStatusDescription = (status, application) => {
    const descriptions = {
      pending: 'Your application is being reviewed by the company. They will contact you if they wish to proceed.',
      accepted: `Congratulations! ${application.company?.name} has made you an offer. Check your email for details.`,
      rejected: `${application.company?.name} has decided not to move forward with your application at this time.`,
      interview: `${application.company?.name} would like to schedule an interview with you.`,
      withdrawn: 'You have withdrawn your application for this position.'
    }
    return descriptions[status] || 'Status information not available.'
  }

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A'
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  }

  const formatDateTime = (timestamp) => {
    if (!timestamp) return 'N/A'
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const viewApplicationDetails = (application) => {
    setSelectedApplication(application)
    setShowDetailsModal(true)
  }

  const withdrawApplication = async (applicationId) => {
    if (!confirm('Are you sure you want to withdraw this application? This action cannot be undone.')) {
      return
    }

    try {
      await updateDoc(doc(db, 'jobApplications', applicationId), {
        status: 'withdrawn',
        withdrawnAt: new Date(),
        updatedAt: new Date()
      })

      toast.success('Application withdrawn successfully')
      fetchJobApplications() // Refresh the list
    } catch (error) {
      console.error('Error withdrawing application:', error)
      toast.error('Failed to withdraw application')
    }
  }

  const downloadApplicationDocuments = async (applicationId) => {
    // In a real implementation, this would download application documents
    // For now, we'll show a success message
    toast.success('Downloading application documents...')
  }

  const getApplicationProgress = (status) => {
    const progress = {
      pending: { width: '25%', label: 'Application Review' },
      interview: { width: '50%', label: 'Interview Stage' },
      accepted: { width: '100%', label: 'Offer Received' },
      rejected: { width: '100%', label: 'Process Complete' },
      withdrawn: { width: '100%', label: 'Application Withdrawn' }
    }
    return progress[status] || { width: '0%', label: 'Not Started' }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="h-12 bg-gray-200 rounded mb-6"></div>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
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
          <h1 className="text-3xl font-bold text-gray-900">Job Applications</h1>
          <p className="text-gray-600 mt-2">
            Track and manage your job applications
          </p>
        </div>

        {/* Application Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="card text-center">
            <div className="text-2xl font-bold text-blue-600">{applications.length}</div>
            <div className="text-sm text-gray-600">Total Applications</div>
          </div>
          <div className="card text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {applications.filter(app => app.status === 'pending').length}
            </div>
            <div className="text-sm text-gray-600">Under Review</div>
          </div>
          <div className="card text-center">
            <div className="text-2xl font-bold text-green-600">
              {applications.filter(app => app.status === 'accepted').length}
            </div>
            <div className="text-sm text-gray-600">Offers Received</div>
          </div>
          <div className="card text-center">
            <div className="text-2xl font-bold text-blue-600">
              {applications.filter(app => app.status === 'interview').length}
            </div>
            <div className="text-sm text-gray-600">Interviews</div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="card mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search by job title or company..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input-field pl-10"
                />
              </div>
            </div>
            <div className="flex space-x-4">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="input-field"
              >
                <option value="all">All Status</option>
                <option value="pending">Under Review</option>
                <option value="interview">Interview Stage</option>
                <option value="accepted">Offer Received</option>
                <option value="rejected">Not Selected</option>
                <option value="withdrawn">Withdrawn</option>
              </select>
            </div>
          </div>
        </div>

        {/* Applications List */}
        <div className="space-y-6">
          {filteredApplications.map((application) => {
            const progress = getApplicationProgress(application.status)
            
            return (
              <div key={application.id} className="card hover:shadow-lg transition-shadow duration-200">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex-1">
                    {/* Application Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900 hover:text-blue-600 cursor-pointer"
                            onClick={() => viewApplicationDetails(application)}>
                          {application.job?.title}
                        </h3>
                        <div className="flex items-center space-x-4 mt-2 flex-wrap gap-2">
                          <div className="flex items-center text-sm text-gray-600">
                            <Building className="h-4 w-4 mr-1" />
                            {application.company?.name}
                          </div>
                          <div className="flex items-center text-sm text-gray-600">
                            <Briefcase className="h-4 w-4 mr-1" />
                            {application.job?.jobType}
                          </div>
                          <div className="flex items-center text-sm text-gray-600">
                            <MapPin className="h-4 w-4 mr-1" />
                            {application.job?.location || 'Remote'}
                          </div>
                        </div>
                      </div>
                      {getStatusBadge(application.status)}
                    </div>

                    {/* Status Description */}
                    <div className={`p-4 rounded-lg mb-4 ${
                      application.status === 'accepted' 
                        ? 'bg-green-50 border border-green-200'
                        : application.status === 'rejected'
                        ? 'bg-red-50 border border-red-200'
                        : application.status === 'interview'
                        ? 'bg-blue-50 border border-blue-200'
                        : application.status === 'withdrawn'
                        ? 'bg-gray-50 border border-gray-200'
                        : 'bg-yellow-50 border border-yellow-200'
                    }`}>
                      <p className={`text-sm ${
                        application.status === 'accepted' 
                          ? 'text-green-800'
                          : application.status === 'rejected'
                          ? 'text-red-800'
                          : application.status === 'interview'
                          ? 'text-blue-800'
                          : application.status === 'withdrawn'
                          ? 'text-gray-800'
                          : 'text-yellow-800'
                      }`}>
                        {getStatusDescription(application.status, application)}
                      </p>
                      
                      {/* Additional info for interviews */}
                      {application.status === 'interview' && application.interviewScheduled && (
                        <div className="mt-2 flex items-center text-sm text-blue-700">
                          <Calendar className="h-4 w-4 mr-1" />
                          Interview scheduled for {formatDateTime(application.interviewDate)}
                          {application.interviewLocation && ` at ${application.interviewLocation}`}
                        </div>
                      )}
                      
                      {/* Additional info for accepted offers */}
                      {application.status === 'accepted' && application.offerDetails && (
                        <div className="mt-2 text-sm text-green-700">
                          Offer details have been sent to your registered email.
                          {application.offerExpiry && ` Offer expires on ${formatDate(application.offerExpiry)}`}
                        </div>
                      )}
                    </div>

                    {/* Application Timeline */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-4">
                      <div className="flex items-center text-gray-600">
                        <Calendar className="h-4 w-4 mr-2" />
                        Applied: {formatDateTime(application.appliedAt)}
                      </div>
                      {application.updatedAt && (
                        <div className="flex items-center text-gray-600">
                          <Calendar className="h-4 w-4 mr-2" />
                          Updated: {formatDateTime(application.updatedAt)}
                        </div>
                      )}
                      {application.withdrawnAt && (
                        <div className="flex items-center text-gray-600">
                          <Calendar className="h-4 w-4 mr-2" />
                          Withdrawn: {formatDateTime(application.withdrawnAt)}
                        </div>
                      )}
                    </div>

                    {/* Application Progress */}
                    <div className="mt-4">
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-gray-600">Application Progress</span>
                        <span className="font-medium text-gray-900">{progress.label}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: progress.width }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex lg:flex-col space-x-2 lg:space-x-0 lg:space-y-2 mt-4 lg:mt-0 lg:ml-6">
                    <button 
                      onClick={() => viewApplicationDetails(application)}
                      className="btn-primary text-sm flex items-center justify-center"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View Details
                    </button>
                    <button 
                      onClick={() => downloadApplicationDocuments(application.id)}
                      className="btn-secondary text-sm flex items-center justify-center"
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Documents
                    </button>
                    
                    {/* Special actions based on status */}
                    {application.status === 'interview' && (
                      <button className="btn-success text-sm">
                        <Calendar className="h-4 w-4 mr-1" />
                        Schedule
                      </button>
                    )}
                    
                    {application.status === 'accepted' && (
                      <button className="btn-success text-sm">
                        View Offer
                      </button>
                    )}
                    
                    {/* Withdraw option for pending applications */}
                    {application.status === 'pending' && (
                      <button 
                        onClick={() => withdrawApplication(application.id)}
                        className="btn-danger text-sm"
                      >
                        Withdraw
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {filteredApplications.length === 0 && (
          <div className="text-center py-12">
            <Briefcase className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No job applications found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {applications.length === 0 
                ? "You haven't applied to any jobs yet." 
                : 'Try changing your filters.'
              }
            </p>
            {applications.length === 0 && (
              <button 
                onClick={() => window.location.href = '/jobs'}
                className="btn-primary mt-4"
              >
                Browse Jobs
              </button>
            )}
          </div>
        )}

        {/* Application Details Modal */}
        {showDetailsModal && selectedApplication && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-gray-900">
                    Application Details
                  </h3>
                  <button 
                    onClick={() => setShowDetailsModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XCircle className="h-6 w-6" />
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Job Details */}
                  <div className="border-b pb-4">
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">
                      {selectedApplication.job?.title}
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                      <div className="flex items-center">
                        <Building className="h-4 w-4 mr-2" />
                        {selectedApplication.company?.name}
                      </div>
                      <div className="flex items-center">
                        <Briefcase className="h-4 w-4 mr-2" />
                        {selectedApplication.job?.jobType}
                      </div>
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-2" />
                        {selectedApplication.job?.location || 'Remote'}
                      </div>
                      {selectedApplication.job?.salary && (
                        <div className="flex items-center">
                          <DollarSign className="h-4 w-4 mr-2" />
                          {selectedApplication.job?.salary}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Application Status */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Application Status</h4>
                    <div className="flex items-center space-x-2">
                      {getStatusBadge(selectedApplication.status)}
                      <span className="text-sm text-gray-600">
                        {getStatusDescription(selectedApplication.status, selectedApplication)}
                      </span>
                    </div>
                  </div>

                  {/* Timeline */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Timeline</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Applied:</span>
                        <span className="font-medium">{formatDateTime(selectedApplication.appliedAt)}</span>
                      </div>
                      {selectedApplication.updatedAt && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Last Updated:</span>
                          <span className="font-medium">{formatDateTime(selectedApplication.updatedAt)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Contact Information */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Contact Information</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center">
                        <Mail className="h-4 w-4 mr-2 text-gray-400" />
                        <span>{selectedApplication.company?.contactEmail || 'N/A'}</span>
                      </div>
                      <div className="flex items-center">
                        <Phone className="h-4 w-4 mr-2 text-gray-400" />
                        <span>{selectedApplication.company?.contactPhone || 'N/A'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Next Steps */}
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-blue-900 mb-2">Next Steps</h4>
                    <p className="text-sm text-blue-800">
                      {selectedApplication.status === 'pending' && 
                        'The company is reviewing your application. You will be notified via email when there is an update.'}
                      {selectedApplication.status === 'interview' && 
                        'Prepare for your interview. Review the job requirements and your application materials.'}
                      {selectedApplication.status === 'accepted' && 
                        'Congratulations! Review the offer details and respond by the specified deadline.'}
                      {selectedApplication.status === 'rejected' && 
                        'Continue your job search. Consider applying to other positions that match your skills.'}
                    </p>
                  </div>
                </div>

                <div className="flex space-x-3 mt-6">
                  <button 
                    onClick={() => setShowDetailsModal(false)}
                    className="btn-secondary flex-1"
                  >
                    Close
                  </button>
                  {selectedApplication.status === 'pending' && (
                    <button 
                      onClick={() => {
                        withdrawApplication(selectedApplication.id)
                        setShowDetailsModal(false)
                      }}
                      className="btn-danger flex-1"
                    >
                      Withdraw Application
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default JobApplications