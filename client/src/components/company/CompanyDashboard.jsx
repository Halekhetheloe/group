import React, { useState, useEffect } from 'react'
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore'
import { db } from '../../firebase-config'
import { useAuth } from '../../hooks/useAuth'
import { useNavigate } from 'react-router-dom'

const CompanyDashboard = () => {
  const { userData } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState({
    totalJobs: 0,
    activeJobs: 0,
    totalApplications: 0,
    pendingApplications: 0
  })
  const [recentJobs, setRecentJobs] = useState([])
  const [recentApplications, setRecentApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [indexError, setIndexError] = useState('')

  useEffect(() => {
    if (userData) {
      fetchDashboardData()
    }
  }, [userData])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      setIndexError('')
      
      const companyId = userData.uid

      // Fetch company's jobs with fallback for index errors
      let jobs = []
      try {
        // Try the indexed query first
        const jobsQuery = query(
          collection(db, 'jobs'),
          where('companyId', '==', companyId),
          orderBy('createdAt', 'desc')
        )
        const jobsSnapshot = await getDocs(jobsQuery)
        jobs = jobsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
      } catch (jobsError) {
        console.warn('Jobs query failed, using fallback:', jobsError)
        setIndexError('Some dashboard features may be limited until indexes are built.')
        
        // Fallback: Get all jobs and filter manually
        const allJobsQuery = query(collection(db, 'jobs'))
        const allJobsSnapshot = await getDocs(allJobsQuery)
        jobs = allJobsSnapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(job => job.companyId === companyId)
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      }

      // Fetch applications with fallback
      let allApplications = []
      const jobIds = jobs.map(job => job.id)
      
      if (jobIds.length > 0) {
        try {
          // Try to get applications for specific jobs (this might need an index)
          const applicationsQuery = query(
            collection(db, 'jobApplications'),
            where('jobId', 'in', jobIds.slice(0, 10)), // Firestore 'in' query limit is 10
            orderBy('appliedAt', 'desc'),
            limit(10)
          )
          const applicationsSnapshot = await getDocs(applicationsQuery)
          allApplications = applicationsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }))
        } catch (appsError) {
          console.warn('Applications query failed, using fallback:', appsError)
          
          // Fallback: Get all applications and filter manually
          const allAppsQuery = query(collection(db, 'jobApplications'))
          const allAppsSnapshot = await getDocs(allAppsQuery)
          allApplications = allAppsSnapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .filter(app => jobIds.includes(app.jobId))
            .sort((a, b) => new Date(b.appliedAt) - new Date(a.appliedAt))
            .slice(0, 10)
        }
      }

      // Calculate stats
      const activeJobs = jobs.filter(job => job.status === 'active').length
      const pendingApplications = allApplications.filter(app => app.status === 'pending').length

      setStats({
        totalJobs: jobs.length,
        activeJobs,
        totalApplications: allApplications.length,
        pendingApplications
      })

      // Set recent jobs and applications
      setRecentJobs(jobs.slice(0, 5))
      setRecentApplications(allApplications.slice(0, 5))

    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      setIndexError('Failed to load some dashboard data. Please try refreshing.')
    } finally {
      setLoading(false)
    }
  }

  // CSS Styles
  const styles = {
    container: "min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6",
    headerContainer: "max-w-7xl mx-auto",
    header: "text-4xl font-bold text-gray-900 mb-3",
    subtitle: "text-lg text-gray-700 mb-8",
    
    // Card Styles
    card: "bg-white rounded-2xl shadow-lg border border-gray-200/60 p-6 hover:shadow-xl transition-all duration-300",
    statCard: "bg-gradient-to-br from-white to-blue-50 rounded-2xl shadow-lg border border-blue-200/50 p-6 hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:scale-105",
    
    // Grid Styles
    grid: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8",
    twoColGrid: "grid grid-cols-1 lg:grid-cols-2 gap-6",
    
    // Text Styles
    statNumber: "text-3xl font-bold text-gray-900 mb-2",
    statLabel: "text-sm font-semibold text-gray-600 uppercase tracking-wide",
    statSubtitle: "text-sm text-gray-500 mt-1",
    sectionTitle: "text-xl font-bold text-gray-900 mb-4",
    
    // Button Styles
    btnPrimary: "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-4 py-2 rounded-xl font-semibold shadow-sm hover:shadow-md transition-all duration-200",
    btnText: "text-blue-600 hover:text-blue-700 text-sm font-medium",
    
    // Error Styles
    errorBanner: "bg-yellow-50 border border-yellow-200 rounded-2xl p-4 mb-6",
    errorText: "text-yellow-700 font-medium",
    
    // Quick Action Styles
    quickAction: "flex flex-col items-center p-6 bg-gradient-to-br from-white to-blue-50 rounded-2xl shadow-lg border border-blue-200/50 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer",
    quickActionTitle: "font-semibold text-blue-900 text-center",
    quickActionSubtitle: "text-sm text-blue-700 mt-1 text-center"
  }

  const StatCard = ({ title, value, subtitle, onClick }) => (
    <div 
      className={styles.statCard}
      onClick={onClick}
    >
      <div>
        <p className={styles.statNumber}>{value}</p>
        <p className={styles.statLabel}>{title}</p>
        {subtitle && <p className={styles.statSubtitle}>{subtitle}</p>}
      </div>
    </div>
  )

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A'
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.headerContainer}>
          <div className="animate-pulse">
            <div className="h-10 bg-gray-300 rounded-xl w-1/4 mb-6"></div>
            <div className={styles.grid}>
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-300 rounded-2xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.headerContainer}>
        {/* Header */}
        <div className="mb-8">
          <h1 className={styles.header}>Company Dashboard</h1>
          <p className={styles.subtitle}>
            Welcome back, {userData?.companyName || userData?.displayName}
          </p>
        </div>

        {/* Index Error Banner */}
        {indexError && (
          <div className={styles.errorBanner}>
            <p className={styles.errorText}>
              {indexError}
            </p>
            <p className="text-yellow-600 text-sm mt-1">
              This is normal during initial setup. Data will load faster once indexes are built.
            </p>
          </div>
        )}

        {/* Stats Grid */}
        <div className={styles.grid}>
          <StatCard
            title="Total Jobs"
            value={stats.totalJobs}
            subtitle={`${stats.activeJobs} active`}
            onClick={() => navigate('/company/jobs')}
          />
          <StatCard
            title="Applications"
            value={stats.totalApplications}
            subtitle={`${stats.pendingApplications} pending`}
            onClick={() => navigate('/company/applicants')}
          />
          <StatCard
            title="Active Jobs"
            value={stats.activeJobs}
            subtitle="Currently posted"
            onClick={() => navigate('/company/jobs')}
          />
          <StatCard
            title="Profile Views"
            value="0"
            subtitle="This month"
          />
        </div>

        <div className={styles.twoColGrid}>
          {/* Recent Jobs */}
          <div className={styles.card}>
            <div className="flex items-center justify-between mb-6">
              <h3 className={styles.sectionTitle}>
                Recent Job Postings
              </h3>
              <button 
                className={styles.btnText}
                onClick={() => navigate('/company/jobs')}
              >
                View All
              </button>
            </div>
            <div className="space-y-4">
              {recentJobs.map(job => (
                <div key={job.id} className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl border border-gray-200/50 hover:border-blue-200 transition-all duration-200">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">{job.title}</h4>
                    <div className="flex items-center text-sm text-gray-600 mt-2">
                      {job.location || 'Remote'}
                      <span className="mx-3 text-gray-300">•</span>
                      {formatDate(job.createdAt)}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      job.status === 'active' 
                        ? 'bg-green-100 text-green-800 border border-green-200'
                        : 'bg-gray-100 text-gray-800 border border-gray-200'
                    }`}>
                      {job.status}
                    </span>
                    <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-semibold border border-blue-200">
                      {job.applicationCount || 0} apps
                    </span>
                  </div>
                </div>
              ))}
              {recentJobs.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-500 text-lg font-medium">No jobs posted yet</p>
                  <p className="text-gray-400 mt-2 mb-4">Start hiring by posting your first job</p>
                  <button 
                    className={styles.btnPrimary}
                    onClick={() => navigate('/company/post-job')}
                  >
                    Post Your First Job
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Recent Applications */}
          <div className={styles.card}>
            <div className="flex items-center justify-between mb-6">
              <h3 className={styles.sectionTitle}>
                Recent Applications
              </h3>
              <button 
                className={styles.btnText}
                onClick={() => navigate('/company/applicants')}
              >
                View All
              </button>
            </div>
            <div className="space-y-4">
              {recentApplications.map(application => (
                <div key={application.id} className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-green-50 rounded-xl border border-gray-200/50 hover:border-green-200 transition-all duration-200">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">
                      {application.applicantName || `Applicant #${application.id.slice(-6)}`}
                    </h4>
                    <div className="text-sm text-gray-600 mt-2">
                      Applied {formatDate(application.appliedAt)}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      application.status === 'pending' 
                        ? 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                        : application.status === 'accepted'
                        ? 'bg-green-100 text-green-800 border border-green-200'
                        : 'bg-red-100 text-red-800 border border-red-200'
                    }`}>
                      {application.status}
                    </span>
                  </div>
                </div>
              ))}
              {recentApplications.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-500 text-lg font-medium">No applications yet</p>
                  <p className="text-gray-400 mt-2">
                    Applications will appear here when candidates apply to your jobs
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className={styles.card}>
          <h3 className={styles.sectionTitle}>
            Quick Actions
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div 
              className={styles.quickAction}
              onClick={() => navigate('/company/post-job')}
            >
              <span className={styles.quickActionTitle}>Post New Job</span>
              <span className={styles.quickActionSubtitle}>Create job listing</span>
            </div>
            <div 
              className={styles.quickAction}
              onClick={() => navigate('/company/applicants')}
            >
              <span className={styles.quickActionTitle}>View Applicants</span>
              <span className={styles.quickActionSubtitle}>Manage applications</span>
            </div>
            <div 
              className={styles.quickAction}
              onClick={() => navigate('/company/profile')}
            >
              <span className={styles.quickActionTitle}>Company Profile</span>
              <span className={styles.quickActionSubtitle}>Update information</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CompanyDashboard