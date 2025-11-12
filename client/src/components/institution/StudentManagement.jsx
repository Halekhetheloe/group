import React, { useState, useEffect } from 'react'
import { collection, query, where, getDocs, doc, updateDoc, orderBy, getDoc } from 'firebase/firestore'
import { db } from '../../firebase-config'
import { useAuth } from '../../hooks/useAuth'
import { Search, Mail, Phone, MapPin, GraduationCap, BookOpen, User, Eye, RefreshCw } from 'lucide-react'

const StudentManagement = () => {
  const { userData } = useAuth()
  const [students, setStudents] = useState([])
  const [filteredStudents, setFilteredStudents] = useState([])
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [courseFilter, setCourseFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [contactModal, setContactModal] = useState({ isOpen: false, student: null })

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

      if (coursesData.length === 0) {
        setStudents([])
        return
      }

      const courseIds = coursesData.map(course => course.id)

      // Query each course individually for admitted students
      let allAdmittedApplications = []
      
      for (const courseId of courseIds) {
        try {
          const applicationsQuery = query(
            collection(db, 'applications'),
            where('courseId', '==', courseId),
            where('status', 'in', ['admitted', 'accepted', 'enrolled'])
          )
          
          const applicationsSnapshot = await getDocs(applicationsQuery)
          const courseApplications = applicationsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }))
          
          allAdmittedApplications = [...allAdmittedApplications, ...courseApplications]
          
        } catch (courseError) {
          // If 'in' query fails, try individual status queries
          try {
            const statuses = ['admitted', 'accepted', 'enrolled']
            for (const status of statuses) {
              const statusQuery = query(
                collection(db, 'applications'),
                where('courseId', '==', courseId),
                where('status', '==', status)
              )
              const statusSnapshot = await getDocs(statusQuery)
              const statusApplications = statusSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
              }))
              allAdmittedApplications = [...allAdmittedApplications, ...statusApplications]
            }
          } catch (individualError) {
            console.error('Error fetching applications:', individualError)
          }
        }
      }

      // Fetch student details for admitted applications
      const studentsWithDetails = await Promise.all(
        allAdmittedApplications.map(async (application) => {
          try {
            // Fetch student user data
            const studentDoc = await getDoc(doc(db, 'users', application.studentId))
            const studentData = studentDoc.exists() ? studentDoc.data() : null
            
            if (!studentData) {
              return null
            }

            // Fetch student profile
            let studentProfile = {}
            try {
              const studentProfileDoc = await getDoc(doc(db, 'studentProfiles', application.studentId))
              studentProfile = studentProfileDoc.exists() ? studentProfileDoc.data() : {}
            } catch (profileError) {
              // No profile found, continue without it
            }
            
            const course = coursesData.find(c => c.id === application.courseId)
            
            const studentInfo = {
              applicationId: application.id,
              studentId: application.studentId,
              student: studentData,
              profile: studentProfile,
              course: course,
              courseId: application.courseId,
              status: application.status,
              enrollmentStatus: application.enrollmentStatus || application.status,
              appliedAt: application.appliedAt,
              admittedAt: application.admittedAt || application.appliedAt,
              ...application
            }
            
            return studentInfo
            
          } catch (error) {
            console.error('Error processing student:', error)
            return null
          }
        })
      )

      // Filter out any null results
      const validStudents = studentsWithDetails.filter(student => student !== null)
      setStudents(validStudents)

    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterStudents = () => {
    let filtered = students

    if (searchTerm) {
      filtered = filtered.filter(student =>
        student.student?.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.student?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.course?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.profile?.fullName?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (courseFilter !== 'all') {
      filtered = filtered.filter(student => student.courseId === courseFilter)
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(student => 
        student.enrollmentStatus === statusFilter || student.status === statusFilter
      )
    }

    setFilteredStudents(filtered)
  }

  const updateStudentStatus = async (applicationId, status) => {
    try {
      const applicationRef = doc(db, 'applications', applicationId)
      await updateDoc(applicationRef, {
        enrollmentStatus: status,
        updatedAt: new Date()
      })
      
      setStudents(students.map(student =>
        student.applicationId === applicationId ? { ...student, enrollmentStatus: status } : student
      ))
      
      alert(`Student status updated to ${status}`)
    } catch (error) {
      console.error('Error updating student status:', error)
      alert('Error updating student status')
    }
  }

  const handleContactStudent = (student) => {
    setContactModal({ isOpen: true, student })
  }

  const closeContactModal = () => {
    setContactModal({ isOpen: false, student: null })
  }

  const sendEmail = (student) => {
    const subject = `Regarding Your Admission - ${student.course?.name}`
    const body = `Dear ${student.student?.displayName || 'Student'},

We hope this message finds you well. This is regarding your admission to our ${student.course?.name} program.

Best regards,
${userData?.displayName || 'Institution Administration'}`

    window.open(`mailto:${student.student?.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_blank')
  }

  const makePhoneCall = (phoneNumber) => {
    window.open(`tel:${phoneNumber}`, '_self')
  }

  const sendSMS = (phoneNumber) => {
    const message = `Dear student, this is regarding your admission. Please contact us for more information.`
    window.open(`sms:${phoneNumber}?body=${encodeURIComponent(message)}`, '_self')
  }

  const getEnrollmentBadge = (status) => {
    const statusConfig = {
      admitted: { color: 'bg-blue-100 text-blue-800', label: 'Admitted' },
      accepted: { color: 'bg-green-100 text-green-800', label: 'Accepted' },
      enrolled: { color: 'bg-green-100 text-green-800', label: 'Enrolled' },
      graduated: { color: 'bg-purple-100 text-purple-800', label: 'Graduated' },
      withdrawn: { color: 'bg-red-100 text-red-800', label: 'Withdrawn' },
      pending: { color: 'bg-yellow-100 text-yellow-800', label: 'Pending' }
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

  // Add CSS styles
  const styles = `
    .card {
      background-color: white;
      border-radius: 0.75rem;
      padding: 1.5rem;
      box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
      border: 1px solid #e2e8f0;
    }
    
    .input-field {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid #d1d5db;
      border-radius: 0.5rem;
      font-size: 0.875rem;
      transition: all 0.2s;
    }
    
    .input-field:focus {
      outline: none;
      ring: 2px;
      ring-color: #3b82f6;
      border-color: #3b82f6;
    }
    
    .btn-primary {
      background-color: #2563eb;
      color: white;
      padding: 0.5rem 1rem;
      border-radius: 0.5rem;
      font-weight: 500;
      border: none;
      cursor: pointer;
      transition: all 0.2s;
    }
    
    .btn-primary:hover {
      background-color: #1d4ed8;
    }
    
    .btn-secondary {
      background-color: #f8fafc;
      color: #475569;
      padding: 0.5rem 1rem;
      border-radius: 0.5rem;
      font-weight: 500;
      border: 1px solid #e2e8f0;
      cursor: pointer;
      transition: all 0.2s;
    }
    
    .btn-secondary:hover {
      background-color: #f1f5f9;
    }
    
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 50;
    }
    
    .modal-content {
      background: white;
      border-radius: 0.75rem;
      padding: 1.5rem;
      max-width: 500px;
      width: 90%;
      max-height: 90vh;
      overflow-y: auto;
    }
  `

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <style>{styles}</style>
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
      <style>{styles}</style>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Student Management</h1>
            <p className="text-gray-600 mt-2">
              Manage admitted and enrolled students ({students.length} found)
            </p>
          </div>
          <button
            onClick={fetchData}
            className="btn-primary flex items-center"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Data
          </button>
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
                <option value="accepted">Accepted</option>
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
            <div key={student.applicationId} className="card">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {student.student?.displayName || student.profile?.fullName || 'Unknown Student'}
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
                  {student.student?.email || 'No email'}
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
                  <span className="font-medium">{student.course?.name || 'Unknown Course'}</span>
                </div>
                {student.course?.facultyName && (
                  <div className="flex items-center text-sm text-gray-600">
                    <GraduationCap className="h-4 w-4 mr-2" />
                    <span>{student.course.facultyName}</span>
                  </div>
                )}
              </div>

              {/* Student Progress */}
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Admission Date</span>
                  <span className="font-medium">{formatDate(student.admittedAt)}</span>
                </div>
                {student.course?.duration && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Course Duration</span>
                    <span className="font-medium">{student.course.duration}</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-2">
                <select
                  value={student.enrollmentStatus || 'admitted'}
                  onChange={(e) => updateStudentStatus(student.applicationId, e.target.value)}
                  className="input-field text-sm flex-1"
                >
                  <option value="admitted">Admitted</option>
                  <option value="accepted">Accepted</option>
                  <option value="enrolled">Enrolled</option>
                  <option value="graduated">Graduated</option>
                  <option value="withdrawn">Withdrawn</option>
                </select>
                <button 
                  onClick={() => handleContactStudent(student)}
                  className="btn-primary text-sm"
                >
                  Contact
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredStudents.length === 0 && (
          <div className="text-center py-12">
            <GraduationCap className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No students found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {students.length === 0 
                ? 'No admitted students found for your courses.' 
                : 'Try changing your search or filters.'
              }
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
                  {students.filter(s => s.enrollmentStatus === 'enrolled' || s.enrollmentStatus === 'accepted').length}
                </div>
                <div className="text-green-600">Enrolled/Accepted</div>
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

        {/* Contact Modal */}
        {contactModal.isOpen && contactModal.student && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Contact Student</h3>
                <button
                  onClick={closeContactModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">
                    {contactModal.student.student?.displayName || contactModal.student.profile?.fullName || 'Student'}
                  </h4>
                  <p className="text-sm text-gray-600">
                    Course: {contactModal.student.course?.name}
                  </p>
                </div>

                <div className="space-y-3">
                  {/* Email Option */}
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center">
                      <Mail className="h-5 w-5 text-blue-600 mr-3" />
                      <div>
                        <p className="font-medium text-blue-900">Email</p>
                        <p className="text-sm text-blue-700">{contactModal.student.student?.email}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => sendEmail(contactModal.student)}
                      className="btn-primary text-sm"
                    >
                      Send Email
                    </button>
                  </div>

                  {/* Phone Options */}
                  {contactModal.student.profile?.phone && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                        <div className="flex items-center">
                          <Phone className="h-5 w-5 text-green-600 mr-3" />
                          <div>
                            <p className="font-medium text-green-900">Phone Call</p>
                            <p className="text-sm text-green-700">{contactModal.student.profile.phone}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => makePhoneCall(contactModal.student.profile.phone)}
                          className="btn-primary text-sm bg-green-600 hover:bg-green-700"
                        >
                          Call
                        </button>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                        <div className="flex items-center">
                          <Phone className="h-5 w-5 text-purple-600 mr-3" />
                          <div>
                            <p className="font-medium text-purple-900">SMS</p>
                            <p className="text-sm text-purple-700">{contactModal.student.profile.phone}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => sendSMS(contactModal.student.profile.phone)}
                          className="btn-primary text-sm bg-purple-600 hover:bg-purple-700"
                        >
                          Send SMS
                        </button>
                      </div>
                    </div>
                  )}

                  {!contactModal.student.profile?.phone && (
                    <div className="p-3 bg-yellow-50 rounded-lg">
                      <p className="text-sm text-yellow-800">
                        No phone number available for this student.
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={closeContactModal}
                    className="btn-secondary"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default StudentManagement