import React, { useState, useEffect } from 'react'
import { collection, addDoc, doc, updateDoc } from 'firebase/firestore'
import { db } from '../../../firebase-config'
import { useAuth } from '../../../hooks/useAuth'
import { Briefcase, MapPin, DollarSign, Clock, Users, FileText, Calendar } from 'lucide-react'
import toast from 'react-hot-toast'

const JobForm = ({ job = null, onSuccess, onCancel }) => {
  const { userData } = useAuth()
  const [loading, setLoading] = useState(false)
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    jobType: 'full-time',
    location: '',
    experience: 'entry',
    salary: '',
    requirements: [],
    responsibilities: [],
    benefits: [],
    applicationDeadline: '',
    vacancy: '1',
    status: 'active'
  })

  useEffect(() => {
    if (job) {
      setFormData({
        title: job.title || '',
        description: job.description || '',
        jobType: job.jobType || 'full-time',
        location: job.location || '',
        experience: job.experience || 'entry',
        salary: job.salary || '',
        requirements: job.requirements || [],
        responsibilities: job.responsibilities || [],
        benefits: job.benefits || [],
        applicationDeadline: job.applicationDeadline || '',
        vacancy: job.vacancy || '1',
        status: job.status || 'active'
      })
    }
  }, [job])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleArrayFieldChange = (fieldName, value) => {
    const items = value.split('\n').filter(item => item.trim())
    setFormData(prev => ({
      ...prev,
      [fieldName]: items
    }))
  }

  const validateForm = () => {
    const required = ['title', 'description', 'jobType', 'location', 'experience', 'vacancy']
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
      const jobData = {
        ...formData,
        companyId: userData.companyId || userData.uid,
        createdAt: job ? job.createdAt : new Date(),
        updatedAt: new Date(),
        vacancy: parseInt(formData.vacancy) || 1,
        salary: formData.salary || 'Negotiable'
      }

      if (job) {
        // Update existing job
        await updateDoc(doc(db, 'jobs', job.id), jobData)
        toast.success('Job posting updated successfully!')
      } else {
        // Create new job
        await addDoc(collection(db, 'jobs'), jobData)
        toast.success('Job posting created successfully!')
      }

      if (onSuccess) onSuccess()
    } catch (error) {
      console.error('Error saving job:', error)
      toast.error('Failed to save job posting')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            {job ? 'Edit Job Posting' : 'Create Job Posting'}
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
                Job Title *
              </label>
              <div className="relative">
                <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="input-field pl-10"
                  placeholder="e.g., Software Developer"
                  required
                />
              </div>
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
                required
              >
                <option value="full-time">Full Time</option>
                <option value="part-time">Part Time</option>
                <option value="contract">Contract</option>
                <option value="internship">Internship</option>
                <option value="remote">Remote</option>
              </select>
            </div>
          </div>

          {/* Location and Experience */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location *
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  className="input-field pl-10"
                  placeholder="e.g., Maseru, Lesotho"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Experience Level *
              </label>
              <select
                name="experience"
                value={formData.experience}
                onChange={handleInputChange}
                className="input-field"
                required
              >
                <option value="entry">Entry Level</option>
                <option value="mid">Mid Level</option>
                <option value="senior">Senior Level</option>
                <option value="executive">Executive</option>
              </select>
            </div>
          </div>

          {/* Salary and Vacancy */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Salary
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  name="salary"
                  value={formData.salary}
                  onChange={handleInputChange}
                  className="input-field pl-10"
                  placeholder="e.g., M5,000 - M8,000 or Negotiable"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Number of Vacancies *
              </label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="number"
                  name="vacancy"
                  value={formData.vacancy}
                  onChange={handleInputChange}
                  className="input-field pl-10"
                  placeholder="1"
                  min="1"
                  required
                />
              </div>
            </div>
          </div>

          {/* Application Deadline */}
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

          {/* Job Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Job Description *
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 text-gray-400 h-4 w-4" />
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows="4"
                className="input-field pl-10"
                placeholder="Describe the role, key objectives, and what makes this position exciting..."
                required
              />
            </div>
          </div>

          {/* Requirements */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Requirements & Qualifications (one per line)
            </label>
            <textarea
              value={formData.requirements.join('\n')}
              onChange={(e) => handleArrayFieldChange('requirements', e.target.value)}
              rows="4"
              className="input-field"
              placeholder="Bachelor's degree in relevant field&#10;2+ years of experience&#10;Strong communication skills"
            />
          </div>

          {/* Responsibilities */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Key Responsibilities (one per line)
            </label>
            <textarea
              value={formData.responsibilities.join('\n')}
              onChange={(e) => handleArrayFieldChange('responsibilities', e.target.value)}
              rows="4"
              className="input-field"
              placeholder="Develop and maintain software applications&#10;Collaborate with cross-functional teams&#10;Participate in code reviews"
            />
          </div>

          {/* Benefits */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Benefits & Perks (one per line)
            </label>
            <textarea
              value={formData.benefits.join('\n')}
              onChange={(e) => handleArrayFieldChange('benefits', e.target.value)}
              rows="3"
              className="input-field"
              placeholder="Health insurance&#10;Flexible working hours&#10;Professional development opportunities"
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Job Status
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleInputChange}
              className="input-field"
            >
              <option value="active">Active - Accepting Applications</option>
              <option value="inactive">Inactive - Not Accepting Applications</option>
              <option value="filled">Position Filled</option>
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
              {loading ? 'Saving...' : job ? 'Update Job' : 'Post Job'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default JobForm