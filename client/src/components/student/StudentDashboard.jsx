import React, { useState, useEffect } from 'react'
import { collection, query, where, getDocs, orderBy, limit, doc, getDoc } from 'firebase/firestore'
import { db } from '../../firebase-config'
import { useAuth } from '../../hooks/useAuth'

const StudentDashboard = () => {
  const { userData } = useAuth()
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

      // Fetch course details for applications
      const applicationsWithDetails = await Promise.all(
        applications.map(async (app) => {
          try {
            const courseDoc = await getDoc(doc(db, 'courses', app.courseId))
            const courseData = courseDoc.data()
            return {
              ...app,
              course: courseData
            }
          } catch (error) {
            console.error('Error fetching course details:', error)
            return {
              ...app,
              course: { name: 'Course not found' }
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

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
      admitted: { color: 'bg-green-100 text-green-800', label: 'Admitted' },
      rejected: { color: 'bg-red-100 text-red-800', label: 'Rejected' }
    }
    const config = statusConfig[status] || { color: 'bg-gray-100 text-gray-800', label: status }
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    )
  }

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A'
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    return date.toLocaleDateString()
  }

  const isDeadlineApproaching = (deadline) => {
    if (!deadline) return false
    const deadlineDate = deadline.toDate ? deadline.toDate() : new Date(deadline)
    const daysUntilDeadline = Math.ceil((deadlineDate - new Date()) / (1000 * 60 * 60 * 24))
    return daysUntilDeadline <= 7 && daysUntilDeadline >= 0
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

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
              <h3 className="text-lg font-semibold text-red-800 mb-2">Dashboard Loading Issue</h3>
              <p className="text-red-600 mb-4">{error}</p>
              <p className="text-sm text-red-500 mb-4">
                This is usually temporary while Firestore indexes are building. Please wait a few minutes and refresh.
              </p>
              <button 
                onClick={fetchDashboardData}
                className="btn-primary"
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Student Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Welcome back, {userData?.displayName || 'Student'}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Applications"
            value={stats.totalApplications}
            subtitle={`${stats.pendingApplications} pending`}
            color="bg-blue-500"
          />
          <StatCard
            title="Admissions"
            value={stats.admittedApplications}
            subtitle="Accepted offers"
            color="bg-green-500"
          />
          <StatCard
            title="Saved Jobs"
            value={stats.savedJobs}
            subtitle="Opportunities"
            color="bg-purple-500"
          />
          <StatCard
            title="Notifications"
            value="0"
            subtitle="Unread"
            color="bg-orange-500"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
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
                    <h4 className="font-medium text-gray-900">{application.course?.name}</h4>
                    <div className="flex items-center text-sm text-gray-600 mt-1">
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
                  <div className="h-12 w-12 text-gray-400 mx-auto mb-4"></div>
                  <p className="text-gray-500">No applications yet</p>
                  <button className="btn-primary mt-2">
                    Browse Courses
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Upcoming Deadlines */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Upcoming Deadlines</h3>
              <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                View All
              </button>
            </div>
            <div className="space-y-4">
              {upcomingDeadlines.map(course => (
                <div key={course.id} className={`p-4 rounded-lg ${
                  isDeadlineApproaching(course.applicationDeadline) 
                    ? 'bg-red-50 border border-red-200' 
                    : 'bg-gray-50'
                }`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium text-gray-900">{course.name}</h4>
                      <p className="text-sm text-gray-600">{course.institutionName}</p>
                    </div>
                    {isDeadlineApproaching(course.applicationDeadline) && (
                      <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-medium">
                        Soon
                      </span>
                    )}
                  </div>
                  <div className="flex items-center text-sm text-gray-600 mt-2">
                    Deadline: {formatDate(course.applicationDeadline)}
                  </div>
                </div>
              ))}
              {upcomingDeadlines.length === 0 && (
                <div className="text-center py-8">
                  <div className="h-12 w-12 text-gray-400 mx-auto mb-4"></div>
                  <p className="text-gray-500">No upcoming deadlines</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recommended Jobs */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Recommended Jobs</h3>
            <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
              View All
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recommendedJobs.map(job => (
              <div key={job.id} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-medium text-gray-900">{job.title}</h4>
                    <p className="text-sm text-gray-600">{job.companyName}</p>
                  </div>
                  <div className="h-5 w-5 text-gray-400"></div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center text-gray-600">
                    {job.jobType}
                  </div>
                  <div className="flex items-center text-gray-600">
                    Deadline: {formatDate(job.deadline)}
                  </div>
                </div>
                <button className="w-full btn-primary mt-3 text-sm">
                  Apply Now
                </button>
              </div>
            ))}
            {recommendedJobs.length === 0 && (
              <div className="col-span-3 text-center py-8">
                <div className="h-12 w-12 text-gray-400 mx-auto mb-4"></div>
                <p className="text-gray-500">No recommended jobs yet</p>
                <p className="text-sm text-gray-400 mt-1">
                  Complete your profile to get better job recommendations
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card mt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <button className="flex flex-col items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors duration-200">
              <div className="h-8 w-8 text-blue-600 mb-2"></div>
              <span className="font-medium text-blue-900">Browse Courses</span>
              <span className="text-sm text-blue-700 mt-1">Find programs</span>
            </button>
            <button className="flex flex-col items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors duration-200">
              <div className="h-8 w-8 text-green-600 mb-2"></div>
              <span className="font-medium text-green-900">My Applications</span>
              <span className="text-sm text-green-700 mt-1">View status</span>
            </button>
            <button className="flex flex-col items-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors duration-200">
              <div className="h-8 w-8 text-purple-600 mb-2"></div>
              <span className="font-medium text-purple-900">Job Search</span>
              <span className="text-sm text-purple-700 mt-1">Find opportunities</span>
            </button>
            <button className="flex flex-col items-center p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors duration-200">
              <div className="h-8 w-8 text-orange-600 mb-2"></div>
              <span className="font-medium text-orange-900">My Profile</span>
              <span className="text-sm text-orange-700 mt-1">Update information</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default StudentDashboard