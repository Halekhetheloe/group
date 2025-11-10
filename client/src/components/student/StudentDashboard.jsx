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

  const StatCard = ({ title, value, subtitle, color, onClick }) => (
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
        <div className={`stat-card-icon ${color}`}>
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
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <div className="h-64 bg-gray-200 rounded-lg"></div>
              <div className="h-64 bg-gray-200 rounded-lg"></div>
            </div>
            <div className="h-64 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
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
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
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
            color="stat-icon-blue"
            onClick={handleMyApplications}
          />
          <StatCard
            title="Admissions"
            value={stats.admittedApplications}
            subtitle="Accepted offers"
            color="stat-icon-green"
          />
          <StatCard
            title="Saved Jobs"
            value={stats.savedJobs}
            subtitle="Opportunities"
            color="stat-icon-purple"
            onClick={handleJobSearch}
          />
          <StatCard
            title="Upcoming Deadlines"
            value={upcomingDeadlines.filter(course => 
              isDeadlineApproaching(course.applicationDeadline)
            ).length}
            subtitle="Approaching soon"
            color="stat-icon-orange"
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
                    <div className="job-icon">💼</div>
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
                <div className="empty-icon">🔍</div>
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
              className="quick-action-card quick-action-blue"
              onClick={handleBrowseCourses}
            >
              <div className="action-icon action-icon-blue">🎓</div>
              <span className="action-title">Browse Courses</span>
              <span className="action-subtitle">Find programs</span>
            </button>
            <button 
              className="quick-action-card quick-action-green"
              onClick={handleMyApplications}
            >
              <div className="action-icon action-icon-green">📋</div>
              <span className="action-title">My Applications</span>
              <span className="action-subtitle">View status</span>
            </button>
            <button 
              className="quick-action-card quick-action-purple"
              onClick={handleJobSearch}
            >
              <div className="action-icon action-icon-purple">💼</div>
              <span className="action-title">Job Search</span>
              <span className="action-subtitle">Find opportunities</span>
            </button>
            <button 
              className="quick-action-card quick-action-orange"
              onClick={handleMyProfile}
            >
              <div className="action-icon action-icon-orange">👤</div>
              <span className="action-title">My Profile</span>
              <span className="action-subtitle">Update information</span>
            </button>
          </div>
        </div>
      </div>

      {/* Add the CSS styles */}
      <style jsx>{`
        .dashboard-header {
          margin-bottom: 2rem;
        }

        .dashboard-title {
          font-size: 1.875rem;
          font-weight: bold;
          color: #111827;
          margin-bottom: 0.5rem;
        }

        .dashboard-subtitle {
          color: #6b7280;
          font-size: 1.125rem;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(1, 1fr);
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        @media (min-width: 768px) {
          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (min-width: 1024px) {
          .stats-grid {
            grid-template-columns: repeat(4, 1fr);
          }
        }

        .stat-card {
          background: white;
          border-radius: 0.75rem;
          border: 1px solid #e5e7eb;
          box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
          padding: 1.5rem;
          transition: all 0.2s;
          cursor: pointer;
        }

        .stat-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }

        .stat-card-content {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .stat-card-title {
          font-size: 0.875rem;
          font-weight: 500;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .stat-card-value {
          font-size: 1.875rem;
          font-weight: bold;
          color: #111827;
          margin: 0.5rem 0;
        }

        .stat-card-subtitle {
          font-size: 0.875rem;
          color: #6b7280;
        }

        .stat-card-icon {
          padding: 0.75rem;
          border-radius: 0.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .stat-icon-blue {
          background-color: #3b82f6;
        }

        .stat-icon-green {
          background-color: #10b981;
        }

        .stat-icon-purple {
          background-color: #8b5cf6;
        }

        .stat-icon-orange {
          background-color: #f59e0b;
        }

        .stat-icon {
          height: 1.5rem;
          width: 1.5rem;
          background: white;
          border-radius: 50%;
        }

        .dashboard-grid {
          display: grid;
          grid-template-columns: repeat(1, 1fr);
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        @media (min-width: 1024px) {
          .dashboard-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        .dashboard-card {
          background: white;
          border-radius: 0.75rem;
          border: 1px solid #e5e7eb;
          box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
          padding: 1.5rem;
        }

        .card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1.5rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid #e5e7eb;
        }

        .card-title {
          font-size: 1.25rem;
          font-weight: 600;
          color: #111827;
        }

        .view-all-button {
          color: #2563eb;
          font-size: 0.875rem;
          font-weight: 500;
          background: none;
          border: none;
          cursor: pointer;
          transition: color 0.2s;
          padding: 0.5rem 1rem;
          border-radius: 0.375rem;
        }

        .view-all-button:hover {
          color: #1d4ed8;
          background-color: #f3f4f6;
        }

        .card-content {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .application-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1rem;
          background-color: #f9fafb;
          border-radius: 0.5rem;
          cursor: pointer;
          transition: all 0.2s;
          border: 1px solid transparent;
        }

        .application-item:hover {
          background-color: #f3f4f6;
          border-color: #e5e7eb;
          transform: translateY(-1px);
        }

        .application-content {
          flex: 1;
        }

        .application-title {
          font-weight: 600;
          color: #111827;
          margin-bottom: 0.25rem;
        }

        .application-meta {
          display: flex;
          align-items: center;
          font-size: 0.875rem;
          color: #6b7280;
          gap: 0.5rem;
        }

        .application-institution {
          color: #374151;
          font-weight: 500;
        }

        .application-status {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .status-badge {
          display: inline-flex;
          align-items: center;
          padding: 0.375rem 0.75rem;
          border-radius: 9999px;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .status-badge-pending {
          background-color: #fef3c7;
          color: #92400e;
        }

        .status-badge-admitted {
          background-color: #d1fae5;
          color: #065f46;
        }

        .status-badge-rejected {
          background-color: #fee2e2;
          color: #991b1b;
        }

        .status-badge-default {
          background-color: #f3f4f6;
          color: #374151;
        }

        .deadline-item {
          padding: 1.25rem;
          border-radius: 0.5rem;
          cursor: pointer;
          transition: all 0.2s;
          border: 1px solid transparent;
        }

        .deadline-normal {
          background-color: #f9fafb;
        }

        .deadline-urgent {
          background-color: #fef2f2;
          border-color: #fecaca;
        }

        .deadline-item:hover {
          background-color: #f3f4f6;
          transform: translateY(-1px);
        }

        .deadline-content {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 0.75rem;
        }

        .deadline-header {
          flex: 1;
        }

        .deadline-title {
          font-weight: 600;
          color: #111827;
          margin-bottom: 0.25rem;
        }

        .deadline-institution {
          font-size: 0.875rem;
          color: #6b7280;
        }

        .deadline-meta {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 0.875rem;
          color: #6b7280;
        }

        .deadline-date {
          font-weight: 500;
        }

        .days-remaining {
          color: #dc2626;
          font-weight: 600;
        }

        .urgent-badge {
          background-color: #dc2626;
          color: white;
          padding: 0.25rem 0.75rem;
          border-radius: 0.25rem;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
        }

        .jobs-grid {
          display: grid;
          grid-template-columns: repeat(1, 1fr);
          gap: 1.5rem;
        }

        @media (min-width: 768px) {
          .jobs-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (min-width: 1024px) {
          .jobs-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        .job-card {
          padding: 1.5rem;
          background-color: #f9fafb;
          border-radius: 0.5rem;
          border: 1px solid #e5e7eb;
          transition: all 0.2s;
        }

        .job-card:hover {
          background-color: #f3f4f6;
          transform: translateY(-2px);
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }

        .job-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 1rem;
        }

        .job-title {
          font-weight: 600;
          color: #111827;
          margin-bottom: 0.25rem;
        }

        .job-company {
          font-size: 0.875rem;
          color: #6b7280;
          font-weight: 500;
        }

        .job-icon {
          font-size: 1.5rem;
        }

        .job-details {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          font-size: 0.875rem;
          margin-bottom: 1.5rem;
        }

        .job-detail {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: #6b7280;
        }

        .job-type, .job-location, .job-salary {
          font-weight: 500;
        }

        .job-type {
          color: #374151;
        }

        .job-salary {
          color: #059669;
        }

        .apply-now-button {
          width: 100%;
          background-color: #2563eb;
          color: white;
          padding: 0.75rem 1.5rem;
          border-radius: 0.5rem;
          font-size: 0.875rem;
          font-weight: 600;
          border: none;
          cursor: pointer;
          transition: background-color 0.2s;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .apply-now-button:hover {
          background-color: #1d4ed8;
          transform: translateY(-1px);
        }

        .quick-actions-grid {
          display: grid;
          grid-template-columns: repeat(1, 1fr);
          gap: 1rem;
        }

        @media (min-width: 768px) {
          .quick-actions-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (min-width: 1024px) {
          .quick-actions-grid {
            grid-template-columns: repeat(4, 1fr);
          }
        }

        .quick-action-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 2rem 1rem;
          border-radius: 0.75rem;
          border: none;
          cursor: pointer;
          transition: all 0.2s;
          text-align: center;
        }

        .quick-action-blue {
          background-color: #dbeafe;
        }

        .quick-action-blue:hover {
          background-color: #bfdbfe;
          transform: translateY(-2px);
        }

        .quick-action-green {
          background-color: #d1fae5;
        }

        .quick-action-green:hover {
          background-color: #a7f3d0;
          transform: translateY(-2px);
        }

        .quick-action-purple {
          background-color: #e9d5ff;
        }

        .quick-action-purple:hover {
          background-color: #d8b4fe;
          transform: translateY(-2px);
        }

        .quick-action-orange {
          background-color: #fed7aa;
        }

        .quick-action-orange:hover {
          background-color: #fdba74;
          transform: translateY(-2px);
        }

        .action-icon {
          height: 3rem;
          width: 3rem;
          margin-bottom: 1rem;
          font-size: 1.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
        }

        .action-icon-blue {
          background-color: #3b82f6;
          color: white;
        }

        .action-icon-green {
          background-color: #10b981;
          color: white;
        }

        .action-icon-purple {
          background-color: #8b5cf6;
          color: white;
        }

        .action-icon-orange {
          background-color: #f59e0b;
          color: white;
        }

        .action-title {
          font-weight: 600;
          margin-bottom: 0.5rem;
          font-size: 1.125rem;
        }

        .quick-action-blue .action-title {
          color: #1e40af;
        }

        .quick-action-green .action-title {
          color: #065f46;
        }

        .quick-action-purple .action-title {
          color: #5b21b6;
        }

        .quick-action-orange .action-title {
          color: #9a3412;
        }

        .action-subtitle {
          font-size: 0.875rem;
          opacity: 0.8;
        }

        .quick-action-blue .action-subtitle {
          color: #3730a3;
        }

        .quick-action-green .action-subtitle {
          color: #047857;
        }

        .quick-action-purple .action-subtitle {
          color: #4c1d95;
        }

        .quick-action-orange .action-subtitle {
          color: #7c2d12;
        }

        .empty-state, .empty-jobs-state {
          text-align: center;
          padding: 3rem 2rem;
        }

        .empty-icon {
          height: 4rem;
          width: 4rem;
          color: #9ca3af;
          margin-left: auto;
          margin-right: auto;
          margin-bottom: 1rem;
          font-size: 2.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .empty-text {
          color: #6b7280;
          font-size: 1.125rem;
          font-weight: 500;
          margin-bottom: 0.5rem;
        }

        .empty-subtext {
          font-size: 0.875rem;
          color: #9ca3af;
          margin-bottom: 1.5rem;
        }

        .empty-action-button {
          background-color: #2563eb;
          color: white;
          padding: 0.75rem 1.5rem;
          border-radius: 0.5rem;
          font-size: 0.875rem;
          font-weight: 500;
          border: none;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .empty-action-button:hover {
          background-color: #1d4ed8;
        }

        .error-container {
          text-align: center;
          padding: 4rem 2rem;
        }

        .error-content {
          background-color: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 0.75rem;
          padding: 2rem;
          max-width: 32rem;
          margin-left: auto;
          margin-right: auto;
        }

        .error-title {
          font-size: 1.25rem;
          font-weight: 600;
          color: #991b1b;
          margin-bottom: 1rem;
        }

        .error-message {
          color: #dc2626;
          margin-bottom: 1.5rem;
        }

        .error-help {
          font-size: 0.875rem;
          color: #b91c1c;
          margin-bottom: 1.5rem;
          line-height: 1.5;
        }

        .retry-button {
          background-color: #dc2626;
          color: white;
          padding: 0.75rem 1.5rem;
          border-radius: 0.5rem;
          font-size: 0.875rem;
          font-weight: 500;
          border: none;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .retry-button:hover {
          background-color: #b91c1c;
        }
      `}</style>
    </div>
  )
}

export default StudentDashboard