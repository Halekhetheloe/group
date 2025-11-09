import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { doc, getDoc, collection, addDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import { db } from '../../firebase-config'
import { useAuth } from '../../hooks/useAuth'
import toast from 'react-hot-toast'

const JobApplication = () => {
  const { jobId } = useParams()
  const navigate = useNavigate()
  const { userData } = useAuth()
  const [job, setJob] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [applicationData, setApplicationData] = useState({
    coverLetter: '',
    resumeUrl: ''
  })

  useEffect(() => {
    fetchJobDetails()
  }, [jobId])

  const fetchJobDetails = async () => {
    try {
      if (!jobId) {
        toast.error('Invalid job ID')
        navigate('/jobs')
        return
      }

      const jobDoc = await getDoc(doc(db, 'jobs', jobId))
      
      if (!jobDoc.exists()) {
        toast.error('Job not found')
        navigate('/jobs')
        return
      }

      const jobData = jobDoc.data()
      
      // Check if job deadline has passed
      const deadline = jobData.deadline?.toDate?.() || new Date(jobData.deadline)
      if (deadline < new Date()) {
        toast.error('This job posting has expired')
        navigate('/jobs')
        return
      }

      setJob({
        id: jobDoc.id,
        ...jobData
      })
    } catch (error) {
      console.error('Error fetching job:', error)
      toast.error('Error loading job details')
      navigate('/jobs')
    } finally {
      setLoading(false)
    }
  }

  const ensureStudentProfileExists = async () => {
    try {
      // Check if student profile exists
      const profileDoc = await getDoc(doc(db, 'studentProfiles', userData.uid))
      
      if (!profileDoc.exists()) {
        // Create a basic student profile if it doesn't exist
        await setDoc(doc(db, 'studentProfiles', userData.uid), {
          studentId: userData.uid,
          displayName: userData.displayName || userData.email,
          email: userData.email,
          location: '', // Student can update this later
          phone: '',
          education: [],
          workExperience: [],
          skills: [],
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        })
        console.log('Created basic student profile')
      }
      
      return true
    } catch (error) {
      console.error('Error ensuring student profile:', error)
      return false
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!userData) {
      toast.error('Please log in to apply for jobs')
      navigate('/login')
      return
    }

    if (applicationData.coverLetter.length < 50) {
      toast.error('Cover letter must be at least 50 characters long')
      return
    }

    setSubmitting(true)

    try {
      // Ensure student profile exists before applying
      const profileReady = await ensureStudentProfileExists()
      if (!profileReady) {
        toast.error('Error setting up student profile')
        return
      }

      // Submit application to Firestore with ALL required data
      const applicationDoc = await addDoc(collection(db, 'applications'), {
        // Application data
        jobId,
        studentId: userData.uid,
        studentName: userData.displayName || userData.email,
        studentEmail: userData.email,
        coverLetter: applicationData.coverLetter,
        resumeUrl: applicationData.resumeUrl,
        
        // Job data for filtering
        jobTitle: job.title,
        companyName: job.companyName,
        companyId: job.companyId,
        jobType: job.jobType,
        location: job.location,
        
        // Status and timestamps
        status: 'pending',
        appliedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        type: 'job',
        
        // Additional fields for filtering
        hasCoverLetter: applicationData.coverLetter.length > 0,
        hasResume: !!applicationData.resumeUrl,
        
        // Default values for filters (students can update these later)
        educationLevel: 'not_specified', // Will be updated from student profile
        experienceYears: 0, // Will be updated from student profile
        gpa: 0 // Will be updated from transcripts
      })

      console.log('Application submitted with ID:', applicationDoc.id)
      toast.success('Application submitted successfully!')
      navigate('/student/applications')

    } catch (error) {
      console.error('Error submitting application:', error)
      toast.error('Failed to submit application. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
            <div className="h-32 bg-gray-200 rounded mb-4"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Job Not Found</h1>
          <p className="text-gray-600 mb-6">The job you're looking for doesn't exist or has been removed.</p>
          <button 
            onClick={() => navigate('/jobs')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Browse Jobs
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-blue-600 hover:text-blue-700 mb-4"
          >
            <div className="h-4 w-4 bg-blue-600 rounded mr-2"></div>
            Back to Jobs
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Apply for Position</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Job Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border p-6 sticky top-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Job Summary</h3>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-gray-900 text-lg">{job.title}</h4>
                  <div className="flex items-center text-gray-600 mt-1">
                    <div className="h-4 w-4 bg-gray-600 rounded mr-2"></div>
                    <span>{job.companyName}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center text-sm text-gray-600">
                    <div className="h-4 w-4 bg-blue-600 rounded mr-2"></div>
                    <span>{job.location}</span>
                  </div>
                  
                  <div className="flex items-center text-sm text-gray-600">
                    <div className="h-4 w-4 bg-green-600 rounded mr-2"></div>
                    <span className="capitalize">{job.jobType?.replace('-', ' ')}</span>
                  </div>
                  
                  {job.salary && (
                    <div className="flex items-center text-sm text-gray-600">
                      <div className="h-4 w-4 bg-yellow-600 rounded mr-2"></div>
                      <span>{job.salary}</span>
                    </div>
                  )}
                  
                  {job.deadline && (
                    <div className="flex items-center text-sm text-gray-600">
                      <div className="h-4 w-4 bg-purple-600 rounded mr-2"></div>
                      <span>
                        Apply by {new Date(job.deadline?.toDate?.() || job.deadline).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <h5 className="font-medium text-gray-900 mb-2">Requirements</h5>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {job.requirements?.slice(0, 3).map((requirement, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-blue-500 mr-2">•</span>
                        {requirement}
                      </li>
                    ))}
                    {job.requirements?.length > 3 && (
                      <li className="text-gray-500">
                        +{job.requirements.length - 3} more requirements
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Application Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Application Form</h2>
                <p className="text-gray-600 mt-1">Complete your application for {job.title} at {job.companyName}</p>
              </div>

              <form onSubmit={handleSubmit} className="p-6">
                {/* Applicant Info */}
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Applicant Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={userData?.displayName || userData?.email || ''}
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email
                      </label>
                      <input
                        type="email"
                        value={userData?.email || ''}
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
                      />
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    Complete your student profile to add education, experience, and transcripts for better job matching.
                  </p>
                </div>

                {/* Cover Letter */}
                <div className="mb-6">
                  <label htmlFor="coverLetter" className="block text-sm font-medium text-gray-700 mb-2">
                    Cover Letter *
                  </label>
                  <textarea
                    id="coverLetter"
                    value={applicationData.coverLetter}
                    onChange={(e) => setApplicationData(prev => ({
                      ...prev,
                      coverLetter: e.target.value
                    }))}
                    rows={8}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                    placeholder="Tell us why you're interested in this position and why you'd be a great fit. Include your relevant experience, skills, and what you can bring to the team..."
                    required
                  />
                  <div className="flex justify-between items-center mt-2">
                    <p className="text-sm text-gray-500">
                      Minimum 50 characters. Current: {applicationData.coverLetter.length}
                    </p>
                    {applicationData.coverLetter.length < 50 && (
                      <p className="text-sm text-red-600">
                        {50 - applicationData.coverLetter.length} more characters required
                      </p>
                    )}
                  </div>
                </div>

                {/* Resume Upload */}
                <div className="mb-8">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Resume
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    {applicationData.resumeUrl ? (
                      <div className="text-green-600">
                        <p className="font-medium">Resume uploaded successfully</p>
                        <p className="text-sm text-gray-500 mt-1">{applicationData.resumeUrl}</p>
                      </div>
                    ) : (
                      <>
                        <div className="h-8 w-8 bg-gray-400 rounded mx-auto mb-2"></div>
                        <p className="text-gray-500 mb-2">No resume uploaded</p>
                        <p className="text-sm text-gray-500 mb-4">
                          Upload your resume to make your application stand out
                        </p>
                      </>
                    )}
                    <button
                      type="button"
                      className="bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 transition-colors text-sm font-medium"
                      onClick={() => {
                        // For demo purposes, simulate resume upload
                        toast.success('Resume uploaded successfully!')
                        setApplicationData(prev => ({
                          ...prev,
                          resumeUrl: 'my_resume.pdf'
                        }))
                      }}
                    >
                      {applicationData.resumeUrl ? 'Change Resume' : 'Upload Resume'}
                    </button>
                    <p className="text-xs text-gray-500 mt-2">
                      PDF, DOC, DOCX up to 5MB
                    </p>
                  </div>
                </div>

                {/* Submit Buttons */}
                <div className="flex gap-4 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => navigate(-1)}
                    className="flex-1 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || applicationData.coverLetter.length < 50}
                    className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                  >
                    {submitting ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                        Submitting...
                      </div>
                    ) : (
                      'Submit Application'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default JobApplication