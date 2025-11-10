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

  const StatCard = ({ title, value, change }) => (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200">
      <div className="flex flex-col">
        <p className="text-gray-600 text-sm font-medium mb-2">{title}</p>
        <p className="text-3xl font-bold text-gray-900 mb-2">
          {loading ? '...' : value}
        </p>
        {change && (
          <p className={`text-sm font-medium ${change > 0 ? 'text-green-600' : 'text-red-600'}`}>
            {change > 0 ? '+' : ''}{change}% from last month
          </p>
        )}
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            {/* Header Skeleton */}
            <div className="h-8 bg-gray-300 rounded mb-2 w-1/3"></div>
            <div className="h-4 bg-gray-300 rounded w-1/2 mb-8"></div>
            
            {/* Stats Grid Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-300 rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">Welcome to the Career Guidance Platform administration panel</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Users"
            value={stats.totalUsers}
            change={12}
          />
          <StatCard
            title="Institutions"
            value={stats.totalInstitutions}
            change={8}
          />
          <StatCard
            title="Companies"
            value={stats.totalCompanies}
            change={15}
          />
          <StatCard
            title="Applications"
            value={stats.totalApplications}
            change={23}
          />
        </div>

        {/* Pending Approvals */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Pending Institutions */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Pending Institutions</h3>
              <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
                {stats.pendingInstitutions} pending
              </span>
            </div>
            <div className="flex flex-col gap-4">
              {stats.pendingInstitutions > 0 ? (
                <p className="text-gray-600">{stats.pendingInstitutions} institutions awaiting approval</p>
              ) : (
                <p className="text-gray-600">No pending institution approvals</p>
              )}
              <button 
                className="bg-gray-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-700 transition-colors duration-200 self-start"
                onClick={handleManageInstitutions}
              >
                Manage Institutions
              </button>
            </div>
          </div>

          {/* Pending Companies */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Pending Companies</h3>
              <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
                {stats.pendingCompanies} pending
              </span>
            </div>
            <div className="flex flex-col gap-4">
              {stats.pendingCompanies > 0 ? (
                <p className="text-gray-600">{stats.pendingCompanies} companies awaiting approval</p>
              ) : (
                <p className="text-gray-600">No pending company approvals</p>
              )}
              <button 
                className="bg-gray-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-700 transition-colors duration-200 self-start"
                onClick={handleManageCompanies}
              >
                Manage Companies
              </button>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-4">
            {recentActivities.length > 0 ? (
              recentActivities.map(activity => (
                <div key={activity.id} className="p-4 rounded-lg bg-gray-50 border border-gray-200">
                  <div className="flex items-start gap-4">
                    <div className="flex-1">
                      <p className="text-gray-900 font-medium mb-1">{activity.message}</p>
                      <p className="text-gray-500 text-sm">
                        {activity.timestamp.toLocaleDateString()} at {activity.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-600 text-center py-8">No recent activities</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard