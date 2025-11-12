import React, { useState, useEffect } from 'react'
import { collection, query, where, getDocs, doc, getDoc, updateDoc } from 'firebase/firestore'
import { db } from '../../firebase-config'
import { useAuth } from '../../hooks/useAuth'

const ApplicationReview = () => {
  const { userData } = useAuth()
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedApplication, setSelectedApplication] = useState(null)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    if (userData) {
      fetchApplications()
    }
  }, [userData, filter])

  const fetchApplications = async () => {
    try {
      setLoading(true)
      
      // Get institution's courses first
      const coursesQuery = query(
        collection(db, 'courses'),
        where('institutionId', '==', userData.uid)
      )
      const coursesSnapshot = await getDocs(coursesQuery)
      const courseIds = coursesSnapshot.docs.map(doc => doc.id)

      if (courseIds.length === 0) {
        setApplications([])
        return
      }

      // Get applications for these courses
      let applicationsQuery = query(
        collection(db, 'applications'),
        where('courseId', 'in', courseIds)
      )

      const applicationsSnapshot = await getDocs(applicationsQuery)
      const applicationsData = await Promise.all(
        applicationsSnapshot.docs.map(async (doc) => {
          const application = { id: doc.id, ...doc.data() }
          
          // Get course details
          const courseDoc = await getDoc(doc(db, 'courses', application.courseId))
          application.course = courseDoc.exists() ? courseDoc.data() : null

          // Get student details and grades
          const studentDoc = await getDoc(doc(db, 'students', application.studentId))
          if (studentDoc.exists()) {
            application.student = studentDoc.data()
            application.studentGrades = studentDoc.data().grades || studentDoc.data().academicRecords
          }

          // Check eligibility
          if (application.course && application.studentGrades) {
            application.eligibility = checkCourseEligibility(application.course, application.studentGrades)
          }

          return application
        })
      )

      // Filter applications
      let filteredApplications = applicationsData
      if (filter !== 'all') {
        filteredApplications = applicationsData.filter(app => app.status === filter)
      }

      setApplications(filteredApplications)

    } catch (error) {
      console.error('Error fetching applications:', error)
    } finally {
      setLoading(false)
    }
  }

  const checkCourseEligibility = (course, studentGrades) => {
    if (!course.requirements) return { eligible: true }
    
    const requirements = course.requirements
    const eligibility = {
      eligible: true,
      missingRequirements: [],
      meetsRequirements: []
    }

    // Check minimum grade requirement
    if (requirements.minGrade) {
      const gradeOrder = { 'A': 5, 'B': 4, 'C': 3, 'D': 2, 'E': 1, 'F': 0 }
      const studentOverallGrade = studentGrades?.overall || 'F'
      
      if (gradeOrder[studentOverallGrade] < gradeOrder[requirements.minGrade]) {
        eligibility.eligible = false
        eligibility.missingRequirements.push(`Minimum grade of ${requirements.minGrade} required (student has: ${studentOverallGrade})`)
      } else {
        eligibility.meetsRequirements.push(`Meets grade requirement (${requirements.minGrade})`)
      }
    }

    // Check subject requirements
    if (requirements.subjects && requirements.subjects.length > 0) {
      const missingSubjects = requirements.subjects.filter(subject => 
        !studentGrades?.subjects || !studentGrades.subjects[subject]
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
      const studentPoints = studentGrades?.points || 0
      if (studentPoints < requirements.minPoints) {
        eligibility.eligible = false
        eligibility.missingRequirements.push(`Minimum ${requirements.minPoints} points required (student has: ${studentPoints})`)
      } else {
        eligibility.meetsRequirements.push(`Meets points requirement (${requirements.minPoints})`)
      }
    }

    return eligibility
  }

  const updateApplicationStatus = async (applicationId, status) => {
    try {
      const applicationRef = doc(db, 'applications', applicationId)
      await updateDoc(applicationRef, {
        status: status,
        reviewedAt: new Date(),
        reviewedBy: userData.uid
      })
      
      // Refresh applications
      fetchApplications()
      setSelectedApplication(null)
      alert(`Application ${status} successfully!`)
    } catch (error) {
      console.error('Error updating application:', error)
      alert('Failed to update application. Please try again.')
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'accepted': return 'bg-green-100 text-green-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getEligibilityColor = (eligibility) => {
    if (!eligibility) return 'bg-gray-100 text-gray-800'
    return eligibility.eligible ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 gap-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg shadow p-6 h-32"></div>
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
          <h1 className="text-3xl font-bold text-gray-900">Application Review</h1>
          <p className="text-gray-600 mt-2">
            Review and manage student applications for your courses
          </p>
        </div>

        {/* Filters */}
        <div className="mb-6 flex space-x-4">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg ${
              filter === 'all' 
                ? 'bg-blue-600 text-white' 
                : 'bg-white text-gray-700 border border-gray-300'
            }`}
          >
            All Applications
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded-lg ${
              filter === 'pending' 
                ? 'bg-blue-600 text-white' 
                : 'bg-white text-gray-700 border border-gray-300'
            }`}
          >
            Pending Review
          </button>
          <button
            onClick={() => setFilter('accepted')}
            className={`px-4 py-2 rounded-lg ${
              filter === 'accepted' 
                ? 'bg-blue-600 text-white' 
                : 'bg-white text-gray-700 border border-gray-300'
            }`}
          >
            Accepted
          </button>
          <button
            onClick={() => setFilter('rejected')}
            className={`px-4 py-2 rounded-lg ${
              filter === 'rejected' 
                ? 'bg-blue-600 text-white' 
                : 'bg-white text-gray-700 border border-gray-300'
            }`}
          >
            Rejected
          </button>
        </div>

        {/* Applications List */}
        <div className="space-y-4">
          {applications.map(application => (
            <div key={application.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-4 mb-3">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {application.student?.firstName} {application.student?.lastName}
                    </h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(application.status)}`}>
                      {application.status}
                    </span>
                    {application.eligibility && (
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getEligibilityColor(application.eligibility)}`}>
                        {application.eligibility.eligible ? 'Eligible' : 'Not Eligible'}
                      </span>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Course</p>
                      <p className="font-medium text-gray-900">{application.course?.name}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Applied On</p>
                      <p className="font-medium text-gray-900">
                        {application.appliedAt?.toDate?.()?.toLocaleDateString() || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Student Grades</p>
                      <p className="font-medium text-gray-900">
                        Overall: {application.studentGrades?.overall || 'N/A'} | 
                        Points: {application.studentGrades?.points || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Course Requirements</p>
                      <p className="font-medium text-gray-900">
                        Min Grade: {application.course?.requirements?.minGrade || 'N/A'} | 
                        Min Points: {application.course?.requirements?.minPoints || 'N/A'}
                      </p>
                    </div>
                  </div>

                  {/* Eligibility Details */}
                  {application.eligibility && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                      <h4 className="font-medium text-gray-900 text-sm mb-2">Eligibility Assessment:</h4>
                      {application.eligibility.meetsRequirements.length > 0 && (
                        <div className="mb-2">
                          <p className="text-green-700 text-sm font-medium">✓ Meets Requirements:</p>
                          <ul className="text-green-600 text-sm list-disc list-inside">
                            {application.eligibility.meetsRequirements.map((req, index) => (
                              <li key={index}>{req}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {application.eligibility.missingRequirements.length > 0 && (
                        <div>
                          <p className="text-red-700 text-sm font-medium">✗ Missing Requirements:</p>
                          <ul className="text-red-600 text-sm list-disc list-inside">
                            {application.eligibility.missingRequirements.map((req, index) => (
                              <li key={index}>{req}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex space-x-2 ml-4">
                  <button
                    onClick={() => setSelectedApplication(application)}
                    className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                  >
                    Review
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {applications.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">📋</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {filter === 'all' ? 'No applications yet' : `No ${filter} applications`}
            </h3>
            <p className="text-gray-600">
              {filter === 'all' 
                ? 'Student applications will appear here once they start applying to your courses.'
                : `There are no ${filter} applications at the moment.`
              }
            </p>
          </div>
        )}

        {/* Application Detail Modal */}
        {selectedApplication && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold mb-4">Application Review</h2>
              
              <div className="space-y-4">
                {/* Student Information */}
                <div className="border-b pb-4">
                  <h3 className="text-lg font-semibold mb-2">Student Information</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Name</p>
                      <p className="font-medium">
                        {selectedApplication.student?.firstName} {selectedApplication.student?.lastName}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Email</p>
                      <p className="font-medium">{selectedApplication.student?.email}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Overall Grade</p>
                      <p className="font-medium">{selectedApplication.studentGrades?.overall || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Points</p>
                      <p className="font-medium">{selectedApplication.studentGrades?.points || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {/* Course Information */}
                <div className="border-b pb-4">
                  <h3 className="text-lg font-semibold mb-2">Course Information</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Course Name</p>
                      <p className="font-medium">{selectedApplication.course?.name}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Faculty</p>
                      <p className="font-medium">{selectedApplication.course?.faculty}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Duration</p>
                      <p className="font-medium">{selectedApplication.course?.duration}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Applied On</p>
                      <p className="font-medium">
                        {selectedApplication.appliedAt?.toDate?.()?.toLocaleDateString() || 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Eligibility Assessment */}
                {selectedApplication.eligibility && (
                  <div className="border-b pb-4">
                    <h3 className="text-lg font-semibold mb-2">Eligibility Assessment</h3>
                    <div className={`p-3 rounded-lg ${
                      selectedApplication.eligibility.eligible ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                    }`}>
                      <p className={`font-medium ${
                        selectedApplication.eligibility.eligible ? 'text-green-800' : 'text-red-800'
                      }`}>
                        {selectedApplication.eligibility.eligible 
                          ? '✓ Student meets all course requirements' 
                          : '✗ Student does not meet course requirements'
                        }
                      </p>
                      
                      {selectedApplication.eligibility.meetsRequirements.length > 0 && (
                        <div className="mt-2">
                          <p className="text-green-700 text-sm font-medium">Requirements Met:</p>
                          <ul className="text-green-600 text-sm list-disc list-inside">
                            {selectedApplication.eligibility.meetsRequirements.map((req, index) => (
                              <li key={index}>{req}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {selectedApplication.eligibility.missingRequirements.length > 0 && (
                        <div className="mt-2">
                          <p className="text-red-700 text-sm font-medium">Requirements Not Met:</p>
                          <ul className="text-red-600 text-sm list-disc list-inside">
                            {selectedApplication.eligibility.missingRequirements.map((req, index) => (
                              <li key={index}>{req}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setSelectedApplication(null)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Close
                  </button>
                  
                  {selectedApplication.status === 'pending' && (
                    <>
                      <button
                        onClick={() => updateApplicationStatus(selectedApplication.id, 'rejected')}
                        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => updateApplicationStatus(selectedApplication.id, 'accepted')}
                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                      >
                        Accept
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ApplicationReview