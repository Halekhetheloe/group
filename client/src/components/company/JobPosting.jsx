import React, { useState, useEffect } from 'react'
import { collection, addDoc, updateDoc, doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '../../firebase-config'
import { useAuth } from '../../hooks/useAuth'
import { useNavigate } from 'react-router-dom'

const JobPosting = () => {
  const { userData } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    requirements: [''],
    qualifications: [''],
    location: '',
    salary: '',
    jobType: 'full-time',
    category: '',
    deadline: '',
    experience: 'entry'
  })
  const [errors, setErrors] = useState({})

  useEffect(() => {
    // Set default deadline to 30 days from now
    const defaultDeadline = new Date()
    defaultDeadline.setDate(defaultDeadline.getDate() + 30)
    setFormData(prev => ({
      ...prev,
      deadline: defaultDeadline.toISOString().split('T')[0]
    }))
  }, [])

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.title.trim()) {
      newErrors.title = 'Job title is required'
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'Job description is required'
    } else if (formData.description.length < 50) {
      newErrors.description = 'Description should be at least 50 characters'
    }
    
    if (!formData.location.trim()) {
      newErrors.location = 'Location is required'
    }
    
    if (!formData.category) {
      newErrors.category = 'Category is required'
    }
    
    if (!formData.deadline) {
      newErrors.deadline = 'Application deadline is required'
    } else if (new Date(formData.deadline) <= new Date()) {
      newErrors.deadline = 'Deadline must be in the future'
    }
    
    // Validate requirements
    const validRequirements = formData.requirements.filter(req => req.trim())
    if (validRequirements.length === 0) {
      newErrors.requirements = 'At least one requirement is needed'
    }
    
    // Validate qualifications
    const validQualifications = formData.qualifications.filter(qual => qual.trim())
    if (validQualifications.length === 0) {
      newErrors.qualifications = 'At least one qualification is needed'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setLoading(true)
    setErrors({})

    try {
      // Get or create company data
      let companyName = userData?.companyName || userData?.displayName || 'Your Company'
      let companyEmail = userData?.email || ''

      if (userData?.uid) {
        try {
          const companyDoc = await getDoc(doc(db, 'companies', userData.uid))
          
          if (companyDoc.exists()) {
            // Company exists, use its data
            const companyData = companyDoc.data()
            companyName = companyData?.name || companyName
            companyEmail = companyData?.email || companyEmail
          } else {
            // Company doesn't exist, create a basic company profile
            console.log('Company document not found, creating basic company profile...')
            
            // Create a basic company document
            await setDoc(doc(db, 'companies', userData.uid), {
              name: companyName,
              email: companyEmail,
              userId: userData.uid,
              createdAt: new Date(),
              updatedAt: new Date(),
              status: 'active',
              // Add other default company fields as needed
              description: 'Company profile not yet completed',
              location: formData.location || '',
              website: '',
              phone: '',
              industry: formData.category || ''
            })
            
            console.log('Basic company profile created successfully')
          }
        } catch (firestoreError) {
          console.error('Error handling company data:', firestoreError)
          // Continue with default values if there's an error
        }
      } else {
        console.error('User UID not available')
        alert('User information not available. Please log in again.')
        return
      }

      // Prepare job data
      const jobData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        requirements: formData.requirements.filter(req => req.trim()),
        qualifications: formData.qualifications.filter(qual => qual.trim()),
        location: formData.location.trim(),
        salary: formData.salary.trim(),
        jobType: formData.jobType,
        category: formData.category,
        experience: formData.experience,
        deadline: new Date(formData.deadline),
        companyId: userData.uid,
        companyName: companyName,
        companyEmail: companyEmail,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
        applicationCount: 0,
        views: 0
      }

      // Add job to Firestore
      const docRef = await addDoc(collection(db, 'jobs'), jobData)
      console.log('Job posted successfully with ID:', docRef.id)

      alert('Job posted successfully!')
      
      // Redirect to job management
      navigate('/company/jobs')

    } catch (error) {
      console.error('Error posting job:', error)
      alert('Failed to post job. Please try again.')
    } finally {
      setLoading(false)
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

  const handleArrayChange = (field, index, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => i === index ? value : item)
    }))
  }

  const addArrayField = (field) => {
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], '']
    }))
  }

  const removeArrayField = (field, index) => {
    if (formData[field].length > 1) {
      setFormData(prev => ({
        ...prev,
        [field]: prev[field].filter((_, i) => i !== index)
      }))
    }
  }

  const jobCategories = [
    'Technology',
    'Business',
    'Healthcare',
    'Education',
    'Engineering',
    'Marketing',
    'Sales',
    'Design',
    'Finance',
    'Operations',
    'Human Resources',
    'Customer Service',
    'Research',
    'Manufacturing',
    'Logistics'
  ]

  // CSS Styles
  const styles = {
    container: "min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6",
    headerContainer: "max-w-4xl mx-auto",
    header: "text-4xl font-bold text-gray-900 mb-3 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent",
    subtitle: "text-lg text-gray-700 mb-8",
    
    // Card Styles
    card: "bg-white rounded-2xl shadow-lg border border-gray-200/60 p-8 hover:shadow-xl transition-all duration-300 backdrop-blur-sm bg-white/95",
    sectionHeader: "text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3 pb-4 border-b border-gray-200",
    
    // Input Styles
    inputField: "w-full px-4 py-4 border-2 border-gray-300 rounded-xl focus:ring-3 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 bg-white text-gray-900 placeholder-gray-500 text-lg font-medium",
    inputFieldError: "w-full px-4 py-4 border-2 border-red-300 rounded-xl focus:ring-3 focus:ring-red-500/20 focus:border-red-500 transition-all duration-300 bg-white text-gray-900 placeholder-gray-500 text-lg font-medium",
    textarea: "w-full px-4 py-4 border-2 border-gray-300 rounded-xl focus:ring-3 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 bg-white text-gray-900 placeholder-gray-500 resize-none min-h-[150px] text-lg font-medium",
    textareaError: "w-full px-4 py-4 border-2 border-red-300 rounded-xl focus:ring-3 focus:ring-red-500/20 focus:border-red-500 transition-all duration-300 bg-white text-gray-900 placeholder-gray-500 resize-none min-h-[150px] text-lg font-medium",
    selectField: "w-full px-4 py-4 border-2 border-gray-300 rounded-xl focus:ring-3 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 bg-white text-gray-900 text-lg font-medium appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,<svg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%204%205%22%3E%3Cpath%20fill%3D%22%236B7280%22%20d%3D%22M2%200L0%202h4zm0%205L0%203h4z%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-right-4 bg-center bg-[length:16px_16px] pr-12",
    
    // Label Styles
    formLabel: "block text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wide",
    formLabelRequired: "block text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wide after:content-['*'] after:ml-1 after:text-red-500",
    
    // Button Styles
    btnPrimary: "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-8 py-4 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 flex items-center justify-center text-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none",
    btnSecondary: "bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white px-8 py-4 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 flex items-center justify-center text-lg",
    btnOutline: "border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:-translate-y-0.5 flex items-center justify-center",
    
    // Icon Styles
    inputIcon: "absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-500",
    textareaIcon: "absolute top-4 left-4 pointer-events-none text-gray-500",
    sectionIcon: "h-6 w-6 text-blue-600",
    
    // Array Field Styles
    arrayFieldContainer: "space-y-4",
    arrayFieldRow: "flex items-center gap-4",
    arrayInput: "flex-1 px-4 py-4 border-2 border-gray-300 rounded-xl focus:ring-3 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 bg-white text-gray-900 placeholder-gray-500 text-lg font-medium",
    removeBtn: "p-3 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl transition-all duration-300 hover:scale-110 border-2 border-red-200",
    addBtn: "flex items-center text-blue-600 hover:text-blue-700 font-bold text-lg transition-all duration-300 hover:scale-105",
    
    // Error Styles
    errorMessage: "text-red-600 text-sm font-semibold mt-2 flex items-center gap-2 bg-red-50 px-4 py-2 rounded-lg border border-red-200",
    charCount: "text-sm font-medium mt-2",
    charCountGood: "text-green-600",
    charCountWarning: "text-yellow-600",
    charCountError: "text-red-600",
    
    // Grid Layout
    grid: "grid grid-cols-1 md:grid-cols-2 gap-8",
    fullWidth: "md:col-span-2",
    
    // Button Group
    buttonGroup: "flex justify-end gap-4 pt-8 border-t border-gray-200 mt-8",
    
    // Progress Indicator
    progressBar: "w-full bg-gray-200 rounded-full h-2 mb-4",
    progressFill: "bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500"
  }

  // Calculate form completion percentage
  const calculateCompletion = () => {
    const fields = [
      formData.title,
      formData.description,
      formData.location,
      formData.category,
      formData.deadline,
      formData.requirements.some(req => req.trim()),
      formData.qualifications.some(qual => qual.trim())
    ]
    const completed = fields.filter(Boolean).length
    return Math.round((completed / fields.length) * 100)
  }

  const completionPercentage = calculateCompletion()

  const getCharCountStyle = () => {
    if (formData.description.length >= 50) return styles.charCountGood
    if (formData.description.length >= 25) return styles.charCountWarning
    return styles.charCountError
  }

  return (
    <div className={styles.container}>
      <div className={styles.headerContainer}>
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className={styles.header}>Create Job Posting</h1>
          <p className={styles.subtitle}>
            Attract top talent with a compelling job description
          </p>
          
          {/* Progress Bar */}
          <div className="max-w-2xl mx-auto">
            <div className={styles.progressBar}>
              <div 
                className={styles.progressFill} 
                style={{ width: `${completionPercentage}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-sm font-medium text-gray-600">
              <span>Form Completion</span>
              <span>{completionPercentage}%</span>
            </div>
          </div>
        </div>

        {/* Job Posting Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Job Details Section */}
          <div className={styles.card}>
            <h2 className={styles.sectionHeader}>
              <div className={styles.sectionIcon}></div>
              Job Details
            </h2>
            
            <div className={styles.grid}>
              {/* Job Title */}
              <div className={styles.fullWidth}>
                <label htmlFor="title" className={styles.formLabelRequired}>
                  Job Title
                </label>
                <div className="relative">
                  <div className={styles.inputIcon}>
                    <div className="h-5 w-5 bg-gray-500 rounded"></div>
                  </div>
                  <input
                    id="title"
                    name="title"
                    type="text"
                    value={formData.title}
                    onChange={handleChange}
                    className={errors.title ? styles.inputFieldError : styles.inputField}
                    placeholder="e.g. Senior Software Engineer"
                    style={{ paddingLeft: '3rem' }}
                  />
                </div>
                {errors.title && (
                  <p className={styles.errorMessage}>
                    ⚠️ {errors.title}
                  </p>
                )}
              </div>

              {/* Location */}
              <div>
                <label htmlFor="location" className={styles.formLabelRequired}>
                  Location
                </label>
                <div className="relative">
                  <div className={styles.inputIcon}>
                    <div className="h-5 w-5 bg-gray-500 rounded"></div>
                  </div>
                  <input
                    id="location"
                    name="location"
                    type="text"
                    value={formData.location}
                    onChange={handleChange}
                    className={errors.location ? styles.inputFieldError : styles.inputField}
                    placeholder="e.g. Maseru, Lesotho"
                    style={{ paddingLeft: '3rem' }}
                  />
                </div>
                {errors.location && (
                  <p className={styles.errorMessage}>
                    ⚠️ {errors.location}
                  </p>
                )}
              </div>

              {/* Salary */}
              <div>
                <label htmlFor="salary" className={styles.formLabel}>
                  Salary Range
                </label>
                <div className="relative">
                  <div className={styles.inputIcon}>
                    <div className="h-5 w-5 bg-gray-500 rounded"></div>
                  </div>
                  <input
                    id="salary"
                    name="salary"
                    type="text"
                    value={formData.salary}
                    onChange={handleChange}
                    className={styles.inputField}
                    placeholder="e.g. M5,000 - M8,000"
                    style={{ paddingLeft: '3rem' }}
                  />
                </div>
              </div>

              {/* Job Type */}
              <div>
                <label htmlFor="jobType" className={styles.formLabelRequired}>
                  Job Type
                </label>
                <div className="relative">
                  <div className={styles.inputIcon}>
                    <div className="h-5 w-5 bg-gray-500 rounded"></div>
                  </div>
                  <select
                    id="jobType"
                    name="jobType"
                    value={formData.jobType}
                    onChange={handleChange}
                    className={styles.selectField}
                    style={{ paddingLeft: '3rem' }}
                  >
                    <option value="full-time">Full Time</option>
                    <option value="part-time">Part Time</option>
                    <option value="contract">Contract</option>
                    <option value="internship">Internship</option>
                    <option value="remote">Remote</option>
                  </select>
                </div>
              </div>

              {/* Experience Level */}
              <div>
                <label htmlFor="experience" className={styles.formLabelRequired}>
                  Experience Level
                </label>
                <div className="relative">
                  <div className={styles.inputIcon}>
                    <div className="h-5 w-5 bg-gray-500 rounded"></div>
                  </div>
                  <select
                    id="experience"
                    name="experience"
                    value={formData.experience}
                    onChange={handleChange}
                    className={styles.selectField}
                    style={{ paddingLeft: '3rem' }}
                  >
                    <option value="entry">Entry Level (0-2 years)</option>
                    <option value="mid">Mid Level (2-5 years)</option>
                    <option value="senior">Senior Level (5+ years)</option>
                    <option value="executive">Executive</option>
                  </select>
                </div>
              </div>

              {/* Category */}
              <div>
                <label htmlFor="category" className={styles.formLabelRequired}>
                  Industry Category
                </label>
                <div className="relative">
                  <div className={styles.inputIcon}>
                    <div className="h-5 w-5 bg-gray-500 rounded"></div>
                  </div>
                  <select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className={errors.category ? styles.inputFieldError : styles.selectField}
                    style={{ paddingLeft: '3rem' }}
                  >
                    <option value="">Select a category</option>
                    {jobCategories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
                {errors.category && (
                  <p className={styles.errorMessage}>
                    ⚠️ {errors.category}
                  </p>
                )}
              </div>

              {/* Application Deadline */}
              <div>
                <label htmlFor="deadline" className={styles.formLabelRequired}>
                  Application Deadline
                </label>
                <div className="relative">
                  <div className={styles.inputIcon}>
                    <div className="h-5 w-5 bg-gray-500 rounded"></div>
                  </div>
                  <input
                    id="deadline"
                    name="deadline"
                    type="date"
                    value={formData.deadline}
                    onChange={handleChange}
                    className={errors.deadline ? styles.inputFieldError : styles.inputField}
                    style={{ paddingLeft: '3rem' }}
                  />
                </div>
                {errors.deadline && (
                  <p className={styles.errorMessage}>
                    ⚠️ {errors.deadline}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Job Description Section */}
          <div className={styles.card}>
            <h2 className={styles.sectionHeader}>
              <div className={styles.sectionIcon}></div>
              Job Description
            </h2>
            <div>
              <label htmlFor="description" className={styles.formLabelRequired}>
                Detailed Job Description
              </label>
              <div className="relative">
                <div className={styles.textareaIcon}>
                  <div className="h-5 w-5 bg-gray-500 rounded"></div>
                </div>
                <textarea
                  id="description"
                  name="description"
                  rows={8}
                  value={formData.description}
                  onChange={handleChange}
                  className={errors.description ? styles.textareaError : styles.textarea}
                  placeholder="Describe the role, responsibilities, company culture, and what makes this opportunity special. Be specific about what you're looking for in a candidate..."
                  style={{ paddingLeft: '3rem', paddingTop: '1rem' }}
                />
              </div>
              {errors.description && (
                <p className={styles.errorMessage}>
                  ⚠️ {errors.description}
                </p>
              )}
              <p className={`${styles.charCount} ${getCharCountStyle()}`}>
                {formData.description.length} characters (minimum 50 required)
                {formData.description.length >= 50 && ' ✅'}
              </p>
            </div>
          </div>

          {/* Requirements Section */}
          <div className={styles.card}>
            <h2 className={styles.sectionHeader}>
              <div className={styles.sectionIcon}></div>
              Job Requirements
            </h2>
            <div className={styles.arrayFieldContainer}>
              {formData.requirements.map((requirement, index) => (
                <div key={index} className={styles.arrayFieldRow}>
                  <input
                    type="text"
                    value={requirement}
                    onChange={(e) => handleArrayChange('requirements', index, e.target.value)}
                    className={styles.arrayInput}
                    placeholder={`Requirement ${index + 1} (e.g., 3+ years of experience in...)`}
                  />
                  {formData.requirements.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeArrayField('requirements', index)}
                      className={styles.removeBtn}
                    >
                      <div className="h-5 w-5 bg-red-600 rounded"></div>
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => addArrayField('requirements')}
                className={styles.addBtn}
              >
                <div className="h-5 w-5 bg-blue-600 rounded mr-2"></div>
                Add Another Requirement
              </button>
              {errors.requirements && (
                <p className={styles.errorMessage}>
                  ⚠️ {errors.requirements}
                </p>
              )}
            </div>
          </div>

          {/* Qualifications Section */}
          <div className={styles.card}>
            <h2 className={styles.sectionHeader}>
              <div className={styles.sectionIcon}></div>
              Preferred Qualifications
            </h2>
            <div className={styles.arrayFieldContainer}>
              {formData.qualifications.map((qualification, index) => (
                <div key={index} className={styles.arrayFieldRow}>
                  <input
                    type="text"
                    value={qualification}
                    onChange={(e) => handleArrayChange('qualifications', index, e.target.value)}
                    className={styles.arrayInput}
                    placeholder={`Qualification ${index + 1} (e.g., Bachelor's degree in...)`}
                  />
                  {formData.qualifications.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeArrayField('qualifications', index)}
                      className={styles.removeBtn}
                    >
                      <div className="h-5 w-5 bg-red-600 rounded"></div>
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => addArrayField('qualifications')}
                className={styles.addBtn}
              >
                <div className="h-5 w-5 bg-blue-600 rounded mr-2"></div>
                Add Another Qualification
              </button>
              {errors.qualifications && (
                <p className={styles.errorMessage}>
                  ⚠️ {errors.qualifications}
                </p>
              )}
            </div>
          </div>

          {/* Submit Buttons */}
          <div className={styles.buttonGroup}>
            <button
              type="button"
              className={styles.btnSecondary}
              onClick={() => navigate('/company/jobs')}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={styles.btnPrimary}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                  Posting Job...
                </>
              ) : (
                <>
                  <div className="h-5 w-5 bg-white rounded mr-2"></div>
                  Post Job Opportunity
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