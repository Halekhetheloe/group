import React, { useState, useEffect } from 'react'
import { collection, addDoc, doc, updateDoc, getDocs } from 'firebase/firestore'
import { db } from '../../../firebase-config'
import { useAuth } from '../../../hooks/useAuth'
import { BookOpen, Clock, Users, DollarSign, Calendar, FileText } from 'lucide-react'
import toast from 'react-hot-toast'

const CourseForm = ({ course = null, onSuccess, onCancel }) => {
  const { userData } = useAuth()
  const [loading, setLoading] = useState(false)
  const [faculties, setFaculties] = useState([])
  
  const [formData, setFormData] = useState({
    title: '',
    code: '',
    description: '',
    facultyId: '',
    duration: '',
    durationUnit: 'months',
    fees: '',
    currency: 'LSL',
    intakeCapacity: '',
    requirements: [],
    applicationDeadline: '',
    startDate: '',
    status: 'active'
  })

  useEffect(() => {
    if (course) {
      setFormData({
        title: course.title || '',
        code: course.code || '',
        description: course.description || '',
        facultyId: course.facultyId || '',
        duration: course.duration || '',
        durationUnit: course.durationUnit || 'months',
        fees: course.fees || '',
        currency: course.currency || 'LSL',
        intakeCapacity: course.intakeCapacity || '',
        requirements: course.requirements || [],
        applicationDeadline: course.applicationDeadline || '',
        startDate: course.startDate || '',
        status: course.status || 'active'
      })
    }
    fetchFaculties()
  }, [course])

  const fetchFaculties = async () => {
    try {
      const facultiesQuery = collection(db, 'faculties')
      const facultiesSnapshot = await getDocs(facultiesQuery)
      const facultiesData = facultiesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      setFaculties(facultiesData)
    } catch (error) {
      console.error('Error fetching faculties:', error)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleRequirementsChange = (e) => {
    const requirements = e.target.value.split('\n').filter(req => req.trim())
    setFormData(prev => ({
      ...prev,
      requirements
    }))
  }

  const validateForm = () => {
    const required = ['title', 'code', 'description', 'facultyId', 'duration', 'intakeCapacity']
    for (let field of required) {
      if (!formData[field]) {
        toast.error(`${field.charAt(0).toUpperCase() + field.slice(1)} is required`)
        return false
      }
    }
    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setLoading(true)
    try {
      const courseData = {
        ...formData,
        institutionId: userData.institutionId || userData.uid,
        createdAt: course ? course.createdAt : new Date(),
        updatedAt: new Date(),
        fees: parseFloat(formData.fees) || 0,
        intakeCapacity: parseInt(formData.intakeCapacity) || 0,
        duration: parseInt(formData.duration) || 0
      }

      if (course) {
        // Update existing course
        await updateDoc(doc(db, 'courses', course.id), courseData)
        toast.success('Course updated successfully!')
      } else {
        // Create new course
        await addDoc(collection(db, 'courses'), courseData)
        toast.success('Course created successfully!')
      }

      if (onSuccess) onSuccess()
    } catch (error) {
      console.error('Error saving course:', error)
      toast.error('Failed to save course')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            {course ? 'Edit Course' : 'Create New Course'}
          </h2>
          {onCancel && (
            <button
              onClick={onCancel}
              className="btn-secondary"
            >
              Cancel
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Course Title *
              </label>
              <div className="relative">
                <BookOpen className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="input-field pl-10"
                  placeholder="e.g., Bachelor of Science in Information Technology"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Course Code *
              </label>
              <input
                type="text"
                name="code"
                value={formData.code}
                onChange={handleInputChange}
                className="input-field"
                placeholder="e.g., BSCIT2024"
                required
              />
            </div>
          </div>

          {/* Faculty Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Faculty/Department *
            </label>
            <select
              name="facultyId"
              value={formData.facultyId}
              onChange={handleInputChange}
              className="input-field"
              required
            >
              <option value="">Select Faculty</option>
              {faculties.map(faculty => (
                <option key={faculty.id} value={faculty.id}>
                  {faculty.name}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Course Description *
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 text-gray-400 h-4 w-4" />
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows="4"
                className="input-field pl-10"
                placeholder="Describe the course objectives, learning outcomes, and key topics..."
                required
              />
            </div>
          </div>

          {/* Duration and Capacity */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Duration *
              </label>
              <div className="flex space-x-2">
                <div className="flex-1">
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <input
                      type="number"
                      name="duration"
                      value={formData.duration}
                      onChange={handleInputChange}
                      className="input-field pl-10"
                      placeholder="e.g., 36"
                      min="1"
                      required
                    />
                  </div>
                </div>
                <select
                  name="durationUnit"
                  value={formData.durationUnit}
                  onChange={handleInputChange}
                  className="input-field w-32"
                >
                  <option value="months">Months</option>
                  <option value="years">Years</option>
                  <option value="semesters">Semesters</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Intake Capacity *
              </label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="number"
                  name="intakeCapacity"
                  value={formData.intakeCapacity}
                  onChange={handleInputChange}
                  className="input-field pl-10"
                  placeholder="e.g., 50"
                  min="1"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tuition Fees
              </label>
              <div className="flex space-x-2">
                <select
                  name="currency"
                  value={formData.currency}
                  onChange={handleInputChange}
                  className="input-field w-20"
                >
                  <option value="LSL">LSL</option>
                  <option value="USD">USD</option>
                  <option value="ZAR">ZAR</option>
                </select>
                <div className="flex-1 relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="number"
                    name="fees"
                    value={formData.fees}
                    onChange={handleInputChange}
                    className="input-field pl-10"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Application Deadline
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="date"
                  name="applicationDeadline"
                  value={formData.applicationDeadline}
                  onChange={handleInputChange}
                  className="input-field pl-10"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Course Start Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleInputChange}
                  className="input-field pl-10"
                />
              </div>
            </div>
          </div>

          {/* Requirements */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Admission Requirements (one per line)
            </label>
            <textarea
              value={formData.requirements.join('\n')}
              onChange={handleRequirementsChange}
              rows="4"
              className="input-field"
              placeholder="High School Diploma&#10;Mathematics Grade C or better&#10;English proficiency certificate"
            />
            <p className="text-xs text-gray-500 mt-1">
              Enter each requirement on a new line
            </p>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Course Status
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleInputChange}
              className="input-field"
            >
              <option value="active">Active - Accepting Applications</option>
              <option value="inactive">Inactive - Not Accepting Applications</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="btn-secondary"
                disabled={loading}
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
            >
              {loading ? 'Saving...' : course ? 'Update Course' : 'Create Course'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CourseForm