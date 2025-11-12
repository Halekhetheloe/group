import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../firebase-config'
import { ArrowLeft, MapPin, Clock, DollarSign, Building, User, Calendar, CheckCircle } from 'lucide-react'

const JobDetails = () => {
  const { jobId } = useParams()
  const navigate = useNavigate()
  const [job, setJob] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (jobId) {
      fetchJobDetails()
    }
  }, [jobId])

  const fetchJobDetails = async () => {
    try {
      const jobDoc = await getDoc(doc(db, 'jobs', jobId))
      if (jobDoc.exists()) {
        setJob({ id: jobDoc.id, ...jobDoc.data() })
      } else {
        console.log('Job not found')
      }
    } catch (error) {
      console.error('Error fetching job:', error)
    } finally {
      setLoading(false)
    }
  }

  // Safe function to handle requirements (both array and object formats)
  const renderRequirements = () => {
    if (!job.requirements) {
      return <p className="text-gray-600">No specific requirements listed.</p>
    }

    // Handle both array and object formats
    let requirementsList = []
    
    if (Array.isArray(job.requirements)) {
      // If it's already an array
      requirementsList = job.requirements
    } else if (typeof job.requirements === 'object') {
      // If it's an object, convert to array format
      if (job.requirements.requiredSkills && Array.isArray(job.requirements.requiredSkills)) {
        requirementsList = job.requirements.requiredSkills
      } else {
        // Convert object entries to array
        requirementsList = Object.entries(job.requirements).map(([key, value]) => {
          if (Array.isArray(value)) {
            return `${key}: ${value.join(', ')}`
          }
          return `${key}: ${value}`
        })
      }
    }

    if (requirementsList.length === 0) {
      return <p className="text-gray-600">No specific requirements listed.</p>
    }

    return (
      <ul className="space-y-2">
        {requirementsList.map((requirement, index) => (
          <li key={index} className="flex items-start">
            <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
            <span className="text-gray-700">{requirement}</span>
          </li>
        ))}
      </ul>
    )
  }

  // Safe function to handle responsibilities
  const renderResponsibilities = () => {
    if (!job.responsibilities) {
      return null
    }

    let responsibilitiesList = []
    
    if (Array.isArray(job.responsibilities)) {
      responsibilitiesList = job.responsibilities
    } else if (typeof job.responsibilities === 'object') {
      responsibilitiesList = Object.values(job.responsibilities)
    }

    if (responsibilitiesList.length === 0) {
      return null
    }

    return (
      <ul className="list-disc list-inside space-y-2 text-gray-700">
        {responsibilitiesList.map((responsibility, index) => (
          <li key={index}>{responsibility}</li>
        ))}
      </ul>
    )
  }

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Recently'
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    } catch (error) {
      return 'Recently'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
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
          <p className="text-gray-600 mb-8">The job you're looking for doesn't exist or has been removed.</p>
          <button
            onClick={() => navigate('/jobs')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg"
          >
            Back to Jobs
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate('/jobs')}
            className="flex items-center text-blue-600 hover:text-blue-700 font-medium"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Jobs
          </button>
        </div>

        {/* Job Details Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{job.title}</h1>
              <div className="flex items-center space-x-4 text-gray-600">
                <div className="flex items-center">
                  <Building className="h-5 w-5 mr-2" />
                  {job.companyName}
                </div>
                <div className="flex items-center">
                  <MapPin className="h-5 w-5 mr-2" />
                  {job.location}
                </div>
              </div>
            </div>
            <button
              onClick={() => navigate(`/jobs/${job.id}/apply`)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium"
            >
              Apply Now
            </button>
          </div>

          {/* Job Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="flex items-center p-4 bg-gray-50 rounded-lg">
              <Clock className="h-6 w-6 text-blue-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Job Type</p>
                <p className="font-medium text-gray-900 capitalize">{job.jobType}</p>
              </div>
            </div>
            <div className="flex items-center p-4 bg-gray-50 rounded-lg">
              <DollarSign className="h-6 w-6 text-green-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Salary</p>
                <p className="font-medium text-gray-900">{job.salary || 'Not specified'}</p>
              </div>
            </div>
            <div className="flex items-center p-4 bg-gray-50 rounded-lg">
              <User className="h-6 w-6 text-purple-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Experience</p>
                <p className="font-medium text-gray-900 capitalize">{job.experienceLevel || 'Not specified'}</p>
              </div>
            </div>
            <div className="flex items-center p-4 bg-gray-50 rounded-lg">
              <Calendar className="h-6 w-6 text-orange-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Posted</p>
                <p className="font-medium text-gray-900">
                  {formatDate(job.postedAt || job.createdAt)}
                </p>
              </div>
            </div>
          </div>

          {/* Job Description */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Job Description</h2>
            <div className="prose max-w-none">
              <p className="text-gray-700 whitespace-pre-line">{job.description}</p>
            </div>
          </div>

          {/* Requirements */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Requirements</h2>
            {renderRequirements()}
          </div>

          {/* Responsibilities */}
          {job.responsibilities && (
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Responsibilities</h2>
              {renderResponsibilities()}
            </div>
          )}

          {/* Apply Button */}
          <div className="border-t border-gray-200 pt-6">
            <button
              onClick={() => navigate(`/jobs/${job.id}/apply`)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 px-6 rounded-lg font-semibold text-lg"
            >
              Apply for this Position
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default JobDetails