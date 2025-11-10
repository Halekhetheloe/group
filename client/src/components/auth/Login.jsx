import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth'
import { auth } from '../../firebase-config'
import toast from 'react-hot-toast'

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const navigate = useNavigate()

  // Check if user is already logged in
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user && user.emailVerified) {
        console.log('User already logged in:', user.email)
        navigate('/') // Changed from '/dashboard' to '/'
      }
    })
    
    return () => unsubscribe()
  }, [navigate])

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.email) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid'
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required'
    }
    // Removed password length check for login
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setLoading(true)
    setErrors({})

    try {
      console.log('Attempting login with:', formData.email)
      
      const userCredential = await signInWithEmailAndPassword(
        auth, 
        formData.email, 
        formData.password
      )
      
      const user = userCredential.user
      console.log('Login successful:', user.email)
      
      // Check if email is verified
      if (!user.emailVerified) {
        toast.error('Please verify your email before logging in. Check your inbox for the verification link.')
        await auth.signOut()
        setErrors({ submit: 'Email not verified. Please check your inbox.' })
        return
      }

      toast.success('Login successful!')
      navigate('/') // Changed from '/dashboard' to '/'
      
    } catch (error) {
      console.error('Login error:', error)
      let errorMessage = 'Login failed. Please try again.'
      
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = 'No account found with this email.'
          break
        case 'auth/wrong-password':
          errorMessage = 'Incorrect password.'
          break
        case 'auth/invalid-email':
          errorMessage = 'Invalid email address.'
          break
        case 'auth/too-many-requests':
          errorMessage = 'Too many failed attempts. Please try again later.'
          break
        case 'auth/user-disabled':
          errorMessage = 'This account has been disabled.'
          break
        case 'auth/network-request-failed':
          errorMessage = 'Network error. Please check your connection.'
          break
      }
      
      setErrors({ submit: errorMessage })
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = async () => {
    if (!formData.email) {
      setErrors({ email: 'Please enter your email to reset password' })
      toast.error('Please enter your email address')
      return
    }

    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      setErrors({ email: 'Please enter a valid email address' })
      toast.error('Please enter a valid email address')
      return
    }

    try {
      await sendPasswordResetEmail(auth, formData.email)
      toast.success('Password reset email sent! Check your inbox.')
    } catch (error) {
      console.error('Password reset error:', error)
      let errorMessage = 'Failed to send reset email.'
      
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email.'
      }
      
      toast.error(errorMessage)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-blue-600 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-lg">CG</span>
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Sign in to your account
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Access your career guidance platform
          </p>
        </div>

        {/* Login Form */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={formData.email}
                onChange={handleChange}
                className={`w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                  errors.email ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''
                }`}
                placeholder="Enter your email"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.email}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 pr-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                    errors.password ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''
                  }`}
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <span className="text-gray-500 text-sm">
                    {showPassword ? 'Hide' : 'Show'}
                  </span>
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.password}
                </p>
              )}
            </div>
          </div>

          {/* Forgot Password */}
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                Remember me
              </label>
            </div>

            <button
              type="button"
              onClick={handleForgotPassword}
              className="text-sm font-medium text-blue-600 hover:text-blue-500"
            >
              Forgot your password?
            </button>
          </div>

          {/* Submit Error */}
          {errors.submit && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-800">
                {errors.submit}
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                'Sign in'
              )}
            </button>
          </div>

          {/* Sign Up Link */}
          <div className="text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <Link
                to="/register"
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                Sign up here
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Login