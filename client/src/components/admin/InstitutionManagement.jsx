import React, { useState, useEffect } from 'react'
import { collection, getDocs, updateDoc, doc, query, where } from 'firebase/firestore'
import { db } from '../../firebase-config'
import { Search, Building2, CheckCircle, XCircle, Clock, MapPin, Phone, Mail } from 'lucide-react'

const InstitutionManagement = () => {
  const [institutions, setInstitutions] = useState([])
  const [filteredInstitutions, setFilteredInstitutions] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    fetchInstitutions()
  }, [])

  useEffect(() => {
    filterInstitutions()
  }, [institutions, searchTerm, statusFilter])

  const fetchInstitutions = async () => {
    try {
      setLoading(true)
      const institutionsQuery = query(collection(db, 'institutions'))
      const institutionsSnapshot = await getDocs(institutionsQuery)
      const institutionsData = institutionsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      setInstitutions(institutionsData)
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
      filtered = filtered.filter(inst =>
        inst.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inst.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inst.location?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(inst => inst.status === statusFilter)
    }

    setFilteredInstitutions(filtered)
  }

  const updateInstitutionStatus = async (institutionId, status) => {
    try {
      const institutionRef = doc(db, 'institutions', institutionId)
      await updateDoc(institutionRef, { status })
      
      // Update local state
      setInstitutions(institutions.map(inst => 
        inst.id === institutionId ? { ...inst, status } : inst
      ))
      
      alert(`Institution ${status === 'approved' ? 'approved' : 'rejected'} successfully`)
    } catch (error) {
      console.error('Error updating institution status:', error)
      alert('Error updating institution status')
    }
  }

  const getStatusBadge = (status) => {
    const statusConfig = {
      approved: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      suspended: { color: 'bg-red-100 text-red-800', icon: XCircle }
    }
    const config = statusConfig[status] || { color: 'bg-gray-100 text-gray-800', icon: Clock }
    const Icon = config.icon
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="h-3 w-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    )
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
                <div key={i} className="h-48 bg-gray-200 rounded-lg"></div>
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
          <h1 className="text-3xl font-bold text-gray-900">Institution Management</h1>
          <p className="text-gray-600 mt-2">Manage higher learning institutions in the system</p>
        </div>

        {/* Filters and Search */}
        <div className="card mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search institutions by name, email, or location..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input-field pl-10"
                />
              </div>
            </div>
            <div className="flex space-x-4">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="input-field"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
          </div>
        </div>

        {/* Institutions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredInstitutions.map((institution) => (
            <div key={institution.id} className="card">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Building2 className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{institution.name}</h3>
                    {getStatusBadge(institution.status)}
                  </div>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm text-gray-600">
                  <Mail className="h-4 w-4 mr-2" />
                  {institution.email}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <MapPin className="h-4 w-4 mr-2" />
                  {institution.location || 'Location not specified'}
                </div>
                {institution.phone && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Phone className="h-4 w-4 mr-2" />
                    {institution.phone}
                  </div>
                )}
              </div>

              <div className="text-sm text-gray-600 mb-4 line-clamp-2">
                {institution.description || 'No description provided.'}
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-2">
                {institution.status === 'pending' && (
                  <>
                    <button
                      onClick={() => updateInstitutionStatus(institution.id, 'approved')}
                      className="btn-success flex-1 text-sm"
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Approve
                    </button>
                    <button
                      onClick={() => updateInstitutionStatus(institution.id, 'suspended')}
                      className="btn-danger flex-1 text-sm"
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Reject
                    </button>
                  </>
                )}
                
                {institution.status === 'approved' && (
                  <button
                    onClick={() => updateInstitutionStatus(institution.id, 'suspended')}
                    className="btn-danger w-full text-sm"
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    Suspend
                  </button>
                )}
                
                {institution.status === 'suspended' && (
                  <button
                    onClick={() => updateInstitutionStatus(institution.id, 'approved')}
                    className="btn-success w-full text-sm"
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Reactivate
                  </button>
                )}
              </div>

              {institution.createdAt && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="text-xs text-gray-500">
                    Registered: {institution.createdAt.toDate?.().toLocaleDateString() || 'N/A'}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        {filteredInstitutions.length === 0 && (
          <div className="text-center py-12">
            <Building2 className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No institutions found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {institutions.length === 0 ? 'No institutions registered yet.' : 'Try changing your filters.'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default InstitutionManagement