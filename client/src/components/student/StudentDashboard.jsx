import React, { useState, useEffect } from 'react'
import { collection, query, where, getDocs, orderBy, limit, doc, getDoc, setDoc, addDoc } from 'firebase/firestore'
import { db } from '../../firebase-config'
import { useAuth } from '../../hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import qualificationUtils from '../../utils/qualificationUtils'

const StudentDashboard = () => {
  const { userData } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState({
    totalApplications: 0,
    pendingApplications: 0,
    admittedApplications: 0,
    eligibleCourses: 0,
    qualifiedJobs: 0
  })
  const [recentApplications, setRecentApplications] = useState([])
  const [recommendedJobs, setRecommendedJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [studentProfile, setStudentProfile] = useState(null)
  const [profileCompletion, setProfileCompletion] = useState(0)
  const [showQualificationDetails, setShowQualificationDetails] = useState(null)

  useEffect(() => {
    if (userData) {
      fetchDashboardData()
    }
  }, [userData])

  const ensureStudentProfile = async () => {
    try {
      if (!userData) return;

      const studentDocRef = doc(db, 'students', userData.uid);
      const studentDoc = await getDoc(studentDocRef);
      
      if (!studentDoc.exists()) {
        const basicProfile = {
          displayName: userData.displayName || '',
          email: userData.email || '',
          createdAt: new Date(),
          updatedAt: new Date(),
          profileCompleted: false,
          qualifications: {
            gpa: null,
            educationLevel: '',
            degreeType: '',
            certificates: [],
            skills: [],
            experience: '',
            documents: {},
            grades: {
              overall: '',
              subjects: {},
              points: 0
            }
          }
        };

        await setDoc(studentDocRef, basicProfile);
        return basicProfile;
      }
      return studentDoc.data();
    } catch (error) {
      console.error('Error ensuring student profile:', error);
      return null;
    }
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const profile = await ensureStudentProfile()
      if (profile) {
        setStudentProfile(profile)
        calculateProfileCompletion(profile)
      }
      
      await fetchStudentProfile()
      
      // Fetch student's applications
      const applicationsQuery = query(
        collection(db, 'applications'),
        where('studentId', '==', userData.uid),
        orderBy('appliedAt', 'desc'),
        limit(5)
      )
      const applicationsSnapshot = await getDocs(applicationsQuery)
      const applications = applicationsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))

      // Fetch course details for applications
      const applicationsWithDetails = await Promise.all(
        applications.map(async (app) => {
          try {
            if (!app.courseId) {
              return {
                ...app,
                course: { name: 'Course information unavailable' }
              }
            }

            const courseDoc = await getDoc(doc(db, 'courses', app.courseId))
            
            if (!courseDoc.exists()) {
              return {
                ...app,
                course: { name: 'Course not found' }
              }
            }

            const courseData = courseDoc.data()
            return {
              ...app,
              course: courseData
            }
          } catch (error) {
            console.error('Error fetching course details for application:', app.id, error)
            return {
              ...app,
              course: { name: 'Error loading course' }
            }
          }
        })
      )

      // Calculate stats
      const pendingApplications = applications.filter(app => app.status === 'pending').length
      const admittedApplications = applications.filter(app => app.status === 'admitted').length

      // Get eligible courses count (FILTERED)
      const eligibleCoursesCount = await getEligibleCoursesCount()

      // Fetch qualified jobs (FILTERED)
      const qualifiedJobs = await getQualifiedJobs()

      setStats({
        totalApplications: applications.length,
        pendingApplications,
        admittedApplications,
        eligibleCourses: eligibleCoursesCount,
        qualifiedJobs: qualifiedJobs.length
      })

      setRecentApplications(applicationsWithDetails)
      setRecommendedJobs(qualifiedJobs)

    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      setError('Failed to load dashboard data. Please try again later.')
    } finally {
      setLoading(false)
    }
  }

  const fetchStudentProfile = async () => {
    try {
      if (!userData) return
      
      const studentDoc = await getDoc(doc(db, 'students', userData.uid))
      if (studentDoc.exists()) {
        const studentData = studentDoc.data()
        setStudentProfile(studentData)
        calculateProfileCompletion(studentData)
      }
    } catch (error) {
      console.error('Error fetching student profile:', error)
    }
  }

  const calculateProfileCompletion = (profile) => {
    let completed = 0
    let total = 0

    // Basic info
    if (profile.displayName) completed++
    if (profile.email) completed++
    total += 2

    // Education
    const qual = profile.qualifications || {}
    if (qual.educationLevel) completed++
    if (qual.degreeType) completed++
    if (qual.gpa !== null && qual.gpa !== undefined) completed++
    total += 3

    // Skills & certificates
    if (qual.skills?.length > 0) completed++
    if (qual.certificates?.length > 0) completed++
    total += 2

    // Experience
    if (qual.experience) completed++
    total += 1

    // Course qualifications
    const grades = qual.grades || {}
    if (Object.keys(grades.subjects || {}).length > 0) completed++
    if (grades.overall) completed++
    total += 2

    setProfileCompletion(Math.round((completed / total) * 100))
  }

  const getEligibleCoursesCount = async () => {
    try {
      if (!userData) return 0

      // Get student profile
      const studentDoc = await getDoc(doc(db, 'students', userData.uid))
      if (!studentDoc.exists()) return 0

      const studentProfile = studentDoc.data()

      // Get all active courses
      const coursesQuery = query(
        collection(db, 'courses'),
        where('status', '==', 'active')
      )
      const coursesSnapshot = await getDocs(coursesQuery)
      const allCourses = coursesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))

      // Use qualificationUtils to filter qualified courses
      const eligibleCourses = qualificationUtils.filterQualifiedCourses(allCourses, studentProfile)

      return eligibleCourses.length
    } catch (error) {
      console.error('Error counting eligible courses:', error)
      return 0
    }
  }

  const getQualifiedJobs = async () => {
    try {
      if (!userData) return []

      // Get student profile
      const studentDoc = await getDoc(doc(db, 'students', userData.uid))
      if (!studentDoc.exists()) return []

      const studentProfile = studentDoc.data()

      // Get all active jobs
      const jobsQuery = query(
        collection(db, 'jobs'),
        where('status', '==', 'active'),
        orderBy('createdAt', 'desc')
      )
      const jobsSnapshot = await getDocs(jobsQuery)
      const allJobs = jobsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))

      // Filter jobs based on student qualifications
      const qualifiedJobs = qualificationUtils.filterQualifiedJobs(allJobs, studentProfile)
      
      // Sort by match score and get qualification details
      const jobsWithScores = qualificationUtils.sortJobsByMatchScore(qualifiedJobs, studentProfile)

      return jobsWithScores.slice(0, 5)
    } catch (error) {
      console.error('Error fetching qualified jobs:', error)
      return []
    }
  }

  const handleApplyNow = async (jobId) => {
    if (!jobId) {
      console.error('Job ID is undefined')
      return
    }
    
    try {
      const applicationData = {
        studentId: userData.uid,
        jobId: jobId,
        appliedAt: new Date(),
        status: 'pending',
        studentName: userData.displayName || '',
        studentEmail: userData.email || '',
      }

      await addDoc(collection(db, 'jobApplications'), applicationData)
      alert('Application submitted successfully!')
      fetchDashboardData()
      
    } catch (error) {
      console.error('Error submitting application:', error)
      alert('Failed to submit application. Please try again.')
    }
  }

  const handleApplyToCourse = async (courseId) => {
    if (!courseId) {
      console.error('Course ID is undefined')
      return
    }
    
    try {
      const applicationData = {
        studentId: userData.uid,
        courseId: courseId,
        appliedAt: new Date(),
        status: 'pending',
        studentName: userData.displayName || '',
        studentEmail: userData.email || '',
      }

      await addDoc(collection(db, 'applications'), applicationData)
      alert('Course application submitted successfully!')
      fetchDashboardData()
      
    } catch (error) {
      console.error('Error submitting course application:', error)
      alert('Failed to submit application. Please try again.')
    }
  }

  const handleViewCourse = (courseId) => {
    if (!courseId) return
    navigate(`/student/courses`)
  }

  const handleViewQualificationDetails = (job) => {
    setShowQualificationDetails(job)
  }

  const getMatchBadge = (matchScore) => {
    if (matchScore >= 90) {
      return { color: 'bg-green-100 text-green-800', label: 'Perfect Match' }
    } else if (matchScore >= 80) {
      return { color: 'bg-blue-100 text-blue-800', label: 'Excellent Match' }
    } else if (matchScore >= 70) {
      return { color: 'bg-purple-100 text-purple-800', label: 'Good Match' }
    } else {
      return { color: 'bg-yellow-100 text-yellow-800', label: 'Qualified' }
    }
  }

  // Navigation handlers
  const handleViewAllApplications = () => {
    navigate('/student/applications')
  }

  const handleMyApplications = () => {
    navigate('/student/applications')
  }

  const handleMyProfile = () => {
    navigate('/student/profile')
  }

  const handleBrowseCourses = () => {
    navigate('/student/courses')
  }

  const handleBrowseJobs = () => {
    navigate('/student/jobs')
  }

  const StatCard = ({ title, value, subtitle, onClick }) => (
    <div 
      className={`bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 ${
        onClick ? 'cursor-pointer hover:scale-105' : ''
      }`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
        </div>
      </div>
    </div>
  )

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
      admitted: { color: 'bg-green-100 text-green-800', label: 'Admitted' },
      rejected: { color: 'bg-red-100 text-red-800', label: 'Rejected' },
      submitted: { color: 'bg-yellow-100 text-yellow-800', label: 'Submitted' },
      under_review: { color: 'bg-yellow-100 text-yellow-800', label: 'Under Review' },
      accepted: { color: 'bg-green-100 text-green-800', label: 'Accepted' },
      declined: { color: 'bg-red-100 text-red-800', label: 'Declined' }
    }
    const config = statusConfig[status] || { color: 'bg-gray-100 text-gray-800', label: status }
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.color}`}>
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
        month: 'short', 
        day: 'numeric' 
      })
    } catch (error) {
      console.error('Error formatting date:', error)
      return 'Invalid Date'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-200 rounded-xl"></div>
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <div className="h-64 bg-gray-200 rounded-xl"></div>
              <div className="h-64 bg-gray-200 rounded-xl"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-xl p-8 text-center">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Dashboard Loading Issue</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <p className="text-sm text-gray-500 mb-6">
              This is usually temporary while Firestore indexes are building. Please wait a few minutes and refresh.
            </p>
            <button 
              onClick={fetchDashboardData}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              Try Again
            </button>
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
          <h1 className="text-3xl font-bold text-gray-900">Student Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Welcome back, {userData?.displayName || 'Student'}! Here are your personalized recommendations.
            {studentProfile?.profileCompleted ? (
              <span className="text-green-600 font-medium"> Showing jobs that match your qualifications</span>
            ) : (
              <span className="text-yellow-600 font-medium"> Complete your profile to see qualified opportunities</span>
            )}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Applications"
            value={stats.totalApplications}
            subtitle={`${stats.pendingApplications} pending`}
            onClick={handleMyApplications}
          />
          <StatCard
            title="Admissions"
            value={stats.admittedApplications}
            subtitle="Accepted offers"
          />
          <StatCard
            title="Eligible Courses"
            value={stats.eligibleCourses}
            subtitle="Matching your grades"
            onClick={handleBrowseCourses}
          />
          <StatCard
            title="Qualified Jobs"
            value={stats.qualifiedJobs}
            subtitle="Matching your education"
            onClick={handleBrowseJobs}
          />
        </div>

        {/* Recent Applications Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Recent Applications */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Recent Applications</h3>
                <button 
                  className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                  onClick={handleViewAllApplications}
                >
                  View All
                </button>
              </div>
            </div>
            <div className="p-6">
              {recentApplications.length > 0 ? (
                <div className="space-y-4">
                  {recentApplications.map(application => (
                    <div 
                      key={application.id} 
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => handleViewCourse(application.courseId)}
                    >
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {application.course?.name || 'Unknown Course'}
                        </h4>
                        <div className="text-sm text-gray-500 mt-1">
                          Applied {formatDate(application.appliedAt)}
                          {application.course?.institutionName && (
                            <span className="ml-2">
                              • {application.course.institutionName}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        {getStatusBadge(application.status)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">No applications yet</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Your course applications will appear here
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 gap-4">
                <button 
                  className="p-6 border border-gray-200 rounded-lg text-left hover:bg-gray-50 transition-colors"
                  onClick={handleMyApplications}
                >
                  <span className="block font-medium text-gray-900 mb-2">My Applications</span>
                  <span className="text-sm text-gray-500">View status & history</span>
                </button>
                <button 
                  className="p-6 border border-gray-200 rounded-lg text-left hover:bg-gray-50 transition-colors"
                  onClick={handleMyProfile}
                >
                  <span className="block font-medium text-gray-900 mb-2">My Profile</span>
                  <span className="text-sm text-gray-500">Update qualifications</span>
                </button>
                <button 
                  className="p-6 border border-gray-200 rounded-lg text-left hover:bg-gray-50 transition-colors"
                  onClick={handleBrowseCourses}
                >
                  <span className="block font-medium text-gray-900 mb-2">Browse Courses</span>
                  <span className="text-sm text-gray-500">Find courses you qualify for</span>
                </button>
                
              </div>
            </div>
          </div>
        </div>

        {/* Qualified Jobs Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Jobs Matching Your Qualifications</h3>
            <p className="text-sm text-gray-600 mt-1">
              {recommendedJobs.length > 0 
                ? `${recommendedJobs.length} jobs match your profile` 
                : 'No qualified jobs found'}
            </p>
          </div>
          <div className="p-6">
            {recommendedJobs.length > 0 ? (
              <div className="space-y-4">
                {recommendedJobs.map(job => {
                  const qualificationBreakdown = qualificationUtils.getQualificationBreakdown(job, studentProfile)
                  
                  return (
                    <div 
                      key={job.id} 
                      className="p-6 border-2 border-green-200 rounded-lg hover:bg-green-50 transition-colors cursor-pointer"
                      onClick={() => handleApplyNow(job.id)}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900">{job.title}</h4>
                          <p className="text-gray-600">{job.companyName}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="bg-green-100 text-green-800 text-xs px-3 py-1 rounded-full font-medium">
                            Qualified ({job.matchScore}%)
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 text-sm text-gray-600">
                        <div>
                          <span className="font-medium capitalize">{job.type}</span>
                        </div>
                        <div>
                          {job.location && (
                            <span>Location: {job.location}</span>
                          )}
                        </div>
                        <div>
                          {job.deadline ? (
                            <span>Apply by: {formatDate(job.deadline)}</span>
                          ) : (
                            <span>Open until filled</span>
                          )}
                        </div>
                      </div>

                      {job.salary && (
                        <div className="mb-4">
                          <span className="font-medium text-gray-900">{job.salary}</span>
                        </div>
                      )}

                      {/* Qualification Preview */}
                      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm font-medium text-blue-800">Qualification Match</span>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation()
                              handleViewQualificationDetails(job)
                            }}
                            className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                          >
                            View Details
                          </button>
                        </div>
                        <div className="space-y-2">
                          {qualificationBreakdown.slice(0, 2).map((item, index) => (
                            <div key={index} className="flex items-center text-sm">
                              <span className={`w-2 h-2 rounded-full mr-3 ${
                                item.meets ? 'bg-green-500' : 'bg-red-500'
                              }`}></span>
                              <span className={item.meets ? 'text-green-700' : 'text-red-700'}>
                                {item.requirement.split(':')[0]}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">
                  {studentProfile?.profileCompleted 
                    ? 'No jobs matching your qualifications yet' 
                    : 'Complete your profile to see qualified jobs'
                  }
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  {studentProfile?.profileCompleted
                    ? 'Check back later for new opportunities that match your qualifications'
                    : 'Update your profile with your education and GPA'
                  }
                </p>
                {!studentProfile?.profileCompleted && (
                  <button 
                    className="mt-4 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                    onClick={handleMyProfile}
                  >
                    Complete Profile
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Profile Completion Panel */}
        {profileCompletion < 70 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 mb-8">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">!</span>
                </div>
              </div>
              <div className="ml-4">
                <h4 className="text-yellow-800 font-medium">Complete Your Profile</h4>
                <p className="text-yellow-700 text-sm mt-1">
                  Your profile is {profileCompletion}% complete. Finish setting up your qualifications to see more job and course matches.
                </p>
                <button 
                  onClick={handleMyProfile}
                  className="mt-3 bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Complete Profile
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Job Qualification Details Modal */}
        {showQualificationDetails && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-gray-900">Qualification Details</h3>
                  <button 
                    onClick={() => setShowQualificationDetails(null)}
                    className="text-gray-400 hover:text-gray-600 text-lg font-bold"
                  >
                    ×
                  </button>
                </div>

                <div className="mb-4">
                  <h4 className="text-lg font-semibold text-gray-900">
                    {showQualificationDetails.title}
                  </h4>
                  <p className="text-gray-600">{showQualificationDetails.companyName}</p>
                </div>

                <div className="space-y-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h5 className="font-semibold text-blue-900 mb-2">Match Summary</h5>
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-600 h-2 rounded-full"
                          style={{ width: `${showQualificationDetails.matchScore}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-gray-700">
                        {showQualificationDetails.matchScore}% Match
                      </span>
                    </div>
                  </div>

                  <div>
                    <h5 className="font-semibold text-gray-900 mb-3">Requirements Breakdown</h5>
                    <div className="space-y-3">
                      {qualificationUtils.getQualificationBreakdown(showQualificationDetails, studentProfile).map((item, index) => (
                        <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                          <div className={`w-3 h-3 rounded-full mt-1 flex-shrink-0 ${
                            item.meets ? 'bg-green-500' : 'bg-red-500'
                          }`}></div>
                          <div className="flex-1">
                            <p className={`font-medium ${item.meets ? 'text-green-700' : 'text-red-700'}`}>
                              {item.requirement}
                            </p>
                            <p className="text-sm text-gray-600 mt-1">
                              Your qualification: {item.studentValue}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex space-x-3 mt-6">
                  <button 
                    onClick={() => setShowQualificationDetails(null)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Close
                  </button>
                  <button 
                    onClick={() => {
                      handleApplyNow(showQualificationDetails.id)
                      setShowQualificationDetails(null)
                    }}
                    className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    Apply Now
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default StudentDashboard