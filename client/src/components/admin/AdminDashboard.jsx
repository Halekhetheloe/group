import React, { useState, useEffect } from 'react'
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore'
import { db } from '../../firebase-config'
import { useNavigate } from 'react-router-dom'

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalInstitutions: 0,
    totalCompanies: 0,
    totalApplications: 0,
    pendingInstitutions: 0,
    pendingCompanies: 0
  })
  const [recentActivities, setRecentActivities] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      
      // Fetch all users count by role
      const usersQuery = query(collection(db, 'users'))
      const usersSnapshot = await getDocs(usersQuery)
      const users = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      
      // Fetch institutions
      const institutionsQuery = query(collection(db, 'institutions'))
      const institutionsSnapshot = await getDocs(institutionsQuery)
      const institutions = institutionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      
      // Fetch companies
      const companiesQuery = query(collection(db, 'companies'))
      const companiesSnapshot = await getDocs(companiesQuery)
      const companies = companiesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      
      // Fetch applications
      const applicationsQuery = query(collection(db, 'applications'))
      const applicationsSnapshot = await getDocs(applicationsQuery)
      const applications = applicationsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))

      // Fetch recent activities from actual data
      await fetchRecentActivities(users, institutions, companies)

      setStats({
        totalUsers: users.length,
        totalInstitutions: institutions.length,
        totalCompanies: companies.length,
        totalApplications: applications.length,
        pendingInstitutions: institutions.filter(inst => inst.status === 'pending').length,
        pendingCompanies: companies.filter(comp => comp.status === 'pending').length
      })

    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchRecentActivities = async (users, institutions, companies) => {
    try {
      const activities = []

      // Get recent users (last 5)
      const recentUsers = users
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5)

      recentUsers.forEach(user => {
        activities.push({
          id: user.id,
          message: `New user registration: ${user.name || user.email}`,
          type: 'user_registered',
          timestamp: user.createdAt ? new Date(user.createdAt.seconds * 1000) : new Date()
        })
      })

      // Get pending institutions
      const pendingInstitutions = institutions
        .filter(inst => inst.status === 'pending')
        .slice(0, 3)

      pendingInstitutions.forEach(inst => {
        activities.push({
          id: inst.id,
          message: `Institution "${inst.name}" submitted for approval`,
          type: 'institution_pending',
          timestamp: inst.createdAt ? new Date(inst.createdAt.seconds * 1000) : new Date()
        })
      })

      // Get recently approved companies
      const recentCompanies = companies
        .filter(comp => comp.status === 'approved')
        .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))
        .slice(0, 2)

      recentCompanies.forEach(company => {
        activities.push({
          id: company.id,
          message: `Company "${company.name}" approved`,
          type: 'company_approved',
          timestamp: company.updatedAt ? new Date(company.updatedAt.seconds * 1000) : 
                    company.createdAt ? new Date(company.createdAt.seconds * 1000) : new Date()
        })
      })

      // Sort all activities by timestamp and take top 10
      const sortedActivities = activities
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 10)

      setRecentActivities(sortedActivities)

    } catch (error) {
      console.error('Error fetching recent activities:', error)
      setRecentActivities([])
    }
  }

  const handleManageInstitutions = () => {
    navigate('/admin/institutions')
  }

  const handleManageCompanies = () => {
    navigate('/admin/companies')
  }

  const StatCard = ({ title, value, color, change }) => (
    <div className="stat-card">
      <div className="flex items-center">
        <div className={`color-indicator ${color} mr-4`}></div>
        <div>
          <p className="stat-title">{title}</p>
          <p className="stat-value">{loading ? '...' : value}</p>
          {change && (
            <p className={`stat-change ${change > 0 ? 'positive' : 'negative'}`}>
              {change > 0 ? '+' : ''}{change}% from last month
            </p>
          )}
        </div>
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className="admin-dashboard">
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
    <div className="admin-dashboard">
      <div className="dashboard-container">
        {/* Header */}
        <div className="dashboard-header">
          <h1 className="dashboard-title">Admin Dashboard</h1>
          <p className="dashboard-subtitle">Welcome to the Career Guidance Platform administration panel</p>
        </div>

        {/* Stats Grid */}
        <div className="stats-grid">
          <StatCard
            title="Total Users"
            value={stats.totalUsers}
            color="bg-blue"
            change={12}
          />
          <StatCard
            title="Institutions"
            value={stats.totalInstitutions}
            color="bg-green"
            change={8}
          />
          <StatCard
            title="Companies"
            value={stats.totalCompanies}
            color="bg-purple"
            change={15}
          />
          <StatCard
            title="Applications"
            value={stats.totalApplications}
            color="bg-orange"
            change={23}
          />
        </div>

        {/* Pending Approvals */}
        <div className="approvals-grid">
          {/* Pending Institutions */}
          <div className="approval-card">
            <div className="approval-header">
              <h3 className="approval-title">Pending Institutions</h3>
              <span className="pending-badge">
                {stats.pendingInstitutions} pending
              </span>
            </div>
            <div className="approval-content">
              {stats.pendingInstitutions > 0 ? (
                <p className="pending-text">{stats.pendingInstitutions} institutions awaiting approval</p>
              ) : (
                <p className="no-pending">No pending institution approvals</p>
              )}
              <button 
                className="manage-btn"
                onClick={handleManageInstitutions}
              >
                Manage Institutions
              </button>
            </div>
          </div>

          {/* Pending Companies */}
          <div className="approval-card">
            <div className="approval-header">
              <h3 className="approval-title">Pending Companies</h3>
              <span className="pending-badge">
                {stats.pendingCompanies} pending
              </span>
            </div>
            <div className="approval-content">
              {stats.pendingCompanies > 0 ? (
                <p className="pending-text">{stats.pendingCompanies} companies awaiting approval</p>
              ) : (
                <p className="no-pending">No pending company approvals</p>
              )}
              <button 
                className="manage-btn"
                onClick={handleManageCompanies}
              >
                Manage Companies
              </button>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="activity-card">
          <h3 className="activity-title">Recent Activity</h3>
          <div className="activity-list">
            {recentActivities.length > 0 ? (
              recentActivities.map(activity => (
                <div key={activity.id} className="activity-item">
                  <div className="activity-content">
                    <div className={`activity-icon ${
                      activity.type.includes('user') ? 'user-activity' :
                      activity.type.includes('institution') ? 'institution-activity' :
                      activity.type.includes('company') ? 'company-activity' :
                      'default-activity'
                    }`}></div>
                    <div className="activity-details">
                      <p className="activity-message">{activity.message}</p>
                      <p className="activity-time">
                        {activity.timestamp.toLocaleDateString()} at {activity.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="no-activities">No recent activities</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard