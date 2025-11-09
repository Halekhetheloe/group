import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '../../firebase-config'
import { useAuth } from '../../hooks/useAuth'

const ApplicantView = () => {
  const { applicantId } = useParams()
  const navigate = useNavigate()
  const { userData } = useAuth()
  const [application, setApplication] = useState(null)
  const [student, setStudent] = useState(null)
  const [job, setJob] = useState(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    if (applicantId) {
      fetchApplicantData()
    }
  }, [applicantId])

  const fetchApplicantData = async () => {
    try {
      setLoading(true)
      
      // Fetch application
      const applicationDoc = await getDoc(doc(db, 'applications', applicantId))
      if (!applicationDoc.exists()) {
        alert('Application not found')
        navigate('/company/applicants')
        return
      }

      const applicationData = {
        id: applicationDoc.id,
        ...applicationDoc.data()
      }
      setApplication(applicationData)

      // Fetch student data
      if (applicationData.studentId) {
        const studentDoc = await getDoc(doc(db, 'users', applicationData.studentId))
        if (studentDoc.exists()) {
          setStudent(studentDoc.data())
        }

        // Fetch student profile
        const profileDoc = await getDoc(doc(db, 'studentProfiles', applicationData.studentId))
        if (profileDoc.exists()) {
          setStudent(prev => ({ ...prev, profile: profileDoc.data() }))
        }

        // Fetch transcripts
        const transcriptsQuery = query(
          collection(db, 'transcripts'),
          where('studentId', '==', applicationData.studentId)
        )
        const transcriptsSnapshot = await getDocs(transcriptsQuery)
        const transcripts = transcriptsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        setStudent(prev => ({ ...prev, transcripts }))
      }

      // Fetch job data
      if (applicationData.jobId) {
        const jobDoc = await getDoc(doc(db, 'jobs', applicationData.jobId))
        if (jobDoc.exists()) {
          setJob(jobDoc.data())
        }
      }

    } catch (error) {
      console.error('Error fetching applicant data:', error)
      alert('Error loading applicant information')
    } finally {
      setLoading(false)
    }
  }

  const updateApplicationStatus = async (newStatus, notes = '') => {
    try {
      setUpdating(true)
      
      const applicationRef = doc(db, 'applications', applicantId)
      const updateData = {
        status: newStatus,
        updatedAt: new Date(),
        reviewedBy: userData.uid,
        reviewedAt: new Date()
      }

      // Add notes if provided
      if (notes) {
        updateData.notes = notes
        updateData.lastNoteAt = new Date()
      }

      await updateDoc(applicationRef, updateData)

      // Update local state
      setApplication(prev => ({
        ...prev,
        ...updateData
      }))

      // Show appropriate message
      const statusMessages = {
        rejected: 'Application rejected successfully',
        under_review: 'Application marked as under review',
        interviewed: 'Application marked as interviewed - schedule an interview',
        accepted: 'Application accepted - offer sent to candidate',
        hired: 'Candidate hired successfully'
      }

      alert(statusMessages[newStatus] || 'Status updated successfully')
      
    } catch (error) {
      console.error('Error updating application status:', error)
      alert('Error updating application status')
    } finally {
      setUpdating(false)
    }
  }

  const sendMessageToApplicant = async (message) => {
    try {
      // In a real app, you would integrate with an email service or messaging system
      alert(`Message sent to applicant: "${message}"\n\nThis would trigger an email or notification to the candidate.`)
      
      // You could also save the message to Firestore
      const messageRef = doc(collection(db, 'applicationMessages'))
      // await setDoc(messageRef, {
      //   applicationId: applicantId,
      //   from: userData.uid,
      //   to: application.studentId,
      //   message,
      //   sentAt: new Date(),
      //   type: 'company_to_student'
      // })
      
    } catch (error) {
      console.error('Error sending message:', error)
      alert('Error sending message')
    }
  }

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', label: 'Pending Review' },
      under_review: { color: 'bg-blue-100 text-blue-800', label: 'Under Review' },
      interviewed: { color: 'bg-purple-100 text-purple-800', label: 'Interviewed' },
      accepted: { color: 'bg-green-100 text-green-800', label: 'Offer Sent' },
      rejected: { color: 'bg-red-100 text-red-800', label: 'Rejected' },
      hired: { color: 'bg-green-100 text-green-800', label: 'Hired' }
    }
    
    const config = statusConfig[status] || { color: 'bg-gray-100 text-gray-800', label: status }
    
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
        {config.label}
      </span>
    )
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
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-slate-200 rounded w-1/3 mb-6"></div>
            <div className="h-64 bg-slate-200 rounded-lg"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!application) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-2xl font-bold text-slate-800 mb-4">Application Not Found</h1>
          <button 
            onClick={() => navigate('/company/applicants')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Applicants
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/company/applicants')}
            className="text-blue-600 hover:text-blue-700 font-medium mb-4"
          >
            ← Back to Applicants
          </button>
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-800 mb-2">
                {student?.displayName || student?.email || 'Applicant'}
              </h1>
              <p className="text-slate-600">
                Application for {job?.title || 'Job'} at {job?.companyName || 'Your Company'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {getStatusBadge(application.status)}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar - Action Panel */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 sticky top-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">Application Actions</h3>
              
              <div className="space-y-3">
                <button
                  onClick={() => updateApplicationStatus('under_review')}
                  disabled={updating || application.status === 'under_review'}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Mark Under Review
                </button>

                <button
                  onClick={() => updateApplicationStatus('interviewed')}
                  disabled={updating || application.status === 'interviewed'}
                  className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Schedule Interview
                </button>

                <button
                  onClick={() => {
                    const message = `Congratulations! We're pleased to offer you the ${job?.title} position. Please check your email for the formal offer letter.`
                    updateApplicationStatus('accepted', message)
                  }}
                  disabled={updating || application.status === 'accepted'}
                  className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Send Offer
                </button>

                <button
                  onClick={() => {
                    const reason = prompt('Please provide a reason for rejection (optional):')
                    updateApplicationStatus('rejected', reason || 'Position filled with another candidate')
                  }}
                  disabled={updating || application.status === 'rejected'}
                  className="w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Reject Application
                </button>

                <button
                  onClick={() => updateApplicationStatus('hired')}
                  disabled={updating || application.status === 'hired'}
                  className="w-full bg-green-700 text-white py-2 px-4 rounded-lg hover:bg-green-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Mark as Hired
                </button>
              </div>

              {/* Quick Contact */}
              <div className="mt-6 pt-6 border-t border-slate-200">
                <h4 className="font-medium text-slate-800 mb-3">Quick Contact</h4>
                <button
                  onClick={() => {
                    const message = prompt('Enter message to send to applicant:')
                    if (message) {
                      sendMessageToApplicant(message)
                    }
                  }}
                  className="w-full bg-slate-600 text-white py-2 px-4 rounded-lg hover:bg-slate-700 transition-colors"
                >
                  Send Message
                </button>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Tabs */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 mb-6">
              <div className="border-b border-slate-200">
                <nav className="flex space-x-8 px-6">
                  {['overview', 'documents', 'timeline'].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`py-4 px-1 border-b-2 font-medium text-sm capitalize ${
                        activeTab === tab
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </nav>
              </div>

              {/* Tab Content */}
              <div className="p-6">
                {activeTab === 'overview' && (
                  <div className="space-y-6">
                    {/* Personal Information */}
                    <div>
                      <h3 className="text-lg font-semibold text-slate-800 mb-4">Personal Information</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-600 mb-1">Full Name</label>
                          <p className="text-slate-900">{student?.displayName || 'Not provided'}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-600 mb-1">Email</label>
                          <p className="text-slate-900">{student?.email}</p>
                        </div>
                        {student?.profile?.phone && (
                          <div>
                            <label className="block text-sm font-medium text-slate-600 mb-1">Phone</label>
                            <p className="text-slate-900">{student.profile.phone}</p>
                          </div>
                        )}
                        {student?.profile?.location && (
                          <div>
                            <label className="block text-sm font-medium text-slate-600 mb-1">Location</label>
                            <p className="text-slate-900">{student.profile.location}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Cover Letter */}
                    {application.coverLetter && (
                      <div>
                        <h3 className="text-lg font-semibold text-slate-800 mb-4">Cover Letter</h3>
                        <div className="bg-slate-50 rounded-lg p-4">
                          <p className="text-slate-700 whitespace-pre-wrap">{application.coverLetter}</p>
                        </div>
                      </div>
                    )}

                    {/* Education & Experience */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Education */}
                      <div>
                        <h3 className="text-lg font-semibold text-slate-800 mb-4">Education</h3>
                        {student?.profile?.education?.length > 0 ? (
                          <div className="space-y-4">
                            {student.profile.education.map((edu, index) => (
                              <div key={index} className="border-l-4 border-blue-500 pl-4">
                                <h4 className="font-medium text-slate-900">{edu.degree}</h4>
                                <p className="text-slate-600">{edu.institution}</p>
                                <p className="text-sm text-slate-500">
                                  {edu.startDate} - {edu.endDate || 'Present'}
                                  {edu.gpa && ` • GPA: ${edu.gpa}`}
                                </p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-slate-500">No education information provided</p>
                        )}
                      </div>

                      {/* Work Experience */}
                      <div>
                        <h3 className="text-lg font-semibold text-slate-800 mb-4">Work Experience</h3>
                        {student?.profile?.workExperience?.length > 0 ? (
                          <div className="space-y-4">
                            {student.profile.workExperience.map((exp, index) => (
                              <div key={index} className="border-l-4 border-green-500 pl-4">
                                <h4 className="font-medium text-slate-900">{exp.position}</h4>
                                <p className="text-slate-600">{exp.company}</p>
                                <p className="text-sm text-slate-500">
                                  {exp.startDate} - {exp.endDate || 'Present'}
                                </p>
                                {exp.description && (
                                  <p className="text-slate-600 mt-1 text-sm">{exp.description}</p>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-slate-500">No work experience provided</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'documents' && (
                  <div>
                    <h3 className="text-lg font-semibold text-slate-800 mb-4">Documents & Transcripts</h3>
                    {student?.transcripts?.length > 0 ? (
                      <div className="space-y-3">
                        {student.transcripts.map((transcript, index) => (
                          <div key={index} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                            <div>
                              <h4 className="font-medium text-slate-900">{transcript.institution}</h4>
                              <p className="text-sm text-slate-600">
                                {transcript.degree} • GPA: {transcript.gpa}
                              </p>
                            </div>
                            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                              Download
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-slate-500">No transcripts uploaded</p>
                    )}
                  </div>
                )}

                {activeTab === 'timeline' && (
                  <div>
                    <h3 className="text-lg font-semibold text-slate-800 mb-4">Application Timeline</h3>
                    <div className="space-y-4">
                      <div className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                        <div>
                          <p className="font-medium text-slate-900">Application Submitted</p>
                          <p className="text-sm text-slate-600">{formatDate(application.appliedAt)}</p>
                        </div>
                      </div>
                      {application.reviewedAt && (
                        <div className="flex items-start space-x-3">
                          <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                          <div>
                            <p className="font-medium text-slate-900">Application Reviewed</p>
                            <p className="text-sm text-slate-600">{formatDate(application.reviewedAt)}</p>
                            {application.notes && (
                              <p className="text-slate-600 mt-1">Note: {application.notes}</p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ApplicantView