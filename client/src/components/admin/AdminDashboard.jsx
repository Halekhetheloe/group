import React, { useState, useEffect } from 'react'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { db } from '../../firebase-config'

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

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      
      // Fetch all users count by role
      const usersQuery = query(collection(db, 'users'))
      const usersSnapshot = await getDocs(usersQuery)
      const users = usersSnapshot.docs.map(doc => doc.data())
      
      // Fetch institutions
      const institutionsQuery = query(collection(db, 'institutions'))
      const institutionsSnapshot = await getDocs(institutionsQuery)
      const institutions = institutionsSnapshot.docs.map(doc => doc.data())
      
      // Fetch companies
      const companiesQuery = query(collection(db, 'companies'))
      const companiesSnapshot = await getDocs(companiesQuery)
      const companies = companiesSnapshot.docs.map(doc => doc.data())
      
      // Fetch applications
      const applicationsQuery = query(collection(db, 'applications'))
      const applicationsSnapshot = await getDocs(applicationsQuery)
      const applications = applicationsSnapshot.docs.map(doc => doc.data())

      setStats({
        totalUsers: users.length,
        totalInstitutions: institutions.length,
        totalCompanies: companies.length,
        totalApplications: applications.length,
        pendingInstitutions: institutions.filter(inst => inst.status === 'pending').length,
        pendingCompanies: companies.filter(comp => comp.status === 'pending').length
      })

      // Mock recent activities (in real app, you'd fetch from an activities collection)
      setRecentActivities([
        { id: 1, type: 'user_registered', message: 'New student registered: John Doe', timestamp: new Date(), user: 'John Doe' },
        { id: 2, type: 'institution_pending', message: 'New institution awaiting approval: LIMKOKWING', timestamp: new Date(), user: 'LIMKOKWING' },
        { id: 3, type: 'application_submitted', message: 'New course application submitted', timestamp: new Date(), user: 'Jane Smith' },
        { id: 4, type: 'company_approved', message: 'Company approved: Tech Solutions Ltd', timestamp: new Date(), user: 'Tech Solutions Ltd' }
      ])

    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const StatCard = ({ title, value, color, change }) => (
    <div className="card">
      <div className="flex items-center">
        <div className={`p-3 rounded-lg ${color} mr-4`}>
          <div className="h-6 w-6 text-white"></div>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{loading ? '...' : value}</p>
          {change && (
            <p className={`text-sm ${change > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {change > 0 ? '+' : ''}{change}% from last month
            </p>
          )}
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
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">Welcome to the Career Guidance Platform administration panel</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Users"
            value={stats.totalUsers}
            color="bg-blue-500"
            change={12}
          />
          <StatCard
            title="Institutions"
            value={stats.totalInstitutions}
            color="bg-green-500"
            change={8}
          />
          <StatCard
            title="Companies"
            value={stats.totalCompanies}
            color="bg-purple-500"
            change={15}
          />
          <StatCard
            title="Applications"
            value={stats.totalApplications}
            color="bg-orange-500"
            change={23}
          />
        </div>

        {/* Pending Approvals */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Pending Institutions */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Pending Institutions</h3>
              <span className="bg-yellow-100 text-yellow-800 text-sm font-medium px-2.5 py-0.5 rounded">
                {stats.pendingInstitutions} pending
              </span>
            </div>
            <div className="space-y-3">
              {stats.pendingInstitutions > 0 ? (
                <p className="text-gray-600">{stats.pendingInstitutions} institutions awaiting approval</p>
              ) : (
                <p className="text-gray-500 text-sm">No pending institution approvals</p>
              )}
              <button className="btn-primary text-sm">
                Manage Institutions
              </button>
            </div>
          </div>

          {/* Pending Companies */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Pending Companies</h3>
              <span className="bg-yellow-100 text-yellow-800 text-sm font-medium px-2.5 py-0.5 rounded">
                {stats.pendingCompanies} pending
              </span>
            </div>
            <div className="space-y-3">
              {stats.pendingCompanies > 0 ? (
                <p className="text-gray-600">{stats.pendingCompanies} companies awaiting approval</p>
              ) : (
                <p className="text-gray-500 text-sm">No pending company approvals</p>
              )}
              <button className="btn-primary text-sm">
                Manage Companies
              </button>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {recentActivities.map(activity => (
              <div key={activity.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-full ${
                    activity.type.includes('user') ? 'bg-blue-100 text-blue-600' :
                    activity.type.includes('institution') ? 'bg-green-100 text-green-600' :
                    activity.type.includes('company') ? 'bg-purple-100 text-purple-600' :
                    'bg-orange-100 text-orange-600'
                  }`}>
                    <div className="h-4 w-4"></div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{activity.message}</p>
                    <p className="text-xs text-gray-500">
                      {activity.timestamp.toLocaleDateString()} at {activity.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard