import React, { useState, useEffect } from 'react'
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore'
import { db } from '../../firebase-config'
import { useAuth } from '../../hooks/useAuth'

const InstitutionDashboard = () => {
  const { userData } = useAuth()
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

  const StatCard = ({ title, value, subtitle, color, onClick }) => (
    <div 
      className={`card cursor-pointer transform hover:scale-105 transition-transform duration-200 ${onClick ? 'hover:shadow-lg' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <div className="h-6 w-6 text-white"></div>
        </div>
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
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
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
          <h1 className="text-3xl font-bold text-gray-900">Institution Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Welcome back, {userData?.institutionName || userData?.displayName}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Courses"
            value={stats.totalCourses}
            subtitle="Offered programs"
            color="bg-blue-500"
          />
          <StatCard
            title="Applications"
            value={stats.totalApplications}
            subtitle={`${stats.pendingApplications} pending`}
            color="bg-green-500"
          />
          <StatCard
            title="Admitted Students"
            value={stats.admittedStudents}
            subtitle="Current intake"
            color="bg-purple-500"
          />
          <StatCard
            title="Profile Views"
            value="0"
            subtitle="This month"
            color="bg-orange-500"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Applications */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Recent Applications</h3>
              <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                View All
              </button>
            </div>
            <div className="space-y-4">
              {recentApplications.map(application => (
                <div key={application.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">Application #{application.id.slice(-6)}</h4>
                    <div className="flex items-center text-sm text-gray-600 mt-1">
                      Applied {formatDate(application.appliedAt)}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      application.status === 'pending' 
                        ? 'bg-yellow-100 text-yellow-800'
                        : application.status === 'admitted'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {application.status}
                    </span>
                  </div>
                </div>
              ))}
              {recentApplications.length === 0 && (
                <div className="text-center py-8">
                  <div className="h-12 w-12 text-gray-400 mx-auto mb-4"></div>
                  <p className="text-gray-500">No applications yet</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Applications will appear here when students apply to your courses
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Popular Courses */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Popular Courses</h3>
              <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                View All
              </button>
            </div>
            <div className="space-y-4">
              {popularCourses.map(course => (
                <div key={course.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{course.name}</h4>
                    <div className="flex items-center text-sm text-gray-600 mt-1">
                      {course.faculty || 'General'}
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
                  <div className="h-12 w-12 text-gray-400 mx-auto mb-4"></div>
                  <p className="text-gray-500">No courses yet</p>
                  <button className="btn-primary mt-2">
                    Add Your First Course
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card mt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="flex flex-col items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors duration-200">
              <div className="h-8 w-8 text-blue-600 mb-2"></div>
              <span className="font-medium text-blue-900">Add Course</span>
              <span className="text-sm text-blue-700 mt-1">Create new program</span>
            </button>
            <button className="flex flex-col items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors duration-200">
              <div className="h-8 w-8 text-green-600 mb-2"></div>
              <span className="font-medium text-green-900">Review Applications</span>
              <span className="text-sm text-green-700 mt-1">Manage applications</span>
            </button>
            <button className="flex flex-col items-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors duration-200">
              <div className="h-8 w-8 text-purple-600 mb-2"></div>
              <span className="font-medium text-purple-900">Publish Admissions</span>
              <span className="text-sm text-purple-700 mt-1">Release results</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default InstitutionDashboard