import React, { useState, useEffect } from 'react'
import { collection, query, where, getDocs, addDoc, doc, getDoc, deleteDoc } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
import { db, storage } from '../../firebase-config'
import { useAuth } from '../../hooks/useAuth'
import { Upload, FileText, Download, Trash2, Plus, Award, BookOpen, Calendar, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'

const TranscriptUpload = () => {
  const { userData } = useAuth()
  const [transcripts, setTranscripts] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    institutionName: '',
    program: '',
    degree: '',
    gpa: '',
    completionDate: '',
    file: null
  })
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (userData) {
      fetchTranscripts()
    }
  }, [userData])

  const fetchTranscripts = async () => {
    try {
      setLoading(true)
      const transcriptsQuery = query(
        collection(db, 'transcripts'),
        where('studentId', '==', userData.uid)
      )
      const transcriptsSnapshot = await getDocs(transcriptsQuery)
      const transcriptsData = transcriptsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      setTranscripts(transcriptsData)
    } catch (error) {
      console.error('Error fetching transcripts:', error)
    } finally {
      setLoading(false)
    }
  }

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.institutionName.trim()) {
      newErrors.institutionName = 'Institution name is required'
    }
    
    if (!formData.program.trim()) {
      newErrors.program = 'Program name is required'
    }
    
    if (!formData.degree.trim()) {
      newErrors.degree = 'Degree type is required'
    }
    
    if (!formData.gpa || parseFloat(formData.gpa) < 0 || parseFloat(formData.gpa) > 4.0) {
      newErrors.gpa = 'Valid GPA between 0.0 and 4.0 is required'
    }
    
    if (!formData.completionDate) {
      newErrors.completionDate = 'Completion date is required'
    }
    
    if (!formData.file) {
      newErrors.file = 'Transcript file is required'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleFileUpload = async (file) => {
    if (!file) return null

    // Validate file type and size
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png']
    const maxSize = 10 * 1024 * 1024 // 10MB

    if (!allowedTypes.includes(file.type)) {
      toast.error('Please upload PDF or image files only')
      return null
    }

    if (file.size > maxSize) {
      toast.error('File size must be less than 10MB')
      return null
    }

    try {
      // Create a unique file name
      const fileExtension = file.name.split('.').pop()
      const fileName = `transcripts/${userData.uid}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExtension}`
      
      // Upload file to Firebase Storage
      const storageRef = ref(storage, fileName)
      const snapshot = await uploadBytes(storageRef, file)
      const downloadURL = await getDownloadURL(snapshot.ref)
      
      return {
        name: file.name,
        type: file.type,
        size: file.size,
        url: downloadURL,
        storagePath: fileName
      }
    } catch (error) {
      console.error('Error uploading file:', error)
      toast.error('Failed to upload file')
      return null
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setUploading(true)

    try {
      // Upload the file first
      const uploadedFile = await handleFileUpload(formData.file)
      if (!uploadedFile) {
        setUploading(false)
        return
      }

      // Save transcript data to Firestore
      const transcriptData = {
        studentId: userData.uid,
        studentName: userData.displayName,
        studentEmail: userData.email,
        institutionName: formData.institutionName.trim(),
        program: formData.program.trim(),
        degree: formData.degree.trim(),
        gpa: parseFloat(formData.gpa),
        completionDate: new Date(formData.completionDate),
        file: uploadedFile,
        verified: false, // Would be verified by institutions
        uploadedAt: new Date(),
        verifiedAt: null,
        verifiedBy: null
      }

      await addDoc(collection(db, 'transcripts'), transcriptData)
      
      toast.success('Transcript uploaded successfully!')
      resetForm()
      fetchTranscripts() // Refresh the list
    } catch (error) {
      console.error('Error uploading transcript:', error)
      toast.error('Failed to upload transcript. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const deleteTranscript = async (transcriptId, storagePath) => {
    if (!window.confirm('Are you sure you want to delete this transcript? This action cannot be undone.')) {
      return
    }

    try {
      // Delete from Firestore
      await deleteDoc(doc(db, 'transcripts', transcriptId))
      
      // Delete from Storage
      const fileRef = ref(storage, storagePath)
      await deleteObject(fileRef)
      
      toast.success('Transcript deleted successfully!')
      fetchTranscripts() // Refresh the list
    } catch (error) {
      console.error('Error deleting transcript:', error)
      toast.error('Failed to delete transcript. Please try again.')
    }
  }

  const resetForm = () => {
    setFormData({
      institutionName: '',
      program: '',
      degree: '',
      gpa: '',
      completionDate: '',
      file: null
    })
    setErrors({})
    setShowForm(false)
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    setFormData(prev => ({ ...prev, file }))
    if (errors.file) {
      setErrors(prev => ({ ...prev, file: '' }))
    }
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A'
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long' 
    })
  }

  const calculateOverallGPA = () => {
    if (transcripts.length === 0) return 0
    const totalGPA = transcripts.reduce((sum, transcript) => sum + transcript.gpa, 0)
    return (totalGPA / transcripts.length).toFixed(2)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="h-12 bg-gray-200 rounded mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-64 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Academic Transcripts</h1>
            <p className="text-gray-600 mt-2">
              Manage your academic records and transcripts
            </p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="btn-primary flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Upload Transcript
          </button>
        </div>

        {/* Overall GPA Summary */}
        {transcripts.length > 0 && (
          <div className="card mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Academic Summary</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-700">{transcripts.length}</div>
                <div className="text-blue-600">Transcripts</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-700">{calculateOverallGPA()}</div>
                <div className="text-green-600">Overall GPA</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-700">
                  {transcripts.filter(t => t.verified).length}
                </div>
                <div className="text-purple-600">Verified</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-700">
                  {new Set(transcripts.map(t => t.institutionName)).size}
                </div>
                <div className="text-orange-600">Institutions</div>
              </div>
            </div>
          </div>
        )}

        {/* Upload Form */}
        {showForm && (
          <div className="card mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Upload New Transcript</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Institution Name */}
                <div>
                  <label htmlFor="institutionName" className="form-label">
                    Institution Name *
                  </label>
                  <input
                    id="institutionName"
                    name="institutionName"
                    type="text"
                    value={formData.institutionName}
                    onChange={(e) => setFormData(prev => ({ ...prev, institutionName: e.target.value }))}
                    className={`input-field ${errors.institutionName ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                    placeholder="e.g. Limkokwing University"
                  />
                  {errors.institutionName && <p className="error-message">{errors.institutionName}</p>}
                </div>

                {/* Program */}
                <div>
                  <label htmlFor="program" className="form-label">
                    Program/Field of Study *
                  </label>
                  <input
                    id="program"
                    name="program"
                    type="text"
                    value={formData.program}
                    onChange={(e) => setFormData(prev => ({ ...prev, program: e.target.value }))}
                    className={`input-field ${errors.program ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                    placeholder="e.g. Information Technology"
                  />
                  {errors.program && <p className="error-message">{errors.program}</p>}
                </div>

                {/* Degree Type */}
                <div>
                  <label htmlFor="degree" className="form-label">
                    Degree/Certificate *
                  </label>
                  <select
                    id="degree"
                    name="degree"
                    value={formData.degree}
                    onChange={(e) => setFormData(prev => ({ ...prev, degree: e.target.value }))}
                    className={`input-field ${errors.degree ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                  >
                    <option value="">Select Degree Type</option>
                    <option value="High School">High School Diploma</option>
                    <option value="Certificate">Certificate</option>
                    <option value="Diploma">Diploma</option>
                    <option value="Associate">Associate Degree</option>
                    <option value="Bachelor">Bachelor's Degree</option>
                    <option value="Master">Master's Degree</option>
                    <option value="PhD">PhD/Doctorate</option>
                    <option value="Other">Other</option>
                  </select>
                  {errors.degree && <p className="error-message">{errors.degree}</p>}
                </div>

                {/* GPA */}
                <div>
                  <label htmlFor="gpa" className="form-label">
                    GPA (0.0 - 4.0) *
                  </label>
                  <input
                    id="gpa"
                    name="gpa"
                    type="number"
                    step="0.01"
                    min="0"
                    max="4.0"
                    value={formData.gpa}
                    onChange={(e) => setFormData(prev => ({ ...prev, gpa: e.target.value }))}
                    className={`input-field ${errors.gpa ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                    placeholder="e.g. 3.75"
                  />
                  {errors.gpa && <p className="error-message">{errors.gpa}</p>}
                </div>

                {/* Completion Date */}
                <div>
                  <label htmlFor="completionDate" className="form-label">
                    Completion Date *
                  </label>
                  <input
                    id="completionDate"
                    name="completionDate"
                    type="month"
                    value={formData.completionDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, completionDate: e.target.value }))}
                    className={`input-field ${errors.completionDate ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                  />
                  {errors.completionDate && <p className="error-message">{errors.completionDate}</p>}
                </div>

                {/* File Upload */}
                <div className="md:col-span-2">
                  <label htmlFor="file" className="form-label">
                    Transcript File *
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors duration-200">
                    <input
                      type="file"
                      id="file"
                      name="file"
                      onChange={handleFileChange}
                      accept=".pdf,.jpg,.jpeg,.png"
                      className="hidden"
                    />
                    <label htmlFor="file" className="cursor-pointer">
                      <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-lg font-medium text-gray-900 mb-2">
                        {formData.file ? formData.file.name : 'Upload your transcript'}
                      </p>
                      <p className="text-sm text-gray-600 mb-4">
                        Upload your official transcript or academic record
                      </p>
                      <button
                        type="button"
                        className="btn-primary"
                      >
                        Choose File
                      </button>
                    </label>
                    {formData.file && (
                      <p className="text-sm text-gray-500 mt-4">
                        Selected: {formData.file.name} ({formatFileSize(formData.file.size)})
                      </p>
                    )}
                  </div>
                  {errors.file && <p className="error-message mt-2">{errors.file}</p>}
                  <p className="text-xs text-gray-500 mt-2">
                    Supported formats: PDF, JPG, PNG (Max 10MB)
                  </p>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={resetForm}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="btn-primary"
                >
                  {uploading ? 'Uploading...' : 'Upload Transcript'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Transcripts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {transcripts.map((transcript) => (
            <div key={transcript.id} className="card group hover:shadow-lg transition-shadow duration-300">
              {/* Transcript Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Award className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{transcript.program}</h3>
                    <p className="text-sm text-gray-600">{transcript.institutionName}</p>
                  </div>
                </div>
                <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <button
                    onClick={() => window.open(transcript.file.url, '_blank')}
                    className="p-1 text-gray-400 hover:text-blue-600 rounded hover:bg-blue-50 transition-colors duration-200"
                    title="View Transcript"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => deleteTranscript(transcript.id, transcript.file.storagePath)}
                    className="p-1 text-gray-400 hover:text-red-600 rounded hover:bg-red-50 transition-colors duration-200"
                    title="Delete Transcript"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Transcript Details */}
              <div className="space-y-3 mb-4">
                <div className="flex items-center text-sm text-gray-600">
                  <BookOpen className="h-4 w-4 mr-2" />
                  {transcript.degree}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Calendar className="h-4 w-4 mr-2" />
                  Completed {formatDate(transcript.completionDate)}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <FileText className="h-4 w-4 mr-2" />
                  GPA: <span className="font-semibold ml-1">{transcript.gpa}/4.0</span>
                </div>
              </div>

              {/* Verification Status */}
              <div className={`flex items-center justify-between p-3 rounded-lg ${
                transcript.verified 
                  ? 'bg-green-50 border border-green-200' 
                  : 'bg-yellow-50 border border-yellow-200'
              }`}>
                <div className="flex items-center">
                  {transcript.verified ? (
                    <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                  ) : (
                    <FileText className="h-4 w-4 text-yellow-600 mr-2" />
                  )}
                  <span className={`text-sm font-medium ${
                    transcript.verified ? 'text-green-800' : 'text-yellow-800'
                  }`}>
                    {transcript.verified ? 'Verified' : 'Pending Verification'}
                  </span>
                </div>
                {transcript.verified && transcript.verifiedAt && (
                  <span className="text-xs text-green-600">
                    {formatDate(transcript.verifiedAt)}
                  </span>
                )}
              </div>

              {/* Upload Date */}
              <div className="mt-3 pt-3 border-t border-gray-200">
                <p className="text-xs text-gray-500">
                  Uploaded {formatDate(transcript.uploadedAt)}
                </p>
              </div>
            </div>
          ))}
        </div>

        {transcripts.length === 0 && !showForm && (
          <div className="text-center py-12">
            <Award className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No Transcripts Yet</h2>
            <p className="text-gray-600 mb-6">
              Upload your academic transcripts to enhance your profile and applications.
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="btn-primary"
            >
              Upload Your First Transcript
            </button>
          </div>
        )}

        {/* Important Information */}
        <div className="card mt-6 bg-blue-50 border-blue-200">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">Important Information</h3>
          <div className="text-sm text-blue-800 space-y-2">
            <p>• Upload official transcripts from all institutions you've attended</p>
            <p>• Ensure transcripts are clear and legible</p>
            <p>• Institutions may verify your transcripts during application review</p>
            <p>• Keep your transcripts updated with new academic achievements</p>
            <p>• Contact institutions directly for transcript verification issues</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TranscriptUpload