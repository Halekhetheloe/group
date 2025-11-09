import React from 'react'
import { useAuth } from '../../context/AuthContext'
import { Shield, Mail, LogOut } from 'lucide-react'

const Suspended = () => {
  const { user, userData, logout } = useAuth()

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-20 w-20 bg-red-500 rounded-full flex items-center justify-center">
            <Shield className="h-10 w-10 text-white" />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Account Suspended
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Your account has been temporarily suspended
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <Shield className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-sm font-medium text-gray-900">Account Status</p>
                <p className="text-sm text-gray-600">Suspended</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Mail className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-gray-900">Contact Email</p>
                <p className="text-sm text-gray-600">{user?.email}</p>
              </div>
            </div>

            {userData && (
              <div className="flex items-center space-x-3">
                <Shield className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Account Type</p>
                  <p className="text-sm text-gray-600 capitalize">{userData?.role}</p>
                </div>
              </div>
            )}

            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-sm text-red-800">
                Your account has been suspended by the administration. This may be due to 
                violations of our terms of service or other administrative reasons.
              </p>
              <p className="text-sm text-red-700 mt-2">
                If you believe this is a mistake, please contact our support team for assistance.
              </p>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-500">
                For assistance, please contact our support team at 
                <a href="mailto:support@careerguide.org" className="text-blue-600 hover:text-blue-500 ml-1">
                  support@careerguide.org
                </a>
              </p>
            </div>
          </div>
        </div>

        <div className="text-center">
          <button
            onClick={logout}
            className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors flex items-center justify-center gap-2 mx-auto"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </div>
    </div>
  )
}

export default Suspended