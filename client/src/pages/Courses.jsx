import React, { useState, useEffect } from 'react'
import { useCourses } from '../hooks/useCourses'
import { useAuth } from '../hooks/useAuth'
import { Link } from 'react-router-dom'
import { 
  Search, 
  Filter, 
  GraduationCap, 
  MapPin, 
  Clock, 
  Users,
  BookOpen,
  Building,
  Star
} from 'lucide-react'
import LoadingSpinner from '../components/shared/UI/LoadingSpinner'

const Courses = () => {
  const { user, userData } = useAuth()
  const { getCourses, loading } = useCourses()
  const [courses, setCourses] = useState([])
  const [filteredCourses, setFilteredCourses] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [institutionFilter, setInstitutionFilter] = useState('all')
  const [durationFilter, setDurationFilter] = useState('all')
  const [institutions, setInstitutions] = useState([])

  useEffect(() => {
    fetchCourses()
  }, [])

  useEffect(() => {
    filterCourses()
  }, [courses, searchTerm, institutionFilter, durationFilter])

  const fetchCourses = async () => {
    try {
      const coursesData = await getCourses()
      setCourses(coursesData)
      
      // Extract unique institutions
      const uniqueInstitutions = coursesData
        .map(course => course.institution)
        .filter((institution, index, self) => 
          institution && self.findIndex(i => i?.uid === institution?.uid) === index
        )
      setInstitutions(uniqueInstitutions)
    } catch (error) {
      console.error('Error fetching courses:', error)
    }
  }

  const filterCourses = () => {
    let filtered = courses

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(course =>
        course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.institution?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.code.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Institution filter
    if (institutionFilter !== 'all') {
      filtered = filtered.filter(course => course.institutionId === institutionFilter)
    }

    // Duration filter
    if (durationFilter !== 'all') {
      filtered = filtered.filter(course => {
        const duration = course.duration || 0
        if (durationFilter === 'short' && duration <= 12) return true
        if (durationFilter === 'medium' && duration > 12 && duration <= 36) return true
        if (durationFilter === 'long' && duration > 36) return true
        return false
      })
    }

    setFilteredCourses(filtered)
  }

  const getDurationLabel = (duration, unit) => {
    if (unit === 'months') {
      if (duration >= 12) {
        const years = duration / 12
        return `${years} year${years > 1 ? 's' : ''}`
      }
      return `${duration} month${duration > 1 ? 's' : ''}`
    }
    return `${duration} ${unit}`
  }

  const getApplicationStatus = (course) => {
    if (!user || userData?.role !== 'student') return null
    
    const deadline = course.applicationDeadline?.toDate?.() || new Date(course.applicationDeadline)
    if (deadline < new Date()) {
      return { status: 'closed', label: 'Applications Closed', color: 'red' }
    }
    
    return { status: 'open', label: 'Accepting Applications', color: 'green' }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <LoadingSpinner size="large" text="Loading courses..." />
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
              Find Your Perfect Course
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Discover courses from institutions across Lesotho that match your interests and career goals
            </p>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            <div className="lg:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Search courses, institutions, or keywords..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div>
              <select
                value={institutionFilter}
                onChange={(e) => setInstitutionFilter(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Institutions</option>
                {institutions.map(institution => (
                  <option key={institution.uid} value={institution.uid}>
                    {institution.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <select
                value={durationFilter}
                onChange={(e) => setDurationFilter(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Any Duration</option>
                <option value="short">Short (≤ 1 year)</option>
                <option value="medium">Medium (1-3 years)</option>
                <option value="long">Long (3+ years)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Courses Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => {
            const applicationStatus = getApplicationStatus(course)
            
            return (
              <div key={course.id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
                {/* Course Header */}
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                        {course.title}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">{course.code}</p>
                    </div>
                    <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
                      {course.status === 'active' ? 'Active' : 'Inactive'}
                    </div>
                  </div>
                  
                  <div className="flex items-center text-sm text-gray-600 mb-2">
                    <Building className="h-4 w-4 mr-1" />
                    <span>{course.institution?.name}</span>
                  </div>
                  
                  {applicationStatus && (
                    <div className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                      applicationStatus.color === 'green' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {applicationStatus.label}
                    </div>
                  )}
                </div>

                {/* Course Details */}
                <div className="p-6 space-y-3">
                  <div className="flex items-center text-sm text-gray-600">
                    <Clock className="h-4 w-4 mr-2" />
                    <span>
                      {getDurationLabel(course.duration, course.durationUnit)}
                    </span>
                  </div>
                  
                  <div className="flex items-center text-sm text-gray-600">
                    <Users className="h-4 w-4 mr-2" />
                    <span>Capacity: {course.intakeCapacity} students</span>
                  </div>
                  
                  {course.fees && course.fees > 0 && (
                    <div className="flex items-center text-sm text-gray-600">
                      <span className="font-medium">Fees: </span>
                      <span className="ml-1">{course.currency} {course.fees.toLocaleString()}</span>
                    </div>
                  )}
                  
                  {course.applicationDeadline && (
                    <div className="flex items-center text-sm text-gray-600">
                      <span className="font-medium">Deadline: </span>
                      <span className="ml-1">
                        {new Date(course.applicationDeadline?.toDate?.() || course.applicationDeadline).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>

                {/* Course Description */}
                <div className="px-6 pb-4">
                  <p className="text-sm text-gray-600 line-clamp-3">
                    {course.description}
                  </p>
                </div>

                {/* Requirements Preview */}
                {course.requirements && course.requirements.length > 0 && (
                  <div className="px-6 pb-4">
                    <p className="text-xs text-gray-500 mb-2">Requirements:</p>
                    <div className="flex flex-wrap gap-1">
                      {course.requirements.slice(0, 3).map((req, index) => (
                        <span 
                          key={index}
                          className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded"
                        >
                          {req}
                        </span>
                      ))}
                      {course.requirements.length > 3 && (
                        <span className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded">
                          +{course.requirements.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="px-6 pb-6 pt-4 border-t border-gray-200">
                  <div className="flex space-x-3">
                    <Link
                      to={`/courses/${course.id}`}
                      className="flex-1 bg-gray-100 text-gray-700 hover:bg-gray-200 px-4 py-2 rounded-lg text-sm font-medium text-center transition-colors"
                    >
                      View Details
                    </Link>
                    {userData?.role === 'student' && applicationStatus?.status === 'open' && (
                      <Link
                        to={`/apply/${course.id}`}
                        className="flex-1 bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-lg text-sm font-medium text-center transition-colors"
                      >
                        Apply Now
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Empty State */}
        {filteredCourses.length === 0 && (
          <div className="text-center py-12">
            <GraduationCap className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No courses found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {courses.length === 0 ? 'No courses available at the moment.' : 'Try changing your filters.'}
            </p>
          </div>
        )}

        {/* Results Count */}
        {filteredCourses.length > 0 && (
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Showing {filteredCourses.length} of {courses.length} courses
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default Courses