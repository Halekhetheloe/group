import React, { useState, useEffect } from 'react'
import { collection, query, where, getDocs, orderBy, limit, doc, getDoc, setDoc, addDoc } from 'firebase/firestore'
import { db } from '../../firebase-config'
import { useAuth } from '../../hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import qualificationUtils from '../../utils/qualificationUtils'
import { CheckCircle, XCircle, AlertCircle, Star, GraduationCap, Briefcase, Clock, BookOpen } from 'lucide-react'

const StudentDashboard = () => {
  const { userData } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState({
    totalApplications: 0,
    pendingApplications: 0,
    admittedApplications: 0,
    savedJobs: 0,
    eligibleCourses: 0,
    qualifiedJobs: 0
  })
  const [recentApplications, setRecentApplications] = useState([])
  const [recommendedJobs, setRecommendedJobs] = useState([])
  const [upcomingDeadlines, setUpcomingDeadlines] = useState([])
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

  // Function to ensure student profile exists
  const ensureStudentProfile = async () => {
    try {
      if (!userData) return;

      const studentDocRef = doc(db, 'students', userData.uid);
      const studentDoc = await getDoc(studentDocRef);
      
      if (!studentDoc.exists()) {
        // Create a basic student profile
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
            documents: {}
          }
        };

        await setDoc(studentDocRef, basicProfile);
        console.log('Created basic student profile');
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
      
      // Ensure student profile exists first
      const profile = await ensureStudentProfile()
      if (profile) {
        setStudentProfile(profile)
        calculateProfileCompletion(profile)
      }
      
      // Fetch student profile and grades
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
            if (!app.courseId || typeof app.courseId !== 'string' || app.courseId.trim() === '') {
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

      // Get eligible courses count
      const eligibleCoursesCount = await getEligibleCoursesCount()

      // Fetch qualified jobs
      const qualifiedJobs = await getQualifiedJobs()

      setStats({
        totalApplications: applications.length,
        pendingApplications,
        admittedApplications,
        savedJobs: 0,
        eligibleCourses: eligibleCoursesCount,
        qualifiedJobs: qualifiedJobs.length
      })

      // Set recent applications
      setRecentApplications(applicationsWithDetails)

      // Set recommended jobs (already qualified)
      setRecommendedJobs(qualifiedJobs)

      // Fetch upcoming deadlines for eligible courses only
      try {
        const upcomingCourses = await getUpcomingEligibleDeadlines()
        setUpcomingDeadlines(upcomingCourses)
      } catch (coursesError) {
        console.error('Error fetching courses:', coursesError)
        setUpcomingDeadlines([])
      }

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

    setProfileCompletion(Math.round((completed / total) * 100))
  }

  const getEligibleCoursesCount = async () => {
    try {
      if (!userData) return 0

      // Get all active courses
      const coursesQuery = query(
        collection(db, 'courses'),
        where('status', '==', 'active')
      )
      const coursesSnapshot = await getDocs(coursesQuery)
      const courses = coursesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))

      // For now, return all active courses count
      // You can add course-specific qualification logic later
      return courses.length
    } catch (error) {
      console.error('Error counting eligible courses:', error)
      return 0
    }
  }

  const getQualifiedJobs = async () => {
    try {
      if (!userData) {
        console.log('No user data available')
        return []
      }

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

      console.log('Total jobs found:', allJobs.length)
      console.log('Student profile:', studentProfile)

      // Filter jobs based on student qualifications
      const qualifiedJobs = qualificationUtils.filterQualifiedJobs(allJobs, studentProfile)
      
      console.log('Qualified jobs after filtering:', qualifiedJobs.length)

      // Sort by match score and get qualification details
      const jobsWithScores = qualificationUtils.sortJobsByMatchScore(qualifiedJobs, studentProfile)

      return jobsWithScores.slice(0, 5) // Return top 5 qualified jobs
    } catch (error) {
      console.error('Error fetching qualified jobs:', error)
      return []
    }
  }

  const getUpcomingEligibleDeadlines = async () => {
    try {
      if (!userData) return []

      // Get all active courses with upcoming deadlines
      const coursesQuery = query(
        collection(db, 'courses'),
        where('status', '==', 'active'),
        orderBy('applicationDeadline', 'asc'),
        limit(10)
      )
      const coursesSnapshot = await getDocs(coursesQuery)
      const courses = coursesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))

      // Return top 3
      return courses.slice(0, 3)
    } catch (error) {
      console.error('Error fetching upcoming deadlines:', error)
      return []
    }
  }

  const handleApplyNow = async (jobId) => {
    if (!jobId) {
      console.error('Job ID is undefined')
      return
    }
    
    try {
      // Submit application directly without form
      const applicationData = {
        studentId: userData.uid,
        jobId: jobId,
        appliedAt: new Date(),
        status: 'pending',
        studentName: userData.displayName || '',
        studentEmail: userData.email || '',
      }

      // Add application to Firestore
      await addDoc(collection(db, 'jobApplications'), applicationData)
      
      // Show success message
      alert('Application submitted successfully!')
      
      // Refresh the dashboard to update stats
      fetchDashboardData()
      
    } catch (error) {
      console.error('Error submitting application:', error)
      alert('Failed to submit application. Please try again.')
    }
  }

  const handleViewCourse = (courseId) => {
    if (!courseId) {
      console.error('Course ID is undefined')
      return
    }
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

  const StatCard = ({ title, value, subtitle, onClick, icon: Icon }) => (
    <div 
      className={`stat-card ${onClick ? 'cursor-pointer hover:scale-105' : ''}`}
      onClick={onClick}
    >
      <div className="stat-card-content">
        <div>
          <p className="stat-card-title">{title}</p>
          <p className="stat-card-value">{value}</p>
          {subtitle && <p className="stat-card-subtitle">{subtitle}</p>}
        </div>
        <div className="stat-card-icon">
          {Icon && <Icon className="h-6 w-6 text-current" />}
        </div>
      </div>
    </div>
  )

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: 'status-badge-pending', label: 'Pending' },
      admitted: { color: 'status-badge-admitted', label: 'Admitted' },
      rejected: { color: 'status-badge-rejected', label: 'Rejected' },
      submitted: { color: 'status-badge-pending', label: 'Submitted' },
      under_review: { color: 'status-badge-pending', label: 'Under Review' },
      accepted: { color: 'status-badge-admitted', label: 'Accepted' },
      declined: { color: 'status-badge-rejected', label: 'Declined' }
    }
    const config = statusConfig[status] || { color: 'status-badge-default', label: status }
    
    return (
      <span className={`status-badge ${config.color}`}>
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

  const isDeadlineApproaching = (deadline) => {
    if (!deadline) return false
    try {
      const deadlineDate = deadline.toDate ? deadline.toDate() : new Date(deadline)
      const daysUntilDeadline = Math.ceil((deadlineDate - new Date()) / (1000 * 60 * 60 * 24))
      return daysUntilDeadline <= 7 && daysUntilDeadline >= 0
    } catch (error) {
      console.error('Error checking deadline:', error)
      return false
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

  const handleAddGrades = () => {
    navigate('/student/profile')
  }

  if (loading) {
    return (
      <div className="student-dashboard">
        <div className="dashboard-container">
          <div className="animate-pulse">
            <div className="loading-header"></div>
            <div className="stats-grid">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="loading-stat"></div>
              ))}
            </div>
            <div className="dashboard-grid">
              <div className="loading-card"></div>
              <div className="loading-card"></div>
            </div>
            <div className="loading-card-large"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="student-dashboard">
        <div className="dashboard-container">
          <div className="error-container">
            <div className="error-content">
              <h3 className="error-title">Dashboard Loading Issue</h3>
              <p className="error-message">{error}</p>
              <p className="error-help">
                This is usually temporary while Firestore indexes are building. Please wait a few minutes and refresh.
              </p>
              <button 
                onClick={fetchDashboardData}
                className="retry-button"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="student-dashboard">
      <div className="dashboard-container">
        {/* Header */}
        <div className="dashboard-header">
          <h1 className="dashboard-title">Student Dashboard</h1>
          <p className="dashboard-subtitle">
            Welcome back, {userData?.displayName || 'Student'}! Here are your personalized recommendations.
            {studentProfile?.profileCompleted ? (
              <span className="text-green-600 font-medium"> Showing jobs that match your qualifications</span>
            ) : (
              <span className="text-yellow-600 font-medium"> Complete your profile to see qualified opportunities</span>
            )}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="stats-grid">
          <StatCard
            title="Total Applications"
            value={stats.totalApplications}
            subtitle={`${stats.pendingApplications} pending`}
            onClick={handleMyApplications}
            icon={Briefcase}
          />
          <StatCard
            title="Admissions"
            value={stats.admittedApplications}
            subtitle="Accepted offers"
            icon={CheckCircle}
          />
          <StatCard
            title="Eligible Courses"
            value={stats.eligibleCourses}
            subtitle="Available courses"
            icon={GraduationCap}
          />
          <StatCard
            title="Qualified Jobs"
            value={stats.qualifiedJobs}
            subtitle="Matching your profile"
            icon={Star}
          />
        </div>

        <div className="dashboard-grid">
          {/* Recent Applications */}
          <div className="dashboard-card">
            <div className="card-header">
              <h3 className="card-title">Recent Applications</h3>
              <button 
                className="view-all-button"
                onClick={handleViewAllApplications}
              >
                View All
              </button>
            </div>
            <div className="card-content">
              {recentApplications.length > 0 ? (
                recentApplications.map(application => (
                  <div 
                    key={application.id} 
                    className="application-item cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => handleViewCourse(application.courseId)}
                  >
                    <div className="application-content">
                      <h4 className="application-title">
                        {application.course?.name || 'Unknown Course'}
                      </h4>
                      <div className="application-meta">
                        Applied {formatDate(application.appliedAt)}
                        {application.course?.institutionName && (
                          <span className="application-institution">
                            • {application.course.institutionName}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="application-status">
                      {getStatusBadge(application.status)}
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-state">
                  <div className="empty-icon"></div>
                  <p className="empty-text">No applications yet</p>
                  <p className="empty-subtext">
                    Your course applications will appear here
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Upcoming Deadlines */}
          <div className="dashboard-card">
            <div className="card-header">
              <h3 className="card-title">Course Deadlines</h3>
            </div>
            <div className="card-content">
              {upcomingDeadlines.length > 0 ? (
                upcomingDeadlines.map(course => {
                  const deadlineDate = course.applicationDeadline?.toDate ? course.applicationDeadline.toDate() : new Date(course.applicationDeadline)
                  const daysUntilDeadline = Math.ceil((deadlineDate - new Date()) / (1000 * 60 * 60 * 24))
                  
                  return (
                    <div 
                      key={course.id} 
                      className={`deadline-item cursor-pointer hover:bg-gray-50 transition-colors ${
                        isDeadlineApproaching(course.applicationDeadline) 
                          ? 'deadline-urgent' 
                          : 'deadline-normal'
                      }`}
                      onClick={() => handleViewCourse(course.id)}
                    >
                      <div className="deadline-content">
                        <div className="deadline-header">
                          <h4 className="deadline-title">{course.name}</h4>
                          <p className="deadline-institution">{course.institutionName}</p>
                        </div>
                        <span className="eligibility-badge bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                          Available
                        </span>
                        {isDeadlineApproaching(course.applicationDeadline) && (
                          <span className="urgent-badge">
                            Soon
                          </span>
                        )}
                      </div>
                      <div className="deadline-meta">
                        <span className="deadline-date">
                          Deadline: {formatDate(course.applicationDeadline)}
                        </span>
                        {isDeadlineApproaching(course.applicationDeadline) && (
                          <span className="days-remaining">
                            {daysUntilDeadline} days left
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="empty-state">
                  <div className="empty-icon"></div>
                  <p className="empty-text">No upcoming deadlines</p>
                  <p className="empty-subtext">
                    Check back later for new course opportunities
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Qualified Jobs - Direct Application */}
        <div className="dashboard-card">
          <div className="card-header">
            <h3 className="card-title">Jobs Matching Your Qualifications</h3>
            <p className="text-sm text-gray-600">
              {recommendedJobs.length > 0 
                ? `${recommendedJobs.length} jobs match your profile` 
                : 'No qualified jobs found'}
            </p>
          </div>
          <div className="card-content">
            {recommendedJobs.length > 0 ? (
              <div className="space-y-4">
                {recommendedJobs.map(job => {
                  const deadlineDate = job.deadline?.toDate ? job.deadline.toDate() : new Date(job.deadline)
                  const daysUntilDeadline = Math.ceil((deadlineDate - new Date()) / (1000 * 60 * 60 * 24))
                  const matchBadge = getMatchBadge(job.matchScore)
                  const qualificationBreakdown = qualificationUtils.getQualificationBreakdown(job, studentProfile)
                  
                  return (
                    <div 
                      key={job.id} 
                      className="job-item cursor-pointer hover:bg-green-50 transition-colors border-2 border-green-200"
                      onClick={() => handleApplyNow(job.id)}
                    >
                      <div className="job-content">
                        <div className="job-header">
                          <h4 className="job-title">{job.title}</h4>
                          <p className="job-company">{job.companyName}</p>
                        </div>
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          <span className={`eligibility-badge ${matchBadge.color} text-xs px-2 py-1 rounded-full flex items-center`}>
                            <Star className="h-3 w-3 mr-1" />
                            {matchBadge.label} ({job.matchScore}%)
                          </span>
                          {isDeadlineApproaching(job.deadline) && (
                            <span className="urgent-badge">
                              <Clock className="h-3 w-3 mr-1" />
                              Apply Soon
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="job-meta">
                        <div className="job-details">
                          <span className="job-type capitalize">{job.jobType}</span>
                          {job.location && (
                            <span className="job-location">• {job.location}</span>
                          )}
                        </div>
                        <div className="job-deadline">
                          {job.deadline ? (
                            <span>Apply by: {formatDate(job.deadline)}</span>
                          ) : (
                            <span>Open until filled</span>
                          )}
                          {isDeadlineApproaching(job.deadline) && job.deadline && (
                            <span className="days-remaining">
                              {daysUntilDeadline} days left
                            </span>
                          )}
                        </div>
                        {job.salary && (
                          <div className="job-salary">
                            <span className="font-medium">{job.salary}</span>
                          </div>
                        )}
                        {/* Qualification Preview */}
                        <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
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
                          <div className="space-y-1">
                            {qualificationBreakdown.slice(0, 3).map((item, index) => (
                              <div key={index} className="flex items-center text-xs">
                                {item.meets ? (
                                  <CheckCircle className="h-3 w-3 text-green-500 mr-1" />
                                ) : (
                                  <XCircle className="h-3 w-3 text-red-500 mr-1" />
                                )}
                                <span className={item.meets ? 'text-green-700' : 'text-red-700'}>
                                  {item.requirement.split(':')[0]}
                                </span>
                              </div>
                            ))}
                            {qualificationBreakdown.length > 3 && (
                              <div className="text-xs text-blue-600">
                                +{qualificationBreakdown.length - 3} more requirements
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-icon"></div>
                <p className="empty-text">
                  {studentProfile?.profileCompleted 
                    ? 'No jobs matching your qualifications yet' 
                    : 'Complete your profile to see qualified jobs'
                  }
                </p>
                <p className="empty-subtext">
                  {studentProfile?.profileCompleted
                    ? 'Check back later for new opportunities that match your qualifications'
                    : 'Update your profile with your education, skills, and experience'
                  }
                </p>
                {!studentProfile?.profileCompleted && (
                  <button 
                    className="empty-action-button"
                    onClick={handleMyProfile}
                  >
                    Complete Profile
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="dashboard-card">
          <h3 className="card-title">Quick Actions</h3>
          <div className="quick-actions-grid">
            <button 
              className="quick-action-card"
              onClick={handleMyApplications}
            >
              <div className="action-icon">
                <Briefcase className="h-6 w-6" />
              </div>
              <span className="action-title">My Applications</span>
              <span className="action-subtitle">View status & history</span>
            </button>
            <button 
              className="quick-action-card"
              onClick={handleMyProfile}
            >
              <div className="action-icon">
                <BookOpen className="h-6 w-6" />
              </div>
              <span className="action-title">My Profile</span>
              <span className="action-subtitle">Update qualifications</span>
            </button>
            {profileCompletion < 70 && (
              <button 
                className="quick-action-card bg-yellow-50 border-yellow-200"
                onClick={handleMyProfile}
              >
                <div className="action-icon">
                  <AlertCircle className="h-6 w-6 text-yellow-600" />
                </div>
                <span className="action-title">Complete Profile</span>
                <span className="action-subtitle">{profileCompletion}% complete</span>
              </button>
            )}
          </div>
        </div>

        {/* Profile Completion Panel */}
        {profileCompletion < 70 && (
          <div className="dashboard-card bg-yellow-50 border border-yellow-200">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm">!</span>
                </div>
              </div>
              <div className="flex-1">
                <h4 className="text-yellow-800 font-medium">Complete Your Profile</h4>
                <p className="text-yellow-700 text-sm mt-1">
                  Your profile is {profileCompletion}% complete. Finish setting up your qualifications to see more job matches.
                </p>
                <button 
                  onClick={handleMyProfile}
                  className="mt-2 bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Complete Profile
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Qualification Details Modal */}
        {showQualificationDetails && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-gray-900">
                    Qualification Details
                  </h3>
                  <button 
                    onClick={() => setShowQualificationDetails(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XCircle className="h-6 w-6" />
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
                          {item.meets ? (
                            <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                          )}
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
                    className="btn-secondary flex-1"
                  >
                    Close
                  </button>
                  <button 
                    onClick={() => {
                      handleApplyNow(showQualificationDetails.id)
                      setShowQualificationDetails(null)
                    }}
                    className="btn-primary flex-1"
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