import React, { useState, useEffect } from 'react'
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore'
import { db } from '../../firebase-config'
import { useAuth } from '../../hooks/useAuth'
import { useNavigate } from 'react-router-dom'

const InstitutionDashboard = () => {
  const { userData } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState({
    totalCourses: 0,
    totalApplications: 0,
    pendingApplications: 0,
    admittedStudents: 0
  })
  const [recentApplications, setRecentApplications] = useState([])
  const [popularCourses, setPopularCourses] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (userData) {
      fetchDashboardData()
    }
  }, [userData])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      
      // Fetch institution's courses
      const coursesQuery = query(
        collection(db, 'courses'),
        where('institutionId', '==', userData.uid)
      )
      const coursesSnapshot = await getDocs(coursesQuery)
      const courses = coursesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))

      // Fetch applications for institution's courses
      const courseIds = courses.map(course => course.id)
      let allApplications = []
      
      if (courseIds.length > 0) {
        const applicationsQuery = query(
          collection(db, 'applications'),
          where('courseId', 'in', courseIds),
          orderBy('appliedAt', 'desc'),
          limit(10)
        )
        const applicationsSnapshot = await getDocs(applicationsQuery)
        allApplications = applicationsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
      }

      // Calculate stats
      const pendingApplications = allApplications.filter(app => app.status === 'pending').length
      const admittedStudents = allApplications.filter(app => app.status === 'admitted').length

      setStats({
        totalCourses: courses.length,
        totalApplications: allApplications.length,
        pendingApplications,
        admittedStudents
      })

      // Set recent applications and popular courses
      setRecentApplications(allApplications.slice(0, 5))
      
      // Calculate popular courses (courses with most applications)
      const courseApplicationCounts = {}
      allApplications.forEach(app => {
        courseApplicationCounts[app.courseId] = (courseApplicationCounts[app.courseId] || 0) + 1
      })
      
      const popular = courses
        .map(course => ({
          ...course,
          applicationCount: courseApplicationCounts[course.id] || 0
        }))
        .sort((a, b) => b.applicationCount - a.applicationCount)
        .slice(0, 3)
      
      setPopularCourses(popular)

    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Navigation handlers - FIXED
  const handleViewAllApplications = () => {
    navigate('/institution/applications')
  }

  const handleViewAllCourses = () => {
    navigate('/institution/courses')
  }

  const handleAddCourse = () => {
    navigate('/institution/courses') // ✅ Fixed: Navigate to existing route
  }

  const handleReviewApplications = () => {
    navigate('/institution/applications')
  }

  const handlePublishAdmissions = () => {
    navigate('/institution/admissions')
  }

  const handleApplicationClick = (applicationId) => {
    navigate(`/institution/applications/${applicationId}`)
  }

  const handleCourseClick = (courseId) => {
    navigate('/institution/courses') // ✅ Fixed: Just go to courses list
  }

  const StatCard = ({ title, value, subtitle, onClick }) => (
    <div 
      className={`stat-card ${onClick ? 'clickable' : ''}`}
      onClick={onClick}
    >
      <div className="stat-content">
        <div>
          <p className="stat-title">{title}</p>
          <p className="stat-value">{value}</p>
          {subtitle && <p className="stat-subtitle">{subtitle}</p>}
        </div>
        <div className="stat-indicator"></div>
      </div>
    </div>
  )

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A'
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    return date.toLocaleDateString()
  }

  if (loading) {
    return (
      <div className="institution-dashboard">
        <div className="dashboard-container">
          <div className="animate-pulse">
            <div className="loading-header"></div>
            <div className="stats-grid">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="loading-stat"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="institution-dashboard">
      <div className="dashboard-container">
        {/* Header */}
        <div className="dashboard-header">
          <h1 className="dashboard-title">Institution Dashboard</h1>
          <p className="dashboard-subtitle">
            Welcome back, {userData?.institutionName || userData?.displayName}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="stats-grid">
          <StatCard
            title="Total Courses"
            value={stats.totalCourses}
            subtitle="Offered programs"
            onClick={() => navigate('/institution/courses')}
          />
          <StatCard
            title="Applications"
            value={stats.totalApplications}
            subtitle={`${stats.pendingApplications} pending`}
            onClick={() => navigate('/institution/applications')}
          />
          <StatCard
            title="Admitted Students"
            value={stats.admittedStudents}
            subtitle="Current intake"
            onClick={() => navigate('/institution/students')}
          />
          <StatCard
            title="Profile Views"
            value="0"
            subtitle="This month"
            onClick={() => navigate('/institution/profile')}
          />
        </div>

        <div className="content-grid">
          {/* Recent Applications */}
          <div className="content-card">
            <div className="card-header">
              <h3 className="card-title">Recent Applications</h3>
              <button 
                className="view-all-btn"
                onClick={handleViewAllApplications}
              >
                View All
              </button>
            </div>
            <div className="card-content">
              {recentApplications.map(application => (
                <div 
                  key={application.id} 
                  className="list-item clickable"
                  onClick={() => handleApplicationClick(application.id)}
                >
                  <div className="item-content">
                    <h4 className="item-title">Application #{application.id.slice(-6)}</h4>
                    <div className="item-subtitle">
                      Applied {formatDate(application.appliedAt)}
                    </div>
                  </div>
                  <div className="item-status">
                    <span className={`status-badge ${application.status}`}>
                      {application.status}
                    </span>
                  </div>
                </div>
              ))}
              {recentApplications.length === 0 && (
                <div className="empty-state">
                  <div className="empty-icon"></div>
                  <p className="empty-text">No applications yet</p>
                  <p className="empty-description">
                    Applications will appear here when students apply to your courses
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Popular Courses */}
          <div className="content-card">
            <div className="card-header">
              <h3 className="card-title">Popular Courses</h3>
              <button 
                className="view-all-btn"
                onClick={handleViewAllCourses}
              >
                View All
              </button>
            </div>
            <div className="card-content">
              {popularCourses.map(course => (
                <div 
                  key={course.id} 
                  className="list-item clickable"
                  onClick={() => handleCourseClick(course.id)}
                >
                  <div className="item-content">
                    <h4 className="item-title">{course.name}</h4>
                    <div className="item-subtitle">
                      {course.faculty || 'General'}
                    </div>
                  </div>
                  <div className="item-metric">
                    <span className="metric-badge">
                      {course.applicationCount} apps
                    </span>
                  </div>
                </div>
              ))}
              {popularCourses.length === 0 && (
                <div className="empty-state">
                  <div className="empty-icon"></div>
                  <p className="empty-text">No courses yet</p>
                  <button 
                    className="primary-btn"
                    onClick={handleAddCourse}
                  >
                    Add Your First Course
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="content-card">
          <h3 className="card-title">Quick Actions</h3>
          <div className="actions-grid">
            <button 
              className="action-card clickable"
              onClick={handleAddCourse}
            >
              <div className="action-icon"></div>
              <span className="action-title">Add Course</span>
              <span className="action-description">Create new program</span>
            </button>
            <button 
              className="action-card clickable"
              onClick={handleReviewApplications}
            >
              <div className="action-icon"></div>
              <span className="action-title">Review Applications</span>
              <span className="action-description">Manage applications</span>
            </button>
            <button 
              className="action-card clickable"
              onClick={handlePublishAdmissions}
            >
              <div className="action-icon"></div>
              <span className="action-title">Publish Admissions</span>
              <span className="action-description">Release results</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default InstitutionDashboard