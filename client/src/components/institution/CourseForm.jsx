import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { doc, getDoc, addDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '../../firebase-config'
import { useAuth } from '../../hooks/useAuth'
import toast from 'react-hot-toast'

const CourseForm = () => {
  const { userData } = useAuth()
  const { courseId } = useParams()
  const navigate = useNavigate()
  const [faculties, setFaculties] = useState([])
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    facultyId: '',
    duration: '',
    tuition: '',
    requirements: [''],
    seats: '',
    applicationDeadline: ''
  })
  const [errors, setErrors] = useState({})

  useEffect(() => {
    fetchData()
  }, [userData, courseId])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // Fetch faculties
      const facultiesQuery = query(
        collection(db, 'faculties'),
        where('institutionId', '==', userData.uid)
      )
      const facultiesSnapshot = await getDocs(facultiesQuery)
      const facultiesData = facultiesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      setFaculties(facultiesData)

      // If editing, fetch course data
      if (courseId) {
        const courseDoc = await getDoc(doc(db, 'courses', courseId))
        if (courseDoc.exists()) {
          const course = courseDoc.data()
          setFormData({
            name: course.name,
            description: course.description,
            facultyId: course.facultyId,
            duration: course.duration,
            tuition: course.tuition,
            requirements: course.requirements.length > 0 ? course.requirements : [''],
            seats: course.seats.toString(),
            applicationDeadline: course.applicationDeadline?.toDate?.().toISOString().split('T')[0] || ''
          })
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.name.trim()) {
      newErrors.name = 'Course name is required'
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required'
    }
    
    if (!formData.facultyId) {
      newErrors.facultyId = 'Faculty is required'
    }
    
    if (!formData.duration.trim()) {
      newErrors.duration = 'Duration is required'
    }
    
    if (!formData.tuition.trim()) {
      newErrors.tuition = 'Tuition fee is required'
    }
    
    if (!formData.seats || formData.seats < 1) {
      newErrors.seats = 'Number of seats is required'
    }
    
    if (!formData.applicationDeadline) {
      newErrors.applicationDeadline = 'Application deadline is required'
    } else if (new Date(formData.applicationDeadline) <= new Date()) {
      newErrors.applicationDeadline = 'Deadline must be in the future'
    }
    
    const validRequirements = formData.requirements.filter(req => req.trim())
    if (validRequirements.length === 0) {
      newErrors.requirements = 'At least one requirement is needed'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) return

    try {
      const faculty = faculties.find(f => f.id === formData.facultyId)
      
      const courseData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        facultyId: formData.facultyId,
        facultyName: faculty?.name,
        duration: formData.duration.trim(),
        tuition: formData.tuition.trim(),
        requirements: formData.requirements.filter(req => req.trim()),
        seats: parseInt(formData.seats),
        applicationDeadline: new Date(formData.applicationDeadline),
        institutionId: userData.uid,
        institutionName: userData.displayName || userData.name || 'Your Institution',
        status: 'active',
        updatedAt: new Date()
      }

      if (courseId) {
        // Update existing course
        await updateDoc(doc(db, 'courses', courseId), courseData)
        toast.success('Course updated successfully!')
      } else {
        // Add new course
        courseData.createdAt = new Date()
        await addDoc(collection(db, 'courses'), courseData)
        toast.success('Course added successfully!')
      }

      navigate('/institution/courses')
      
    } catch (error) {
      console.error('Error saving course:', error)
      toast.error('Failed to save course. Please try again.')
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

  const handleRequirementChange = (index, value) => {
    setFormData(prev => ({
      ...prev,
      requirements: prev.requirements.map((req, i) => i === index ? value : req)
    }))
  }

  const addRequirement = () => {
    setFormData(prev => ({
      ...prev,
      requirements: [...prev.requirements, '']
    }))
  }

  const removeRequirement = (index) => {
    if (formData.requirements.length > 1) {
      setFormData(prev => ({
        ...prev,
        requirements: prev.requirements.filter((_, i) => i !== index)
      }))
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="h-96 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/institution/courses')}
            className="text-blue-600 hover:text-blue-700 mb-4 flex items-center"
          >
            ← Back to Courses
          </button>
          <h1 className="text-3xl font-bold text-gray-900">
            {courseId ? 'Edit Course' : 'Add New Course'}
          </h1>
          <p className="text-gray-600 mt-2">
            {courseId ? 'Update your course information' : 'Create a new academic course or program'}
          </p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Course Name */}
              <div className="md:col-span-2 space-y-2">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Course Name *
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 ${
                    errors.name ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="e.g. Bachelor of Science in Information Technology"
                />
                {errors.name && <p className="text-sm text-red-600 mt-1">{errors.name}</p>}
              </div>

              {/* Faculty */}
              <div className="space-y-2">
                <label htmlFor="facultyId" className="block text-sm font-medium text-gray-700">
                  Faculty *
                </label>
                <select
                  id="facultyId"
                  name="facultyId"
                  value={formData.facultyId}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 ${
                    errors.facultyId ? 'border-red-300' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select Faculty</option>
                  {faculties.map(faculty => (
                    <option key={faculty.id} value={faculty.id}>
                      {faculty.name}
                    </option>
                  ))}
                </select>
                {errors.facultyId && <p className="text-sm text-red-600 mt-1">{errors.facultyId}</p>}
              </div>

              {/* Duration */}
              <div className="space-y-2">
                <label htmlFor="duration" className="block text-sm font-medium text-gray-700">
                  Duration *
                </label>
                <input
                  id="duration"
                  name="duration"
                  type="text"
                  value={formData.duration}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 ${
                    errors.duration ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="e.g. 4 years, 2 semesters"
                />
                {errors.duration && <p className="text-sm text-red-600 mt-1">{errors.duration}</p>}
              </div>

              {/* Tuition */}
              <div className="space-y-2">
                <label htmlFor="tuition" className="block text-sm font-medium text-gray-700">
                  Tuition Fee *
                </label>
                <input
                  id="tuition"
                  name="tuition"
                  type="text"
                  value={formData.tuition}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 ${
                    errors.tuition ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="e.g. M5,000 per semester"
                />
                {errors.tuition && <p className="text-sm text-red-600 mt-1">{errors.tuition}</p>}
              </div>

              {/* Seats */}
              <div className="space-y-2">
                <label htmlFor="seats" className="block text-sm font-medium text-gray-700">
                  Available Seats *
                </label>
                <input
                  id="seats"
                  name="seats"
                  type="number"
                  min="1"
                  value={formData.seats}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 ${
                    errors.seats ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Number of available seats"
                />
                {errors.seats && <p className="text-sm text-red-600 mt-1">{errors.seats}</p>}
              </div>

              {/* Application Deadline */}
              <div className="space-y-2">
                <label htmlFor="applicationDeadline" className="block text-sm font-medium text-gray-700">
                  Application Deadline *
                </label>
                <input
                  id="applicationDeadline"
                  name="applicationDeadline"
                  type="date"
                  value={formData.applicationDeadline}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 ${
                    errors.applicationDeadline ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {errors.applicationDeadline && <p className="text-sm text-red-600 mt-1">{errors.applicationDeadline}</p>}
              </div>

              {/* Description */}
              <div className="md:col-span-2 space-y-2">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Course Description *
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={4}
                  value={formData.description}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 resize-none ${
                    errors.description ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Describe the course, curriculum, career opportunities..."
                />
                {errors.description && <p className="text-sm text-red-600 mt-1">{errors.description}</p>}
              </div>

              {/* Requirements */}
              <div className="md:col-span-2 space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Admission Requirements *
                </label>
                <div className="space-y-3">
                  {formData.requirements.map((requirement, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <input
                        type="text"
                        value={requirement}
                        onChange={(e) => handleRequirementChange(index, e.target.value)}
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                        placeholder={`Requirement ${index + 1} (e.g., High School Diploma, Minimum GPA...)`}
                      />
                      {formData.requirements.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeRequirement(index)}
                          className="p-3 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addRequirement}
                    className="flex items-center text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200"
                  >
                    + Add Requirement
                  </button>
                  {errors.requirements && <p className="text-sm text-red-600 mt-1">{errors.requirements}</p>}
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => navigate('/institution/courses')}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200"
              >
                {courseId ? 'Update Course' : 'Add Course'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default CourseForm