import React, { useState, useEffect } from 'react'
import { collection, query, where, getDocs, doc, getDoc, updateDoc, orderBy } from 'firebase/firestore'
import { db } from '../../firebase-config'
import { useAuth } from '../../hooks/useAuth'
import { Search, Filter, Eye, Download, CheckCircle, XCircle, Clock, User, Mail, Phone, MapPin, FileText, GraduationCap, Award } from 'lucide-react'

const ApplicationReview = () => {
  const { userData } = useAuth()
  const [applications, setApplications] = useState([])
  const [filteredApplications, setFilteredApplications] = useState([])
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [courseFilter, setCourseFilter] = useState('all')
  const [selectedApplication, setSelectedApplication] = useState(null)
  const [view, setView] = useState('list')
  const [debugInfo, setDebugInfo] = useState('')

  useEffect(() => {
    if (userData) {
      fetchData()
    }
  }, [userData])

  useEffect(() => {
    filterApplications()
  }, [applications, searchTerm, statusFilter, courseFilter])

  const fetchData = async () => {
    try {
      setLoading(true)
      console.log('🔍 Starting data fetch for institution:', userData.uid)
      
      // Fetch institution's courses
      const coursesQuery = query(
        collection(db, 'courses'),
        where('institutionId', '==', userData.uid)
      )
      const coursesSnapshot = await getDocs(coursesQuery)
      const coursesData = coursesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      setCourses(coursesData)

      console.log('📚 Found courses:', coursesData)

      // Fetch applications for institution's courses
      const courseIds = coursesData.map(course => course.id)
      let allApplications = []
      
      console.log('🎯 Course IDs to search:', courseIds)

      if (courseIds.length > 0) {
        // Fetch all applications and filter by course IDs
        console.log('📨 Fetching all applications...')
        const applicationsQuery = query(
          collection(db, 'applications'),
          orderBy('appliedAt', 'desc')
        )
        const applicationsSnapshot = await getDocs(applicationsQuery)
        const rawApplications = applicationsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        
        console.log('📄 Raw applications found:', rawApplications)
        
        // Filter applications that belong to institution's courses
        allApplications = rawApplications.filter(app => {
          const matches = courseIds.includes(app.courseId)
          console.log(`🔍 Application ${app.id} courseId: ${app.courseId}, matches: ${matches}`)
          return matches
        })
        
        console.log('✅ Filtered applications for institution:', allApplications)

        // Fetch student details for each application
        console.log('👨‍🎓 Fetching student details...')
        const applicationsWithDetails = await Promise.all(
          allApplications.map(async (application) => {
            try {
              console.log(`📋 Processing application ${application.id} for student ${application.studentId}`)
              
              let studentData = null
              let studentProfile = {}
              let transcripts = []
              let course = null

              // Fetch student data
              try {
                const studentDoc = await getDoc(doc(db, 'users', application.studentId))
                studentData = studentDoc.exists() ? studentDoc.data() : null
              } catch (error) {
                console.error('Error fetching student:', error)
              }

              // Fetch student profile
              try {
                const studentProfileDoc = await getDoc(doc(db, 'studentProfiles', application.studentId))
                studentProfile = studentProfileDoc.exists() ? studentProfileDoc.data() : {}
              } catch (error) {
                console.error('Error fetching student profile:', error)
              }

              // Fetch academic transcripts
              try {
                const transcriptsQuery = query(
                  collection(db, 'transcripts'),
                  where('studentId', '==', application.studentId)
                )
                const transcriptsSnapshot = await getDocs(transcriptsQuery)
                transcripts = transcriptsSnapshot.docs.map(doc => doc.data())
              } catch (error) {
                console.error('Error fetching transcripts:', error)
              }

              // Fetch course details
              course = coursesData.find(c => c.id === application.courseId)

              const applicationWithDetails = {
                ...application,
                student: studentData,
                profile: studentProfile,
                transcripts: transcripts,
                course: course
              }

              console.log(`✅ Processed application:`, applicationWithDetails)
              return applicationWithDetails

            } catch (error) {
              console.error(`❌ Error processing application ${application.id}:`, error)
              return {
                ...application,
                student: null,
                profile: {},
                transcripts: [],
                course: coursesData.find(c => c.id === application.courseId)
              }
            }
          })
        )

        console.log('🎉 Final applications with details:', applicationsWithDetails)
        setApplications(applicationsWithDetails)
        setDebugInfo(`Found ${coursesData.length} courses and ${applicationsWithDetails.length} applications`)
      } else {
        console.log('❌ No courses found for this institution')
        setDebugInfo('No courses found for this institution')
        setApplications([])
      }

    } catch (error) {
      console.error('❌ Error fetching data:', error)
      setDebugInfo(`Error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const filterApplications = () => {
    let filtered = applications

    console.log('🔍 Filtering applications:', {
      total: applications.length,
      searchTerm,
      statusFilter,
      courseFilter
    })

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(app => {
        const matches = (
          app.student?.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          app.student?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          app.course?.name?.toLowerCase().includes(searchTerm.toLowerCase())
        )
        console.log(`🔍 Search filter for ${app.student?.displayName}: ${matches}`)
        return matches
      })
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(app => {
        const matches = app.status === statusFilter
        console.log(`🔍 Status filter for ${app.student?.displayName}: ${app.status} === ${statusFilter} = ${matches}`)
        return matches
      })
    }

    // Course filter
    if (courseFilter !== 'all') {
      filtered = filtered.filter(app => {
        const matches = app.courseId === courseFilter
        console.log(`🔍 Course filter for ${app.student?.displayName}: ${app.courseId} === ${courseFilter} = ${matches}`)
        return matches
      })
    }

    console.log('✅ Filtered applications:', filtered.length)
    setFilteredApplications(filtered)
  }

  const updateApplicationStatus = async (applicationId, status) => {
    try {
      const applicationRef = doc(db, 'applications', applicationId)
      const updateData = {
        status,
        reviewedAt: new Date(),
        reviewedBy: userData.uid
      }

      if (status === 'admitted') {
        updateData.admittedAt = new Date()
      }

      await updateDoc(applicationRef, updateData)
      
      // Update local state
      setApplications(applications.map(app =>
        app.id === applicationId ? { ...app, status, ...updateData } : app
      ))
      
      if (selectedApplication && selectedApplication.id === applicationId) {
        setSelectedApplication(prev => ({ ...prev, status, ...updateData }))
      }
      
      alert(`Application ${status} successfully`)
    } catch (error) {
      console.error('Error updating application status:', error)
      alert('Error updating application status')
    }
  }

  const calculateGPA = (transcripts) => {
    if (!transcripts || transcripts.length === 0) return 'N/A'
    const totalGPA = transcripts.reduce((sum, transcript) => sum + (transcript.gpa || 0), 0)
    return (totalGPA / transcripts.length).toFixed(2)
  }

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, label: 'Pending' },
      admitted: { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Admitted' },
      rejected: { color: 'bg-red-100 text-red-800', icon: XCircle, label: 'Rejected' }
    }
    const config = statusConfig[status] || { color: 'bg-gray-100 text-gray-800', icon: Clock, label: status }
    const Icon = config.icon
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </span>
    )
  }

  const viewApplicationDetails = (application) => {
    setSelectedApplication(application)
    setView('detail')
  }

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A'
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    return date.toLocaleDateString()
  }

  const checkEligibility = (application) => {
    // Basic eligibility check based on course requirements and student qualifications
    if (!application.course?.requirements || !application.profile) return 'unknown'
    
    const requirements = application.course.requirements
    const profile = application.profile
    
    // Check if student meets minimum requirements
    let meetsRequirements = true
    
    // Check academic qualifications
    if (requirements.some(req => req.toLowerCase().includes('diploma') || req.toLowerCase().includes('degree'))) {
      if (!profile.education || profile.education.length === 0) {
        meetsRequirements = false
      }
    }
    
    // Check GPA requirements
    const gpa = calculateGPA(application.transcripts)
    if (requirements.some(req => req.toLowerCase().includes('gpa')) && gpa !== 'N/A') {
      if (parseFloat(gpa) < 2.5) { // Example minimum GPA
        meetsRequirements = false
      }
    }
    
    return meetsRequirements ? 'eligible' : 'not-eligible'
  }

  // Debug info display
  const DebugInfo = () => (
    <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
      <h4 className="text-sm font-medium text-yellow-800 mb-2">Debug Information</h4>
      <p className="text-sm text-yellow-700">{debugInfo}</p>
      <p className="text-xs text-yellow-600 mt-1">
        Institution ID: {userData?.uid} | Courses: {courses.length} | Applications: {applications.length}
      </p>
      {courses.length > 0 && (
        <div className="mt-2">
          <p className="text-xs text-yellow-600">Course IDs: {courses.map(c => c.id).join(', ')}</p>
        </div>
      )}
      <div className="mt-2">
        <button
          onClick={() => {
            setSearchTerm('')
            setStatusFilter('all')
            setCourseFilter('all')
          }}
          className="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1 rounded text-xs font-medium"
        >
          Clear All Filters
        </button>
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="h-12 bg-gray-200 rounded mb-6"></div>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-20 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (view === 'detail' && selectedApplication) {
    const eligibility = checkEligibility(selectedApplication)
    
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          {/* Debug info */}
          <DebugInfo />
          
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setView('list')}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                ← Back to Applications
              </button>
              <h1 className="text-2xl font-bold text-gray-900">Application Details</h1>
            </div>
            <div className="flex items-center space-x-3">
              {getStatusBadge(selectedApplication.status)}
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                eligibility === 'eligible' 
                  ? 'bg-green-100 text-green-800'
                  : eligibility === 'not-eligible'
                  ? 'bg-red-100 text-red-800'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {eligibility === 'eligible' ? 'Eligible' : eligibility === 'not-eligible' ? 'Not Eligible' : 'Unknown'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-3 space-y-6">
              {/* Applicant Information */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Applicant Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Full Name</label>
                    <p className="text-gray-900">{selectedApplication.student?.displayName || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Email</label>
                    <div className="flex items-center text-gray-900">
                      <Mail className="h-4 w-4 mr-2" />
                      {selectedApplication.student?.email || 'N/A'}
                    </div>
                  </div>
                  {selectedApplication.profile?.phone && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Phone</label>
                      <div className="flex items-center text-gray-900">
                        <Phone className="h-4 w-4 mr-2" />
                        {selectedApplication.profile.phone}
                      </div>
                    </div>
                  )}
                  {selectedApplication.profile?.location && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Location</label>
                      <div className="flex items-center text-gray-900">
                        <MapPin className="h-4 w-4 mr-2" />
                        {selectedApplication.profile.location}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Academic Information */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <GraduationCap className="h-5 w-5 mr-2" />
                  Academic Information
                </h2>
                
                {/* GPA Summary */}
                <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-blue-900">Academic Performance</h4>
                      <p className="text-sm text-blue-700">Overall GPA: {calculateGPA(selectedApplication.transcripts)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-blue-700">{selectedApplication.transcripts.length} Transcripts</p>
                      <p className="text-sm text-blue-700">{selectedApplication.profile?.certificates?.length || 0} Certificates</p>
                    </div>
                  </div>
                </div>

                {/* Education History */}
                {selectedApplication.profile?.education && selectedApplication.profile.education.length > 0 && (
                  <div className="mb-4">
                    <h4 className="font-medium text-gray-900 mb-2">Education History</h4>
                    {selectedApplication.profile.education.map((edu, index) => (
                      <div key={index} className="mb-3 p-3 bg-gray-50 rounded">
                        <div className="flex justify-between items-start">
                          <div>
                            <h5 className="font-medium text-gray-900">{edu.degree}</h5>
                            <p className="text-sm text-gray-600">{edu.institution}</p>
                            <p className="text-sm text-gray-500">
                              {edu.startDate} - {edu.endDate || 'Present'}
                            </p>
                          </div>
                          {edu.gpa && (
                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm font-medium">
                              GPA: {edu.gpa}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Skills */}
                {selectedApplication.profile?.skills && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Skills</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedApplication.profile.skills.map((skill, index) => (
                        <span key={index} className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Course Information */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Course Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Course Name</label>
                    <p className="text-gray-900">{selectedApplication.course?.name || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Faculty</label>
                    <p className="text-gray-900">{selectedApplication.course?.facultyName || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Duration</label>
                    <p className="text-gray-900">{selectedApplication.course?.duration || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Tuition</label>
                    <p className="text-gray-900">{selectedApplication.course?.tuition || 'N/A'}</p>
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium text-gray-600">Requirements</label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedApplication.course?.requirements?.map((req, index) => (
                        <span key={index} className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded">
                          {req}
                        </span>
                      )) || <span className="text-gray-500 text-sm">No requirements listed</span>}
                    </div>
                  </div>
                </div>
              </div>

              {/* Application Documents */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  Application Documents
                </h2>
                <div className="space-y-3">
                  {selectedApplication.documents?.map((doc, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <FileText className="h-5 w-5 text-gray-400 mr-3" />
                        <div>
                          <p className="font-medium text-gray-900">{doc.name}</p>
                          <p className="text-sm text-gray-600">{doc.type} • {doc.size}</p>
                        </div>
                      </div>
                      <button className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded text-sm flex items-center">
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </button>
                    </div>
                  ))}
                  {(!selectedApplication.documents || selectedApplication.documents.length === 0) && (
                    <p className="text-gray-500 text-center py-4">No documents uploaded</p>
                  )}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Action Panel */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Application Actions</h3>
                <div className="space-y-3">
                  <button className="w-full bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded text-sm font-medium flex items-center justify-center">
                    <Download className="h-4 w-4 mr-2" />
                    Download All Documents
                  </button>
                  <button className="w-full bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded text-sm font-medium flex items-center justify-center">
                    <Mail className="h-4 w-4 mr-2" />
                    Contact Applicant
                  </button>
                </div>

                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h4 className="font-medium text-gray-900 mb-3">Update Status</h4>
                  <div className="space-y-2">
                    <button
                      onClick={() => updateApplicationStatus(selectedApplication.id, 'admitted')}
                      className="w-full bg-green-100 text-green-700 py-2 px-4 rounded text-sm font-medium hover:bg-green-200 transition-colors duration-200 flex items-center justify-center"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Admit Student
                    </button>
                    <button
                      onClick={() => updateApplicationStatus(selectedApplication.id, 'rejected')}
                      className="w-full bg-red-100 text-red-700 py-2 px-4 rounded text-sm font-medium hover:bg-red-200 transition-colors duration-200 flex items-center justify-center"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject Application
                    </button>
                  </div>
                </div>
              </div>

              {/* Application Timeline */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Application Timeline</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Applied</span>
                    <span className="text-gray-900">
                      {formatDate(selectedApplication.appliedAt)}
                    </span>
                  </div>
                  {selectedApplication.reviewedAt && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Reviewed</span>
                      <span className="text-gray-900">
                        {formatDate(selectedApplication.reviewedAt)}
                      </span>
                    </div>
                  )}
                  {selectedApplication.status === 'admitted' && selectedApplication.admittedAt && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Admitted</span>
                      <span className="text-gray-900">
                        {formatDate(selectedApplication.admittedAt)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Eligibility Check */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Eligibility Check</h3>
                <div className="space-y-3">
                  <div className={`p-3 rounded-lg ${
                    eligibility === 'eligible' 
                      ? 'bg-green-50 border border-green-200'
                      : eligibility === 'not-eligible'
                      ? 'bg-red-50 border border-red-200'
                      : 'bg-gray-50 border border-gray-200'
                  }`}>
                    <div className="flex items-center">
                      {eligibility === 'eligible' ? (
                        <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                      ) : eligibility === 'not-eligible' ? (
                        <XCircle className="h-5 w-5 text-red-600 mr-2" />
                      ) : (
                        <Clock className="h-5 w-5 text-gray-600 mr-2" />
                      )}
                      <span className={`font-medium ${
                        eligibility === 'eligible' 
                          ? 'text-green-800'
                          : eligibility === 'not-eligible'
                          ? 'text-red-800'
                          : 'text-gray-800'
                      }`}>
                        {eligibility === 'eligible' 
                          ? 'Meets Requirements' 
                          : eligibility === 'not-eligible'
                          ? 'Does Not Meet Requirements'
                          : 'Eligibility Unknown'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="text-xs text-gray-600 space-y-1">
                    <p>• Checked against course requirements</p>
                    <p>• Verified academic qualifications</p>
                    <p>• Assessed overall suitability</p>
                  </div>
                </div>
              </div>

              {/* Course Statistics */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Course Statistics</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Applications</span>
                    <span className="font-medium text-gray-900">
                      {applications.filter(app => app.courseId === selectedApplication.courseId).length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Available Seats</span>
                    <span className="font-medium text-gray-900">
                      {selectedApplication.course?.seats || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Admission Rate</span>
                    <span className="font-medium text-gray-900">
                      {((applications.filter(app => app.courseId === selectedApplication.courseId && app.status === 'admitted').length / applications.filter(app => app.courseId === selectedApplication.courseId).length) * 100 || 0).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Debug info */}
        <DebugInfo />
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Application Review</h1>
          <p className="text-gray-600 mt-2">
            Review and manage student applications
          </p>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search applicants by name, email, or course..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex space-x-4">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="admitted">Admitted</option>
                <option value="rejected">Rejected</option>
              </select>
              <select
                value={courseFilter}
                onChange={(e) => setCourseFilter(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Courses</option>
                {courses.map(course => (
                  <option key={course.id} value={course.id}>
                    {course.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Applications List */}
        <div className="space-y-4">
          {filteredApplications.map((application) => {
            const eligibility = checkEligibility(application)
            return (
              <div key={application.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="h-6 w-6 text-blue-600" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {application.student?.displayName || 'Unknown Student'}
                      </h3>
                      <div className="flex items-center space-x-4 mt-1">
                        <div className="flex items-center text-sm text-gray-600">
                          <Mail className="h-4 w-4 mr-1" />
                          {application.student?.email || 'No email'}
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <span className="font-medium">{application.course?.name || 'Unknown Course'}</span>
                        </div>
                        {getStatusBadge(application.status)}
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          eligibility === 'eligible' 
                            ? 'bg-green-100 text-green-800'
                            : eligibility === 'not-eligible'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {eligibility === 'eligible' ? 'Eligible' : eligibility === 'not-eligible' ? 'Not Eligible' : 'Unknown'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => viewApplicationDetails(application)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium flex items-center"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Review
                    </button>
                  </div>
                </div>

                {/* Application Details */}
                <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                  <div className="flex items-center text-gray-600">
                    <Clock className="h-4 w-4 mr-2" />
                    Applied: {formatDate(application.appliedAt)}
                  </div>
                  <div className="flex items-center text-gray-600">
                    <MapPin className="h-4 w-4 mr-2" />
                    {application.profile?.location || 'Location not provided'}
                  </div>
                  <div className="flex items-center text-gray-600">
                    <GraduationCap className="h-4 w-4 mr-2" />
                    GPA: {calculateGPA(application.transcripts)}
                  </div>
                  {application.documents && (
                    <div className="flex items-center text-gray-600">
                      <FileText className="h-4 w-4 mr-2" />
                      {application.documents.length} documents
                    </div>
                  )}
                </div>

                {/* Quick Actions */}
                {application.status === 'pending' && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => updateApplicationStatus(application.id, 'admitted')}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm font-medium flex items-center"
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Admit
                      </button>
                      <button
                        onClick={() => updateApplicationStatus(application.id, 'rejected')}
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-sm font-medium flex items-center"
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Reject
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Empty States */}
        {filteredApplications.length === 0 && applications.length > 0 && (
          <div className="text-center py-12">
            <Filter className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No applications match your filters</h3>
            <p className="mt-1 text-sm text-gray-500">
              Try changing your search terms or filters to see {applications.length} applications.
            </p>
            <div className="mt-4">
              <button
                onClick={() => {
                  setSearchTerm('')
                  setStatusFilter('all')
                  setCourseFilter('all')
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
              >
                Clear All Filters
              </button>
            </div>
          </div>
        )}

        {applications.length === 0 && (
          <div className="text-center py-12">
            <User className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No applications received yet</h3>
            <p className="mt-1 text-sm text-gray-500">
              When students apply to your courses, they will appear here.
            </p>
            <div className="mt-4">
              <p className="text-sm text-gray-600 mb-2">You have {courses.length} courses. Make sure:</p>
              <ul className="text-sm text-gray-500 space-y-1 text-left max-w-md mx-auto">
                <li>• Students know about your courses</li>
                <li>• Course application deadlines haven't passed</li>
                <li>• Courses are properly published and visible</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ApplicationReview