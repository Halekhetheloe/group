import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

function ProfileRedirect() {
  const { user, userData } = useAuth()
  
  console.log('🔍 ProfileRedirect Debug:');
  console.log('User:', user);
  console.log('UserData:', userData);
  console.log('User Role from user:', user?.role);
  console.log('User Role from userData:', userData?.role);
  
  // If no user at all, go to login
  if (!user) {
    console.log('❌ No user, redirecting to login');
    return <Navigate to="/login" replace />
  }
  
  // Use userData.role if available, fallback to user.role
  const userRole = userData?.role || user?.role;
  
  console.log('🎯 Final user role:', userRole);
  
  switch (userRole) {
    case 'student':
      console.log('➡️ Redirecting to student profile');
      return <Navigate to="/student/profile" replace />
    case 'institution':
      console.log('➡️ Redirecting to institution profile');
      return <Navigate to="/institution/profile" replace />
    case 'company':
      console.log('➡️ Redirecting to company profile');
      return <Navigate to="/company/profile" replace />
    case 'admin':
      console.log('➡️ Redirecting to admin profile');
      return <Navigate to="/admin/profile" replace />
    default:
      console.log('➡️ No valid role, redirecting to dashboard');
      return <Navigate to="/dashboard" replace />
  }
}

export default ProfileRedirect