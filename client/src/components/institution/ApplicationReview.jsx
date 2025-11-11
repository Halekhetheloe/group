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
  const [view, setView] = useState('list') // 'list' or 'detail'
  const [debugInfo, setDebugInfo] = useState('') // Debug info

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

      console.log('📚 Found courses:', coursesData.length, coursesData)

      // Fetch applications for institution's courses
      const courseIds = coursesData.map(course => course.id)
      let allApplications = []
      
      console.log('🎯 Course IDs to search:', courseIds)

      if (courseIds.length > 0) {
        // Since Firestore doesn't support 'in' with more than 10 items, fetch all and filter
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
        
        console.log('📄 Raw applications found:', rawApplications.length, rawApplications)
        
        // Filter applications that belong to institution's courses
        allApplications = rawApplications.filter(app => courseIds.includes(app.courseId))
        console.log('✅ Filtered applications for institution:', allApplications.length, allApplications)

        // Fetch student details for each application
        console.log('👨‍🎓 Fetching student details...')
        const applicationsWithDetails = await Promise.all(
          allApplications.map(async (application) => {
            try {
              console.log(`📋 Processing application ${application.id} for student ${application.studentId}`)
              
              const studentDoc = await getDoc(doc(db, 'users', application.studentId))
              const studentData = studentDoc.data()
              
              // Fetch student profile
              const studentProfileDoc = await getDoc(doc(db, 'studentProfiles', application.studentId))
              const studentProfile = studentProfileDoc.exists() ? studentProfileDoc.data() : {}
              
              // Fetch academic transcripts
              const transcriptsQuery = query(
                collection(db, 'transcripts'),
                where('studentId', '==', application.studentId)
              )
              const transcriptsSnapshot = await getDocs(transcriptsQuery)
              const transcripts = transcriptsSnapshot.docs.map(doc => doc.data())
              
              // Fetch course details
              const course = coursesData.find(c => c.id === application.courseId)
              
              return {
                ...application,
                student: studentData,
                profile: studentProfile,
                transcripts: transcripts,
                course: course
              }
            } catch (error) {
              console.error(`❌ Error processing application ${application.id}:`, error)
              return {
                ...application,
                student: null,
                profile: {},
                transcripts: [],
                course: null
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

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(app =>
        app.student?.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.student?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.course?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(app => app.status === statusFilter)
    }

    // Course filter
    if (courseFilter !== 'all') {
      filtered = filtered.filter(app => app.courseId === courseFilter)
    }

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

  // Debug info display - remove in production
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
    </div>
  )

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

          {/* Rest of the detail view remains the same */}
          {/* ... */}
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

        {/* Rest of the list view remains the same */}
        {/* ... */}

        {filteredApplications.length === 0 && (
          <div className="text-center py-12">
            <User className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No applications found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {applications.length === 0 ? 'No applications received yet.' : 'Try changing your filters.'}
            </p>
            {applications.length === 0 && (
              <div className="mt-4">
                <p className="text-sm text-gray-600 mb-2">Make sure:</p>
                <ul className="text-sm text-gray-500 space-y-1">
                  <li>• You have created courses in your institution</li>
                  <li>• Students have applied to your courses</li>
                  <li>• Course institution IDs match your user ID</li>
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default ApplicationReview