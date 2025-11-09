import React, { useState, useEffect } from 'react'
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore'
import { db } from '../firebase-config'
import { Link } from 'react-router-dom'
import { 
  Search, 
  Filter, 
  Building, 
  MapPin, 
  Users, 
  GraduationCap,
  Star,
  CheckCircle
} from 'lucide-react'
import LoadingSpinner from '../components/shared/UI/LoadingSpinner'

const Institutions = () => {
  const [institutions, setInstitutions] = useState([])
  const [filteredInstitutions, setFilteredInstitutions] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('approved')

  useEffect(() => {
    fetchInstitutions()
  }, [])

  useEffect(() => {
    filterInstitutions()
  }, [institutions, searchTerm, statusFilter])

  const fetchInstitutions = async () => {
    try {
      setLoading(true)
      const institutionsQuery = query(
        collection(db, 'institutions'),
        where('status', '==', 'approved'),
        orderBy('name', 'asc')
      )
      const institutionsSnapshot = await getDocs(institutionsQuery)
      const institutionsData = institutionsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))

      // Fetch course counts for each institution
      const institutionsWithStats = await Promise.all(
        institutionsData.map(async (institution) => {
          const coursesQuery = query(
            collection(db, 'courses'),
            where('institutionId', '==', institution.id),
            where('status', '==', 'active')
          )
          const coursesSnapshot = await getDocs(coursesQuery)
          
          const studentsQuery = query(
            collection(db, 'applications'),
            where('institutionId', '==', institution.id),
            where('status', '==', 'accepted')
          )
          const studentsSnapshot = await getDocs(studentsQuery)

          return {
            ...institution,
            courseCount: coursesSnapshot.size,
            studentCount: studentsSnapshot.size
          }
        })
      )

      setInstitutions(institutionsWithStats)
    } catch (error) {
      console.error('Error fetching institutions:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterInstitutions = () => {
    let filtered = institutions

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(institution =>
        institution.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        institution.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        institution.address?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(institution => institution.status === statusFilter)
    }

    setFilteredInstitutions(filtered)
  }

  const getInstitutionType = (institution) => {
    // This would typically come from institution data
    if (institution.name?.toLowerCase().includes('university')) return 'University'
    if (institution.name?.toLowerCase().includes('college')) return 'College'
    if (institution.name?.toLowerCase().includes('institute')) return 'Institute'
    return 'Institution'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <LoadingSpinner size="large" text="Loading institutions..." />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Partner Institutions
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Discover accredited institutions in Lesotho offering quality education and diverse programs
            </p>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            <div className="lg:col-span-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Search institutions by name, location, or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="approved">Approved</option>
                <option value="all">All Institutions</option>
              </select>
            </div>
          </div>
        </div>

        {/* Institutions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredInstitutions.map((institution) => (
            <div key={institution.id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
              {/* Institution Header */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {institution.name}
                    </h3>
                    <div className="flex items-center text-sm text-gray-600 mb-1">
                      <Building className="h-4 w-4 mr-1" />
                      <span>{getInstitutionType(institution)}</span>
                    </div>
                    {institution.accreditationStatus && (
                      <div className="flex items-center text-sm text-green-600">
                        <CheckCircle className="h-4 w-4 mr-1" />
                        <span>Accredited</span>
                      </div>
                    )}
                  </div>
                  {institution.logoURL && (
                    <img 
                      src={institution.logoURL} 
                      alt={`${institution.name} logo`}
                      className="w-12 h-12 object-contain rounded"
                    />
                  )}
                </div>
                
                {institution.address && (
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="h-4 w-4 mr-1" />
                    <span className="line-clamp-1">{institution.address}</span>
                  </div>
                )}
              </div>

              {/* Institution Details */}
              <div className="p-6">
                {/* Description */}
                {institution.description && (
                  <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                    {institution.description}
                  </p>
                )}

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="text-center">
                    <div className="flex items-center justify-center text-blue-600 mb-1">
                      <GraduationCap className="h-5 w-5 mr-1" />
                      <span className="text-lg font-bold">{institution.courseCount || 0}</span>
                    </div>
                    <div className="text-xs text-gray-500">Courses</div>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center text-green-600 mb-1">
                      <Users className="h-5 w-5 mr-1" />
                      <span className="text-lg font-bold">{institution.studentCount || 0}</span>
                    </div>
                    <div className="text-xs text-gray-500">Students</div>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="space-y-2 text-sm text-gray-600 mb-4">
                  {institution.contactEmail && (
                    <div>
                      <span className="font-medium">Email: </span>
                      <span>{institution.contactEmail}</span>
                    </div>
                  )}
                  {institution.contactPhone && (
                    <div>
                      <span className="font-medium">Phone: </span>
                      <span>{institution.contactPhone}</span>
                    </div>
                  )}
                  {institution.website && (
                    <div>
                      <span className="font-medium">Website: </span>
                      <a 
                        href={institution.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        Visit Website
                      </a>
                    </div>
                  )}
                </div>

                {/* Specializations */}
                {institution.specializations && institution.specializations.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs text-gray-500 mb-2">Areas of Focus:</p>
                    <div className="flex flex-wrap gap-1">
                      {institution.specializations.slice(0, 3).map((specialization, index) => (
                        <span 
                          key={index}
                          className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded"
                        >
                          {specialization}
                        </span>
                      ))}
                      {institution.specializations.length > 3 && (
                        <span className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded">
                          +{institution.specializations.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex space-x-3">
                  <Link
                    to={`/institutions/${institution.id}`}
                    className="flex-1 bg-gray-100 text-gray-700 hover:bg-gray-200 px-4 py-2 rounded-lg text-sm font-medium text-center transition-colors"
                  >
                    View Profile
                  </Link>
                  <Link
                    to={`/courses?institution=${institution.id}`}
                    className="flex-1 bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-lg text-sm font-medium text-center transition-colors"
                  >
                    View Courses
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredInstitutions.length === 0 && (
          <div className="text-center py-12">
            <Building className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No institutions found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {institutions.length === 0 ? 'No institutions available at the moment.' : 'Try changing your filters.'}
            </p>
          </div>
        )}

        {/* Results Count */}
        {filteredInstitutions.length > 0 && (
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Showing {filteredInstitutions.length} of {institutions.length} institutions
            </p>
          </div>
        )}

        {/* Partner With Us Section */}
        <div className="mt-12 bg-blue-600 rounded-lg p-8 text-center text-white">
          <h3 className="text-2xl font-bold mb-4">
            Want to Partner With Us?
          </h3>
          <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
            Join our network of institutions and reach thousands of students looking for quality education in Lesotho.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register?role=institution"
              className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
            >
              Register Your Institution
            </Link>
            <Link
              to="/contact"
              className="border-2 border-white text-white px-6 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Institutions