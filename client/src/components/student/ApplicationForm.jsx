import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { doc, getDoc, addDoc, collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '../../firebase-config'
import { useAuth } from '../../hooks/useAuth'
import { ArrowLeft, CheckCircle, AlertCircle, Plus, X } from 'lucide-react'
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
    grades: [{ subject: '', grade: '' }]
  })
  const [errors, setErrors] = useState({})
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
    
    // Validate grades
    if (formData.grades.length === 0) {
      newErrors.grades = 'At least one grade is required'
    } else {
      const invalidGrades = formData.grades.filter(grade => !grade.subject.trim() || !grade.grade)
      if (invalidGrades.length > 0) {
        newErrors.grades = 'All grades must have both subject and grade selected'
      }
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleGradeChange = (index, field, value) => {
    const updatedGrades = [...formData.grades]
    updatedGrades[index][field] = value
    setFormData(prev => ({ ...prev, grades: updatedGrades }))
  }

  const addGrade = () => {
    setFormData(prev => ({
      ...prev,
      grades: [...prev.grades, { subject: '', grade: '' }]
    }))
  }

  const removeGrade = (index) => {
    if (formData.grades.length > 1) {
      setFormData(prev => ({
        ...prev,
        grades: prev.grades.filter((_, i) => i !== index)
      }))
    }
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
        grades: formData.grades.filter(grade => grade.subject.trim() && grade.grade),
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

  const gradeOptions = [
    'A*', 'A', 'B', 'C', 'D'
  ]

  const commonSubjects = [
    'Mathematics',
    'English Language',
    'English Literature',
    'Physics',
    'Chemistry',
    'Biology',
    'History',
    'Geography',
    'French',
    'Spanish',
    'Computer Science',
    'Business Studies',
    'Economics',
    'Accounting',
    'Art and Design',
    'Music',
    'Physical Education',
    'Religious Studies',
    'Sociology',
    'Psychology'
  ]

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
          {/* Academic Grades */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 transition-all duration-300 hover:shadow-xl">
            <h2 className="text-xl font-bold text-gray-900 mb-6 pb-3 border-b border-gray-200">Academic Grades</h2>
            
            <div className="space-y-4">
              {formData.grades.map((grade, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Subject {index + 1}
                    </label>
                    <select
                      value={grade.subject}
                      onChange={(e) => handleGradeChange(index, 'subject', e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 text-gray-900"
                    >
                      <option value="">Select Subject</option>
                      {commonSubjects.map((subject) => (
                        <option key={subject} value={subject}>
                          {subject}
                        </option>
                      ))}
                      <option value="Other">Other (Please specify)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Grade
                    </label>
                    <select
                      value={grade.grade}
                      onChange={(e) => handleGradeChange(index, 'grade', e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 text-gray-900"
                    >
                      <option value="">Select Grade</option>
                      {gradeOptions.map((gradeOption) => (
                        <option key={gradeOption} value={gradeOption}>
                          {gradeOption}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex space-x-2">
                    {formData.grades.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeGrade(index)}
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 flex items-center justify-center flex-1"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    )}
                    {index === formData.grades.length - 1 && (
                      <button
                        type="button"
                        onClick={addGrade}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 flex items-center justify-center flex-1"
                      >
                        <Plus className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {errors.grades && (
              <p className="text-red-600 font-medium mt-4 flex items-center">
                <AlertCircle className="h-4 w-4 mr-2" />
                {errors.grades}
              </p>
            )}

            <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> Please add all your relevant academic grades. Include subjects that are required for this course admission.
              </p>
            </div>
          </div>

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