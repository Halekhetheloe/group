import React, { useState, useEffect } from 'react'
import { collection, query, where, getDocs, addDoc, updateDoc, doc, deleteDoc, orderBy } from 'firebase/firestore'
import { db } from '../../firebase-config'
import { useAuth } from '../../hooks/useAuth'
import { Plus, Search, Filter, Edit, Trash2, BookOpen, Clock, Users, DollarSign, Save, X, Target } from 'lucide-react'
import toast from 'react-hot-toast'

const CourseManagement = () => {
  const { user, userData } = useAuth()
  const [courses, setCourses] = useState([])
  const [filteredCourses, setFilteredCourses] = useState([])
  const [faculties, setFaculties] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [facultyFilter, setFacultyFilter] = useState('all')
  const [showForm, setShowForm] = useState(false)
  const [editingCourse, setEditingCourse] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    facultyId: '',
    duration: '',
    tuition: '',
    requirements: {
      minPoints: 60, // Minimum 60 points required
      subjects: [],
      certificates: ['High School Diploma']
    },
    seats: '',
    applicationDeadline: ''
  })
  const [errors, setErrors] = useState({})

  const subjectOptions = ['Mathematics', 'English', 'Science', 'Biology', 'Chemistry', 'Physics', 'History', 'Geography', 'Accounting', 'Economics']

  useEffect(() => {
    if (userData) {
      fetchData()
    }
  }, [userData])

  useEffect(() => {
    filterCourses()
  }, [courses, searchTerm, facultyFilter])

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

      // Fetch courses
      const coursesQuery = query(
        collection(db, 'courses'),
        where('institutionId', '==', userData.uid),
        orderBy('createdAt', 'desc')
      )
      const coursesSnapshot = await getDocs(coursesQuery)
      const coursesData = coursesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      setCourses(coursesData)

    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterCourses = () => {
    let filtered = courses

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(course =>
        course.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Faculty filter
    if (facultyFilter !== 'all') {
      filtered = filtered.filter(course => course.facultyId === facultyFilter)
    }

    setFilteredCourses(filtered)
  }

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.name.trim()) {
      newErrors.name = 'Course name is required'
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
    
    // Validate minimum points
    if (!formData.requirements.minPoints || formData.requirements.minPoints < 60) {
      newErrors.minPoints = 'Minimum points must be at least 60'
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
        facultyId: formData.facultyId,
        facultyName: faculty?.name,
        duration: formData.duration.trim(),
        tuition: formData.tuition.trim(),
        requirements: formData.requirements,
        seats: parseInt(formData.seats),
        applicationDeadline: new Date(formData.applicationDeadline),
        institutionId: userData.uid,
        institutionName: userData.displayName || userData.name || 'Your Institution',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      }

      if (editingCourse) {
        // Update existing course
        await updateDoc(doc(db, 'courses', editingCourse.id), courseData)
        toast.success('Course updated successfully!')
      } else {
        // Add new course
        await addDoc(collection(db, 'courses'), courseData)
        toast.success('Course added successfully!')
      }

      // Reset form and refresh data
      handleCancel()
      fetchData()
      
    } catch (error) {
      console.error('Error saving course:', error)
      toast.error('Failed to save course. Please try again.')
    }
  }

  const handleEdit = (course) => {
    setEditingCourse(course)
    setFormData({
      name: course.name,
      facultyId: course.facultyId,
      duration: course.duration,
      tuition: course.tuition,
      requirements: course.requirements || {
        minPoints: 60,
        subjects: [],
        certificates: ['High School Diploma']
      },
      seats: course.seats.toString(),
      applicationDeadline: course.applicationDeadline?.toDate?.().toISOString().split('T')[0] || ''
    })
    setShowForm(true)
  }

  const handleDelete = async (courseId) => {
    if (!window.confirm('Are you sure you want to delete this course? This action cannot be undone.')) {
      return
    }

    try {
      // Check if course has applications
      const applicationsQuery = query(
        collection(db, 'applications'),
        where('courseId', '==', courseId)
      )
      const applicationsSnapshot = await getDocs(applicationsQuery)
      
      if (applicationsSnapshot.docs.length > 0) {
        toast.error('Cannot delete course with existing applications. Please handle the applications first.')
        return
      }

      await deleteDoc(doc(db, 'courses', courseId))
      toast.success('Course deleted successfully!')
      fetchData()
    } catch (error) {
      console.error('Error deleting course:', error)
      toast.error('Failed to delete course. Please try again.')
    }
  }

  const handleCancel = () => {
    setFormData({
      name: '',
      facultyId: '',
      duration: '',
      tuition: '',
      requirements: {
        minPoints: 60,
        subjects: [],
        certificates: ['High School Diploma']
      },
      seats: '',
      applicationDeadline: ''
    })
    setShowForm(false)
    setEditingCourse(null)
    setErrors({})
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

  const handleRequirementChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      requirements: {
        ...prev.requirements,
        [field]: value
      }
    }))
  }

  const handleSubjectToggle = (subject) => {
    const currentSubjects = formData.requirements.subjects
    const newSubjects = currentSubjects.includes(subject)
      ? currentSubjects.filter(s => s !== subject)
      : [...currentSubjects, subject]
    
    setFormData(prev => ({
      ...prev,
      requirements: {
        ...prev.requirements,
        subjects: newSubjects
      }
    }))
  }

  const getFacultyName = (facultyId) => {
    const faculty = faculties.find(f => f.id === facultyId)
    return faculty?.name || 'Unknown Faculty'
  }

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A'
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    return date.toLocaleDateString()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="h-12 bg-gray-200 rounded mb-6"></div>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Course Management</h1>
            <p className="text-gray-600 mt-2">
              Manage academic courses and programs (Minimum 60 points required)
            </p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-all duration-200 flex items-center shadow-md hover:shadow-lg"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Course
          </button>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search courses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                />
              </div>
            </div>
            <div className="flex space-x-4">
              <select
                value={facultyFilter}
                onChange={(e) => setFacultyFilter(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
              >
                <option value="all">All Faculties</option>
                {faculties.map(faculty => (
                  <option key={faculty.id} value={faculty.id}>
                    {faculty.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Add/Edit Form */}
        {showForm && (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-6 transform transition-all duration-300">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingCourse ? 'Edit Course' : 'Add New Course'}
              </h2>
              <button
                onClick={handleCancel}
                className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
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
                      errors.name ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300'
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
                      errors.facultyId ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300'
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
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Clock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="duration"
                      name="duration"
                      type="text"
                      value={formData.duration}
                      onChange={handleChange}
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 ${
                        errors.duration ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300'
                      }`}
                      placeholder="e.g. 4 years, 2 semesters"
                    />
                  </div>
                  {errors.duration && <p className="text-sm text-red-600 mt-1">{errors.duration}</p>}
                </div>

                {/* Tuition */}
                <div className="space-y-2">
                  <label htmlFor="tuition" className="block text-sm font-medium text-gray-700">
                    Tuition Fee *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <DollarSign className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="tuition"
                      name="tuition"
                      type="text"
                      value={formData.tuition}
                      onChange={handleChange}
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 ${
                        errors.tuition ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300'
                      }`}
                      placeholder="e.g. M5,000 per semester"
                    />
                  </div>
                  {errors.tuition && <p className="text-sm text-red-600 mt-1">{errors.tuition}</p>}
                </div>

                {/* Seats */}
                <div className="space-y-2">
                  <label htmlFor="seats" className="block text-sm font-medium text-gray-700">
                    Available Seats *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Users className="h-5 w-5 mr-3 text-gray-400" />
                    </div>
                    <input
                      id="seats"
                      name="seats"
                      type="number"
                      min="1"
                      value={formData.seats}
                      onChange={handleChange}
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 ${
                        errors.seats ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Number of available seats"
                    />
                  </div>
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
                      errors.applicationDeadline ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.applicationDeadline && <p className="text-sm text-red-600 mt-1">{errors.applicationDeadline}</p>}
                </div>

                {/* Minimum Points Requirement */}
                <div className="md:col-span-2 space-y-2">
                  <label htmlFor="minPoints" className="block text-sm font-medium text-gray-700">
                    Minimum Points Required *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Target className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="minPoints"
                      name="minPoints"
                      type="number"
                      min="60"
                      max="100"
                      value={formData.requirements.minPoints}
                      onChange={(e) => handleRequirementChange('minPoints', parseInt(e.target.value))}
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 ${
                        errors.minPoints ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Minimum 60 points required"
                    />
                  </div>
                  {errors.minPoints && <p className="text-sm text-red-600 mt-1">{errors.minPoints}</p>}
                  <p className="text-xs text-gray-500 mt-1">
                    Students with less than {formData.requirements.minPoints} points will not see this course
                  </p>
                </div>

                {/* Required Subjects */}
                <div className="md:col-span-2 space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Required Subjects
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {subjectOptions.map(subject => (
                      <label key={subject} className="flex items-center space-x-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.requirements.subjects.includes(subject)}
                          onChange={() => handleSubjectToggle(subject)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">{subject}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-200 flex items-center"
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-200 flex items-center shadow-md hover:shadow-lg"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {editingCourse ? 'Update Course' : 'Add Course'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Courses List */}
        <div className="space-y-4">
          {filteredCourses.map((course) => (
            <div key={course.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-300">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">{course.name}</h3>
                      <div className="flex items-center space-x-4 mt-2">
                        <span className="text-sm text-gray-600">
                          {getFacultyName(course.facultyId)}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          course.status === 'active' 
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {course.status}
                        </span>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(course)}
                        className="p-2 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-all duration-200"
                        title="Edit Course"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(course.id)}
                        className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-all duration-200"
                        title="Delete Course"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm mb-4">
                    <div className="flex items-center text-gray-600">
                      <Clock className="h-5 w-5 mr-3 text-blue-500" />
                      <div>
                        <div className="font-medium">Duration</div>
                        <div>{course.duration}</div>
                      </div>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <DollarSign className="h-5 w-5 mr-3 text-green-500" />
                      <div>
                        <div className="font-medium">Tuition</div>
                        <div>{course.tuition}</div>
                      </div>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <Users className="h-5 w-5 mr-3 text-purple-500" />
                      <div>
                        <div className="font-medium">Seats</div>
                        <div>{course.seats} available</div>
                      </div>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <Target className="h-5 w-5 mr-3 text-orange-500" />
                      <div>
                        <div className="font-medium">Min Points</div>
                        <div>{course.requirements?.minPoints || 60}</div>
                      </div>
                    </div>
                  </div>

                  {/* Requirements Preview */}
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Admission Requirements:</h4>
                    <div className="space-y-2">
                      <div className="flex items-center text-sm text-gray-700">
                        <Target className="h-4 w-4 mr-2 text-orange-500" />
                        Minimum {course.requirements?.minPoints || 60} points required
                      </div>
                      {course.requirements?.subjects && course.requirements.subjects.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          <span className="text-sm font-medium text-gray-700">Required Subjects:</span>
                          {course.requirements.subjects.map((subject, index) => (
                            <span key={index} className="inline-block bg-blue-50 text-blue-700 text-sm px-3 py-1 rounded-lg border border-blue-100">
                              {subject}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredCourses.length === 0 && (
          <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-gray-200">
            <BookOpen className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {courses.length === 0 ? 'No courses yet' : 'No matching courses'}
            </h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              {courses.length === 0 
                ? 'Start by creating your first course to offer academic programs.'
                : 'Try adjusting your search terms or filters to find what you\'re looking for.'
              }
            </p>
            {courses.length === 0 && (
              <button 
                onClick={() => setShowForm(true)}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-all duration-200 flex items-center mx-auto shadow-md hover:shadow-lg"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Course
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default CourseManagement