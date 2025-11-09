import React, { useState, useEffect } from 'react'
import { collection, query, where, getDocs, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore'
import { db } from '../../firebase-config'
import { useAuth } from '../../hooks/useAuth'
import { Plus, Search, Edit, Trash2, Building2, Users, BookOpen, Save, X } from 'lucide-react'
import toast from 'react-hot-toast'

const FacultyManagement = () => {
  const { user, userData } = useAuth()
  const [faculties, setFaculties] = useState([])
  const [filteredFaculties, setFilteredFaculties] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingFaculty, setEditingFaculty] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    dean: '',
    contactEmail: ''
  })
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (userData) {
      fetchFaculties()
    }
  }, [userData])

  useEffect(() => {
    filterFaculties()
  }, [faculties, searchTerm])

  const fetchFaculties = async () => {
    try {
      setLoading(true)
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
    } catch (error) {
      console.error('Error fetching faculties:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterFaculties = () => {
    let filtered = faculties

    if (searchTerm) {
      filtered = filtered.filter(faculty =>
        faculty.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        faculty.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    setFilteredFaculties(filtered)
  }

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.name.trim()) {
      newErrors.name = 'Faculty name is required'
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) return

    try {
      const facultyData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        dean: formData.dean.trim(),
        contactEmail: formData.contactEmail.trim(),
        institutionId: userData.uid,
        institutionName: userData.displayName || userData.name || 'Your Institution', // FIXED: Use available fields
        createdAt: new Date(),
        updatedAt: new Date()
      }

      if (editingFaculty) {
        // Update existing faculty
        await updateDoc(doc(db, 'faculties', editingFaculty.id), facultyData)
        toast.success('Faculty updated successfully!')
      } else {
        // Add new faculty
        await addDoc(collection(db, 'faculties'), facultyData)
        toast.success('Faculty added successfully!')
      }

      // Reset form and refresh data
      setFormData({ name: '', description: '', dean: '', contactEmail: '' })
      setShowForm(false)
      setEditingFaculty(null)
      fetchFaculties()
      
    } catch (error) {
      console.error('Error saving faculty:', error)
      toast.error('Failed to save faculty. Please try again.')
    }
  }

  const handleEdit = (faculty) => {
    setEditingFaculty(faculty)
    setFormData({
      name: faculty.name,
      description: faculty.description,
      dean: faculty.dean || '',
      contactEmail: faculty.contactEmail || ''
    })
    setShowForm(true)
  }

  const handleDelete = async (facultyId) => {
    if (!window.confirm('Are you sure you want to delete this faculty? This action cannot be undone.')) {
      return
    }

    try {
      // Check if faculty has courses
      const coursesQuery = query(
        collection(db, 'courses'),
        where('facultyId', '==', facultyId)
      )
      const coursesSnapshot = await getDocs(coursesQuery)
      
      if (coursesSnapshot.docs.length > 0) {
        toast.error('Cannot delete faculty with existing courses. Please delete or move the courses first.')
        return
      }

      await deleteDoc(doc(db, 'faculties', facultyId))
      toast.success('Faculty deleted successfully!')
      fetchFaculties()
    } catch (error) {
      console.error('Error deleting faculty:', error)
      toast.error('Failed to delete faculty. Please try again.')
    }
  }

  const handleCancel = () => {
    setFormData({ name: '', description: '', dean: '', contactEmail: '' })
    setShowForm(false)
    setEditingFaculty(null)
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="h-12 bg-gray-200 rounded mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-48 bg-gray-200 rounded-lg"></div>
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
            <h1 className="text-3xl font-bold text-gray-900">Faculty Management</h1>
            <p className="text-gray-600 mt-2">
              Manage academic faculties and departments
            </p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-all duration-200 flex items-center shadow-md hover:shadow-lg"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Faculty
          </button>
        </div>

        {/* Search */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search faculties..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
              />
            </div>
          </div>
        </div>

        {/* Add/Edit Form */}
        {showForm && (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-6 transform transition-all duration-300">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingFaculty ? 'Edit Faculty' : 'Add New Faculty'}
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
                <div className="space-y-2">
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Faculty Name *
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
                    placeholder="e.g. Faculty of Information Technology"
                  />
                  {errors.name && <p className="text-sm text-red-600 mt-1">{errors.name}</p>}
                </div>

                <div className="space-y-2">
                  <label htmlFor="dean" className="block text-sm font-medium text-gray-700">
                    Dean Name
                  </label>
                  <input
                    id="dean"
                    name="dean"
                    type="text"
                    value={formData.dean}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    placeholder="e.g. Dr. John Smith"
                  />
                </div>

                <div className="md:col-span-2 space-y-2">
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                    Description *
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    rows={4}
                    value={formData.description}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 resize-none ${
                      errors.description ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Describe the faculty, its programs, and areas of focus..."
                  />
                  {errors.description && <p className="text-sm text-red-600 mt-1">{errors.description}</p>}
                </div>

                <div className="space-y-2">
                  <label htmlFor="contactEmail" className="block text-sm font-medium text-gray-700">
                    Contact Email
                  </label>
                  <input
                    id="contactEmail"
                    name="contactEmail"
                    type="email"
                    value={formData.contactEmail}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    placeholder="faculty@institution.edu.ls"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
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
                  {editingFaculty ? 'Update Faculty' : 'Add Faculty'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Faculties Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFaculties.map((faculty) => (
            <div key={faculty.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-300">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Building2 className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{faculty.name}</h3>
                    {faculty.dean && (
                      <p className="text-sm text-gray-600">Dean: {faculty.dean}</p>
                    )}
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEdit(faculty)}
                    className="p-2 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-all duration-200"
                    title="Edit Faculty"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(faculty.id)}
                    className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-all duration-200"
                    title="Delete Faculty"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                {faculty.description}
              </p>

              <div className="flex items-center justify-between text-sm text-gray-500">
                <div className="flex items-center">
                  <BookOpen className="h-4 w-4 mr-1" />
                  <span>0 courses</span>
                </div>
                {faculty.contactEmail && (
                  <div className="flex items-center">
                    <Users className="h-4 w-4 mr-1" />
                    <span className="truncate max-w-[120px]">{faculty.contactEmail}</span>
                  </div>
                )}
              </div>

              {faculty.createdAt && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="text-xs text-gray-500">
                    Created: {faculty.createdAt.toDate?.().toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        {filteredFaculties.length === 0 && (
          <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-gray-200">
            <Building2 className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {faculties.length === 0 ? 'No faculties yet' : 'No matching faculties'}
            </h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              {faculties.length === 0 
                ? 'Start by creating your first faculty to organize your academic departments.'
                : 'Try adjusting your search terms to find what you\'re looking for.'
              }
            </p>
            {faculties.length === 0 && (
              <button 
                onClick={() => setShowForm(true)}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-all duration-200 flex items-center mx-auto shadow-md hover:shadow-lg"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Faculty
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default FacultyManagement