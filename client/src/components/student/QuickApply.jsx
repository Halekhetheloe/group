import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { doc, getDoc, addDoc, collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '../../firebase-config'
import { useAuth } from '../../hooks/useAuth'
import { CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'

const QuickApply = () => {
  const { courseId } = useParams()
  const navigate = useNavigate()
  const { userData } = useAuth()
  const [course, setCourse] = useState(null)
  const [institution, setInstitution] = useState(null)
  const [loading, setLoading] = useState(true)
  const [applying, setApplying] = useState(false)
  const [hasApplied, setHasApplied] = useState(false)

  useEffect(() => {
    if (courseId && userData) {
      checkApplicationStatus()
    }
  }, [courseId, userData])

  const checkApplicationStatus = async () => {
    try {
      setLoading(true)

      // Fetch course details
      const courseDoc = await getDoc(doc(db, 'courses', courseId))
      if (!courseDoc.exists()) {
        toast.error('Course not found')
        navigate('/courses')
        return
      }
      setCourse(courseDoc.data())

      // Fetch institution details
      if (courseDoc.data().institutionId) {
        const institutionDoc = await getDoc(doc(db, 'institutions', courseDoc.data().institutionId))
        if (institutionDoc.exists()) {
          setInstitution(institutionDoc.data())
        }
      }

      // Check if already applied
      const applicationsQuery = query(
        collection(db, 'applications'),
        where('studentId', '==', userData.uid),
        where('courseId', '==', courseId)
      )
      const applicationsSnapshot = await getDocs(applicationsQuery)
      
      if (applicationsSnapshot.docs.length > 0) {
        setHasApplied(true)
      }

    } catch (error) {
      console.error('Error checking application:', error)
      toast.error('Error loading application')
    } finally {
      setLoading(false)
    }
  }

  const handleQuickApply = async () => {
    if (!courseId || !userData?.uid) {
      toast.error('Missing required information')
      return
    }

    setApplying(true)

    try {
      const applicationData = {
        studentId: userData.uid,
        courseId: courseId,
        institutionId: course?.institutionId || '',
        status: 'pending',
        appliedAt: new Date(),
        studentName: userData.displayName || 'Student',
        studentEmail: userData.email || '',
        qualified: true, // Since they can access this course
        appliedVia: 'quick-apply'
      }

      await addDoc(collection(db, 'applications'), applicationData)
      
      toast.success('🎉 Application submitted successfully!')
      setHasApplied(true)
      
      // Redirect after short delay to show success message
      setTimeout(() => {
        navigate('/student/my-applications')
      }, 1500)

    } catch (error) {
      console.error('Error submitting application:', error)
      toast.error('Failed to submit application')
    } finally {
      setApplying(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading application...</p>
        </div>
      </div>
    )
  }

  if (hasApplied) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-teal-100 p-6">
        <div className="max-w-md mx-auto">
          <div className="text-center py-16 bg-white rounded-2xl shadow-lg border border-green-200">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-3">Application Submitted!</h1>
            <p className="text-gray-600 mb-6">
              You've successfully applied for <span className="font-semibold">{course?.name}</span>
            </p>
            <button
              onClick={() => navigate('/student/my-applications')}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold transition-all duration-300"
            >
              View My Applications
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center mb-8">
          <button
            onClick={() => navigate(-1)}
            className="bg-white hover:bg-gray-50 text-blue-600 hover:text-blue-700 px-4 py-2 rounded-xl font-semibold transition-all duration-300 shadow-md flex items-center border border-blue-200"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </button>
        </div>

        {/* Application Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 text-center">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-6" />
          
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Quick Apply</h1>
          <p className="text-gray-600 mb-6">
            You qualify for this course! Apply with one click.
          </p>

          {/* Course Info */}
          <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left">
            <h3 className="font-semibold text-gray-900 mb-2">{course?.name}</h3>
            <p className="text-sm text-gray-600">{institution?.name}</p>
            <p className="text-xs text-gray-500 mt-1">Course ID: {courseId}</p>
          </div>

          {/* Benefits */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
            <h4 className="font-semibold text-blue-800 mb-2">✓ Automatic Qualification</h4>
            <p className="text-sm text-blue-700">
              Your profile meets all requirements. No additional information needed.
            </p>
          </div>

          {/* Apply Button */}
          <button
            onClick={handleQuickApply}
            disabled={applying}
            className={`w-full py-4 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl ${
              applying 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-green-600 hover:bg-green-700 text-white transform hover:scale-105'
            }`}
          >
            {applying ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mx-auto mr-2 inline"></div>
                Applying...
              </>
            ) : (
              'Apply Now'
            )}
          </button>

          <p className="text-xs text-gray-500 mt-4">
            By clicking "Apply Now", you submit your application to the institution.
          </p>
        </div>
      </div>
    </div>
  )
}

export default QuickApply