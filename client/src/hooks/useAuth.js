// client/src/hooks/useAuth.js
import { useContext } from 'react'
import AuthContext from '../context/AuthContext'

export const useAuth = () => {
  const context = useContext(AuthContext)
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  
  return context
}

// Additional auth-related hooks
export const useAuthGuard = (requiredRole = null) => {
  const { user, userData, loading } = useAuth()
  
  const isAuthenticated = !!user
  const isVerified = user?.emailVerified
  
  // Enhanced approval check for company/institution roles
  const isApproved = () => {
    if (!userData) return false
    
    // For students and admins, no approval needed
    if (['student', 'admin'].includes(userData?.role)) {
      return true
    }
    
    // For company and institution, check multiple possible approval fields
    const approvalStatus = 
      userData?.status === 'approved' || 
      userData?.isApproved === true || 
      userData?.approvalStatus === 'approved'
    
    return approvalStatus
  }
  
  const hasRole = requiredRole ? userData?.role === requiredRole : true
  const isAuthorized = isAuthenticated && isVerified && hasRole && isApproved()
  const needsApproval = isAuthenticated && !isApproved() && ['company', 'institution'].includes(userData?.role)
  
  return {
    isAuthenticated,
    isVerified,
    hasRole,
    isAuthorized,
    needsApproval,
    isApproved: isApproved(),
    loading,
    user,
    userData
  }
}

export const useRoleAccess = () => {
  const { userData } = useAuth()
  
  const isStudent = userData?.role === 'student'
  const isInstitution = userData?.role === 'institution'
  const isCompany = userData?.role === 'company'
  const isAdmin = userData?.role === 'admin'
  
  // Approval status check
  const isApproved = () => {
    if (!userData) return false
    if (['student', 'admin'].includes(userData?.role)) return true
    
    return userData?.status === 'approved' || 
           userData?.isApproved === true || 
           userData?.approvalStatus === 'approved'
  }
  
  return {
    isStudent,
    isInstitution,
    isCompany,
    isAdmin,
    isApproved: isApproved(),
    currentRole: userData?.role,
    needsApproval: !isApproved() && ['company', 'institution'].includes(userData?.role)
  }
}

// New hook specifically for approval status
export const useApprovalStatus = () => {
  const { userData } = useAuth()
  
  const getApprovalStatus = () => {
    if (!userData) return 'unknown'
    
    // Check multiple possible approval fields
    if (userData?.status === 'approved' || 
        userData?.isApproved === true || 
        userData?.approvalStatus === 'approved') {
      return 'approved'
    }
    
    if (userData?.status === 'rejected' || 
        userData?.approvalStatus === 'rejected') {
      return 'rejected'
    }
    
    if (userData?.status === 'pending' || 
        userData?.approvalStatus === 'pending' || 
        userData?.status === undefined) {
      return 'pending'
    }
    
    return 'unknown'
  }
  
  return {
    approvalStatus: getApprovalStatus(),
    isApproved: getApprovalStatus() === 'approved',
    isPending: getApprovalStatus() === 'pending',
    isRejected: getApprovalStatus() === 'rejected'
  }
}