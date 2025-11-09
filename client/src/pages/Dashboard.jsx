import React from 'react'
import { useAuth } from '../hooks/useAuth'
import { useApp } from '../context/AppContext'
import StudentDashboard from '../components/student/StudentDashboard'
import InstitutionDashboard from '../components/institution/InstitutionDashboard'
import CompanyDashboard from '../components/company/CompanyDashboard'
import AdminDashboard from '../components/admin/AdminDashboard'
import LoadingSpinner from '../components/shared/UI/LoadingSpinner'

const Dashboard = () => {
  const { user, userData, loading: authLoading } = useAuth()
  const { loading: appLoading } = useApp()

  if (authLoading || appLoading) {
    return <LoadingSpinner size="large" text="Loading dashboard..." />
  }

  if (!user || !userData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-600">Please log in to access your dashboard.</p>
        </div>
      </div>
    )
  }

  // Render appropriate dashboard based on user role
  const renderDashboard = () => {
    switch (userData.role) {
      case 'student':
        return <StudentDashboard />
      case 'institution':
        return <InstitutionDashboard />
      case 'company':
        return <CompanyDashboard />
      case 'admin':
        return <AdminDashboard />
      default:
        return (
          <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Invalid User Role</h2>
              <p className="text-gray-600">Please contact administrator for assistance.</p>
            </div>
          </div>
        )
    }
  }

  return renderDashboard()
}

export default Dashboard