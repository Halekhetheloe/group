import React, { useEffect } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const ProtectedRoute = ({ children, allowedRoles = null, requiredRole = null }) => {
  const { user, userData, loading, refreshUserData } = useAuth()
  const location = useLocation()

  // Force refresh user data when component mounts
  useEffect(() => {
    if (user && !userData) {
      console.log('🔄 ProtectedRoute: User exists but no userData, refreshing...')
      refreshUserData?.()
    }
  }, [user, userData, refreshUserData])

  // Add debug logging
  console.log('🔐 ProtectedRoute Debug:')
  console.log(' - User:', user?.email)
  console.log(' - UserData:', userData)
  console.log(' - Loading:', loading)
  console.log(' - Path:', location.pathname)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // If no user, redirect to login
  if (!user) {
    console.log('🚫 No user, redirecting to login')
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // If user exists but no userData, wait for it to load
  if (user && !userData) {
    console.log('⏳ User exists but userData is null, waiting...')
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your profile...</p>
          <p className="text-sm text-gray-500 mt-2">User: {user.email}</p>
        </div>
      </div>
    )
  }

  if (!user.emailVerified) {
    return <Navigate to="/verify-email" replace />
  }

  // Handle both allowedRoles (array) and requiredRole (string) for backward compatibility
  const role = requiredRole || allowedRoles
  if (role) {
    const allowedRolesArray = Array.isArray(role) ? role : [role]
    if (!allowedRolesArray.includes(userData?.role)) {
      console.log('🚫 Role not allowed. Required:', allowedRolesArray, 'Current:', userData?.role)
      return <Navigate to="/unauthorized" replace />
    }
  }

  // Enhanced status checking - check for suspended first
  const getUserStatus = () => {
    const status = userData?.status || 'active'
    console.log('📊 User status check:', status)
    return status
  }

  const userStatus = getUserStatus()

  // Check suspended status first (highest priority)
  if (userStatus === 'suspended') {
    console.log('🚫 User is suspended, redirecting to suspended page')
    return <Navigate to="/suspended" replace />
  }

  // Enhanced approval check
  const isApproved = () => {
    // Students and admins are always considered approved
    if (['student', 'admin'].includes(userData?.role)) {
      return true
    }
    
    // Check multiple possible approval fields
    const approved = 
      userData?.status === 'approved' || 
      userData?.isApproved === true || 
      userData?.approvalStatus === 'approved'
    
    console.log('✅ Approval check result:', approved, 'for role:', userData?.role)
    return approved
  }

  // Check if user needs approval (company/institution roles)
  if (['company', 'institution'].includes(userData?.role) && !isApproved()) {
    console.log('🚫 Redirecting to pending approval - Role:', userData?.role, 'Approved:', isApproved(), 'Status:', userStatus)
    return <Navigate to="/pending-approval" replace />
  }

  console.log('✅ Access granted to role:', userData?.role, 'Status:', userStatus)
  return children
}

export default ProtectedRoute