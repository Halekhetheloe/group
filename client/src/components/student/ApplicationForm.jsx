import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { doc, getDoc, addDoc, collection, query, where, getDocs } from 'firebase/firestore'
import { db, storage } from '../../firebase-config'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { useAuth } from '../../hooks/useAuth'
import { ArrowLeft, Upload, FileText, X, CheckCircle, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'

const ApplicationForm = () => {
  const { courseId } = useParams()
  const navigate = useNavigate()
  const { userData } = useAuth()
  const [course, setCourse] = useState(null)
  const [institution, setInstitution] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    personalStatement: '',
    documents: []
  })
  const [errors, setErrors] = useState({})
  const [uploading, setUploading] = useState(false)
  const [hasApplied, setHasApplied] = useState(false)
  const [applicationLimit, setApplicationLimit] = useState(false)

  useEffect(() => {
    if (courseId && userData) {
      fetchData()
    }
  }, [courseId, userData])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // Fetch course details
      const courseDoc = await getDoc(doc(db, 'courses', courseId))
      if (!courseDoc.exists()) {
        toast.error('Course not found')
        navigate('/courses')
        return
      }
      const courseData = courseDoc.data()
      setCourse(courseData)

      // Fetch institution details
      const institutionDoc = await getDoc(doc(db, 'institutions', courseData.institutionId))
      setInstitution(institutionDoc.data())

      // Check if student has already applied
      const applicationsQuery = query(
        collection(db, 'applications'),
        where('studentId', '==', userData.uid),
        where('courseId', '==', courseId)
      )
      const applicationsSnapshot = await getDocs(applicationsQuery)
      
      if (applicationsSnapshot.docs.length > 0) {
        setHasApplied(true)
        return
      }

      // Check application limit (max 2 per institution)
      const institutionApplicationsQuery = query(
        collection(db, 'applications'),
        where('studentId', '==', userData.uid),
        where('institutionId', '==', courseData.institutionId)
      )
      const institutionApplicationsSnapshot = await getDocs(institutionApplicationsQuery)
      
      if (institutionApplicationsSnapshot.docs.length >= 2) {
        setApplicationLimit(true)
      }

    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Error loading application form')
    } finally {
      setLoading(false)
    }
  }

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.personalStatement.trim()) {
      newErrors.personalStatement = 'Personal statement is required'
    } else if (formData.personalStatement.length < 100) {
      newErrors.personalStatement = 'Personal statement should be at least 100 characters'
    }
    
    if (formData.documents.length === 0) {
      newErrors.documents = 'At least one document is required'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleFileUpload = async (file) => {
    if (!file) return null

    // Validate file type and size
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    const maxSize = 5 * 1024 * 1024 // 5MB

    if (!allowedTypes.includes(file.type)) {
      toast.error('Please upload PDF, Word, or image files only')
      return null
    }

    if (file.size > maxSize) {
      toast.error('File size must be less than 5MB')
      return null
    }

    try {
      setUploading(true)
      
      // Create a unique file name
      const fileExtension = file.name.split('.').pop()
      const fileName = `applications/${userData.uid}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExtension}`
      
      // Upload file to Firebase Storage
      const storageRef = ref(storage, fileName)
      const snapshot = await uploadBytes(storageRef, file)
      const downloadURL = await getDownloadURL(snapshot.ref)
      
      return {
        name: file.name,
        type: file.type,
        size: file.size,
        url: downloadURL,
        uploadedAt: new Date()
      }
    } catch (error) {
      console.error('Error uploading file:', error)
      toast.error('Failed to upload file')
      return null
    } finally {
      setUploading(false)
    }
  }

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files)
    
    for (const file of files) {
      const uploadedFile = await handleFileUpload(file)
      if (uploadedFile) {
        setFormData(prev => ({
          ...prev,
          documents: [...prev.documents, uploadedFile]
        }))
      }
    }
    
    // Clear file input
    e.target.value = ''
  }

  const removeDocument = (index) => {
    setFormData(prev => ({
      ...prev,
      documents: prev.documents.filter((_, i) => i !== index)
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) return

    if (hasApplied) {
      toast.error('You have already applied for this course')
      return
    }

    if (applicationLimit) {
      toast.error('You can only apply for 2 courses per institution')
      return
    }

    setSubmitting(true)

    try {
      const applicationData = {
        studentId: userData.uid,
        courseId: courseId,
        institutionId: course.institutionId,
        personalStatement: formData.personalStatement.trim(),
        documents: formData.documents,
        status: 'pending',
        appliedAt: new Date(),
        // Student profile information
        studentName: userData.displayName,
        studentEmail: userData.email
      }

      await addDoc(collection(db, 'applications'), applicationData)
      
      toast.success('Application submitted successfully!')
      navigate('/student/my-applications')
    } catch (error) {
      console.error('Error submitting application:', error)
      toast.error('Failed to submit application. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileIcon = (fileType) => {
    if (fileType.includes('pdf')) return '📄'
    if (fileType.includes('word') || fileType.includes('document')) return '📝'
    if (fileType.includes('image')) return '🖼️'
    return '📎'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded-xl w-1/4 mb-6"></div>
            <div className="h-64 bg-gray-200 rounded-xl"></div>
          </div>
        </div>
      </div>
    )
  }

  if (hasApplied) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-teal-100 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-16 bg-white rounded-2xl shadow-lg border border-green-200">
            <CheckCircle className="h-20 w-20 text-green-500 mx-auto mb-6" />
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Application Submitted</h1>
            <p className="text-lg text-gray-600 mb-8 max-w-md mx-auto">
              You have already applied for <span className="font-semibold text-blue-600">{course?.name}</span> at <span className="font-semibold text-purple-600">{institution?.name}</span>
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => navigate('/student/my-applications')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center"
              >
                View My Applications
              </button>
              <button
                onClick={() => navigate('/courses')}
                className="bg-gray-600 hover:bg-gray-700 text-white px-8 py-4 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center"
              >
                Browse More Courses
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (applicationLimit) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-100 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-16 bg-white rounded-2xl shadow-lg border border-yellow-200">
            <AlertCircle className="h-20 w-20 text-yellow-500 mx-auto mb-6" />
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Application Limit Reached</h1>
            <p className="text-lg text-gray-600 mb-8 max-w-md mx-auto">
              You can only apply for 2 courses per institution. You have already applied for 2 courses at <span className="font-semibold text-purple-600">{institution?.name}</span>.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => navigate('/student/my-applications')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center"
              >
                View My Applications
              </button>
              <button
                onClick={() => navigate('/courses')}
                className="bg-gray-600 hover:bg-gray-700 text-white px-8 py-4 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center"
              >
                Browse Other Institutions
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate(-1)}
              className="bg-white hover:bg-gray-50 text-blue-600 hover:text-blue-700 px-4 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg flex items-center border border-blue-200"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to Courses
            </button>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Course Application</h1>
              <p className="text-gray-600 mt-2 text-sm sm:text-base">
                Apply for <span className="font-semibold text-blue-600">{course?.name}</span> at <span className="font-semibold text-purple-600">{institution?.name}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Course Summary */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 mb-6 transition-all duration-300 hover:shadow-xl">
          <h2 className="text-xl font-bold text-gray-900 mb-6 pb-3 border-b border-gray-200">Course Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-600">Course Name</label>
              <p className="text-lg text-gray-900 font-medium">{course?.name}</p>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-600">Institution</label>
              <p className="text-lg text-gray-900 font-medium">{institution?.name}</p>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-600">Faculty</label>
              <p className="text-lg text-gray-900 font-medium">{course?.facultyName}</p>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-600">Duration</label>
              <p className="text-lg text-gray-900 font-medium">{course?.duration}</p>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-600">Tuition</label>
              <p className="text-lg text-gray-900 font-medium">{course?.tuition}</p>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-600">Application Deadline</label>
              <p className="text-lg text-gray-900 font-medium">
                {course?.applicationDeadline?.toDate?.().toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Requirements */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <label className="text-sm font-semibold text-gray-600 mb-3 block">Admission Requirements</label>
            <ul className="space-y-2">
              {course?.requirements?.map((requirement, index) => (
                <li key={index} className="text-sm text-gray-700 flex items-start bg-green-50 rounded-lg p-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  {requirement}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Application Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Statement */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 transition-all duration-300 hover:shadow-xl">
            <h2 className="text-xl font-bold text-gray-900 mb-6 pb-3 border-b border-gray-200">Personal Statement</h2>
            <div>
              <label htmlFor="personalStatement" className="block text-sm font-semibold text-gray-700 mb-3">
                Why are you interested in this course? *
              </label>
              <textarea
                id="personalStatement"
                name="personalStatement"
                rows={8}
                value={formData.personalStatement}
                onChange={(e) => setFormData(prev => ({ ...prev, personalStatement: e.target.value }))}
                className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 resize-none text-gray-900 placeholder-gray-400 ${
                  errors.personalStatement ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300'
                }`}
                placeholder="Describe your interest in this course, your career goals, relevant experience, and why you would be a good fit for this program..."
              />
              {errors.personalStatement && (
                <p className="text-red-600 font-medium mt-2 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  {errors.personalStatement}
                </p>
              )}
              <div className="flex justify-between text-sm text-gray-500 mt-3">
                <span>Minimum 100 characters</span>
                <span className={`font-semibold ${
                  formData.personalStatement.length < 100 ? 'text-red-500' : 'text-green-500'
                }`}>
                  {formData.personalStatement.length} characters
                </span>
              </div>
            </div>
          </div>

          {/* Document Upload */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 transition-all duration-300 hover:shadow-xl">
            <h2 className="text-xl font-bold text-gray-900 mb-6 pb-3 border-b border-gray-200">Supporting Documents</h2>
            
            {/* File Upload Area */}
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-400 transition-all duration-300 bg-gray-50 hover:bg-blue-50">
              <input
                type="file"
                id="documents"
                multiple
                onChange={handleFileChange}
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                className="hidden"
              />
              <label htmlFor="documents" className="cursor-pointer block">
                <Upload className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-xl font-semibold text-gray-900 mb-3">
                  Upload supporting documents
                </p>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  Upload your transcripts, certificates, ID, and other required documents
                </p>
                <button
                  type="button"
                  className={`bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center mx-auto ${
                    uploading ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                  disabled={uploading}
                >
                  <Upload className="h-5 w-5 mr-2" />
                  {uploading ? 'Uploading...' : 'Choose Files'}
                </button>
              </label>
              <p className="text-sm text-gray-500 mt-6">
                Supported formats: PDF, Word, JPG, PNG (Max 5MB per file)
              </p>
            </div>

            {errors.documents && (
              <p className="text-red-600 font-medium mt-4 flex items-center">
                <AlertCircle className="h-4 w-4 mr-2" />
                {errors.documents}
              </p>
            )}

            {/* Uploaded Files List */}
            {formData.documents.length > 0 && (
              <div className="mt-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Uploaded Documents ({formData.documents.length})</h3>
                <div className="space-y-3">
                  {formData.documents.map((doc, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200 hover:bg-blue-50 transition-all duration-300">
                      <div className="flex items-center space-x-4">
                        <span className="text-2xl">{getFileIcon(doc.type)}</span>
                        <div>
                          <p className="font-semibold text-gray-900">{doc.name}</p>
                          <p className="text-sm text-gray-600">
                            {formatFileSize(doc.size)} • {doc.type.split('/')[1]?.toUpperCase()}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeDocument(index)}
                        className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-300 transform hover:scale-110"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Required Documents Info */}
          <div className="bg-blue-50 rounded-2xl border-2 border-blue-200 p-6 transition-all duration-300 hover:shadow-lg">
            <h3 className="text-lg font-bold text-blue-900 mb-4 flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Required Documents
            </h3>
            <ul className="space-y-3 text-blue-800">
              <li className="flex items-center bg-blue-100 rounded-lg p-3">
                <FileText className="h-4 w-4 mr-3 text-blue-600" />
                Academic transcripts and certificates
              </li>
              <li className="flex items-center bg-blue-100 rounded-lg p-3">
                <FileText className="h-4 w-4 mr-3 text-blue-600" />
                National ID or passport copy
              </li>
              <li className="flex items-center bg-blue-100 rounded-lg p-3">
                <FileText className="h-4 w-4 mr-3 text-blue-600" />
                Recent passport-sized photograph
              </li>
              <li className="flex items-center bg-blue-100 rounded-lg p-3">
                <FileText className="h-4 w-4 mr-3 text-blue-600" />
                Any other supporting documents
              </li>
            </ul>
          </div>

          {/* Submit Button */}
          <div className="flex flex-col sm:flex-row gap-4 justify-end pt-6">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="bg-gray-600 hover:bg-gray-700 text-white px-8 py-4 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center order-2 sm:order-1"
            >
              Cancel Application
            </button>
            <button
              type="submit"
              disabled={submitting}
              className={`px-8 py-4 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center order-1 sm:order-2 ${
                submitting 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                  Submitting Application...
                </>
              ) : (
                'Submit Application'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ApplicationForm