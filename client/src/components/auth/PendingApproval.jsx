import React, { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { Building, Clock, Mail, Briefcase, CheckCircle, Loader, LogOut } from 'lucide-react'

const PendingApproval = () => {
  const { user, userData, logout, loading, refreshUserData } = useAuth()
  const navigate = useNavigate()
  const [isActuallyApproved, setIsActuallyApproved] = useState(false)
  const [checkingApproval, setCheckingApproval] = useState(true)
  const [retryCount, setRetryCount] = useState(0)

  // Check if user is actually approved
  useEffect(() => {
    const checkApproval = async () => {
      console.log('🔍 PendingApproval: Checking approval status...')
      console.log(' - User:', user?.email)
      console.log(' - UserData:', userData)
      console.log(' - Loading:', loading)
      console.log(' - Retry count:', retryCount)
      
      if (loading) {
        console.log('⏳ Still loading user data...')
        return
      }

      if (!user) {
        console.log('❌ No user available')
        setCheckingApproval(false)
        navigate('/login')
        return
      }

      if (!userData) {
        console.log('🔄 No userData, attempting to refresh...')
        if (retryCount < 3) {
          try {
            await refreshUserData()
            setRetryCount(prev => prev + 1)
          } catch (error) {
            console.error('Error refreshing user data:', error)
          }
          return
        } else {
          console.log('❌ Max retries reached, user data still not available')
          setCheckingApproval(false)
          return
        }
      }
      
      const approved = 
        userData?.status === 'approved' || 
        userData?.isApproved === true || 
        userData?.approvalStatus === 'approved'
      
      console.log('✅ Approval check result:', approved)
      
      if (approved) {
        console.log('🎉 User is approved, redirecting...')
        setIsActuallyApproved(true)
        setCheckingApproval(false)
        
        // Redirect to appropriate dashboard after a brief delay
        const timer = setTimeout(() => {
          const role = userData?.role || 'student'
          console.log('🚀 Redirecting to dashboard for role:', role)
          switch (role) {
            case 'company':
              navigate('/company/dashboard')
              break
            case 'institution':
              navigate('/institution/dashboard')
              break
            case 'admin':
              navigate('/admin/dashboard')
              break
            case 'student':
              navigate('/student/dashboard')
              break
            default:
              navigate('/dashboard')
          }
        }, 3000)
        return () => clearTimeout(timer)
      } else {
        console.log('⏳ Still pending approval')
        setCheckingApproval(false)
      }
    }

    checkApproval()
  }, [userData, loading, navigate, user, refreshUserData, retryCount])

  // Show loading while checking
  if (loading || checkingApproval) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 text-center">
          <div className="mx-auto h-20 w-20 bg-blue-500 rounded-full flex items-center justify-center">
            <Loader className="h-10 w-10 text-white animate-spin" />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            {loading ? 'Loading...' : 'Checking Approval Status...'}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {user ? `Checking account status for ${user.email}` : 'Please wait...'}
          </p>
          {retryCount > 0 && (
            <p className="text-xs text-gray-500">
              Attempting to load data... ({retryCount}/3)
            </p>
          )}
        </div>
      </div>
    )
  }

  // If actually approved, show success message
  if (isActuallyApproved) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="mx-auto h-20 w-20 bg-green-500 rounded-full flex items-center justify-center">
              <CheckCircle className="h-10 w-10 text-white" />
            </div>
            <h2 className="mt-6 text-3xl font-bold text-gray-900">
              Account Approved!
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Your account has been approved and is now active.
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <p className="text-sm text-gray-600 mb-4">
              Redirecting you to your dashboard...
            </p>
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => {
                  const role = userData?.role || 'student'
                  switch (role) {
                    case 'company':
                      navigate('/company/dashboard')
                      break
                    case 'institution':
                      navigate('/institution/dashboard')
                      break
                    default:
                      navigate('/dashboard')
                  }
                }}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                Go to Dashboard Now
              </button>
              <button
                onClick={logout}
                className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // If no user data after retries, show error
  if (!userData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 text-center">
          <div className="mx-auto h-20 w-20 bg-red-500 rounded-full flex items-center justify-center">
            <Loader className="h-10 w-10 text-white" />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Unable to Load Account
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            We couldn't load your account information. Please try signing in again.
          </p>
          <div className="space-y-4">
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              Retry
            </button>
            <button
              onClick={logout}
              className="w-full bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Determine account type and display data
  const isCompany = userData?.role === 'company'
  const isInstitution = userData?.role === 'institution'
  
  const accountType = isCompany ? 'company' : isInstitution ? 'institution' : 'account'
  const accountTypeLabel = isCompany ? 'Company' : isInstitution ? 'Institution' : 'Account'
  
  // Get the appropriate name based on account type
  const getDisplayName = () => {
    if (isCompany && userData?.companyName) {
      return userData.companyName
    }
    if (isInstitution && userData?.institutionName) {
      return userData.institutionName
    }
    return userData?.displayName || user?.email || 'Unknown'
  }

  // Get the appropriate icon based on account type
  const getAccountIcon = () => {
    if (isCompany) {
      return <Briefcase className="h-5 w-5 text-blue-600" />
    }
    return <Building className="h-5 w-5 text-blue-600" />
  }

  // Get the appropriate name label based on account type
  const getNameLabel = () => {
    if (isCompany) {
      return 'Company Name'
    }
    if (isInstitution) {
      return 'Institution Name'
    }
    return 'Account Name'
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-20 w-20 bg-yellow-500 rounded-full flex items-center justify-center">
            <Clock className="h-10 w-10 text-white" />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            {accountTypeLabel} Pending Approval
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Your {accountType} account is under review
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              {getAccountIcon()}
              <div>
                <p className="text-sm font-medium text-gray-900">{getNameLabel()}</p>
                <p className="text-sm text-gray-600">{getDisplayName()}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Mail className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-gray-900">Contact Email</p>
                <p className="text-sm text-gray-600">{user?.email}</p>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
              <p className="text-sm text-yellow-800">
                Your {accountType} account is currently being reviewed by our administration team. 
                This process typically takes 24-48 hours. You will receive an email notification 
                once your account has been approved.
              </p>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-500">
                If you have any questions, please contact our support team at 
                <a href="mailto:support@careerguide.org" className="text-blue-600 hover:text-blue-500 ml-1">
                  support@careerguide.org
                </a>
              </p>
            </div>
          </div>
        </div>

        <div className="text-center space-y-4">
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Refresh Status
          </button>
          <button
            onClick={logout}
            className="w-full bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </div>
    </div>
  )
}

export default PendingApproval