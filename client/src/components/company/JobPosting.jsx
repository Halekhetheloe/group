import React, { useState } from 'react'
import { collection, addDoc } from 'firebase/firestore'
import { db } from '../../firebase-config'
import { useAuth } from '../../hooks/useAuth'
import toast from 'react-hot-toast'

const JobPosting = () => {
  const { userData } = useAuth()
  const [activeSection, setActiveSection] = useState('basic')
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    jobType: 'full-time',
    location: '',
    salary: '',
    deadline: '',
    // SIMPLIFIED: Only educational level and GPA requirements
    requirements: {
      educationLevel: '',
      minGPA: ''
    }
  })
  const [loading, setLoading] = useState(false)

  const educationLevels = [
    { value: 'high_school', label: 'High School Diploma' },
    { value: 'associate', label: 'Associate Degree' },
    { value: 'bachelor', label: "Bachelor's Degree" },
    { value: 'master', label: "Master's Degree" },
    { value: 'phd', label: 'PhD' }
  ]

  const jobTypes = [
    'full-time',
    'part-time',
    'contract',
    'internship',
    'remote'
  ]

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleRequirementsChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      requirements: {
        ...prev.requirements,
        [field]: value
      }
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Validate form
      if (!formData.title || !formData.description || !formData.location) {
        toast.error('Please fill in all required fields')
        return
      }

      const jobData = {
        title: formData.title,
        description: formData.description,
        type: formData.jobType,
        location: formData.location,
        salary: formData.salary,
        applicationDeadline: formData.deadline,
        companyId: userData.uid,
        companyName: userData.displayName || userData.companyName,
        status: 'active',
        createdAt: new Date(),
        // SIMPLIFIED: Only educational level and GPA requirements
        requirements: {
          educationalLevel: formData.requirements.educationLevel || '',
          minGPA: formData.requirements.minGPA ? parseFloat(formData.requirements.minGPA) : 0
        }
      }

      await addDoc(collection(db, 'jobs'), jobData)
      
      toast.success('Job posted successfully! Only students meeting your educational requirements will see this job.')
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        jobType: 'full-time',
        location: '',
        salary: '',
        deadline: '',
        requirements: {
          educationLevel: '',
          minGPA: ''
        }
      })
      setActiveSection('basic')
      
    } catch (error) {
      console.error('Error posting job:', error)
      toast.error('Failed to post job. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const SectionButton = ({ id, title, isActive }) => (
    <button
      type="button"
      onClick={() => setActiveSection(id)}
      className={`flex items-center space-x-3 px-6 py-4 w-full text-left rounded-lg transition-all duration-200 ${
        isActive 
          ? 'bg-blue-600 text-white shadow-lg transform -translate-y-1' 
          : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
      }`}
    >
      <span className="font-medium">{title}</span>
    </button>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Post a New Job</h1>
          <p className="text-gray-600 mt-2">
            Create a job posting - students will only see jobs that match their educational qualifications
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1 space-y-3">
            <SectionButton
              id="basic"
              title="Job Details"
              isActive={activeSection === 'basic'}
            />
            <SectionButton
              id="requirements"
              title="Qualifications"
              isActive={activeSection === 'requirements'}
            />
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <form onSubmit={handleSubmit}>
              <div className="bg-white rounded-2xl shadow-xl p-6">
                {/* Basic Information */}
                {activeSection === 'basic' && (
                  <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Job Details</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Job Title *
                        </label>
                        <input
                          type="text"
                          name="title"
                          value={formData.title}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                          placeholder="e.g., Software Engineer"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Job Type *
                        </label>
                        <select
                          name="jobType"
                          value={formData.jobType}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        >
                          {jobTypes.map(type => (
                            <option key={type} value={type}>
                              {type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Location *
                        </label>
                        <input
                          type="text"
                          name="location"
                          value={formData.location}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                          placeholder="e.g., Maseru, Lesotho"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Salary Range
                        </label>
                        <input
                          type="text"
                          name="salary"
                          value={formData.salary}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                          placeholder="e.g., M5000 - M8000"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Job Description *
                        </label>
                        <textarea
                          name="description"
                          value={formData.description}
                          onChange={handleInputChange}
                          rows={6}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                          placeholder="Describe the job responsibilities, expectations, and what makes your company great..."
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Application Deadline
                        </label>
                        <input
                          type="date"
                          name="deadline"
                          value={formData.deadline}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                          min={new Date().toISOString().split('T')[0]}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Educational Requirements */}
                {activeSection === 'requirements' && (
                  <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Educational Requirements</h2>
                    <p className="text-gray-600 mb-6">
                      Set the minimum educational qualifications. Only students meeting these requirements will see this job.
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Minimum Education Level
                        </label>
                        <select
                          value={formData.requirements.educationLevel}
                          onChange={(e) => handleRequirementsChange('educationLevel', e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        >
                          <option value="">No Minimum (Any Education Level)</option>
                          {educationLevels.map(level => (
                            <option key={level.value} value={level.value}>
                              {level.label}
                            </option>
                          ))}
                        </select>
                        <p className="text-sm text-gray-500 mt-2">
                          Students must have this education level or higher
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Minimum GPA (4.0 scale)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          max="4.0"
                          value={formData.requirements.minGPA}
                          onChange={(e) => handleRequirementsChange('minGPA', e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                          placeholder="e.g., 3.0"
                        />
                        <p className="text-sm text-gray-500 mt-2">
                          Students must have at least this GPA
                        </p>
                      </div>
                    </div>

                    {/* Requirements Preview */}
                    <div className="mt-8 p-6 bg-blue-50 rounded-lg border border-blue-200">
                      <h3 className="text-lg font-semibold text-blue-900 mb-4">Qualification Preview</h3>
                      <div className="space-y-3">
                        <div className="flex items-center">
                          <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                          <div>
                            <p className="font-medium text-blue-800">Education Level</p>
                            <p className="text-sm text-blue-600">
                              {formData.requirements.educationLevel 
                                ? educationLevels.find(l => l.value === formData.requirements.educationLevel)?.label 
                                : 'Any education level accepted'
                              }
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                          <div>
                            <p className="font-medium text-blue-800">Minimum GPA</p>
                            <p className="text-sm text-blue-600">
                              {formData.requirements.minGPA 
                                ? `${formData.requirements.minGPA} or higher` 
                                : 'No GPA requirement'
                              }
                            </p>
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-blue-700 mt-4">
                        Students will only see this job if they meet ALL the requirements above.
                      </p>
                    </div>
                  </div>
                )}

                {/* Navigation Buttons */}
                <div className="flex justify-between pt-8 mt-8 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => {
                      const sections = ['basic', 'requirements']
                      const currentIndex = sections.indexOf(activeSection)
                      if (currentIndex > 0) {
                        setActiveSection(sections[currentIndex - 1])
                      }
                    }}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                    disabled={activeSection === 'basic'}
                  >
                    Previous
                  </button>
                  
                  {activeSection === 'requirements' ? (
                    <button
                      type="submit"
                      disabled={loading}
                      className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-3 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg"
                    >
                      {loading ? 'Posting Job...' : 'Post Job'}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        const sections = ['basic', 'requirements']
                        const currentIndex = sections.indexOf(activeSection)
                        if (currentIndex < sections.length - 1) {
                          setActiveSection(sections[currentIndex + 1])
                        }
                      }}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors duration-200"
                    >
                      Next
                    </button>
                  )}
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

export default JobPosting