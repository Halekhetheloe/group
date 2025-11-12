import React, { useState, useEffect } from 'react'
import { collection, query, getDocs, where, orderBy, doc, getDoc, addDoc } from 'firebase/firestore'
import { db } from '../../firebase-config'
import { useAuth } from '../../hooks/useAuth'

const CourseBrowser = () => {
  const { userData } = useAuth()
  const [courses, setCourses] = useState([])
  const [filteredCourses, setFilteredCourses] = useState([])
  const [institutions, setInstitutions] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [institutionFilter, setInstitutionFilter] = useState('all')
  const [facultyFilter, setFacultyFilter] = useState('all')
  const [durationFilter, setDurationFilter] = useState('all')
  const [sortBy, setSortBy] = useState('newest')
  const [appliedCourses, setAppliedCourses] = useState(new Set())
  const [studentGrades, setStudentGrades] = useState(null)
  const [eligibilityChecked, setEligibilityChecked] = useState(false)
  const [noQualifiedCourses, setNoQualifiedCourses] = useState(false)

  // CSS Styles
  const styles = {
    container: "min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6",
    headerContainer: "max-w-7xl mx-auto",
    header: "text-4xl font-bold text-slate-800 mb-3",
    subtitle: "text-lg text-slate-600 mb-8",
    card: "bg-white rounded-2xl shadow-sm border border-slate-200 p-6 hover:shadow-lg transition-all duration-300 backdrop-blur-sm bg-white/95",
    filterCard: "bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6",
    inputField: "w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white text-slate-900 placeholder-slate-500",
    selectField: "px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white text-slate-900 min-w-[150px]",
    btnPrimary: "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-xl font-semibold shadow-sm hover:shadow-md transition-all duration-200 transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none",
    btnSecondary: "bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white px-6 py-3 rounded-xl font-semibold shadow-sm hover:shadow-md transition-all duration-200 transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none",
    btnOutline: "border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 transform hover:-translate-y-0.5",
    courseTitle: "text-xl font-bold text-slate-800 group-hover:text-blue-600 transition-colors duration-200",
    institutionName: "text-sm text-slate-600 mt-1",
    courseDescription: "text-sm text-slate-600 mb-4 line-clamp-3",
    detailText: "text-sm text-slate-600 flex items-center",
    requirementBadge: "inline-block bg-slate-100 text-slate-700 text-xs px-2 py-1 rounded-lg border border-slate-200",
    moreBadge: "inline-block bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-lg border border-blue-200",
    deadlinePassed: "bg-red-50 border border-red-200 text-red-700",
    deadlineActive: "bg-blue-50 border border-blue-200 text-blue-700",
    warningText: "text-xs text-red-600 mt-1",
    grid: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6",
    flexBetween: "flex items-center justify-between",
    flexCenter: "flex items-center justify-center",
    iconButton: "p-1 text-slate-400 hover:text-blue-500 rounded transition-colors duration-200",
    icon: "h-4 w-4 mr-2",
    emptyState: "text-center py-12",
    emptyIcon: "mx-auto h-12 w-12 text-slate-400 mb-4",
    emptyTitle: "text-lg font-semibold text-slate-800 mb-2",
    emptyText: "text-slate-600 mb-6",
    loadingPulse: "animate-pulse",
    loadingHeader: "h-8 bg-slate-200 rounded w-1/4 mb-6",
    loadingFilter: "h-12 bg-slate-200 rounded mb-6",
    loadingCard: "h-96 bg-slate-200 rounded-lg"
  }

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    if (userData) {
      fetchStudentGrades()
      fetchAppliedCourses()
    }
  }, [userData])

  useEffect(() => {
    filterAndSortCourses()
  }, [courses, searchTerm, institutionFilter, facultyFilter, durationFilter, sortBy, studentGrades])

  const fetchStudentGrades = async () => {
    try {
      if (!userData) return
      
      const studentDoc = await getDoc(doc(db, 'students', userData.uid))
      if (studentDoc.exists()) {
        const studentData = studentDoc.data()
        setStudentGrades(studentData.grades || studentData.academicRecords || null)
      }
      setEligibilityChecked(true)
    } catch (error) {
      console.error('Error fetching student grades:', error)
      setEligibilityChecked(true)
    }
  }

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // Fetch all active courses
      const coursesQuery = query(
        collection(db, 'courses'),
        where('status', '==', 'active'),
        orderBy('createdAt', 'desc')
      )
      const coursesSnapshot = await getDocs(coursesQuery)
      const coursesData = coursesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))

      // Fetch institution details for each course
      const coursesWithInstitutions = await Promise.all(
        coursesData.map(async (course) => {
          const institutionDoc = await getDoc(doc(db, 'institutions', course.institutionId))
          const institutionData = institutionDoc.exists() ? institutionDoc.data() : { name: 'Unknown Institution', location: 'Unknown' }
          return {
            ...course,
            institution: institutionData
          }
        })
      )

      setCourses(coursesWithInstitutions)

      // Get unique institutions for filter
      const uniqueInstitutions = [...new Set(coursesData.map(course => course.institutionId))]
      const institutionDetails = await Promise.all(
        uniqueInstitutions.map(async (id) => {
          const institutionDoc = await getDoc(doc(db, 'institutions', id))
          return {
            id,
            ...institutionDoc.data()
          }
        })
      )
      setInstitutions(institutionDetails)

    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAppliedCourses = async () => {
    try {
      const applicationsQuery = query(
        collection(db, 'applications'),
        where('studentId', '==', userData.uid)
      )
      const applicationsSnapshot = await getDocs(applicationsQuery)
      const appliedCourseIds = applicationsSnapshot.docs.map(doc => doc.data().courseId)
      setAppliedCourses(new Set(appliedCourseIds))
    } catch (error) {
      console.error('Error fetching applications:', error)
    }
  }

  const checkCourseEligibility = (course, grades) => {
    if (!course.requirements) return { eligible: true, reason: 'No requirements specified' }
    
    const requirements = course.requirements
    const eligibility = {
      eligible: true,
      missingRequirements: [],
      meetsRequirements: []
    }

    // Check minimum grade requirement
    if (requirements.minGrade) {
      const gradeOrder = { 'A': 5, 'B': 4, 'C': 3, 'D': 2, 'E': 1, 'F': 0 }
      const studentOverallGrade = grades?.overall || 'F'
      
      if (gradeOrder[studentOverallGrade] < gradeOrder[requirements.minGrade]) {
        eligibility.eligible = false
        eligibility.missingRequirements.push(`Minimum grade of ${requirements.minGrade} required (your grade: ${studentOverallGrade})`)
      } else {
        eligibility.meetsRequirements.push(`Meets grade requirement (${requirements.minGrade})`)
      }
    }

    // Check subject requirements
    if (requirements.subjects && requirements.subjects.length > 0) {
      const missingSubjects = requirements.subjects.filter(subject => 
        !grades?.subjects || !grades.subjects[subject]
      )

      if (missingSubjects.length > 0) {
        eligibility.eligible = false
        eligibility.missingRequirements.push(`Missing subjects: ${missingSubjects.join(', ')}`)
      } else {
        eligibility.meetsRequirements.push('Meets all subject requirements')
      }
    }

    // Check minimum points
    if (requirements.minPoints) {
      const studentPoints = grades?.points || 0
      if (studentPoints < requirements.minPoints) {
        eligibility.eligible = false
        eligibility.missingRequirements.push(`Minimum ${requirements.minPoints} points required (your points: ${studentPoints})`)
      } else {
        eligibility.meetsRequirements.push(`Meets points requirement (${requirements.minPoints})`)
      }
    }

    return eligibility
  }

  const filterAndSortCourses = () => {
    let filtered = courses

    // Apply grade-based filtering if student grades are available
    if (studentGrades && eligibilityChecked) {
      filtered = filtered.filter(course => {
        const eligibility = checkCourseEligibility(course, studentGrades)
        course.eligibility = eligibility // Attach eligibility info to course
        return eligibility.eligible
      })

      // NEW: Check if no courses are qualified
      setNoQualifiedCourses(filtered.length === 0)
    }

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(course =>
        course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.institution?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Institution filter
    if (institutionFilter !== 'all') {
      filtered = filtered.filter(course => course.institutionId === institutionFilter)
    }

    // Faculty filter
    if (facultyFilter !== 'all') {
      filtered = filtered.filter(course => course.facultyId === facultyFilter)
    }

    // Duration filter
    if (durationFilter !== 'all') {
      filtered = filtered.filter(course => {
        const duration = course.duration?.toLowerCase() || ''
        if (durationFilter === 'short' && (duration.includes('month') || duration.includes('1 year'))) {
          return true
        }
        if (durationFilter === 'medium' && (duration.includes('2 year') || duration.includes('3 year'))) {
          return true
        }
        if (durationFilter === 'long' && (duration.includes('4 year') || duration.includes('5 year'))) {
          return true
        }
        return false
      })
    }

    // Sort courses
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt?.toDate?.() || b.createdAt) - new Date(a.createdAt?.toDate?.() || a.createdAt)
        case 'oldest':
          return new Date(a.createdAt?.toDate?.() || a.createdAt) - new Date(b.createdAt?.toDate?.() || b.createdAt)
        case 'name':
          return a.name.localeCompare(b.name)
        case 'deadline':
          return new Date(a.applicationDeadline?.toDate?.() || a.applicationDeadline) - new Date(b.applicationDeadline?.toDate?.() || b.applicationDeadline)
        default:
          return 0
      }
    })

    setFilteredCourses(filtered)
  }

  const applyForCourse = async (courseId) => {
    if (!userData) {
      alert('Please log in to apply for courses')
      return
    }

    // Check if already applied
    if (appliedCourses.has(courseId)) {
      alert('You have already applied for this course')
      return
    }

    // Check application limit (max 2 applications per institution)
    const course = courses.find(c => c.id === courseId)
    const institutionApplications = Array.from(appliedCourses).filter(id => {
      const appliedCourse = courses.find(c => c.id === id)
      return appliedCourse?.institutionId === course?.institutionId
    })

    if (institutionApplications.length >= 2) {
      alert('You can only apply for 2 courses per institution')
      return
    }

    try {
      const applicationData = {
        studentId: userData.uid,
        courseId: courseId,
        institutionId: course?.institutionId,
        status: 'pending',
        appliedAt: new Date(),
        documents: [],
        type: 'course'
      }

      await addDoc(collection(db, 'applications'), applicationData)
      
      // Update local state
      setAppliedCourses(prev => new Set([...prev, courseId]))
      alert('Application submitted successfully!')
    } catch (error) {
      console.error('Error applying for course:', error)
      alert('Failed to submit application. Please try again.')
    }
  }

  const isDeadlinePassed = (deadline) => {
    if (!deadline) return true
    const deadlineDate = deadline.toDate ? deadline.toDate() : new Date(deadline)
    return deadlineDate < new Date()
  }

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A'
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    } catch (error) {
      return 'Invalid Date'
    }
  }

  const getUniqueFaculties = () => {
    const faculties = courses.map(course => ({
      id: course.facultyId,
      name: course.facultyName
    }))
    return faculties.filter((faculty, index, self) => 
      faculty.id && self.findIndex(f => f.id === faculty.id) === index
    )
  }

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.headerContainer}>
          <div className={styles.loadingPulse}>
            <div className={styles.loadingHeader}></div>
            <div className={styles.loadingFilter}></div>
            <div className={styles.grid}>
              {[...Array(6)].map((_, i) => (
                <div key={i} className={styles.loadingCard}></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.headerContainer}>
        {/* Header */}
        <div className="mb-8">
          <h1 className={styles.header}>Browse Courses</h1>
          <p className={styles.subtitle}>
            {studentGrades 
              ? "Courses you qualify for based on your grades"
              : "Discover programs from institutions across Lesotho"
            }
            {!eligibilityChecked && " (Checking your eligibility...)"}
          </p>
          {studentGrades && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-blue-800">
                <strong>Your Grades:</strong> Overall: {studentGrades.overall || 'Not specified'} | 
                Points: {studentGrades.points || 'Not specified'}
              </p>
            </div>
          )}
        </div>

        {/* Filters and Search - Hide when no qualified courses */}
        {!noQualifiedCourses && (
          <div className={styles.filterCard}>
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
              <div className="flex-1 max-w-md">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <div className="h-4 w-4 bg-slate-400 rounded"></div>
                  </div>
                  <input
                    type="text"
                    placeholder="Search courses, institutions, or programs..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={`${styles.inputField} pl-10`}
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-4">
                <select
                  value={institutionFilter}
                  onChange={(e) => setInstitutionFilter(e.target.value)}
                  className={styles.selectField}
                >
                  <option value="all">All Institutions</option>
                  {institutions.map(institution => (
                    <option key={institution.id} value={institution.id}>
                      {institution.name}
                    </option>
                  ))}
                </select>
                <select
                  value={facultyFilter}
                  onChange={(e) => setFacultyFilter(e.target.value)}
                  className={styles.selectField}
                >
                  <option value="all">All Faculties</option>
                  {getUniqueFaculties().map(faculty => (
                    <option key={faculty.id} value={faculty.id}>
                      {faculty.name}
                    </option>
                  ))}
                </select>
                <select
                  value={durationFilter}
                  onChange={(e) => setDurationFilter(e.target.value)}
                  className={styles.selectField}
                >
                  <option value="all">Any Duration</option>
                  <option value="short">Short (≤1 year)</option>
                  <option value="medium">Medium (2-3 years)</option>
                  <option value="long">Long (≥4 years)</option>
                </select>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className={styles.selectField}
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="name">Name A-Z</option>
                  <option value="deadline">Application Deadline</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Eligibility Notice */}
        {!studentGrades && eligibilityChecked && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-yellow-800">
              <strong>Note:</strong> We couldn't find your grade information. 
              Please update your student profile with your academic records to see courses you qualify for.
            </p>
          </div>
        )}

        {/* NEW: No Qualified Courses Message */}
        {noQualifiedCourses && studentGrades && (
          <div className="bg-white rounded-2xl shadow-sm border border-red-200 p-8 text-center mb-6">
            <div className="text-red-500 text-6xl mb-4">🎓</div>
            <h2 className="text-2xl font-bold text-red-800 mb-4">
              You Don't Qualify for Any Courses
            </h2>
            <p className="text-red-700 mb-6 max-w-2xl mx-auto">
              Based on your current grades, you don't meet the requirements for any available courses. 
              Don't worry! Here are some suggestions to improve your chances:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 max-w-4xl mx-auto">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-left">
                <h3 className="font-semibold text-red-800 mb-2">📚 Improve Your Grades</h3>
                <p className="text-red-700 text-sm">
                  Consider retaking subjects or improving your overall performance
                </p>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-left">
                <h3 className="font-semibold text-red-800 mb-2">🎯 Explore Alternative Paths</h3>
                <p className="text-red-700 text-sm">
                  Look for bridging programs or foundation courses with lower requirements
                </p>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-left">
                <h3 className="font-semibold text-red-800 mb-2">💼 Consider Vocational Training</h3>
                <p className="text-red-700 text-sm">
                  Explore skills-based programs that may have different entry requirements
                </p>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-left">
                <h3 className="font-semibold text-red-800 mb-2">📞 Contact Institutions</h3>
                <p className="text-red-700 text-sm">
                  Some institutions offer special consideration or alternative entry pathways
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => navigate('/student/grades')}
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
              >
                Update Your Grades
              </button>
              <button
                onClick={() => navigate('/student/dashboard')}
                className="border border-red-600 text-red-600 hover:bg-red-50 px-6 py-3 rounded-lg font-semibold transition-colors"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        )}

        {/* Courses Grid - Only show when there are qualified courses */}
        {!noQualifiedCourses && filteredCourses.length > 0 && (
          <div className={styles.grid}>
            {filteredCourses.map((course) => {
              const hasApplied = appliedCourses.has(course.id)
              const deadlinePassed = isDeadlinePassed(course.applicationDeadline)
              
              return (
                <div key={course.id} className={`${styles.card} group`}>
                  {/* Eligibility Badge */}
                  {course.eligibility && (
                    <div className="mb-3">
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                        course.eligibility.eligible 
                          ? 'bg-green-100 text-green-800 border border-green-200' 
                          : 'bg-red-100 text-red-800 border border-red-200'
                      }`}>
                        {course.eligibility.eligible ? 'You Qualify' : 'Requirements Not Met'}
                      </span>
                    </div>
                  )}

                  {/* Course Header */}
                  <div className={styles.flexBetween}>
                    <div className="flex-1">
                      <h3 className={styles.courseTitle}>
                        {course.name}
                      </h3>
                      <p className={styles.institutionName}>{course.institution?.name}</p>
                    </div>
                    <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <button className={styles.iconButton}>
                        <div className="h-4 w-4 bg-red-400 rounded"></div>
                      </button>
                      <button className={styles.iconButton}>
                        <div className="h-4 w-4 bg-blue-400 rounded"></div>
                      </button>
                    </div>
                  </div>

                  {/* Course Description */}
                  <p className={styles.courseDescription}>
                    {course.description}
                  </p>

                  {/* Course Details */}
                  <div className="space-y-3 mb-4">
                    <div className={styles.detailText}>
                      <div className="h-4 w-4 bg-blue-500 rounded mr-2"></div>
                      {course.facultyName || 'General Studies'}
                    </div>
                    <div className={styles.detailText}>
                      <div className="h-4 w-4 bg-green-500 rounded mr-2"></div>
                      {course.duration || 'Duration not specified'}
                    </div>
                    <div className={styles.detailText}>
                      <div className="h-4 w-4 bg-yellow-500 rounded mr-2"></div>
                      {course.tuition || 'Tuition not specified'}
                    </div>
                    <div className={styles.detailText}>
                      <div className="h-4 w-4 bg-purple-500 rounded mr-2"></div>
                      {course.institution?.location || 'Location not specified'}
                    </div>
                    <div className={styles.detailText}>
                      <div className="h-4 w-4 bg-indigo-500 rounded mr-2"></div>
                      {course.seats || 'Unknown'} seats available
                    </div>
                  </div>

                  {/* Requirements */}
                  {course.requirements && (
                    <div className="mb-4 p-3 bg-slate-50 rounded-lg">
                      <h4 className="text-sm font-medium text-slate-800 mb-2">Requirements:</h4>
                      <div className="space-y-1">
                        {course.requirements.minGrade && (
                          <p className="text-xs text-slate-600">Minimum Grade: {course.requirements.minGrade}</p>
                        )}
                        {course.requirements.minPoints && (
                          <p className="text-xs text-slate-600">Minimum Points: {course.requirements.minPoints}</p>
                        )}
                        {course.requirements.subjects && course.requirements.subjects.length > 0 && (
                          <p className="text-xs text-slate-600">Required Subjects: {course.requirements.subjects.join(', ')}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Application Deadline */}
                  <div className={`p-3 rounded-lg mb-4 ${
                    deadlinePassed ? styles.deadlinePassed : styles.deadlineActive
                  }`}>
                    <div className="flex justify-between items-center text-sm">
                      <span>Application Deadline</span>
                      <span className="font-medium">
                        {formatDate(course.applicationDeadline)}
                      </span>
                    </div>
                    {deadlinePassed && (
                      <p className={styles.warningText}>Applications closed</p>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-2">
                    <button className={styles.btnSecondary}>
                      <div className="h-4 w-4 bg-white rounded mr-1"></div>
                      View Details
                    </button>
                    <button
                      onClick={() => applyForCourse(course.id)}
                      disabled={hasApplied || deadlinePassed || !userData || (course.eligibility && !course.eligibility.eligible)}
                      className={styles.btnPrimary}
                    >
                      {hasApplied ? 'Applied' : deadlinePassed ? 'Closed' : (course.eligibility && !course.eligibility.eligible) ? 'Not Eligible' : 'Apply Now'}
                    </button>
                  </div>

                  {/* Application Limit Warning */}
                  {!hasApplied && !deadlinePassed && userData && course.eligibility?.eligible && (
                    <div className="mt-2 text-xs text-slate-500">
                      Max 2 applications per institution
                    </div>
                  )}

                  {/* Eligibility Details */}
                  {course.eligibility && !course.eligibility.eligible && (
                    <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                      <p className="font-medium">Why you don't qualify:</p>
                      <ul className="list-disc list-inside mt-1">
                        {course.eligibility.missingRequirements.map((req, index) => (
                          <li key={index}>{req}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Empty State - Only show when there are no qualified courses but student has grades */}
        {!noQualifiedCourses && filteredCourses.length === 0 && studentGrades && (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}></div>
            <h3 className={styles.emptyTitle}>No courses found</h3>
            <p className={styles.emptyText}>
              Try adjusting your search terms or filters to find more courses.
            </p>
          </div>
        )}

        {/* Results Count */}
        {!noQualifiedCourses && filteredCourses.length > 0 && (
          <div className="mt-6 text-center">
            <p className="text-sm text-slate-600">
              Showing {filteredCourses.length} of {courses.length} courses
              {studentGrades && ' that you qualify for'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default CourseBrowser