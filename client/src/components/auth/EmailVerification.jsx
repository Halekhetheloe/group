import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { onAuthStateChanged, sendEmailVerification, signOut } from 'firebase/auth'
import { auth } from '../../firebase-config'
import { Mail, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'

const EmailVerification = () => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const navigate = useNavigate()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        navigate('/login')
        return
      }

      setUser(currentUser)

      // If email is already verified, redirect to dashboard
      if (currentUser.emailVerified) {
        toast.success('Email verified successfully!')
        navigate('/dashboard')
      }
    })

    return () => unsubscribe()
  }, [navigate])

  useEffect(() => {
    let timer
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000)
    }
    return () => clearTimeout(timer)
  }, [countdown])

  const handleResendVerification = async () => {
    if (!user) return

    setSending(true)
    try {
      await sendEmailVerification(user)
      setCountdown(60) // 60 seconds cooldown
      toast.success('Verification email sent! Check your inbox.')
    } catch (error) {
      console.error('Error sending verification email:', error)
      toast.error('Failed to send verification email. Please try again.')
    } finally {
      setSending(false)
    }
  }

  const handleRefresh = async () => {
    if (!user) return

    setLoading(true)
    try {
      // Reload user to check if email was verified
      await user.reload()
      const updatedUser = auth.currentUser
      
      if (updatedUser.emailVerified) {
        toast.success('Email verified successfully!')
        navigate('/dashboard')
      } else {
        toast.info('Email not verified yet. Please check your inbox.')
      }
    } catch (error) {
      console.error('Error refreshing user:', error)
      toast.error('Error checking verification status.')
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut(auth)
      navigate('/login')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center">
            <Mail className="h-8 w-8 text-blue-600" />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Verify your email
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            We've sent a verification link to your email address
          </p>
        </div>

        <div className="bg-white py-8 px-6 shadow rounded-lg sm:px-10">
          <div className="space-y-6">
            {/* Email Address Display */}
            <div className="text-center">
              <p className="text-lg font-medium text-gray-900">
                {user.email}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                Check your inbox for the verification link
              </p>
            </div>

            {/* Instructions */}
            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-blue-800 mb-2">
                What to do next:
              </h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Check your email inbox
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Click the verification link
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Return here and refresh
                </li>
              </ul>
            </div>

            {/* Spam Warning */}
            <div className="bg-yellow-50 rounded-lg p-4">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-yellow-400" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">
                    Can't find the email?
                  </h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <p>Check your spam folder or try resending the verification email.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={handleRefresh}
                disabled={loading}
                className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                {loading ? (
                  <>
                    <RefreshCw className="animate-spin h-4 w-4 mr-2" />
                    Checking...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    I've verified my email
                  </>
                )}
              </button>

              <button
                onClick={handleResendVerification}
                disabled={sending || countdown > 0}
                className="w-full flex justify-center items-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                {sending ? (
                  <>
                    <RefreshCw className="animate-spin h-4 w-4 mr-2" />
                    Sending...
                  </>
                ) : countdown > 0 ? (
                  `Resend in ${countdown}s`
                ) : (
                  'Resend verification email'
                )}
              </button>

              <button
                onClick={handleSignOut}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors duration-200"
              >
                Sign out
              </button>
            </div>

            {/* Support Contact */}
            <div className="text-center pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-500">
                Need help?{' '}
                <a
                  href="mailto:support@careerpath.ls"
                  className="font-medium text-blue-600 hover:text-blue-500"
                >
                  Contact support
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EmailVerification