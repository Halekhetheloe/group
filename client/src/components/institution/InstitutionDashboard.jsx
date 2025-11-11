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
  const [debugInfo, setDebugInfo] = useState('') // For debugging

  useEffect(() => {
    if (userData) {
      fetchDashboardData()
    }
  }, [userData])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      console.log('🔍 Fetching dashboard data for institution:', userData.uid)
      console.log('📊 User data:', userData)
      
      // Fetch institution's courses - FIXED: Use institutionId from userData
      const coursesQuery = query(
        collection(db, 'courses'),
        where('institutionId', '==', userData.institutionId || userData.uid) // Try both
      )
      const coursesSnapshot = await getDocs(coursesQuery)
      const courses = coursesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))

      console.log('📚 Found courses:', courses.length, courses)

      // Fetch applications for institution's courses
      const courseIds = courses.map(course => course.id)
      let allApplications = []
      
      console.log('🎯 Course IDs to search:', courseIds)

      if (courseIds.length > 0) {
        // Since Firestore doesn't support 'in' with more than 10 items, we'll fetch all and filter
        const applicationsQuery = query(
          collection(db, 'applications'),
          orderBy('appliedAt', 'desc')
        )
        const applicationsSnapshot = await getDocs(applicationsQuery)
        allApplications = applicationsSnapshot.docs
          .map(doc => ({
            id: doc.id,
            ...doc.data()
          }))
          .filter(app => courseIds.includes(app.courseId))
          .slice(0, 10) // Limit to 10 most recent

        console.log('📨 Found applications:', allApplications.length, allApplications)
      } else {
        console.log('❌ No courses found, skipping applications fetch')
      }

      // Calculate stats
      const pendingApplications = allApplications.filter(app => 
        app.status === 'pending' || app.status === 'under_review'
      ).length
      const admittedStudents = allApplications.filter(app => 
        app.status === 'admitted' || app.status === 'accepted'
      ).length

      console.log('📈 Calculated stats:', {
        totalCourses: courses.length,
        totalApplications: allApplications.length,
        pendingApplications,
        admittedStudents
      })

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

      // Set debug info
      setDebugInfo(`Courses: ${courses.length}, Applications: ${allApplications.length}`)

    } catch (error) {
      console.error('❌ Error fetching dashboard data:', error)
      setDebugInfo(`Error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  // Navigation handlers
  const handleViewAllApplications = () => {
    navigate('/institution/applications')
  }

  const handleViewAllCourses = () => {
    navigate('/institution/courses')
  }

  const handleAddCourse = () => {
    navigate('/institution/courses')
  }

  const handleReviewApplications = () => {
    navigate('/institution/applications')
  }

  const handlePublishAdmissions = () => {
    navigate('/institution/admissions')
  }

  const handleApplicationClick = (applicationId) => {
    navigate(`/institution/applications`)
  }

  const handleCourseClick = (courseId) => {
    navigate('/institution/courses')
  }

  const StatCard = ({ title, value, subtitle, onClick }) => (
    <div 
      className={`bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-all duration-300 ${
        onClick ? 'cursor-pointer hover:border-blue-300' : ''
      }`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-slate-900">{value}</p>
          {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
        </div>
        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
          <div className="w-6 h-6 bg-blue-500 rounded"></div>
        </div>
      </div>
    </div>
  )

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A'
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
      })
    } catch (error) {
      return 'Invalid Date'
    }
  }

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
      under_review: { color: 'bg-blue-100 text-blue-800', label: 'Review' },
      admitted: { color: 'bg-green-100 text-green-800', label: 'Admitted' },
      accepted: { color: 'bg-green-100 text-green-800', label: 'Accepted' },
      rejected: { color: 'bg-red-100 text-red-800', label: 'Rejected' }
    }
    
    const config = statusConfig[status] || { color: 'bg-gray-100 text-gray-800', label: status }
    
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-slate-200 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-slate-200 rounded-xl"></div>
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <div className="h-64 bg-slate-200 rounded-xl"></div>
              <div className="h-64 bg-slate-200 rounded-xl"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Debug info - remove in production */}
        {debugInfo && (
          <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">Debug: {debugInfo}</p>
            <p className="text-xs text-yellow-600 mt-1">Institution ID: {userData?.institutionId || userData?.uid}</p>
          </div>
        )}

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Institution Dashboard</h1>
          <p className="text-slate-600 mt-2">
            Welcome back, {userData?.institutionName || userData?.displayName || 'Administrator'}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Recent Applications */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-slate-900">Recent Applications</h3>
              <button 
                className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                onClick={handleViewAllApplications}
              >
                View All
              </button>
            </div>
            <div className="space-y-4">
              {recentApplications.map(application => (
                <div 
                  key={application.id} 
                  className="flex items-center justify-between p-4 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors"
                  onClick={() => handleApplicationClick(application.id)}
                >
                  <div className="flex-1">
                    <h4 className="font-medium text-slate-900">
                      Application #{application.id.slice(-6)}
                    </h4>
                    <div className="text-sm text-slate-600 mt-1">
                      Applied {formatDate(application.appliedAt)}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusBadge(application.status)}
                  </div>
                </div>
              ))}
              {recentApplications.length === 0 && (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <div className="w-8 h-8 bg-slate-300 rounded"></div>
                  </div>
                  <p className="text-slate-600 mb-2">No applications yet</p>
                  <p className="text-sm text-slate-500">
                    Applications will appear here when students apply to your courses
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Popular Courses */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-slate-900">Popular Courses</h3>
              <button 
                className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                onClick={handleViewAllCourses}
              >
                View All
              </button>
            </div>
            <div className="space-y-4">
              {popularCourses.map(course => (
                <div 
                  key={course.id} 
                  className="flex items-center justify-between p-4 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors"
                  onClick={() => handleCourseClick(course.id)}
                >
                  <div className="flex-1">
                    <h4 className="font-medium text-slate-900">{course.name}</h4>
                    <div className="text-sm text-slate-600 mt-1">
                      {course.facultyName || course.faculty || 'General Studies'}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                      {course.applicationCount} apps
                    </span>
                  </div>
                </div>
              ))}
              {popularCourses.length === 0 && (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <div className="w-8 h-8 bg-slate-300 rounded"></div>
                  </div>
                  <p className="text-slate-600 mb-4">No courses yet</p>
                  <button 
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
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
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-6">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button 
              className="flex flex-col items-center p-6 border-2 border-dashed border-slate-300 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-all duration-300 text-center"
              onClick={handleAddCourse}
            >
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
                <div className="w-6 h-6 bg-blue-500 rounded"></div>
              </div>
              <span className="font-semibold text-slate-900 mb-1">Add Course</span>
              <span className="text-sm text-slate-600">Create new program</span>
            </button>
            <button 
              className="flex flex-col items-center p-6 border-2 border-dashed border-slate-300 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-all duration-300 text-center"
              onClick={handleReviewApplications}
            >
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
                <div className="w-6 h-6 bg-blue-500 rounded"></div>
              </div>
              <span className="font-semibold text-slate-900 mb-1">Review Applications</span>
              <span className="text-sm text-slate-600">Manage applications</span>
            </button>
            <button 
              className="flex flex-col items-center p-6 border-2 border-dashed border-slate-300 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-all duration-300 text-center"
              onClick={handlePublishAdmissions}
            >
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
                <div className="w-6 h-6 bg-blue-500 rounded"></div>
              </div>
              <span className="font-semibold text-slate-900 mb-1">Publish Admissions</span>
              <span className="text-sm text-slate-600">Release results</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default InstitutionDashboard