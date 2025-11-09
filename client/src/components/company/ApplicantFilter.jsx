import React, { useState, useEffect } from 'react'
import { collection, query, where, getDocs, doc, getDoc, updateDoc } from 'firebase/firestore'
import { db } from '../../firebase-config'
import { useAuth } from '../../hooks/useAuth'
import { useNavigate } from 'react-router-dom'

const ApplicantFilter = () => {
  const { userData } = useAuth()
  const navigate = useNavigate()
  const [filters, setFilters] = useState({
    minGPA: '',
    experience: '',
    education: '',
    location: '',
    status: 'all'
  })
  const [applicants, setApplicants] = useState([])
  const [filteredApplicants, setFilteredApplicants] = useState([])
  const [loading, setLoading] = useState(true)
  const [jobs, setJobs] = useState([])
  const [selectedJob, setSelectedJob] = useState('all')

  useEffect(() => {
    if (userData) {
      fetchCompanyJobs()
    }
  }, [userData])

  useEffect(() => {
    if (userData && jobs.length > 0) {
      fetchApplicants()
    }
  }, [userData, jobs])

  useEffect(() => {
    filterApplicants()
  }, [applicants, filters, selectedJob])

  const fetchCompanyJobs = async () => {
    try {
      const jobsQuery = query(
        collection(db, 'jobs'),
        where('companyId', '==', userData.uid)
      )
      const jobsSnapshot = await getDocs(jobsQuery)
      const jobsData = jobsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      setJobs(jobsData)
    } catch (error) {
      console.error('Error fetching jobs:', error)
    }
  }

  const fetchApplicants = async () => {
    try {
      setLoading(true)
      
      // Get job IDs to filter applications
      const jobIds = jobs.map(job => job.id)
      
      if (jobIds.length === 0) {
        setApplicants([])
        return
      }

      // Fetch job applications for company's jobs
      const applicationsQuery = query(
        collection(db, 'applications'),
        where('jobId', 'in', jobIds)
      )
      
      const applicationsSnapshot = await getDocs(applicationsQuery)
      const applications = applicationsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))

      // Enhanced applicant details with safe defaults
      const applicantsData = await Promise.all(
        applications.map(async (application) => {
          try {
            // Safe defaults for all required fields
            let studentData = {
              displayName: application.studentName || 'Unknown Applicant',
              email: application.studentEmail || 'No email',
              location: ''
            }
            
            let studentProfile = {
              education: [],
              workExperience: [],
              skills: [],
              location: ''
            }
            
            let transcripts = []

            // Fetch student basic info if available
            if (application.studentId) {
              try {
                const studentDoc = await getDoc(doc(db, 'users', application.studentId))
                if (studentDoc.exists()) {
                  studentData = { ...studentData, ...studentDoc.data() }
                }

                // Fetch student profile with error handling
                const studentProfileDoc = await getDoc(doc(db, 'studentProfiles', application.studentId))
                if (studentProfileDoc.exists()) {
                  studentProfile = { ...studentProfile, ...studentProfileDoc.data() }
                }

                // Fetch transcripts with error handling
                const transcriptsQuery = query(
                  collection(db, 'transcripts'),
                  where('studentId', '==', application.studentId)
                )
                const transcriptsSnapshot = await getDocs(transcriptsQuery)
                transcripts = transcriptsSnapshot.docs.map(doc => doc.data())
              } catch (error) {
                console.log('Error fetching additional student data:', error)
                // Continue with safe defaults
              }
            }

            // Get job details
            let jobDetails = {}
            if (application.jobId) {
              try {
                const jobDoc = await getDoc(doc(db, 'jobs', application.jobId))
                if (jobDoc.exists()) {
                  jobDetails = jobDoc.data()
                }
              } catch (error) {
                console.log('Error fetching job details:', error)
              }
            }

            // Calculate derived fields for filtering
            const experienceYears = calculateExperienceYears(studentProfile.workExperience || [])
            const gpa = calculateGPA(transcripts)
            const educationLevel = getHighestEducationLevel(studentProfile.education || [])

            return {
              ...application,
              student: studentData,
              profile: studentProfile,
              transcripts,
              job: jobDetails,
              // Derived fields for easy filtering
              experienceYears,
              gpa,
              educationLevel,
              hasEducation: (studentProfile.education || []).length > 0,
              hasExperience: (studentProfile.workExperience || []).length > 0,
              hasTranscripts: transcripts.length > 0
            }
          } catch (error) {
            console.error('Error processing applicant:', error)
            // Return application with safe defaults
            return {
              ...application,
              student: {
                displayName: application.studentName || 'Unknown Applicant',
                email: application.studentEmail || 'No email',
                location: ''
              },
              profile: {
                education: [],
                workExperience: [],
                skills: [],
                location: ''
              },
              transcripts: [],
              job: {},
              experienceYears: 0,
              gpa: 0,
              educationLevel: 'not_specified',
              hasEducation: false,
              hasExperience: false,
              hasTranscripts: false
            }
          }
        })
      )

      setApplicants(applicantsData)
    } catch (error) {
      console.error('Error fetching applicants:', error)
    } finally {
      setLoading(false)
    }
  }

  // Helper functions for derived data
  const calculateExperienceYears = (workExperience) => {
    if (!workExperience || workExperience.length === 0) return 0
    
    // Simple calculation: count number of experiences as years
    // In a real app, you'd calculate actual duration
    return workExperience.length
  }

  const calculateGPA = (transcripts) => {
    if (!transcripts || transcripts.length === 0) return 0
    
    const validTranscripts = transcripts.filter(t => t.gpa && !isNaN(t.gpa))
    if (validTranscripts.length === 0) return 0
    
    const totalGPA = validTranscripts.reduce((sum, transcript) => sum + transcript.gpa, 0)
    return Math.round((totalGPA / validTranscripts.length) * 100) / 100 // Round to 2 decimal places
  }

  const getHighestEducationLevel = (education) => {
    if (!education || education.length === 0) return 'not_specified'
    
    const levels = {
      'phd': 4,
      'master': 3,
      'bachelor': 2,
      'diploma': 1,
      'high_school': 0
    }
    
    let highestLevel = 'not_specified'
    let highestScore = -1
    
    education.forEach(edu => {
      const degree = edu.degree?.toLowerCase() || ''
      let score = 0
      
      if (degree.includes('phd')) score = 4
      else if (degree.includes('master')) score = 3
      else if (degree.includes('bachelor')) score = 2
      else if (degree.includes('diploma')) score = 1
      
      if (score > highestScore) {
        highestScore = score
        highestLevel = degree.includes('phd') ? 'phd' :
                      degree.includes('master') ? 'master' :
                      degree.includes('bachelor') ? 'bachelor' :
                      degree.includes('diploma') ? 'diploma' : 'not_specified'
      }
    })
    
    return highestLevel
  }

  const filterApplicants = () => {
    let filtered = applicants

    // Filter by selected job
    if (selectedJob !== 'all') {
      filtered = filtered.filter(applicant => applicant.jobId === selectedJob)
    }

    // Filter by GPA (with safe defaults)
    if (filters.minGPA) {
      filtered = filtered.filter(applicant => {
        const gpa = applicant.gpa || 0
        return gpa >= parseFloat(filters.minGPA)
      })
    }

    // Filter by experience (with safe defaults)
    if (filters.experience) {
      filtered = filtered.filter(applicant => {
        const experience = applicant.experienceYears || 0
        return experience >= parseInt(filters.experience)
      })
    }

    // Filter by education (with safe defaults)
    if (filters.education) {
      filtered = filtered.filter(applicant => {
        const educationLevel = applicant.educationLevel || 'not_specified'
        return educationLevel === filters.education
      })
    }

    // Filter by location (with safe defaults)
    if (filters.location) {
      filtered = filtered.filter(applicant => {
        const location = applicant.student?.location || 
                        applicant.profile?.location || 
                        applicant.job?.location || 
                        ''
        return location.toLowerCase().includes(filters.location.toLowerCase())
      })
    }

    // Filter by status
    if (filters.status !== 'all') {
      filtered = filtered.filter(applicant => applicant.status === filters.status)
    }

    setFilteredApplicants(filtered)
  }

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const clearFilters = () => {
    setFilters({
      minGPA: '',
      experience: '',
      education: '',
      location: '',
      status: 'all'
    })
    setSelectedJob('all')
  }

  const handleViewApplicant = (applicantId) => {
    navigate(`/company/applicant/${applicantId}`)
  }

  const updateApplicationStatus = async (applicantId, newStatus) => {
    try {
      await updateDoc(doc(db, 'applications', applicantId), {
        status: newStatus,
        updatedAt: new Date()
      })
      
      // Update local state
      setApplicants(applicants.map(app => 
        app.id === applicantId ? { ...app, status: newStatus } : app
      ))
      
      alert(`Application ${newStatus} successfully`)
    } catch (error) {
      console.error('Error updating application status:', error)
      alert('Error updating application status')
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-slate-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-10 bg-slate-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-800">Filter Applicants</h3>
        <div className="h-5 w-5 bg-slate-400 rounded"></div>
      </div>

      <div className="space-y-4">
        {/* Job Selection */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Select Job</label>
          <select
            value={selectedJob}
            onChange={(e) => setSelectedJob(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Jobs</option>
            {jobs.map(job => (
              <option key={job.id} value={job.id}>
                {job.title}
              </option>
            ))}
          </select>
        </div>

        {/* Minimum GPA */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Minimum GPA</label>
          <select
            value={filters.minGPA}
            onChange={(e) => handleFilterChange('minGPA', e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Any GPA</option>
            <option value="3.5">3.5+</option>
            <option value="3.0">3.0+</option>
            <option value="2.5">2.5+</option>
            <option value="2.0">2.0+</option>
          </select>
        </div>

        {/* Years of Experience */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Minimum Experience</label>
          <select
            value={filters.experience}
            onChange={(e) => handleFilterChange('experience', e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Any Experience</option>
            <option value="0">No Experience</option>
            <option value="1">1+ years</option>
            <option value="2">2+ years</option>
            <option value="3">3+ years</option>
            <option value="5">5+ years</option>
          </select>
        </div>

        {/* Education Level */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Education</label>
          <select
            value={filters.education}
            onChange={(e) => handleFilterChange('education', e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Any Education</option>
            <option value="diploma">Diploma</option>
            <option value="bachelor">Bachelor's Degree</option>
            <option value="master">Master's Degree</option>
            <option value="phd">PhD</option>
            <option value="not_specified">Not Specified</option>
          </select>
        </div>

        {/* Location */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Location</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <div className="h-4 w-4 bg-slate-400 rounded"></div>
            </div>
            <input
              type="text"
              placeholder="Filter by location..."
              value={filters.location}
              onChange={(e) => handleFilterChange('location', e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Application Status */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Application Status</label>
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="under_review">Under Review</option>
            <option value="interviewed">Interviewed</option>
            <option value="accepted">Accepted</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        {/* Results Count */}
        <div className="pt-4 border-t border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600">
              {filteredApplicants.length} applicants found
            </span>
            <button
              onClick={clearFilters}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="mt-6 pt-6 border-t border-slate-200">
        <h4 className="text-sm font-medium text-slate-800 mb-3">Applicant Statistics</h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="font-bold text-blue-700">{applicants.length}</div>
            <div className="text-blue-600">Total</div>
          </div>
          <div className="text-center p-3 bg-yellow-50 rounded-lg">
            <div className="font-bold text-yellow-700">
              {applicants.filter(a => a.status === 'pending' || a.status === 'under_review').length}
            </div>
            <div className="text-yellow-600">Pending</div>
          </div>
        </div>
      </div>

      {/* Applicant List Preview */}
      {filteredApplicants.length > 0 && (
        <div className="mt-6 pt-6 border-t border-slate-200">
          <h4 className="text-sm font-medium text-slate-800 mb-3">Filtered Applicants</h4>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {filteredApplicants.slice(0, 5).map(applicant => (
              <div key={applicant.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div>
                  <p className="font-medium text-slate-800">{applicant.student.displayName}</p>
                  <p className="text-sm text-slate-600">{applicant.jobTitle}</p>
                </div>
                <button
                  onClick={() => handleViewApplicant(applicant.id)}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  View
                </button>
              </div>
            ))}
            {filteredApplicants.length > 5 && (
              <p className="text-sm text-slate-500 text-center">
                +{filteredApplicants.length - 5} more applicants
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default ApplicantFilter