import React, { useState, useEffect } from 'react'
import { collection, query, where, getDocs, orderBy, limit, doc, getDoc } from 'firebase/firestore'
import { db } from '../../firebase-config'
import { useAuth } from '../../hooks/useAuth'
import { useNavigate } from 'react-router-dom'

const StudentDashboard = () => {
  const { userData } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState({
    totalApplications: 0,
    pendingApplications: 0,
    admittedApplications: 0,
    savedJobs: 0
  })
  const [recentApplications, setRecentApplications] = useState([])
  const [recommendedJobs, setRecommendedJobs] = useState([])
  const [upcomingDeadlines, setUpcomingDeadlines] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (userData) {
      fetchDashboardData()
    }
  }, [userData])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)
      
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

      // Fetch course details for applications with proper error handling
      const applicationsWithDetails = await Promise.all(
        applications.map(async (app) => {
          try {
            // Check if courseId exists and is valid
            if (!app.courseId || typeof app.courseId !== 'string' || app.courseId.trim() === '') {
              console.warn('Invalid courseId for application:', app.id)
              return {
                ...app,
                course: { name: 'Course information unavailable' }
              }
            }

            const courseDoc = await getDoc(doc(db, 'courses', app.courseId))
            
            if (!courseDoc.exists()) {
              console.warn('Course not found:', app.courseId)
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

      setStats({
        totalApplications: applications.length,
        pendingApplications,
        admittedApplications,
        savedJobs: 0 // Would come from saved jobs collection
      })

      // Set recent applications
      setRecentApplications(applicationsWithDetails)

      // Fetch recommended jobs
      try {
        const jobsQuery = query(
          collection(db, 'jobs'),
          where('status', '==', 'active'),
          orderBy('createdAt', 'desc'),
          limit(3)
        )
        const jobsSnapshot = await getDocs(jobsQuery)
        const jobs = jobsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        setRecommendedJobs(jobs)
      } catch (jobsError) {
        console.error('Error fetching jobs:', jobsError)
        setRecommendedJobs([])
      }

      // Fetch upcoming deadlines
      try {
        const coursesQuery = query(
          collection(db, 'courses'),
          where('status', '==', 'active'),
          orderBy('applicationDeadline', 'asc'),
          limit(3)
        )
        const coursesSnapshot = await getDocs(coursesQuery)
        const upcomingCourses = coursesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
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

  // Navigation handlers
  const handleViewAllApplications = () => {
    navigate('/student/applications')
  }

  const handleViewAllCourses = () => {
    navigate('/courses')
  }

  const handleViewAllJobs = () => {
    navigate('/jobs')
  }

  const handleBrowseCourses = () => {
    navigate('/student/courses')
  }

  const handleMyApplications = () => {
    navigate('/student/applications')
  }

  const handleJobSearch = () => {
    navigate('/student/jobs')
  }

  const handleMyProfile = () => {
    navigate('/student/profile')
  }

  const handleApplyNow = (jobId) => {
    if (!jobId) {
      console.error('Job ID is undefined')
      return
    }
    
    // Use the correct route path that matches your App.jsx
    navigate(`/jobs/${jobId}/apply`)
  }

  const handleViewCourse = (courseId) => {
    if (!courseId) {
      console.error('Course ID is undefined')
      return
    }
    navigate(`/student/courses`)
  }

  const StatCard = ({ title, value, subtitle, onClick }) => (
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
          <div className="stat-icon"></div>
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
            Welcome back, {userData?.displayName || 'Student'}! Here's your application overview.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="stats-grid">
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
            title="Saved Jobs"
            value={stats.savedJobs}
            subtitle="Opportunities"
            onClick={handleJobSearch}
          />
          <StatCard
            title="Upcoming Deadlines"
            value={upcomingDeadlines.filter(course => 
              isDeadlineApproaching(course.applicationDeadline)
            ).length}
            subtitle="Approaching soon"
            onClick={handleViewAllCourses}
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
                    className="application-item"
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
                    Start your journey by applying to courses
                  </p>
                  <button 
                    className="empty-action-button"
                    onClick={handleBrowseCourses}
                  >
                    Browse Courses
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Upcoming Deadlines */}
          <div className="dashboard-card">
            <div className="card-header">
              <h3 className="card-title">Upcoming Deadlines</h3>
              <button 
                className="view-all-button"
                onClick={handleViewAllCourses}
              >
                View All
              </button>
            </div>
            <div className="card-content">
              {upcomingDeadlines.length > 0 ? (
                upcomingDeadlines.map(course => {
                  const deadlineDate = course.applicationDeadline?.toDate ? course.applicationDeadline.toDate() : new Date(course.applicationDeadline)
                  const daysUntilDeadline = Math.ceil((deadlineDate - new Date()) / (1000 * 60 * 60 * 24))
                  
                  return (
                    <div 
                      key={course.id} 
                      className={`deadline-item ${
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
                    Check back later for new opportunities
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recommended Jobs */}
        <div className="dashboard-card">
          <div className="card-header">
            <h3 className="card-title">Recommended Jobs</h3>
            <button 
              className="view-all-button"
              onClick={handleViewAllJobs}
            >
              View All
            </button>
          </div>
          <div className="jobs-grid">
            {recommendedJobs.length > 0 ? (
              recommendedJobs.map(job => (
                <div key={job.id} className="job-card">
                  <div className="job-header">
                    <div>
                      <h4 className="job-title">{job.title}</h4>
                      <p className="job-company">{job.companyName}</p>
                    </div>
                    <div className="job-icon"></div>
                  </div>
                  <div className="job-details">
                    <div className="job-detail">
                      <span className="job-type">{job.jobType}</span>
                      {job.location && (
                        <span className="job-location">• {job.location}</span>
                      )}
                    </div>
                    <div className="job-detail">
                      {job.deadline ? (
                        <span>Deadline: {formatDate(job.deadline)}</span>
                      ) : (
                        <span>Open until filled</span>
                      )}
                    </div>
                    {job.salary && (
                      <div className="job-detail">
                        <span className="job-salary">{job.salary}</span>
                      </div>
                    )}
                  </div>
                  <button 
                    className="apply-now-button"
                    onClick={() => handleApplyNow(job.id)}
                  >
                    Apply Now
                  </button>
                </div>
              ))
            ) : (
              <div className="empty-jobs-state">
                <div className="empty-icon"></div>
                <p className="empty-text">No recommended jobs yet</p>
                <p className="empty-subtext">
                  Complete your profile to get better job recommendations
                </p>
                <button 
                  className="empty-action-button"
                  onClick={handleMyProfile}
                >
                  Update Profile
                </button>
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
              onClick={handleBrowseCourses}
            >
              <div className="action-icon"></div>
              <span className="action-title">Browse Courses</span>
              <span className="action-subtitle">Find programs</span>
            </button>
            <button 
              className="quick-action-card"
              onClick={handleMyApplications}
            >
              <div className="action-icon"></div>
              <span className="action-title">My Applications</span>
              <span className="action-subtitle">View status</span>
            </button>
            <button 
              className="quick-action-card"
              onClick={handleJobSearch}
            >
              <div className="action-icon"></div>
              <span className="action-title">Job Search</span>
              <span className="action-subtitle">Find opportunities</span>
            </button>
            <button 
              className="quick-action-card"
              onClick={handleMyProfile}
            >
              <div className="action-icon"></div>
              <span className="action-title">My Profile</span>
              <span className="action-subtitle">Update information</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default StudentDashboard