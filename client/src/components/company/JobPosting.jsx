import React, { useState } from 'react'
import { collection, addDoc } from 'firebase/firestore'
import { db } from '../../firebase-config'
import { useAuth } from '../../hooks/useAuth'
import toast from 'react-hot-toast'
import { Plus, X, BookOpen, Award, GraduationCap, Briefcase } from 'lucide-react'

const JobPosting = () => {
  const { userData } = useAuth()
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    jobType: 'full-time',
    location: '',
    salary: '',
    deadline: '',
    requirements: {
      minGPA: '',
      educationLevel: '',
      requiredCertificates: [],
      requiredSkills: [],
      minExperience: '',
      degreeType: '',
      requiredDocuments: []
    }
  })
  const [currentCertificate, setCurrentCertificate] = useState('')
  const [currentSkill, setCurrentSkill] = useState('')
  const [loading, setLoading] = useState(false)

  const educationLevels = [
    { value: 'high_school', label: 'High School Diploma' },
    { value: 'associate', label: 'Associate Degree' },
    { value: 'bachelor', label: "Bachelor's Degree" },
    { value: 'master', label: "Master's Degree" },
    { value: 'phd', label: 'PhD' }
  ]

  const degreeTypes = [
    'Computer Science',
    'Engineering',
    'Business Administration',
    'Medicine',
    'Law',
    'Arts',
    'Sciences',
    'Education',
    'Other'
  ]

  const jobTypes = [
    'full-time',
    'part-time',
    'contract',
    'internship',
    'remote'
  ]

  const experienceLevels = [
    'no_experience',
    'internship',
    'entry_level',
    'mid_level',
    'senior_level',
    'executive'
  ]

  const documentTypes = [
    'transcript',
    'diploma',
    'certificate',
    'portfolio',
    'recommendation_letter',
    'cover_letter'
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

  const addCertificate = () => {
    if (currentCertificate.trim() && !formData.requirements.requiredCertificates.includes(currentCertificate.trim())) {
      handleRequirementsChange('requiredCertificates', [
        ...formData.requirements.requiredCertificates,
        currentCertificate.trim()
      ])
      setCurrentCertificate('')
    }
  }

  const removeCertificate = (certificate) => {
    handleRequirementsChange('requiredCertificates', 
      formData.requirements.requiredCertificates.filter(c => c !== certificate)
    )
  }

  const addSkill = () => {
    if (currentSkill.trim() && !formData.requirements.requiredSkills.includes(currentSkill.trim())) {
      handleRequirementsChange('requiredSkills', [
        ...formData.requirements.requiredSkills,
        currentSkill.trim()
      ])
      setCurrentSkill('')
    }
  }

  const removeSkill = (skill) => {
    handleRequirementsChange('requiredSkills', 
      formData.requirements.requiredSkills.filter(s => s !== skill)
    )
  }

  const toggleDocument = (document) => {
    const currentDocs = formData.requirements.requiredDocuments
    const newDocs = currentDocs.includes(document)
      ? currentDocs.filter(d => d !== document)
      : [...currentDocs, document]
    
    handleRequirementsChange('requiredDocuments', newDocs)
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
        ...formData,
        companyId: userData.uid,
        companyName: userData.displayName || userData.companyName,
        status: 'active',
        createdAt: new Date(),
        applications: 0,
        // Ensure requirements are properly formatted
        requirements: {
          minGPA: formData.requirements.minGPA ? parseFloat(formData.requirements.minGPA) : null,
          educationLevel: formData.requirements.educationLevel || null,
          requiredCertificates: formData.requirements.requiredCertificates,
          requiredSkills: formData.requirements.requiredSkills,
          minExperience: formData.requirements.minExperience || null,
          degreeType: formData.requirements.degreeType || null,
          requiredDocuments: formData.requirements.requiredDocuments
        }
      }

      await addDoc(collection(db, 'jobs'), jobData)
      
      toast.success('Job posted successfully!')
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        jobType: 'full-time',
        location: '',
        salary: '',
        deadline: '',
        requirements: {
          minGPA: '',
          educationLevel: '',
          requiredCertificates: [],
          requiredSkills: [],
          minExperience: '',
          degreeType: '',
          requiredDocuments: []
        }
      })
      
    } catch (error) {
      console.error('Error posting job:', error)
      toast.error('Failed to post job. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Post a New Job</h1>
          <p className="text-gray-600 mt-2">
            Create a job posting with specific requirements to find qualified candidates
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Job Information */}
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Basic Job Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Job Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder="e.g., Software Engineer"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Job Type *
                </label>
                <select
                  name="jobType"
                  value={formData.jobType}
                  onChange={handleInputChange}
                  className="input-field"
                >
                  {jobTypes.map(type => (
                    <option key={type} value={type}>
                      {type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location *
                </label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder="e.g., Maseru, Lesotho"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Salary Range
                </label>
                <input
                  type="text"
                  name="salary"
                  value={formData.salary}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder="e.g., M5000 - M8000"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Job Description *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={6}
                  className="input-field"
                  placeholder="Describe the job responsibilities, expectations, and what makes your company great..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Application Deadline
                </label>
                <input
                  type="date"
                  name="deadline"
                  value={formData.deadline}
                  onChange={handleInputChange}
                  className="input-field"
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>
          </div>

          {/* Academic Requirements */}
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <GraduationCap className="h-5 w-5 mr-2 text-blue-600" />
              Academic Requirements
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Minimum GPA
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="4.0"
                  value={formData.requirements.minGPA}
                  onChange={(e) => handleRequirementsChange('minGPA', e.target.value)}
                  className="input-field"
                  placeholder="e.g., 3.0"
                />
                <p className="text-xs text-gray-500 mt-1">Leave empty if no GPA requirement</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Minimum Education Level
                </label>
                <select
                  value={formData.requirements.educationLevel}
                  onChange={(e) => handleRequirementsChange('educationLevel', e.target.value)}
                  className="input-field"
                >
                  <option value="">Any Education Level</option>
                  {educationLevels.map(level => (
                    <option key={level.value} value={level.value}>
                      {level.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Required Degree Type
                </label>
                <select
                  value={formData.requirements.degreeType}
                  onChange={(e) => handleRequirementsChange('degreeType', e.target.value)}
                  className="input-field"
                >
                  <option value="">Any Degree Type</option>
                  {degreeTypes.map(degree => (
                    <option key={degree} value={degree}>
                      {degree}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Experience Level
                </label>
                <select
                  value={formData.requirements.minExperience}
                  onChange={(e) => handleRequirementsChange('minExperience', e.target.value)}
                  className="input-field"
                >
                  <option value="">Any Experience Level</option>
                  {experienceLevels.map(exp => (
                    <option key={exp} value={exp}>
                      {exp.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Certificates & Skills */}
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <Award className="h-5 w-5 mr-2 text-green-600" />
              Certificates & Skills
            </h2>
            
            {/* Required Certificates */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Required Certificates
              </label>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={currentCertificate}
                  onChange={(e) => setCurrentCertificate(e.target.value)}
                  className="input-field flex-1"
                  placeholder="e.g., AWS Certified, PMP, etc."
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCertificate())}
                />
                <button
                  type="button"
                  onClick={addCertificate}
                  className="btn-primary whitespace-nowrap"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.requirements.requiredCertificates.map((certificate, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                  >
                    {certificate}
                    <button
                      type="button"
                      onClick={() => removeCertificate(certificate)}
                      className="ml-2 hover:text-blue-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Required Skills */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Required Skills
              </label>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={currentSkill}
                  onChange={(e) => setCurrentSkill(e.target.value)}
                  className="input-field flex-1"
                  placeholder="e.g., JavaScript, Python, Project Management"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                />
                <button
                  type="button"
                  onClick={addSkill}
                  className="btn-primary whitespace-nowrap"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.requirements.requiredSkills.map((skill, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800"
                  >
                    {skill}
                    <button
                      type="button"
                      onClick={() => removeSkill(skill)}
                      className="ml-2 hover:text-green-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Required Documents */}
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <BookOpen className="h-5 w-5 mr-2 text-purple-600" />
              Required Documents
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Select which documents applicants must provide
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {documentTypes.map(doc => (
                <label key={doc} className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.requirements.requiredDocuments.includes(doc)}
                    onChange={() => toggleDocument(doc)}
                    className="h-4 w-4 text-blue-600 rounded"
                  />
                  <span className="text-sm text-gray-700 capitalize">
                    {doc.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="btn-primary text-lg px-8 py-3"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                  Posting Job...
                </>
              ) : (
                <>
                  <Briefcase className="h-5 w-5 mr-2" />
                  Post Job
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default JobPosting