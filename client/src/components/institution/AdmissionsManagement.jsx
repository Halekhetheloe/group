import React, { useState, useEffect } from 'react'
import { collection, query, where, getDocs, doc, updateDoc, writeBatch } from 'firebase/firestore'
import { db } from '../../firebase-config'
import { useAuth } from '../../hooks/useAuth'
import { Search, Filter, Send, Download, Users, BookOpen, CheckCircle, XCircle, AlertCircle } from 'lucide-react'

const AdmissionsManagement = () => {
  const { userData } = useAuth()
  const [admissions, setAdmissions] = useState([])
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedCourse, setSelectedCourse] = useState('')
  const [publishing, setPublishing] = useState(false)

  useEffect(() => {
    if (userData) {
      fetchData()
    }
  }, [userData])

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

      // Fetch admissions data (applications with decisions)
      const courseIds = coursesData.map(course => course.id)
      let allAdmissions = []
      
      if (courseIds.length > 0) {
        const admissionsQuery = query(
          collection(db, 'applications'),
          where('courseId', 'in', courseIds)
        )
        const admissionsSnapshot = await getDocs(admissionsQuery)
        const admissionsData = admissionsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))

        // Fetch student details
        const admissionsWithDetails = await Promise.all(
          admissionsData.map(async (admission) => {
            const studentDoc = await getDoc(doc(db, 'users', admission.studentId))
            const studentData = studentDoc.data()
            
            const course = coursesData.find(c => c.id === admission.courseId)
            
            return {
              ...admission,
              student: studentData,
              course: course
            }
          })
        )

        setAdmissions(admissionsWithDetails)
      }

    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const publishAdmissions = async () => {
    if (!selectedCourse) {
      alert('Please select a course to publish admissions for.')
      return
    }

    if (!window.confirm('Are you sure you want to publish admissions for this course? This will notify all applicants.')) {
      return
    }

    setPublishing(true)
    try {
      const batch = writeBatch(db)
      const courseAdmissions = admissions.filter(admission => 
        admission.courseId === selectedCourse && admission.status === 'admitted'
      )

      // Update admissions status to published
      courseAdmissions.forEach(admission => {
        const admissionRef = doc(db, 'applications', admission.id)
        batch.update(admissionRef, {
          status: 'admitted',
          admittedAt: new Date(),
          published: true
        })
      })

      await batch.commit()

      // In a real implementation, you would send email notifications here
      alert(`Admissions published successfully for ${courseAdmissions.length} students!`)
      
      // Refresh data
      fetchData()
    } catch (error) {
      console.error('Error publishing admissions:', error)
      alert('Failed to publish admissions. Please try again.')
    } finally {
      setPublishing(false)
    }
  }

  const getCourseAdmissionStats = (courseId) => {
    const courseApplications = admissions.filter(app => app.courseId === courseId)
    const total = courseApplications.length
    const admitted = courseApplications.filter(app => app.status === 'admitted').length
    const rejected = courseApplications.filter(app => app.status === 'rejected').length
    const pending = courseApplications.filter(app => app.status === 'pending').length
    
    return { total, admitted, rejected, pending }
  }

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
      admitted: { color: 'bg-green-100 text-green-800', label: 'Admitted' },
      rejected: { color: 'bg-red-100 text-red-800', label: 'Rejected' }
    }
    const config = statusConfig[status] || { color: 'bg-gray-100 text-gray-800', label: status }
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
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
          <h1 className="text-3xl font-bold text-gray-900">Admissions Management</h1>
          <p className="text-gray-600 mt-2">
            Publish admission results and manage student intake
          </p>
        </div>

        {/* Course Selection and Publishing */}
        <div className="card mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Publish Admissions</h2>
          <div className="flex flex-col md:flex-row md:items-end space-y-4 md:space-y-0 md:space-x-4">
            <div className="flex-1">
              <label className="form-label">Select Course</label>
              <select
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                className="input-field"
              >
                <option value="">Choose a course...</option>
                {courses.map(course => (
                  <option key={course.id} value={course.id}>
                    {course.name} (Seats: {course.seats})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <button
                onClick={publishAdmissions}
                disabled={!selectedCourse || publishing}
                className="btn-success flex items-center"
              >
                {publishing ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                {publishing ? 'Publishing...' : 'Publish Admissions'}
              </button>
            </div>
          </div>

          {selectedCourse && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-blue-900">
                    {courses.find(c => c.id === selectedCourse)?.name}
                  </h4>
                  <p className="text-sm text-blue-700">
                    {getCourseAdmissionStats(selectedCourse).admitted} students admitted out of {getCourseAdmissionStats(selectedCourse).total} applications
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-blue-700">
                    Available Seats: {courses.find(c => c.id === selectedCourse)?.seats}
                  </p>
                  <p className="text-sm text-blue-700">
                    Admission Rate: {((getCourseAdmissionStats(selectedCourse).admitted / getCourseAdmissionStats(selectedCourse).total) * 100 || 0).toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Course Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {courses.map(course => {
            const stats = getCourseAdmissionStats(course.id)
            return (
              <div key={course.id} className="card">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">{course.name}</h3>
                  <BookOpen className="h-5 w-5 text-gray-400" />
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Total Applications</span>
                    <span className="font-medium">{stats.total}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-green-600">Admitted</span>
                    <span className="font-medium text-green-600">{stats.admitted}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-red-600">Rejected</span>
                    <span className="font-medium text-red-600">{stats.rejected}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-yellow-600">Pending</span>
                    <span className="font-medium text-yellow-600">{stats.pending}</span>
                  </div>
                  
                  <div className="pt-3 border-t border-gray-200">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Available Seats</span>
                      <span className="font-medium">{course.seats}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Admission Rate</span>
                      <span className="font-medium">
                        {((stats.admitted / stats.total) * 100 || 0).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Admissions List */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">All Admissions</h2>
            <button className="btn-secondary flex items-center text-sm">
              <Download className="h-4 w-4 mr-1" />
              Export Report
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Course
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Applied
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Decision Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {admissions.map((admission) => (
                  <tr key={admission.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <Users className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {admission.student?.displayName}
                          </div>
                          <div className="text-sm text-gray-500">{admission.student?.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{admission.course?.name}</div>
                      <div className="text-sm text-gray-500">{admission.course?.facultyName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(admission.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(admission.appliedAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {admission.admittedAt ? formatDate(admission.admittedAt) : 
                       admission.reviewedAt ? formatDate(admission.reviewedAt) : 'Pending'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {admissions.length === 0 && (
            <div className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No admissions data</h3>
              <p className="mt-1 text-sm text-gray-500">
                Admission data will appear here once you start reviewing applications.
              </p>
            </div>
          )}
        </div>

        {/* Important Notes */}
        <div className="card mt-6 bg-yellow-50 border-yellow-200">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-yellow-400 mr-3" />
            <div>
              <h3 className="text-sm font-medium text-yellow-800">Important Notes</h3>
              <div className="mt-2 text-sm text-yellow-700">
                <ul className="list-disc list-inside space-y-1">
                  <li>Publishing admissions will notify all admitted students via email</li>
                  <li>Ensure all application reviews are completed before publishing</li>
                  <li>Admitted students have a limited time to accept their offers</li>
                  <li>Monitor seat availability and waitlist if necessary</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdmissionsManagement