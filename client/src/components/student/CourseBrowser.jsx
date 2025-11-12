import React, { useState, useEffect } from 'react'
import { collection, query, getDocs, where, orderBy, doc, getDoc, addDoc } from 'firebase/firestore'
import { db } from '../../firebase-config'
import { useAuth } from '../../hooks/useAuth'
import { useNavigate } from 'react-router-dom'

const CourseBrowser = () => {
  const { userData } = useAuth()
  const navigate = useNavigate()
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
    courseTitle: "text-xl font-bold text-slate-800 group-hover:text-blue-600 transition-colors duration-200",
    institutionName: "text-sm text-slate-600 mt-1",
    courseDescription: "text-sm text-slate-600 mb-4 line-clamp-3",
    detailText: "text-sm text-slate-600 flex items-center",
    deadlinePassed: "bg-red-50 border border-red-200 text-red-700",
    deadlineActive: "bg-blue-50 border border-blue-200 text-blue-700",
    warningText: "text-xs text-red-600 mt-1",
    grid: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6",
    flexBetween: "flex items-center justify-between",
    iconButton: "p-1 text-slate-400 hover:text-blue-500 rounded transition-colors duration-200",
    emptyState: "text-center py-12",
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
      
      console.log('🔍 Fetching student grades for:', userData.uid)
      const studentDoc = await getDoc(doc(db, 'students', userData.uid))
      
      if (studentDoc.exists()) {
        const studentData = studentDoc.data()
        console.log('📊 Student data found:', studentData)
        
        // Handle different grade data structures
        const grades = studentData.grades || studentData.academicRecords
        console.log('🎯 Student grades:', grades)
        
        setStudentGrades(grades || null)
      } else {
        console.log('❌ No student document found')
        setStudentGrades(null)
      }
      setEligibilityChecked(true)
    } catch (error) {
      console.error('❌ Error fetching student grades:', error)
      setEligibilityChecked(true)
    }
  }

  const fetchData = async () => {
    try {
      setLoading(true)
      console.log('📚 Starting to fetch courses...')
      
      // Try different query approaches to find courses
      let coursesData = []

      // Approach 1: Try to get all courses without status filter first
      try {
        console.log('🔄 Trying to fetch all courses...')
        const coursesQuery = query(
          collection(db, 'courses'),
          orderBy('createdAt', 'desc')
        )
        const coursesSnapshot = await getDocs(coursesQuery)
        coursesData = coursesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        console.log(`✅ Found ${coursesData.length} courses without status filter`)
      } catch (error) {
        console.log('❌ Error fetching without status filter:', error)
        
        // Approach 2: Try with status filter
        try {
          console.log('🔄 Trying with status filter...')
          const coursesQuery = query(
            collection(db, 'courses'),
            where('status', '==', 'active'),
            orderBy('createdAt', 'desc')
          )
          const coursesSnapshot = await getDocs(coursesQuery)
          coursesData = coursesSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }))
          console.log(`✅ Found ${coursesData.length} courses with status filter`)
        } catch (statusError) {
          console.log('❌ Error with status filter:', statusError)
          
          // Approach 3: Try simplest query - just get all documents
          try {
            console.log('🔄 Trying simplest query...')
            const coursesSnapshot = await getDocs(collection(db, 'courses'))
            coursesData = coursesSnapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }))
            console.log(`✅ Found ${coursesData.length} courses with simple query`)
          } catch (simpleError) {
            console.log('❌ Error with simple query:', simpleError)
            coursesData = []
          }
        }
      }

      console.log('📋 Final courses data:', coursesData)

      if (coursesData.length === 0) {
        console.log('⚠️ No courses found in database. Possible issues:')
        console.log('1. No courses have been created yet')
        console.log('2. Firestore security rules are blocking access')
        console.log('3. Collection name might be different')
        console.log('4. Database connection issue')
      }

      // Fetch institution details for each course
      const coursesWithInstitutions = await Promise.all(
        coursesData.map(async (course) => {
          try {
            if (!course.institutionId) {
              console.log('⚠️ Course missing institutionId:', course.id)
              return {
                ...course,
                institution: { name: 'Unknown Institution', location: 'Unknown' }
              }
            }

            const institutionDoc = await getDoc(doc(db, 'institutions', course.institutionId))
            const institutionData = institutionDoc.exists() ? institutionDoc.data() : { 
              name: 'Unknown Institution', 
              location: 'Unknown' 
            }
            return {
              ...course,
              institution: institutionData
            }
          } catch (error) {
            console.error('❌ Error fetching institution:', error)
            return {
              ...course,
              institution: { name: 'Unknown Institution', location: 'Unknown' }
            }
          }
        })
      )

      setCourses(coursesWithInstitutions)

      // Get unique institutions for filter
      const uniqueInstitutions = [...new Set(coursesData.map(course => course.institutionId).filter(Boolean))]
      console.log('🏫 Unique institutions:', uniqueInstitutions)
      
      const institutionDetails = await Promise.all(
        uniqueInstitutions.map(async (id) => {
          try {
            const institutionDoc = await getDoc(doc(db, 'institutions', id))
            return {
              id,
              ...institutionDoc.data()
            }
          } catch (error) {
            console.error('❌ Error fetching institution details:', error)
            return { id, name: 'Unknown Institution' }
          }
        })
      )
      setInstitutions(institutionDetails)

    } catch (error) {
      console.error('❌ Error in fetchData:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAppliedCourses = async () => {
    try {
      if (!userData) return
      
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
    console.log('🎯 Checking eligibility for course:', course.name)
    console.log('📊 Course requirements:', course.requirements)
    console.log('📈 Student grades:', grades)

    if (!course.requirements) {
      console.log('✅ No requirements - course is eligible')
      return { 
        eligible: true, 
        reason: 'No requirements specified',
        missingRequirements: [],
        meetsRequirements: ['No specific requirements']
      }
    }
    
    const requirements = course.requirements
    const eligibility = {
      eligible: true,
      missingRequirements: [],
      meetsRequirements: []
    }

    // Check minimum points (this is the main requirement)
    if (requirements.minPoints) {
      const studentPoints = grades?.points || 0
      console.log(`📊 Points check: Student ${studentPoints} vs Required ${requirements.minPoints}`)
      
      if (studentPoints < requirements.minPoints) {
        eligibility.eligible = false
        eligibility.missingRequirements.push(`Minimum ${requirements.minPoints} points required (your points: ${studentPoints})`)
        console.log('❌ Points requirement not met')
      } else {
        eligibility.meetsRequirements.push(`Meets points requirement (${requirements.minPoints})`)
        console.log('✅ Points requirement met')
      }
    } else {
      console.log('ℹ️ No points requirement specified')
      // If no points requirement, course is eligible
      eligibility.meetsRequirements.push('No minimum points requirement')
    }

    // Check minimum grade requirement (if specified)
    if (requirements.minGrade) {
      const gradeOrder = { 'A': 5, 'B': 4, 'C': 3, 'D': 2, 'E': 1, 'F': 0 }
      const studentOverallGrade = grades?.overall || 'F'
      
      console.log(`📊 Grade check: Student ${studentOverallGrade} vs Required ${requirements.minGrade}`)
      
      if (gradeOrder[studentOverallGrade] < gradeOrder[requirements.minGrade]) {
        eligibility.eligible = false
        eligibility.missingRequirements.push(`Minimum grade of ${requirements.minGrade} required (your grade: ${studentOverallGrade})`)
        console.log('❌ Grade requirement not met')
      } else {
        eligibility.meetsRequirements.push(`Meets grade requirement (${requirements.minGrade})`)
        console.log('✅ Grade requirement met')
      }
    }

    // Check subject requirements (if specified)
    if (requirements.subjects && requirements.subjects.length > 0) {
      const missingSubjects = requirements.subjects.filter(subject => 
        !grades?.subjects || !grades.subjects[subject]
      )

      if (missingSubjects.length > 0) {
        eligibility.eligible = false
        eligibility.missingRequirements.push(`Missing subjects: ${missingSubjects.join(', ')}`)
        console.log('❌ Subject requirements not met')
      } else {
        eligibility.meetsRequirements.push('Meets all subject requirements')
        console.log('✅ Subject requirements met')
      }
    }

    console.log('🎯 Final eligibility:', eligibility.eligible)
    return eligibility
  }

  const filterAndSortCourses = () => {
    console.log('🔍 Starting course filtering...')
    console.log('📚 Total courses:', courses.length)
    console.log('📊 Student grades:', studentGrades)
    console.log('✅ Eligibility checked:', eligibilityChecked)

    let filtered = courses

    // Apply grade-based filtering if student grades are available
    if (studentGrades && eligibilityChecked) {
      console.log('🎯 Applying eligibility filtering...')
      const beforeFilter = filtered.length
      
      filtered = filtered.filter(course => {
        const eligibility = checkCourseEligibility(course, studentGrades)
        course.eligibility = eligibility // Attach eligibility info to course
        return eligibility.eligible
      })
      
      console.log(`📊 Filtered from ${beforeFilter} to ${filtered.length} courses`)
    } else if (eligibilityChecked) {
      console.log('ℹ️ No student grades available, showing all courses')
    }

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(course =>
        course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (course.description && course.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (course.institution?.name && course.institution.name.toLowerCase().includes(searchTerm.toLowerCase()))
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

    console.log('✅ Final filtered courses:', filtered.length)
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

  // Function to create sample courses for testing
  const createSampleCourse = async () => {
    if (!userData) {
      alert('Please log in to create sample courses')
      return
    }

    try {
      const sampleCourse = {
        name: 'Bachelor of Science in Computer Science',
        facultyId: 'sample-faculty',
        facultyName: 'Faculty of Science and Technology',
        duration: '4 years',
        tuition: 'M25,000 per year',
        requirements: {
          minPoints: 60,
          minGrade: 'C',
          subjects: ['Mathematics', 'English'],
          certificates: ['High School Diploma']
        },
        seats: 50,
        applicationDeadline: new Date('2024-12-31'),
        institutionId: 'sample-institution',
        institutionName: 'National University of Lesotho',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      }

      await addDoc(collection(db, 'courses'), sampleCourse)
      alert('Sample course created! Refreshing...')
      fetchData() // Refresh the course list
    } catch (error) {
      console.error('Error creating sample course:', error)
      alert('Failed to create sample course')
    }
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
              <p className="text-xs text-blue-600 mt-1">
               {courses.length} total courses, {filteredCourses.length} filtered
              </p>
            </div>
          )}
        </div>

        {/* Create Sample Course Button (for testing) */}
        {courses.length === 0 && userData && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-semibold text-yellow-800 mb-2">No Courses Found</h3>
            <p className="text-yellow-700 mb-4">
              There are no courses in the database yet. You can create a sample course for testing.
            </p>
            <button
              onClick={createSampleCourse}
              className="bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-3 rounded-lg font-semibold"
            >
              Create Sample Course
            </button>
          </div>
        )}

        {/* Filters and Search */}
        {courses.length > 0 && (
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

        {/* Courses Grid */}
        {courses.length > 0 && (
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
                  </div>

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

        {/* Empty State */}
        {filteredCourses.length === 0 && courses.length > 0 && (
          <div className={styles.emptyState}>
            <div className="text-6xl mb-4">📚</div>
            <h3 className={styles.emptyTitle}>
              {studentGrades ? 'No courses match your qualifications' : 'No courses found'}
            </h3>
            <p className={styles.emptyText}>
              {studentGrades 
                ? 'Try updating your profile with better grades or explore different filters.'
                : 'Try adjusting your search terms or filters.'
              }
            </p>
            {studentGrades && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Debug Info:</strong> You have {studentGrades.points || 0} points. 
                  There are {courses.length} total courses but none match your current qualifications.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Results Count */}
        {filteredCourses.length > 0 && (
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