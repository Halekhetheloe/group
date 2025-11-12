import React, { useState, useEffect } from 'react'
import { collection, query, where, getDocs, orderBy, doc, getDoc, addDoc, deleteDoc } from 'firebase/firestore'
import { db } from '../../firebase-config'
import { useAuth } from '../../hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import { Search, Filter, Briefcase, MapPin, Clock, DollarSign, Building, Heart, Share2, Eye, Users, Target, GraduationCap, Award } from 'lucide-react'
import toast from 'react-hot-toast'

const JobBrowser = () => {
  const { userData } = useAuth()
  const navigate = useNavigate()
  const [jobs, setJobs] = useState([])
  const [filteredJobs, setFilteredJobs] = useState([])
  const [companies, setCompanies] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [companyFilter, setCompanyFilter] = useState('all')
  const [jobTypeFilter, setJobTypeFilter] = useState('all')
  const [experienceFilter, setExperienceFilter] = useState('all')
  const [sortBy, setSortBy] = useState('newest')
  const [appliedJobs, setAppliedJobs] = useState(new Set())
  const [savedJobs, setSavedJobs] = useState(new Set())
  const [studentProfile, setStudentProfile] = useState(null)
  const [qualificationChecked, setQualificationChecked] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    if (userData) {
      fetchStudentProfile()
      fetchAppliedJobs()
      fetchSavedJobs()
    }
  }, [userData])

  useEffect(() => {
    filterAndSortJobs()
  }, [jobs, searchTerm, companyFilter, jobTypeFilter, experienceFilter, sortBy, studentProfile])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // Fetch all active jobs
      const jobsQuery = query(
        collection(db, 'jobs'),
        where('status', '==', 'active'),
        orderBy('createdAt', 'desc')
      )
      const jobsSnapshot = await getDocs(jobsQuery)
      const jobsData = jobsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))

      console.log('📋 Jobs found:', jobsData.length)
      console.log('📋 Jobs data:', jobsData)

      // Fetch company details for each job
      const jobsWithCompanies = await Promise.all(
        jobsData.map(async (job) => {
          try {
            const companyDoc = await getDoc(doc(db, 'companies', job.companyId))
            const companyData = companyDoc.exists() ? companyDoc.data() : { name: 'Unknown Company' }
            return {
              ...job,
              company: companyData
            }
          } catch (error) {
            console.error('Error fetching company:', error)
            return {
              ...job,
              company: { name: 'Unknown Company' }
            }
          }
        })
      )

      setJobs(jobsWithCompanies)

      // Get unique companies for filter
      const uniqueCompanies = [...new Set(jobsData.map(job => job.companyId))]
      const companyDetails = await Promise.all(
        uniqueCompanies.map(async (id) => {
          try {
            const companyDoc = await getDoc(doc(db, 'companies', id))
            return {
              id,
              ...companyDoc.data()
            }
          } catch (error) {
            console.error('Error fetching company details:', error)
            return { id, name: 'Unknown Company' }
          }
        })
      )
      setCompanies(companyDetails)

    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchStudentProfile = async () => {
    try {
      if (!userData) return
      
      console.log('🔍 Fetching student profile for:', userData.uid)
      const studentDoc = await getDoc(doc(db, 'students', userData.uid))
      
      if (studentDoc.exists()) {
        const profileData = studentDoc.data()
        console.log('📊 Student profile found:', profileData)
        setStudentProfile(profileData)
      } else {
        console.log('❌ No student profile found')
        setStudentProfile(null)
      }
      setQualificationChecked(true)
    } catch (error) {
      console.error('❌ Error fetching student profile:', error)
      setQualificationChecked(true)
    }
  }

  const fetchAppliedJobs = async () => {
    try {
      const applicationsQuery = query(
        collection(db, 'jobApplications'),
        where('studentId', '==', userData.uid)
      )
      const applicationsSnapshot = await getDocs(applicationsQuery)
      const appliedJobIds = applicationsSnapshot.docs.map(doc => doc.data().jobId)
      setAppliedJobs(new Set(appliedJobIds))
    } catch (error) {
      console.error('Error fetching job applications:', error)
    }
  }

  const fetchSavedJobs = async () => {
    try {
      const savedQuery = query(
        collection(db, 'savedJobs'),
        where('studentId', '==', userData.uid)
      )
      const savedSnapshot = await getDocs(savedQuery)
      const savedJobIds = savedSnapshot.docs.map(doc => doc.data().jobId)
      setSavedJobs(new Set(savedJobIds))
    } catch (error) {
      console.error('Error fetching saved jobs:', error)
    }
  }

  const checkJobQualification = (job, profile) => {
    console.log('🎯 Checking qualification for job:', job.title)
    console.log('📊 Job requirements:', job.requirements)
    console.log('👤 Student profile:', profile)

    if (!job.requirements) {
      console.log('✅ No requirements - job is accessible')
      return { 
        qualified: true, 
        reason: 'No specific requirements',
        missingQualifications: [],
        meetsQualifications: ['No specific requirements specified']
      }
    }
    
    const requirements = job.requirements
    const qualification = {
      qualified: true,
      missingQualifications: [],
      meetsQualifications: []
    }

    // Check minimum education level
    if (requirements.minEducation) {
      const educationOrder = {
        'high-school': 1,
        'associate': 2,
        'bachelor': 3,
        'master': 4,
        'phd': 5
      }
      
      const studentEducation = profile?.educationLevel || 'high-school'
      const requiredEducation = requirements.minEducation
      
      console.log(`📚 Education check: Student ${studentEducation} vs Required ${requiredEducation}`)
      
      if (educationOrder[studentEducation] < educationOrder[requiredEducation]) {
        qualification.qualified = false
        qualification.missingQualifications.push(`Minimum ${requiredEducation} degree required (your education: ${studentEducation})`)
        console.log('❌ Education requirement not met')
      } else {
        qualification.meetsQualifications.push(`Meets education requirement (${requiredEducation})`)
        console.log('✅ Education requirement met')
      }
    }

    // Check minimum experience level
    if (requirements.minExperience) {
      const experienceOrder = {
        'entry': 1,
        'mid': 2,
        'senior': 3,
        'executive': 4
      }
      
      const studentExperience = profile?.experienceLevel || 'entry'
      const requiredExperience = requirements.minExperience
      
      console.log(`💼 Experience check: Student ${studentExperience} vs Required ${requiredExperience}`)
      
      if (experienceOrder[studentExperience] < experienceOrder[requiredExperience]) {
        qualification.qualified = false
        qualification.missingQualifications.push(`Minimum ${requiredExperience} level experience required`)
        console.log('❌ Experience requirement not met')
      } else {
        qualification.meetsQualifications.push(`Meets experience requirement (${requiredExperience})`)
        console.log('✅ Experience requirement met')
      }
    }

    // Check required skills
    if (requirements.requiredSkills && requirements.requiredSkills.length > 0) {
      const studentSkills = profile?.skills || []
      const missingSkills = requirements.requiredSkills.filter(skill => 
        !studentSkills.some(studentSkill => 
          studentSkill.toLowerCase().includes(skill.toLowerCase()) ||
          skill.toLowerCase().includes(studentSkill.toLowerCase())
        )
      )

      if (missingSkills.length > 0) {
        qualification.qualified = false
        qualification.missingQualifications.push(`Missing skills: ${missingSkills.join(', ')}`)
        console.log('❌ Skills requirement not met')
      } else {
        qualification.meetsQualifications.push('Meets all skill requirements')
        console.log('✅ Skills requirement met')
      }
    }

    // Check minimum GPA/points if specified
    if (requirements.minGPA) {
      const studentGPA = profile?.gpa || profile?.grades?.points || 0
      console.log(`📊 GPA check: Student ${studentGPA} vs Required ${requirements.minGPA}`)
      
      if (studentGPA < requirements.minGPA) {
        qualification.qualified = false
        qualification.missingQualifications.push(`Minimum GPA of ${requirements.minGPA} required (your GPA: ${studentGPA})`)
        console.log('❌ GPA requirement not met')
      } else {
        qualification.meetsQualifications.push(`Meets GPA requirement (${requirements.minGPA})`)
        console.log('✅ GPA requirement met')
      }
    }

    // Check specific qualifications/certifications
    if (requirements.qualifications && requirements.qualifications.length > 0) {
      const studentQualifications = profile?.qualifications || []
      const missingQualifications = requirements.qualifications.filter(qual => 
        !studentQualifications.some(studentQual => 
          studentQual.toLowerCase().includes(qual.toLowerCase()) ||
          qual.toLowerCase().includes(studentQual.toLowerCase())
        )
      )

      if (missingQualifications.length > 0) {
        qualification.qualified = false
        qualification.missingQualifications.push(`Missing qualifications: ${missingQualifications.join(', ')}`)
        console.log('❌ Qualifications requirement not met')
      } else {
        qualification.meetsQualifications.push('Meets all qualification requirements')
        console.log('✅ Qualifications requirement met')
      }
    }

    console.log('🎯 Final qualification:', qualification.qualified)
    return qualification
  }

  const filterAndSortJobs = () => {
    console.log('🔍 Starting job filtering...')
    console.log('📚 Total jobs:', jobs.length)
    console.log('👤 Student profile:', studentProfile)
    console.log('✅ Qualification checked:', qualificationChecked)

    let filtered = jobs

    // Apply qualification filtering if student profile is available
    if (studentProfile && qualificationChecked) {
      console.log('🎯 Applying qualification filtering...')
      const beforeFilter = filtered.length
      
      filtered = filtered.filter(job => {
        const qualification = checkJobQualification(job, studentProfile)
        job.qualification = qualification // Attach qualification info to job
        return qualification.qualified
      })
      
      console.log(`📊 Filtered from ${beforeFilter} to ${filtered.length} jobs`)
    } else if (qualificationChecked) {
      console.log('ℹ️ No student profile available, showing all jobs')
    }

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(job =>
        job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.company?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (job.requirements?.requiredSkills && job.requirements.requiredSkills.some(skill => 
          skill.toLowerCase().includes(searchTerm.toLowerCase())
        ))
      )
    }

    // Company filter
    if (companyFilter !== 'all') {
      filtered = filtered.filter(job => job.companyId === companyFilter)
    }

    // Job type filter
    if (jobTypeFilter !== 'all') {
      filtered = filtered.filter(job => job.jobType === jobTypeFilter)
    }

    // Experience filter
    if (experienceFilter !== 'all') {
      filtered = filtered.filter(job => job.experience === experienceFilter)
    }

    // Sort jobs
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt?.toDate?.() || b.createdAt) - new Date(a.createdAt?.toDate?.() || a.createdAt)
        case 'oldest':
          return new Date(a.createdAt?.toDate?.() || a.createdAt) - new Date(b.createdAt?.toDate?.() || b.createdAt)
        case 'title':
          return a.title.localeCompare(b.title)
        case 'deadline':
          return new Date(a.deadline?.toDate?.() || a.deadline) - new Date(b.deadline?.toDate?.() || b.deadline)
        case 'company':
          return a.company?.name?.localeCompare(b.company?.name)
        default:
          return 0
      }
    })

    console.log('✅ Final filtered jobs:', filtered.length)
    setFilteredJobs(filtered)
  }

  const applyForJob = async (jobId) => {
    if (!userData) {
      toast.error('Please log in to apply for jobs')
      return
    }

    // Check if already applied
    if (appliedJobs.has(jobId)) {
      toast.error('You have already applied for this job')
      return
    }

    try {
      const job = jobs.find(j => j.id === jobId)
      const applicationData = {
        studentId: userData.uid,
        jobId: jobId,
        companyId: job?.companyId,
        status: 'pending',
        appliedAt: new Date(),
        // Student profile information
        studentName: userData.displayName,
        studentEmail: userData.email,
        // Qualification info
        qualified: job?.qualification?.qualified || false,
        qualificationDetails: job?.qualification || {}
      }

      await addDoc(collection(db, 'jobApplications'), applicationData)
      
      // Update local state
      setAppliedJobs(prev => new Set([...prev, jobId]))
      toast.success('Job application submitted successfully!')
    } catch (error) {
      console.error('Error applying for job:', error)
      toast.error('Failed to submit application. Please try again.')
    }
  }

  const toggleSaveJob = async (jobId) => {
    if (!userData) {
      toast.error('Please log in to save jobs')
      return
    }

    try {
      if (savedJobs.has(jobId)) {
        // Remove from saved jobs
        const savedQuery = query(
          collection(db, 'savedJobs'),
          where('studentId', '==', userData.uid),
          where('jobId', '==', jobId)
        )
        const savedSnapshot = await getDocs(savedQuery)
        
        if (!savedSnapshot.empty) {
          await deleteDoc(doc(db, 'savedJobs', savedSnapshot.docs[0].id))
        }
        
        setSavedJobs(prev => {
          const newSet = new Set(prev)
          newSet.delete(jobId)
          return newSet
        })
        
        toast.success('Job removed from saved jobs')
      } else {
        // Add to saved jobs
        const saveData = {
          studentId: userData.uid,
          jobId: jobId,
          savedAt: new Date()
        }

        await addDoc(collection(db, 'savedJobs'), saveData)
        
        setSavedJobs(prev => new Set([...prev, jobId]))
        toast.success('Job saved successfully!')
      }
    } catch (error) {
      console.error('Error toggling save job:', error)
      toast.error('Failed to update saved jobs. Please try again.')
    }
  }

  const isDeadlinePassed = (deadline) => {
    if (!deadline) return true
    const deadlineDate = deadline.toDate ? deadline.toDate() : new Date(deadline)
    return deadlineDate < new Date()
  }

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A'
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    return date.toLocaleDateString()
  }

  const getExperienceLabel = (experience) => {
    const labels = {
      'entry': 'Entry Level',
      'mid': 'Mid Level',
      'senior': 'Senior Level',
      'executive': 'Executive'
    }
    return labels[experience] || experience
  }

  const getJobTypeLabel = (jobType) => {
    const labels = {
      'full-time': 'Full Time',
      'part-time': 'Part Time',
      'contract': 'Contract',
      'internship': 'Internship',
      'remote': 'Remote'
    }
    return labels[jobType] || jobType
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
                <div key={i} className="h-96 bg-gray-200 rounded-lg"></div>
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Browse Jobs</h1>
          <p className="text-gray-600 mt-2">
            {studentProfile 
              ? "Jobs you qualify for based on your profile"
              : "Discover career opportunities from partner companies"
            }
            {!qualificationChecked && " (Checking your qualifications...)"}
          </p>
          {studentProfile && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-blue-800">
                <strong>Your Profile:</strong> {studentProfile.educationLevel || 'Not specified'} | 
                Skills: {studentProfile.skills?.length || 0}
              </p>
              <p className="text-xs text-blue-600 mt-1">
                Debug: {jobs.length} total jobs, {filteredJobs.length} qualified
              </p>
            </div>
          )}
        </div>

        {/* Qualification Notice */}
        {!studentProfile && qualificationChecked && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-yellow-800">
              <strong>Note:</strong> We couldn't find your complete profile information. 
              Please update your student profile with your education, skills, and experience to see jobs you qualify for.
            </p>
          </div>
        )}

        {/* Filters and Search */}
        <div className="card mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search jobs, companies, or skills..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input-field pl-10"
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-4">
              <select
                value={companyFilter}
                onChange={(e) => setCompanyFilter(e.target.value)}
                className="input-field"
              >
                <option value="all">All Companies</option>
                {companies.map(company => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </select>
              <select
                value={jobTypeFilter}
                onChange={(e) => setJobTypeFilter(e.target.value)}
                className="input-field"
              >
                <option value="all">All Job Types</option>
                <option value="full-time">Full Time</option>
                <option value="part-time">Part Time</option>
                <option value="contract">Contract</option>
                <option value="internship">Internship</option>
                <option value="remote">Remote</option>
              </select>
              <select
                value={experienceFilter}
                onChange={(e) => setExperienceFilter(e.target.value)}
                className="input-field"
              >
                <option value="all">All Experience Levels</option>
                <option value="entry">Entry Level</option>
                <option value="mid">Mid Level</option>
                <option value="senior">Senior Level</option>
                <option value="executive">Executive</option>
              </select>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="input-field"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="title">Job Title A-Z</option>
                <option value="company">Company Name</option>
                <option value="deadline">Application Deadline</option>
              </select>
            </div>
          </div>
        </div>

        {/* Jobs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredJobs.map((job) => {
            const hasApplied = appliedJobs.has(job.id)
            const isSaved = savedJobs.has(job.id)
            const deadlinePassed = isDeadlinePassed(job.deadline)
            
            return (
              <div key={job.id} className="card group hover:shadow-lg transition-shadow duration-300">
                {/* Qualification Badge */}
                {job.qualification && (
                  <div className="mb-3">
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                      job.qualification.qualified 
                        ? 'bg-green-100 text-green-800 border border-green-200' 
                        : 'bg-red-100 text-red-800 border border-red-200'
                    }`}>
                      {job.qualification.qualified ? 'You Qualify' : 'Requirements Not Met'}
                    </span>
                  </div>
                )}

                {/* Job Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors duration-200">
                      {job.title}
                    </h3>
                    <div className="flex items-center space-x-2 mt-1">
                      <Building className="h-4 w-4 text-gray-400" />
                      <p className="text-sm text-gray-600">{job.company?.name}</p>
                    </div>
                  </div>
                  <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <button 
                      onClick={() => toggleSaveJob(job.id)}
                      className={`p-1 rounded transition-colors duration-200 ${
                        isSaved 
                          ? 'text-red-500 hover:text-red-600 hover:bg-red-50' 
                          : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
                      }`}
                    >
                      <Heart className={`h-4 w-4 ${isSaved ? 'fill-current' : ''}`} />
                    </button>
                    <button className="p-1 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded transition-colors duration-200">
                      <Share2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Job Description */}
                <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                  {job.description}
                </p>

                {/* Job Details */}
                <div className="space-y-3 mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="h-4 w-4 mr-2" />
                    {job.location || 'Remote'}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Clock className="h-4 w-4 mr-2" />
                    {getJobTypeLabel(job.jobType)}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Users className="h-4 w-4 mr-2" />
                    {getExperienceLabel(job.experience)}
                  </div>
                  {job.salary && (
                    <div className="flex items-center text-sm text-gray-600">
                      <DollarSign className="h-4 w-4 mr-2" />
                      {job.salary}
                    </div>
                  )}
                </div>

                {/* Requirements Preview */}
                {job.requirements && (
                  <div className="mb-4 p-3 bg-slate-50 rounded-lg">
                    <h4 className="text-sm font-medium text-slate-800 mb-2 flex items-center">
                      <Target className="h-4 w-4 mr-2" />
                      Requirements:
                    </h4>
                    <div className="space-y-1 text-xs text-slate-600">
                      {job.requirements.minEducation && (
                        <p>Education: {job.requirements.minEducation}</p>
                      )}
                      {job.requirements.minExperience && (
                        <p>Experience: {getExperienceLabel(job.requirements.minExperience)}</p>
                      )}
                      {job.requirements.minGPA && (
                        <p>Minimum GPA: {job.requirements.minGPA}</p>
                      )}
                      {job.requirements.requiredSkills && job.requirements.requiredSkills.length > 0 && (
                        <p>Skills: {job.requirements.requiredSkills.slice(0, 3).join(', ')}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Application Deadline */}
                <div className={`p-3 rounded-lg mb-4 ${
                  deadlinePassed 
                    ? 'bg-red-50 border border-red-200' 
                    : 'bg-blue-50 border border-blue-200'
                }`}>
                  <div className="flex justify-between items-center text-sm">
                    <span className={deadlinePassed ? 'text-red-700' : 'text-blue-700'}>
                      Application Deadline
                    </span>
                    <span className={`font-medium ${deadlinePassed ? 'text-red-800' : 'text-blue-800'}`}>
                      {formatDate(job.deadline)}
                    </span>
                  </div>
                  {deadlinePassed && (
                    <p className="text-xs text-red-600 mt-1">Applications closed</p>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-2">
                  <button 
                    onClick={() => navigate(`/jobs/${job.id}`)}
                    className="btn-secondary flex-1 text-sm flex items-center justify-center"
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    View Details
                  </button>
                  <button
                    onClick={() => applyForJob(job.id)}
                    disabled={hasApplied || deadlinePassed || !userData || (job.qualification && !job.qualification.qualified)}
                    className={`flex-1 text-sm flex items-center justify-center ${
                      hasApplied 
                        ? 'btn-secondary cursor-not-allowed' 
                        : deadlinePassed
                        ? 'btn-secondary cursor-not-allowed'
                        : (job.qualification && !job.qualification.qualified)
                        ? 'btn-secondary cursor-not-allowed'
                        : 'btn-primary'
                    }`}
                  >
                    {hasApplied ? 'Applied' : 
                     deadlinePassed ? 'Closed' : 
                     (job.qualification && !job.qualification.qualified) ? 'Not Qualified' : 
                     'Apply Now'}
                  </button>
                </div>

                {/* Qualification Details */}
                {job.qualification && !job.qualification.qualified && (
                  <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                    <p className="font-medium">Why you don't qualify:</p>
                    <ul className="list-disc list-inside mt-1">
                      {job.qualification.missingQualifications.map((req, index) => (
                        <li key={index}>{req}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Application Status */}
                {hasApplied && (
                  <div className="mt-2 text-center">
                    <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                      ✓ Application Submitted
                    </span>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {filteredJobs.length === 0 && (
          <div className="text-center py-12">
            <Briefcase className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              {jobs.length === 0 ? 'No jobs available' : 'No jobs match your qualifications'}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {jobs.length === 0 ? 'No jobs available at the moment.' : 
               studentProfile ? 'Try updating your profile or explore different filters.' :
               'Try adjusting your search terms or filters.'}
            </p>
            {studentProfile && jobs.length > 0 && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg max-w-md mx-auto">
                <p className="text-sm text-blue-800">
                  <strong>Debug Info:</strong> You have a {studentProfile.educationLevel || 'Not specified'} degree. 
                  There are {jobs.length} total jobs but none match your current qualifications.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Results Count */}
        {filteredJobs.length > 0 && (
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Showing {filteredJobs.length} of {jobs.length} jobs
              {studentProfile && ' that you qualify for'}
            </p>
          </div>
        )}

        {/* Job Search Tips */}
        <div className="card mt-6 bg-blue-50 border-blue-200">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">
            {studentProfile ? 'Improve Your Qualifications' : 'Job Search Tips'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
            <div>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <GraduationCap className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                  Update your education level in your profile
                </li>
                <li className="flex items-start">
                  <Award className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                  Add all your skills and certifications
                </li>
                <li className="flex items-start">
                  <Briefcase className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                  Include relevant work experience
                </li>
              </ul>
            </div>
            <div>
              <ul className="space-y-2">
                <li>• Tailor your resume for each job application</li>
                <li>• Research the company before applying</li>
                <li>• Apply early before deadlines</li>
                <li>• Save interesting jobs for later review</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default JobBrowser