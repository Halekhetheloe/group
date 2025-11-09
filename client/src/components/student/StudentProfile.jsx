import React, { useState, useEffect } from 'react'
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage } from '../../firebase-config'
import { useAuth } from '../../hooks/useAuth'
import { User, Mail, Phone, MapPin, Calendar, GraduationCap, Briefcase, Upload, Save, Edit, Award, BookOpen } from 'lucide-react'
import toast from 'react-hot-toast'

const StudentProfile = () => {
  const { user, userData, updateUserProfile } = useAuth()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState(false)
  const [stats, setStats] = useState({})
  const [uploadingPhoto, setUploadingPhoto] = useState(false)

  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    phone: '',
    address: '',
    dateOfBirth: '',
    educationLevel: '',
    institution: '',
    major: '',
    graduationYear: '',
    skills: [],
    bio: '',
    resumeUrl: '',
    transcriptUrl: ''
  })

  useEffect(() => {
    if (userData) {
      fetchProfile()
      fetchStats()
    }
  }, [userData])

  const fetchProfile = async () => {
    try {
      setLoading(true)
      const profileDoc = await getDoc(doc(db, 'students', user.uid))
      
      if (profileDoc.exists()) {
        const profileData = profileDoc.data()
        setProfile(profileData)
        setFormData({
          displayName: profileData.displayName || user.displayName || '',
          email: profileData.email || user.email || '',
          phone: profileData.phone || '',
          address: profileData.address || '',
          dateOfBirth: profileData.dateOfBirth || '',
          educationLevel: profileData.educationLevel || '',
          institution: profileData.institution || '',
          major: profileData.major || '',
          graduationYear: profileData.graduationYear || '',
          skills: profileData.skills || [],
          bio: profileData.bio || '',
          resumeUrl: profileData.resumeUrl || '',
          transcriptUrl: profileData.transcriptUrl || ''
        })
      } else {
        // Initialize with basic user data
        setFormData(prev => ({
          ...prev,
          displayName: user.displayName || '',
          email: user.email || ''
        }))
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
      toast.error('Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      // Fetch application stats
      const applicationsQuery = query(
        collection(db, 'applications'),
        where('studentId', '==', user.uid)
      )
      const applicationsSnapshot = await getDocs(applicationsQuery)
      
      // Fetch job application stats
      const jobApplicationsQuery = query(
        collection(db, 'jobApplications'),
        where('studentId', '==', user.uid)
      )
      const jobApplicationsSnapshot = await getDocs(jobApplicationsQuery)

      setStats({
        totalApplications: applicationsSnapshot.size,
        totalJobApplications: jobApplicationsSnapshot.size,
        pendingApplications: applicationsSnapshot.docs.filter(doc => doc.data().status === 'pending').length,
        acceptedApplications: applicationsSnapshot.docs.filter(doc => doc.data().status === 'accepted').length
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSkillsChange = (e) => {
    const skills = e.target.value.split(',').map(skill => skill.trim()).filter(skill => skill)
    setFormData(prev => ({
      ...prev,
      skills
    }))
  }

  const uploadFile = async (file, path) => {
    try {
      const storageRef = ref(storage, path)
      const snapshot = await uploadBytes(storageRef, file)
      const downloadURL = await getDownloadURL(snapshot.ref)
      return downloadURL
    } catch (error) {
      console.error('Error uploading file:', error)
      throw error
    }
  }

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB')
      return
    }

    try {
      setUploadingPhoto(true)
      const photoURL = await uploadFile(file, `students/${user.uid}/profile-photo`)
      
      // Update user profile
      await updateUserProfile({ photoURL })
      
      // Update student document
      await updateDoc(doc(db, 'students', user.uid), {
        photoURL,
        updatedAt: new Date()
      })

      toast.success('Profile photo updated successfully!')
      fetchProfile() // Refresh data
    } catch (error) {
      console.error('Error uploading photo:', error)
      toast.error('Failed to upload photo')
    } finally {
      setUploadingPhoto(false)
    }
  }

  const handleResumeUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    if (file.type !== 'application/pdf') {
      toast.error('Please upload a PDF file')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size should be less than 10MB')
      return
    }

    try {
      const resumeUrl = await uploadFile(file, `students/${user.uid}/resume`)
      setFormData(prev => ({ ...prev, resumeUrl }))
      toast.success('Resume uploaded successfully!')
    } catch (error) {
      console.error('Error uploading resume:', error)
      toast.error('Failed to upload resume')
    }
  }

  const handleSaveProfile = async () => {
    try {
      setSaving(true)

      const updateData = {
        ...formData,
        updatedAt: new Date(),
        profileCompleted: true
      }

      // Update student document
      await updateDoc(doc(db, 'students', user.uid), updateData)

      // Update user profile if name changed
      if (formData.displayName !== user.displayName) {
        await updateUserProfile({
          displayName: formData.displayName
        })
      }

      setProfile(updateData)
      setEditing(false)
      toast.success('Profile updated successfully!')
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error('Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const getCompletionPercentage = () => {
    const fields = [
      formData.displayName,
      formData.phone,
      formData.educationLevel,
      formData.institution,
      formData.major,
      formData.skills.length > 0,
      formData.bio,
      formData.resumeUrl
    ]
    const completed = fields.filter(Boolean).length
    return Math.round((completed / fields.length) * 100)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="h-64 bg-gray-200 rounded mb-6"></div>
            <div className="h-96 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  const completionPercentage = getCompletionPercentage()

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Student Profile</h1>
          <p className="text-gray-600 mt-2">
            Manage your profile information and application materials
          </p>
        </div>

        {/* Profile Completion */}
        <div className="card mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Profile Completion</h3>
            <span className="text-sm font-medium text-gray-600">{completionPercentage}% Complete</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-green-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${completionPercentage}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Complete your profile to improve your application success rate
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Profile Card */}
          <div className="lg:col-span-1">
            <div className="card text-center">
              {/* Profile Photo */}
              <div className="relative inline-block mb-4">
                <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center mx-auto">
                  {user.photoURL ? (
                    <img 
                      src={user.photoURL} 
                      alt="Profile" 
                      className="w-32 h-32 rounded-full object-cover"
                    />
                  ) : (
                    <User className="h-16 w-16 text-gray-400" />
                  )}
                </div>
                <label className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full cursor-pointer hover:bg-blue-700 transition-colors">
                  <Upload className="h-4 w-4" />
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    disabled={uploadingPhoto}
                  />
                </label>
              </div>

              {uploadingPhoto && (
                <p className="text-sm text-blue-600 mb-2">Uploading photo...</p>
              )}

              <h2 className="text-xl font-semibold text-gray-900">
                {formData.displayName || 'Unknown User'}
              </h2>
              <p className="text-gray-600 mb-4">{formData.email}</p>

              {/* Quick Stats */}
              <div className="space-y-3 mt-6">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Course Applications</span>
                  <span className="font-semibold">{stats.totalApplications || 0}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Job Applications</span>
                  <span className="font-semibold">{stats.totalJobApplications || 0}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Accepted Offers</span>
                  <span className="font-semibold text-green-600">{stats.acceptedApplications || 0}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 space-y-2">
                {!editing ? (
                  <button
                    onClick={() => setEditing(true)}
                    className="btn-primary w-full flex items-center justify-center"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Profile
                  </button>
                ) : (
                  <button
                    onClick={handleSaveProfile}
                    disabled={saving}
                    className="btn-success w-full flex items-center justify-center"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                )}
                
                {editing && (
                  <button
                    onClick={() => {
                      setEditing(false)
                      setFormData({
                        displayName: profile?.displayName || user.displayName || '',
                        email: profile?.email || user.email || '',
                        phone: profile?.phone || '',
                        address: profile?.address || '',
                        dateOfBirth: profile?.dateOfBirth || '',
                        educationLevel: profile?.educationLevel || '',
                        institution: profile?.institution || '',
                        major: profile?.major || '',
                        graduationYear: profile?.graduationYear || '',
                        skills: profile?.skills || [],
                        bio: profile?.bio || '',
                        resumeUrl: profile?.resumeUrl || '',
                        transcriptUrl: profile?.transcriptUrl || ''
                      })
                    }}
                    className="btn-secondary w-full"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>

            {/* Documents Card */}
            <div className="card mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Documents</h3>
              
              {/* Resume */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Resume
                </label>
                {formData.resumeUrl ? (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-green-600">✓ Uploaded</span>
                    <a 
                      href={formData.resumeUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      View
                    </a>
                  </div>
                ) : (
                  <div>
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={handleResumeUpload}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                    <p className="text-xs text-gray-500 mt-1">PDF format, max 10MB</p>
                  </div>
                )}
              </div>

              {/* Transcript */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Academic Transcript
                </label>
                {formData.transcriptUrl ? (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-green-600">✓ Uploaded</span>
                    <a 
                      href={formData.transcriptUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      View
                    </a>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No transcript uploaded</p>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Profile Form */}
          <div className="lg:col-span-2">
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">
                {editing ? 'Edit Profile Information' : 'Profile Information'}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Personal Information */}
                <div className="md:col-span-2">
                  <h4 className="text-md font-medium text-gray-900 mb-4 flex items-center">
                    <User className="h-5 w-5 mr-2 text-blue-600" />
                    Personal Information
                  </h4>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="displayName"
                    value={formData.displayName}
                    onChange={handleInputChange}
                    disabled={!editing}
                    className="input-field"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      disabled={!editing}
                      className="input-field pl-10"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      disabled={!editing}
                      className="input-field pl-10"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date of Birth
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <input
                      type="date"
                      name="dateOfBirth"
                      value={formData.dateOfBirth}
                      onChange={handleInputChange}
                      disabled={!editing}
                      className="input-field pl-10"
                    />
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 text-gray-400 h-4 w-4" />
                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      disabled={!editing}
                      rows="3"
                      className="input-field pl-10"
                    />
                  </div>
                </div>

                {/* Educational Information */}
                <div className="md:col-span-2 mt-6">
                  <h4 className="text-md font-medium text-gray-900 mb-4 flex items-center">
                    <GraduationCap className="h-5 w-5 mr-2 text-green-600" />
                    Educational Information
                  </h4>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Education Level *
                  </label>
                  <select
                    name="educationLevel"
                    value={formData.educationLevel}
                    onChange={handleInputChange}
                    disabled={!editing}
                    className="input-field"
                  >
                    <option value="">Select Level</option>
                    <option value="high-school">High School</option>
                    <option value="associate">Associate Degree</option>
                    <option value="bachelor">Bachelor's Degree</option>
                    <option value="master">Master's Degree</option>
                    <option value="phd">PhD</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Graduation Year
                  </label>
                  <input
                    type="number"
                    name="graduationYear"
                    value={formData.graduationYear}
                    onChange={handleInputChange}
                    disabled={!editing}
                    min="1900"
                    max="2030"
                    className="input-field"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Institution *
                  </label>
                  <input
                    type="text"
                    name="institution"
                    value={formData.institution}
                    onChange={handleInputChange}
                    disabled={!editing}
                    className="input-field"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Major/Field of Study *
                  </label>
                  <input
                    type="text"
                    name="major"
                    value={formData.major}
                    onChange={handleInputChange}
                    disabled={!editing}
                    className="input-field"
                    required
                  />
                </div>

                {/* Skills & Bio */}
                <div className="md:col-span-2 mt-6">
                  <h4 className="text-md font-medium text-gray-900 mb-4 flex items-center">
                    <Award className="h-5 w-5 mr-2 text-purple-600" />
                    Skills & Biography
                  </h4>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Skills (comma-separated) *
                  </label>
                  <input
                    type="text"
                    value={formData.skills.join(', ')}
                    onChange={handleSkillsChange}
                    disabled={!editing}
                    placeholder="e.g., JavaScript, Python, Project Management"
                    className="input-field"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Separate multiple skills with commas
                  </p>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Biography *
                  </label>
                  <textarea
                    name="bio"
                    value={formData.bio}
                    onChange={handleInputChange}
                    disabled={!editing}
                    rows="4"
                    placeholder="Tell us about your academic interests, career goals, and achievements..."
                    className="input-field"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.bio.length}/500 characters
                  </p>
                </div>
              </div>

              {!editing && (
                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    Keep your profile updated to ensure institutions and companies have your latest information.
                    A complete profile increases your chances of successful applications.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default StudentProfile