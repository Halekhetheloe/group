import React, { useState, useEffect } from 'react'
import { collection, query, where, getDocs, doc, getDoc, updateDoc } from 'firebase/firestore'
import { db } from '../../firebase-config'
import { useAuth } from '../../hooks/useAuth'
import { CheckCircle, XCircle, Clock, Award, Download, Mail, Calendar } from 'lucide-react'

const AdmissionsResults = () => {
  const { userData } = useAuth()
  const [admissions, setAdmissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedAdmission, setSelectedAdmission] = useState(null)

  useEffect(() => {
    if (userData) {
      fetchAdmissionsResults()
    }
  }, [userData])

  const fetchAdmissionsResults = async () => {
    try {
      setLoading(true)
      
      // Fetch student's applications with decisions
      const applicationsQuery = query(
        collection(db, 'applications'),
        where('studentId', '==', userData.uid),
        where('status', 'in', ['admitted', 'rejected'])
      )
      const applicationsSnapshot = await getDocs(applicationsQuery)
      const applicationsData = applicationsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))

      // Fetch course and institution details
      const admissionsWithDetails = await Promise.all(
        applicationsData.map(async (application) => {
          const courseDoc = await getDoc(doc(db, 'courses', application.courseId))
          const courseData = courseDoc.data()
          
          const institutionDoc = await getDoc(doc(db, 'institutions', application.institutionId))
          const institutionData = institutionDoc.data()
          
          return {
            ...application,
            course: courseData,
            institution: institutionData
          }
        })
      )

      setAdmissions(admissionsWithDetails)
    } catch (error) {
      console.error('Error fetching admissions results:', error)
    } finally {
      setLoading(false)
    }
  }

  const acceptAdmissionOffer = async (admissionId) => {
    if (!window.confirm('Are you sure you want to accept this admission offer? This action cannot be undone.')) {
      return
    }

    try {
      const admissionRef = doc(db, 'applications', admissionId)
      await updateDoc(admissionRef, {
        offerAccepted: true,
        offerAcceptedAt: new Date()
      })

      // Update local state
      setAdmissions(admissions.map(admission =>
        admission.id === admissionId 
          ? { ...admission, offerAccepted: true, offerAcceptedAt: new Date() }
          : admission
      ))

      alert('Admission offer accepted successfully!')
    } catch (error) {
      console.error('Error accepting admission offer:', error)
      alert('Failed to accept admission offer. Please try again.')
    }
  }

  const getResultCardClass = (status) => {
    switch (status) {
      case 'admitted':
        return 'border-green-200 bg-green-50 hover:bg-green-100'
      case 'rejected':
        return 'border-red-200 bg-red-50 hover:bg-red-100'
      default:
        return 'border-gray-200 bg-gray-50'
    }
  }

  const getResultIcon = (status) => {
    switch (status) {
      case 'admitted':
        return <CheckCircle className="h-8 w-8 text-green-600" />
      case 'rejected':
        return <XCircle className="h-8 w-8 text-red-600" />
      default:
        return <Clock className="h-8 w-8 text-gray-600" />
    }
  }

  const getResultTitle = (status) => {
    switch (status) {
      case 'admitted':
        return 'Congratulations! You have been admitted'
      case 'rejected':
        return 'Application Decision'
      default:
        return 'Pending Decision'
    }
  }

  const getResultDescription = (admission) => {
    if (admission.status === 'admitted') {
      return `You have been admitted to ${admission.course?.name} at ${admission.institution?.name}.`
    } else if (admission.status === 'rejected') {
      return `Your application to ${admission.course?.name} at ${admission.institution?.name} was not successful.`
    }
    return 'Your application is still under review.'
  }

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A'
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  }

  const downloadAdmissionLetter = async (admission) => {
    // In a real implementation, this would generate and download an admission letter
    alert('Admission letter download would be implemented here')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-48 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900">Admissions Results</h1>
          <p className="text-gray-600 mt-2">
            View your application decisions from institutions
          </p>
        </div>

        {/* Results Summary */}
        {admissions.length > 0 && (
          <div className="card mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Results Summary</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-700">
                  {admissions.filter(a => a.status === 'admitted').length}
                </div>
                <div className="text-green-600">Admission Offers</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-700">
                  {admissions.filter(a => a.status === 'rejected').length}
                </div>
                <div className="text-red-600">Not Admitted</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-700">
                  {admissions.filter(a => a.status === 'admitted' && a.offerAccepted).length}
                </div>
                <div className="text-blue-600">Accepted Offers</div>
              </div>
            </div>
          </div>
        )}

        {/* Admissions Results */}
        <div className="space-y-6">
          {admissions.map((admission) => (
            <div 
              key={admission.id} 
              className={`card border-2 transition-all duration-200 ${getResultCardClass(admission.status)}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    {getResultIcon(admission.status)}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900">
                      {getResultTitle(admission.status)}
                    </h3>
                    <p className="text-gray-600 mt-1">
                      {getResultDescription(admission)}
                    </p>
                    
                    {/* Course and Institution Details */}
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-900">Program:</span>
                        <span className="text-gray-600 ml-2">{admission.course?.name}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-900">Institution:</span>
                        <span className="text-gray-600 ml-2">{admission.institution?.name}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-900">Faculty:</span>
                        <span className="text-gray-600 ml-2">{admission.course?.facultyName}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-900">Decision Date:</span>
                        <span className="text-gray-600 ml-2">
                          {admission.admittedAt ? formatDate(admission.admittedAt) : formatDate(admission.reviewedAt)}
                        </span>
                      </div>
                    </div>

                    {/* Additional Information for Admitted Students */}
                    {admission.status === 'admitted' && (
                      <div className="mt-4 p-4 bg-white rounded-lg border">
                        <h4 className="font-medium text-gray-900 mb-2">Admission Details</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Duration:</span>
                            <span className="text-gray-900">{admission.course?.duration}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Tuition:</span>
                            <span className="text-gray-900">{admission.course?.tuition}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Next Steps:</span>
                            <span className="text-gray-900">Accept offer and complete registration</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 mt-6 pt-6 border-t border-gray-200">
                {admission.status === 'admitted' && (
                  <>
                    {!admission.offerAccepted ? (
                      <button
                        onClick={() => acceptAdmissionOffer(admission.id)}
                        className="btn-success flex items-center"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Accept Offer
                      </button>
                    ) : (
                      <span className="bg-green-100 text-green-800 px-3 py-2 rounded-lg text-sm font-medium flex items-center">
                        <Award className="h-4 w-4 mr-2" />
                        Offer Accepted on {formatDate(admission.offerAcceptedAt)}
                      </span>
                    )}
                    <button
                      onClick={() => downloadAdmissionLetter(admission)}
                      className="btn-primary flex items-center"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download Admission Letter
                    </button>
                  </>
                )}
                
                <button className="btn-secondary flex items-center">
                  <Mail className="h-4 w-4 mr-2" />
                  Contact Institution
                </button>
                
                {admission.status === 'rejected' && (
                  <button className="btn-secondary">
                    Request Feedback
                  </button>
                )}
              </div>

              {/* Important Notes for Admitted Students */}
              {admission.status === 'admitted' && !admission.offerAccepted && (
                <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <h4 className="font-medium text-yellow-800 mb-2">Important Information</h4>
                  <ul className="text-sm text-yellow-700 space-y-1">
                    <li>• You must accept this offer within the specified deadline</li>
                    <li>• Accepting this offer may affect other applications</li>
                    <li>• Contact the institution for any questions about the program</li>
                    <li>• Review all admission requirements before accepting</li>
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>

        {admissions.length === 0 && (
          <div className="text-center py-12">
            <Award className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No Results Yet</h2>
            <p className="text-gray-600 mb-6">
              Your application decisions will appear here once institutions have reviewed your applications.
            </p>
            <div className="space-y-4 text-sm text-gray-500">
              <p>• Check back regularly for updates</p>
              <p>• Institutions typically release decisions within 4-6 weeks</p>
              <p>• Ensure all your application documents were submitted correctly</p>
              <p>• Contact institutions directly if you have questions about your application</p>
            </div>
          </div>
        )}

        {/* Multiple Offers Guidance */}
        {admissions.filter(a => a.status === 'admitted' && !a.offerAccepted).length > 1 && (
          <div className="card mt-6 bg-blue-50 border-blue-200">
            <h3 className="text-lg font-semibold text-blue-900 mb-3">Multiple Admission Offers</h3>
            <div className="text-sm text-blue-800 space-y-2">
              <p>You have received multiple admission offers. Please consider the following:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Compare program curriculum, faculty, and opportunities</li>
                <li>Consider location, campus facilities, and student life</li>
                <li>Review tuition costs and available financial aid</li>
                <li>Check acceptance deadlines for each offer</li>
                <li>You can only accept one offer per program type</li>
              </ul>
            </div>
          </div>
        )}

        {/* Next Steps */}
        {admissions.length > 0 && (
          <div className="card mt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Next Steps</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900">If You're Admitted:</h4>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    Accept your offer before the deadline
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    Complete any required registration steps
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    Arrange for tuition payment and housing
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    Attend orientation sessions
                  </li>
                </ul>
              </div>
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900">If You're Not Admitted:</h4>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li className="flex items-center">
                    <Clock className="h-4 w-4 text-blue-500 mr-2" />
                    Consider applying to other programs
                  </li>
                  <li className="flex items-center">
                    <Clock className="h-4 w-4 text-blue-500 mr-2" />
                    Request feedback to improve future applications
                  </li>
                  <li className="flex items-center">
                    <Clock className="h-4 w-4 text-blue-500 mr-2" />
                    Explore alternative education pathways
                  </li>
                  <li className="flex items-center">
                    <Clock className="h-4 w-4 text-blue-500 mr-2" />
                    Consider gap year opportunities
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AdmissionsResults