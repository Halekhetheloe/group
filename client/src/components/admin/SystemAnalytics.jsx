import React, { useState, useEffect } from 'react'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { db } from '../../firebase-config'
import { BarChart3, PieChart, TrendingUp, Users, BookOpen, Briefcase, Calendar } from 'lucide-react'

const SystemAnalytics = () => {
  const [analytics, setAnalytics] = useState({
    userDistribution: {},
    applicationTrends: {},
    popularCourses: [],
    jobPostingStats: {}
  })
  const [timeFrame, setTimeFrame] = useState('month')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAnalyticsData()
  }, [timeFrame])

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true)
      
      // Fetch all data for analytics
      const [usersSnapshot, applicationsSnapshot, coursesSnapshot, jobsSnapshot] = await Promise.all([
        getDocs(collection(db, 'users')),
        getDocs(collection(db, 'applications')),
        getDocs(collection(db, 'courses')),
        getDocs(collection(db, 'jobs'))
      ])

      const users = usersSnapshot.docs.map(doc => doc.data())
      const applications = applicationsSnapshot.docs.map(doc => doc.data())
      const courses = coursesSnapshot.docs.map(doc => doc.data())
      const jobs = jobsSnapshot.docs.map(doc => doc.data())

      setAnalytics({
        userDistribution: calculateUserDistribution(users),
        applicationTrends: calculateApplicationTrends(applications),
        popularCourses: calculatePopularCourses(courses, applications),
        jobPostingStats: calculateJobPostingStats(jobs)
      })

    } catch (error) {
      console.error('Error fetching analytics data:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateUserDistribution = (users) => {
    const roles = {
      student: users.filter(u => u.role === 'student').length,
      institution: users.filter(u => u.role === 'institution').length,
      company: users.filter(u => u.role === 'company').length,
      admin: users.filter(u => u.role === 'admin').length
    }
    
    return {
      ...roles,
      total: users.length
    }
  }

  const calculateApplicationTrends = (applications) => {
    const statusCounts = {
      pending: applications.filter(app => app.status === 'pending').length,
      approved: applications.filter(app => app.status === 'approved').length,
      rejected: applications.filter(app => app.status === 'rejected').length
    }
    
    return {
      ...statusCounts,
      total: applications.length,
      approvalRate: applications.length > 0 ? 
        ((statusCounts.approved / applications.length) * 100).toFixed(1) : 0
    }
  }

  const calculatePopularCourses = (courses, applications) => {
    // Count applications per course
    const courseApplications = {}
    applications.forEach(app => {
      courseApplications[app.courseId] = (courseApplications[app.courseId] || 0) + 1
    })
    
    // Map to course names and sort by popularity
    return courses
      .map(course => ({
        name: course.name,
        applications: courseApplications[course.id] || 0,
        institution: course.institutionName
      }))
      .sort((a, b) => b.applications - a.applications)
      .slice(0, 5) // Top 5
  }

  const calculateJobPostingStats = (jobs) => {
    const activeJobs = jobs.filter(job => job.status === 'active').length
    const closedJobs = jobs.filter(job => job.status === 'closed').length
    const totalApplications = jobs.reduce((sum, job) => sum + (job.applicationCount || 0), 0)
    
    return {
      active: activeJobs,
      closed: closedJobs,
      total: jobs.length,
      totalApplications,
      avgApplications: jobs.length > 0 ? (totalApplications / jobs.length).toFixed(1) : 0
    }
  }

  const MetricCard = ({ title, value, description, icon: Icon, color }) => (
    <div className="card">
      <div className="flex items-center">
        <div className={`p-3 rounded-lg ${color} mr-4`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          {description && <p className="text-xs text-gray-500 mt-1">{description}</p>}
        </div>
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
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
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">System Analytics</h1>
            <p className="text-gray-600 mt-2">Deep insights into platform performance</p>
          </div>
          <div className="mt-4 md:mt-0">
            <select
              value={timeFrame}
              onChange={(e) => setTimeFrame(e.target.value)}
              className="input-field"
            >
              <option value="week">Last 7 days</option>
              <option value="month">Last 30 days</option>
              <option value="quarter">Last 90 days</option>
              <option value="year">Last year</option>
            </select>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="Total Users"
            value={analytics.userDistribution.total}
            description="All platform users"
            icon={Users}
            color="bg-blue-500"
          />
          <MetricCard
            title="Applications"
            value={analytics.applicationTrends.total}
            description={`${analytics.applicationTrends.approvalRate}% approval rate`}
            icon={BookOpen}
            color="bg-green-500"
          />
          <MetricCard
            title="Active Jobs"
            value={analytics.jobPostingStats.active}
            description={`${analytics.jobPostingStats.avgApplications} avg applications`}
            icon={Briefcase}
            color="bg-purple-500"
          />
          <MetricCard
            title="Popular Courses"
            value={analytics.popularCourses.length}
            description="Top courses by applications"
            icon={TrendingUp}
            color="bg-orange-500"
          />
        </div>

        {/* Analytics Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* User Distribution */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">User Distribution</h3>
            <div className="space-y-3">
              {Object.entries(analytics.userDistribution)
                .filter(([key]) => key !== 'total')
                .map(([role, count]) => (
                  <div key={role} className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600 capitalize">{role}s</span>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold">{count}</span>
                      <span className="text-xs text-gray-500">
                        ({((count / analytics.userDistribution.total) * 100).toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                ))
              }
            </div>
          </div>

          {/* Application Trends */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Application Trends</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Pending</span>
                <span className="font-bold text-yellow-600">{analytics.applicationTrends.pending}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Approved</span>
                <span className="font-bold text-green-600">{analytics.applicationTrends.approved}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Rejected</span>
                <span className="font-bold text-red-600">{analytics.applicationTrends.rejected}</span>
              </div>
              <div className="pt-3 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">Approval Rate</span>
                  <span className="font-bold text-blue-600">{analytics.applicationTrends.approvalRate}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Popular Courses */}
        <div className="card mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Most Popular Courses</h3>
          <div className="space-y-4">
            {analytics.popularCourses.map((course, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{course.name}</p>
                  <p className="text-sm text-gray-600">{course.institution}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-blue-600">{course.applications} applications</p>
                </div>
              </div>
            ))}
            {analytics.popularCourses.length === 0 && (
              <p className="text-center text-gray-500 py-4">No course application data available</p>
            )}
          </div>
        </div>

        {/* Job Posting Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card text-center">
            <Briefcase className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">{analytics.jobPostingStats.total}</p>
            <p className="text-sm text-gray-600">Total Jobs Posted</p>
          </div>
          <div className="card text-center">
            <Users className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">{analytics.jobPostingStats.totalApplications}</p>
            <p className="text-sm text-gray-600">Total Applications</p>
          </div>
          <div className="card text-center">
            <BarChart3 className="h-8 w-8 text-purple-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">{analytics.jobPostingStats.avgApplications}</p>
            <p className="text-sm text-gray-600">Avg Applications per Job</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SystemAnalytics