import React, { useState, useEffect } from 'react'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { db } from '../../firebase-config'
import { useAuth } from '../../hooks/useAuth'
import { Building2, MapPin, Phone, Mail, Globe, Users, Edit, Save, X } from 'lucide-react'
import toast from 'react-hot-toast'

const InstitutionProfile = () => {
  const { userData } = useAuth()
  const [institutionData, setInstitutionData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [formData, setFormData] = useState({})
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (userData) {
      fetchInstitutionData()
    }
  }, [userData])

  const fetchInstitutionData = async () => {
    try {
      setLoading(true)
      const institutionDoc = await getDoc(doc(db, 'institutions', userData.uid))
      if (institutionDoc.exists()) {
        const data = institutionDoc.data()
        setInstitutionData(data)
        setFormData(data)
      }
    } catch (error) {
      console.error('Error fetching institution data:', error)
    } finally {
      setLoading(false)
    }
  }

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.name?.trim()) {
      newErrors.name = 'Institution name is required'
    }
    
    if (!formData.email?.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid'
    }
    
    if (!formData.location?.trim()) {
      newErrors.location = 'Location is required'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) return

    try {
      const institutionRef = doc(db, 'institutions', userData.uid)
      await updateDoc(institutionRef, {
        ...formData,
        updatedAt: new Date()
      })

      setInstitutionData(formData)
      setEditing(false)
      toast.success('Profile updated successfully!')
    } catch (error) {
      console.error('Error updating institution profile:', error)
      toast.error('Failed to update profile. Please try again.')
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const handleCancel = () => {
    setFormData(institutionData)
    setEditing(false)
    setErrors({})
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Institution Profile</h1>
            <p className="text-gray-600 mt-2">
              Manage your institution information and settings
            </p>
          </div>
          {!editing ? (
            <button
              onClick={() => setEditing(true)}
              className="btn-primary flex items-center"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit Profile
            </button>
          ) : (
            <div className="flex space-x-3">
              <button
                onClick={handleCancel}
                className="btn-secondary flex items-center"
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="btn-success flex items-center"
              >
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </button>
            </div>
          )}
        </div>

        {/* Profile Form */}
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Information */}
            <div className="lg:col-span-2 space-y-6">
              {/* Institution Details Card */}
              <div className="card">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Institution Information</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Institution Name */}
                  <div className="md:col-span-2">
                    <label htmlFor="name" className="form-label">
                      Institution Name *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Building2 className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        id="name"
                        name="name"
                        type="text"
                        value={formData.name || ''}
                        onChange={handleChange}
                        disabled={!editing}
                        className={`input-field pl-10 ${errors.name ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''} ${!editing ? 'bg-gray-50' : ''}`}
                        placeholder="e.g. Limkokwing University of Creative Technology"
                      />
                    </div>
                    {errors.name && <p className="error-message">{errors.name}</p>}
                  </div>

                  {/* Email */}
                  <div>
                    <label htmlFor="email" className="form-label">
                      Email Address *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email || ''}
                        onChange={handleChange}
                        disabled={!editing}
                        className={`input-field pl-10 ${errors.email ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''} ${!editing ? 'bg-gray-50' : ''}`}
                      />
                    </div>
                    {errors.email && <p className="error-message">{errors.email}</p>}
                  </div>

                  {/* Phone */}
                  <div>
                    <label htmlFor="phone" className="form-label">
                      Phone Number
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Phone className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        id="phone"
                        name="phone"
                        type="tel"
                        value={formData.phone || ''}
                        onChange={handleChange}
                        disabled={!editing}
                        className={`input-field pl-10 ${!editing ? 'bg-gray-50' : ''}`}
                      />
                    </div>
                  </div>

                  {/* Location */}
                  <div className="md:col-span-2">
                    <label htmlFor="location" className="form-label">
                      Location *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <MapPin className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        id="location"
                        name="location"
                        type="text"
                        value={formData.location || ''}
                        onChange={handleChange}
                        disabled={!editing}
                        className={`input-field pl-10 ${errors.location ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''} ${!editing ? 'bg-gray-50' : ''}`}
                        placeholder="e.g. Maseru, Lesotho"
                      />
                    </div>
                    {errors.location && <p className="error-message">{errors.location}</p>}
                  </div>

                  {/* Website */}
                  <div className="md:col-span-2">
                    <label htmlFor="website" className="form-label">
                      Website
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Globe className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        id="website"
                        name="website"
                        type="url"
                        value={formData.website || ''}
                        onChange={handleChange}
                        disabled={!editing}
                        className={`input-field pl-10 ${!editing ? 'bg-gray-50' : ''}`}
                        placeholder="https://example.edu.ls"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Institution Description */}
              <div className="card">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Institution Description</h2>
                <div>
                  <label htmlFor="description" className="form-label">
                    About Your Institution
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    rows={6}
                    value={formData.description || ''}
                    onChange={handleChange}
                    disabled={!editing}
                    className={`input-field ${!editing ? 'bg-gray-50' : ''}`}
                    placeholder="Describe your institution, mission, values, academic programs, facilities, and what makes you unique..."
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    This description will be visible to prospective students.
                  </p>
                </div>
              </div>

              {/* Additional Information */}
              <div className="card">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Additional Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="type" className="form-label">
                      Institution Type
                    </label>
                    <select
                      id="type"
                      name="type"
                      value={formData.type || ''}
                      onChange={handleChange}
                      disabled={!editing}
                      className={`input-field ${!editing ? 'bg-gray-50' : ''}`}
                    >
                      <option value="">Select Type</option>
                      <option value="university">University</option>
                      <option value="college">College</option>
                      <option value="polytechnic">Polytechnic</option>
                      <option value="vocational">Vocational School</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="foundingYear" className="form-label">
                      Founding Year
                    </label>
                    <input
                      id="foundingYear"
                      name="foundingYear"
                      type="number"
                      min="1800"
                      max="2024"
                      value={formData.foundingYear || ''}
                      onChange={handleChange}
                      disabled={!editing}
                      className={`input-field ${!editing ? 'bg-gray-50' : ''}`}
                      placeholder="e.g. 2008"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Status Card */}
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Status</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      institutionData?.status === 'approved' 
                        ? 'bg-green-100 text-green-800'
                        : institutionData?.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {institutionData?.status?.charAt(0).toUpperCase() + institutionData?.status?.slice(1)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Member Since</span>
                    <span className="text-gray-900">
                      {institutionData?.createdAt?.toDate?.().toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Last Updated</span>
                    <span className="text-gray-900">
                      {institutionData?.updatedAt?.toDate?.().toLocaleDateString() || 'Never'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Statistics Card */}
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Institution Statistics</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Active Courses</span>
                    <span className="font-medium text-gray-900">0</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Applications</span>
                    <span className="font-medium text-gray-900">0</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Admitted Students</span>
                    <span className="font-medium text-gray-900">0</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Profile Views</span>
                    <span className="font-medium text-gray-900">0</span>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
                <div className="space-y-2 text-sm">
                  {institutionData?.email && (
                    <div className="flex items-center text-gray-600">
                      <Mail className="h-4 w-4 mr-2" />
                      {institutionData.email}
                    </div>
                  )}
                  {institutionData?.phone && (
                    <div className="flex items-center text-gray-600">
                      <Phone className="h-4 w-4 mr-2" />
                      {institutionData.phone}
                    </div>
                  )}
                  {institutionData?.location && (
                    <div className="flex items-center text-gray-600">
                      <MapPin className="h-4 w-4 mr-2" />
                      {institutionData.location}
                    </div>
                  )}
                  {institutionData?.website && (
                    <div className="flex items-center text-gray-600">
                      <Globe className="h-4 w-4 mr-2" />
                      <a href={institutionData.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700">
                        Visit Website
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="space-y-2">
                  <button className="w-full btn-secondary text-sm">
                    View Public Profile
                  </button>
                  <button className="w-full btn-secondary text-sm">
                    Manage Courses
                  </button>
                  <button className="w-full btn-secondary text-sm">
                    Review Applications
                  </button>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

export default InstitutionProfile