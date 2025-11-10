import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { createUserWithEmailAndPassword, sendEmailVerification, updateProfile } from 'firebase/auth'
import { doc, setDoc } from 'firebase/firestore'
import { auth, db } from '../../firebase-config'
import toast from 'react-hot-toast'

const Register = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'student',
    institutionName: '',
    companyName: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const navigate = useNavigate()

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required'
    }
    
    if (!formData.email) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid'
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters'
    }
    
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password'
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }
    
    if (formData.role === 'institution' && !formData.institutionName.trim()) {
      newErrors.institutionName = 'Institution name is required'
    }
    
    if (formData.role === 'company' && !formData.companyName.trim()) {
      newErrors.companyName = 'Company name is required'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setLoading(true)
    setErrors({})

    try {
      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      )
      
      const user = userCredential.user

      // Update user profile with display name
      await updateProfile(user, {
        displayName: formData.fullName
      })

      // Prepare user data for Firestore
      const userData = {
        uid: user.uid,
        email: user.email,
        displayName: formData.fullName,
        role: formData.role,
        status: formData.role === 'student' ? 'active' : 'pending',
        createdAt: new Date(),
        emailVerified: false
      }

      // Add role-specific data
      if (formData.role === 'institution') {
        userData.institutionName = formData.institutionName
        userData.status = 'pending' // Institutions need approval
      } else if (formData.role === 'company') {
        userData.companyName = formData.companyName
        userData.status = 'pending' // Companies need approval
      }

      // Save user data to Firestore
      await setDoc(doc(db, 'users', user.uid), userData)

      // Create role-specific document if needed
      if (formData.role === 'institution') {
        await setDoc(doc(db, 'institutions', user.uid), {
          name: formData.institutionName,
          email: formData.email,
          ownerId: user.uid,
          status: 'pending',
          createdAt: new Date()
        })
      } else if (formData.role === 'company') {
        await setDoc(doc(db, 'companies', user.uid), {
          name: formData.companyName,
          email: formData.email,
          ownerId: user.uid,
          status: 'pending',
          createdAt: new Date()
        })
      }

      // Send email verification
      await sendEmailVerification(user)

      toast.success('Account created successfully! Please check your email for verification.')
      navigate('/verify-email')

    } catch (error) {
      console.error('Registration error:', error)
      let errorMessage = 'Registration failed. Please try again.'
      
      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = 'An account with this email already exists.'
          break
        case 'auth/invalid-email':
          errorMessage = 'Invalid email address.'
          break
        case 'auth/operation-not-allowed':
          errorMessage = 'Email/password accounts are not enabled.'
          break
        case 'auth/weak-password':
          errorMessage = 'Password is too weak.'
          break
      }
      
      setErrors({ submit: errorMessage })
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    console.log(`Field changed: ${name} = ${value}`)
    
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

  const getRoleDescription = (role) => {
    switch (role) {
      case 'student':
        return 'Apply to courses and find job opportunities'
      case 'institution':
        return 'Manage courses and review student applications'
      case 'company':
        return 'Post jobs and find qualified candidates'
      default:
        return ''
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
            Create your account
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Join the Career Guidance Platform
          </p>
        </div>

        {/* Registration Form */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* Full Name */}
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                autoComplete="name"
                value={formData.fullName}
                onChange={handleChange}
                className={`w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                  errors.fullName ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''
                }`}
                placeholder="Enter your full name"
              />
              {errors.fullName && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.fullName}
                </p>
              )}
            </div>

            {/* Email */}
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

            {/* Role Selection - Dropdown */}
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                I am a
              </label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="student">Student</option>
                <option value="institution">Institution</option>
                <option value="company">Company</option>
              </select>
              <p className="text-xs text-gray-500 mt-2">
                {getRoleDescription(formData.role)}
              </p>
            </div>

            {/* Institution Name (if role is institution) */}
            {formData.role === 'institution' && (
              <div>
                <label htmlFor="institutionName" className="block text-sm font-medium text-gray-700 mb-1">
                  Institution Name
                </label>
                <input
                  id="institutionName"
                  name="institutionName"
                  type="text"
                  value={formData.institutionName}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                    errors.institutionName ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''
                  }`}
                  placeholder="Enter your institution name"
                />
                {errors.institutionName && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.institutionName}
                  </p>
                )}
              </div>
            )}

            {/* Company Name (if role is company) */}
            {formData.role === 'company' && (
              <div>
                <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-1">
                  Company Name
                </label>
                <input
                  id="companyName"
                  name="companyName"
                  type="text"
                  value={formData.companyName}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                    errors.companyName ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''
                  }`}
                  placeholder="Enter your company name"
                />
                {errors.companyName && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.companyName}
                  </p>
                )}
              </div>
            )}

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 pr-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                    errors.password ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''
                  }`}
                  placeholder="Create a password"
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

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 pr-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                    errors.confirmPassword ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''
                  }`}
                  placeholder="Confirm your password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <span className="text-gray-500 text-sm">
                    {showConfirmPassword ? 'Hide' : 'Show'}
                  </span>
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.confirmPassword}
                </p>
              )}
            </div>
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
                'Create Account'
              )}
            </button>
          </div>

          {/* Login Link */}
          <div className="text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link
                to="/login"
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                Sign in here
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Register