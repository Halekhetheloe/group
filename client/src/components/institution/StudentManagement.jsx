import React, { useState, useEffect } from 'react'
import { collection, query, where, getDocs, doc, updateDoc, orderBy } from 'firebase/firestore'
import { db } from '../../firebase-config'
import { useAuth } from '../../hooks/useAuth'
import { Search, Filter, Mail, Phone, MapPin, GraduationCap, BookOpen, User, Eye } from 'lucide-react'

const StudentManagement = () => {
  const { userData } = useAuth()
  const [students, setStudents] = useState([])
  const [filteredStudents, setFilteredStudents] = useState([])
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [courseFilter, setCourseFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    if (userData) {
      fetchData()
    }
  }, [userData])

  useEffect(() => {
    filterStudents()
  }, [students, searchTerm, courseFilter, statusFilter])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // Fetch institution's courses
      const coursesQuery = query(
        collection(db, 'courses'),
        where('institutionId', '==', userData.uid)
      )
      const coursesSnapshot = await getDocs(coursesQuery)
      const coursesData = coursesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      setCourses(coursesData)

      // Fetch admitted students
      const courseIds = coursesData.map(course => course.id)
      let admittedStudents = []
      
      if (courseIds.length > 0) {
        const studentsQuery = query(
          collection(db, 'applications'),
          where('courseId', 'in', courseIds),
          where('status', '==', 'admitted'),
          orderBy('admittedAt', 'desc')
        )
        const studentsSnapshot = await getDocs(studentsQuery)
        const studentsData = studentsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))

        // Fetch student details
        const studentsWithDetails = await Promise.all(
          studentsData.map(async (student) => {
            const studentDoc = await getDoc(doc(db, 'users', student.studentId))
            const studentData = studentDoc.data()
            
            // Fetch student profile
            const studentProfileDoc = await getDoc(doc(db, 'studentProfiles', student.studentId))
            const studentProfile = studentProfileDoc.exists() ? studentProfileDoc.data() : {}
            
            const course = coursesData.find(c => c.id === student.courseId)
            
            return {
              ...student,
              student: studentData,
              profile: studentProfile,
              course: course
            }
          })
        )

        setStudents(studentsWithDetails)
      }

    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterStudents = () => {
    let filtered = students

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(student =>
        student.student?.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.student?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.course?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Course filter
    if (courseFilter !== 'all') {
      filtered = filtered.filter(student => student.courseId === courseFilter)
    }

    // Status filter (you can add more statuses like enrolled, graduated, etc.)
    if (statusFilter !== 'all') {
      // For now, we only have 'admitted' status from applications
      filtered = filtered.filter(student => student.status === statusFilter)
    }

    setFilteredStudents(filtered)
  }

  const updateStudentStatus = async (studentId, status) => {
    try {
      const studentRef = doc(db, 'applications', studentId)
      await updateDoc(studentRef, {
        enrollmentStatus: status,
        updatedAt: new Date()
      })
      
      // Update local state
      setStudents(students.map(student =>
        student.id === studentId ? { ...student, enrollmentStatus: status } : student
      ))
      
      alert(`Student status updated to ${status}`)
    } catch (error) {
      console.error('Error updating student status:', error)
      alert('Error updating student status')
    }
  }

  const getEnrollmentBadge = (status) => {
    const statusConfig = {
      admitted: { color: 'bg-blue-100 text-blue-800', label: 'Admitted' },
      enrolled: { color: 'bg-green-100 text-green-800', label: 'Enrolled' },
      graduated: { color: 'bg-purple-100 text-purple-800', label: 'Graduated' },
      withdrawn: { color: 'bg-red-100 text-red-800', label: 'Withdrawn' }
    }
    const config = statusConfig[status] || { color: 'bg-gray-100 text-gray-800', label: status || 'Admitted' }
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    )
  }

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A'
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    return date.toLocaleDateString()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="h-12 bg-gray-200 rounded mb-6"></div>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-20 bg-gray-200 rounded"></div>
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
          <h1 className="text-3xl font-bold text-gray-900">Student Management</h1>
          <p className="text-gray-600 mt-2">
            Manage admitted and enrolled students
          </p>
        </div>

        {/* Filters and Search */}
        <div className="card mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search students by name, email, or course..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input-field pl-10"
                />
              </div>
            </div>
            <div className="flex space-x-4">
              <select
                value={courseFilter}
                onChange={(e) => setCourseFilter(e.target.value)}
                className="input-field"
              >
                <option value="all">All Courses</option>
                {courses.map(course => (
                  <option key={course.id} value={course.id}>
                    {course.name}
                  </option>
                ))}
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="input-field"
              >
                <option value="all">All Status</option>
                <option value="admitted">Admitted</option>
                <option value="enrolled">Enrolled</option>
                <option value="graduated">Graduated</option>
                <option value="withdrawn">Withdrawn</option>
              </select>
            </div>
          </div>
        </div>

        {/* Students Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStudents.map((student) => (
            <div key={student.id} className="card">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {student.student?.displayName}
                    </h3>
                    {getEnrollmentBadge(student.enrollmentStatus)}
                  </div>
                </div>
                <button className="p-2 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors duration-200">
                  <Eye className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm text-gray-600">
                  <Mail className="h-4 w-4 mr-2" />
                  {student.student?.email}
                </div>
                {student.profile?.phone && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Phone className="h-4 w-4 mr-2" />
                    {student.profile.phone}
                  </div>
                )}
                {student.profile?.location && (
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="h-4 w-4 mr-2" />
                    {student.profile.location}
                  </div>
                )}
              </div>

              <div className="mb-4">
                <div className="flex items-center text-sm text-gray-600 mb-1">
                  <BookOpen className="h-4 w-4 mr-2" />
                  <span className="font-medium">{student.course?.name}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <GraduationCap className="h-4 w-4 mr-2" />
                  <span>{student.course?.facultyName}</span>
                </div>
              </div>

              {/* Student Progress */}
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Admission Date</span>
                  <span className="font-medium">{formatDate(student.admittedAt)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Course Duration</span>
                  <span className="font-medium">{student.course?.duration}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-2">
                <select
                  value={student.enrollmentStatus || 'admitted'}
                  onChange={(e) => updateStudentStatus(student.id, e.target.value)}
                  className="input-field text-sm flex-1"
                >
                  <option value="admitted">Admitted</option>
                  <option value="enrolled">Enrolled</option>
                  <option value="graduated">Graduated</option>
                  <option value="withdrawn">Withdrawn</option>
                </select>
                <button className="btn-primary text-sm">
                  Contact
                </button>
              </div>

              {/* Additional Info */}
              {student.profile?.education && student.profile.education.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="text-xs text-gray-500">
                    Previous Education: {student.profile.education[0].degree}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        {filteredStudents.length === 0 && (
          <div className="text-center py-12">
            <GraduationCap className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No students found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {students.length === 0 ? 'No students admitted yet.' : 'Try changing your filters.'}
            </p>
          </div>
        )}

        {/* Statistics Summary */}
        {students.length > 0 && (
          <div className="card mt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Student Statistics</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-700">{students.length}</div>
                <div className="text-blue-600">Total Students</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-700">
                  {students.filter(s => s.enrollmentStatus === 'enrolled').length}
                </div>
                <div className="text-green-600">Enrolled</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-700">
                  {students.filter(s => s.enrollmentStatus === 'graduated').length}
                </div>
                <div className="text-purple-600">Graduated</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-700">
                  {new Set(students.map(s => s.courseId)).size}
                </div>
                <div className="text-orange-600">Active Courses</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default StudentManagement