import React, { useState, useEffect } from 'react'
import { collection, getDocs, updateDoc, doc, query, where } from 'firebase/firestore'
import { db } from '../../firebase-config'

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
      approved: { color: 'status-approved', label: 'Approved' },
      pending: { color: 'status-pending', label: 'Pending' },
      suspended: { color: 'status-suspended', label: 'Suspended' }
    }
    const config = statusConfig[status] || { color: 'status-default', label: status }
    
    return (
      <span className={`status-badge ${config.color}`}>
        {config.label}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="institution-management">
        <div className="management-container">
          <div className="animate-pulse">
            <div className="loading-header"></div>
            <div className="loading-search"></div>
            <div className="institutions-grid">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="loading-card"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="institution-management">
      <div className="management-container">
        {/* Header */}
        <div className="management-header">
          <h1 className="management-title">Institution Management</h1>
          <p className="management-subtitle">Manage higher learning institutions in the system</p>
        </div>

        {/* Filters and Search */}
        <div className="filters-card">
          <div className="filters-container">
            <div className="search-container">
              <div className="search-wrapper">
                <input
                  type="text"
                  placeholder="Search institutions by name, email, or location..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
              </div>
            </div>
            <div className="filter-controls">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="filter-select"
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
        <div className="institutions-grid">
          {filteredInstitutions.map((institution) => (
            <div key={institution.id} className="institution-card">
              <div className="card-header">
                <div className="institution-info">
                  <div className="institution-avatar"></div>
                  <div>
                    <h3 className="institution-name">{institution.name}</h3>
                    {getStatusBadge(institution.status)}
                  </div>
                </div>
              </div>

              <div className="institution-details">
                <div className="detail-item">
                  <span className="detail-label">Email:</span>
                  <span className="detail-value">{institution.email}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Location:</span>
                  <span className="detail-value">{institution.location || 'Location not specified'}</span>
                </div>
                {institution.phone && (
                  <div className="detail-item">
                    <span className="detail-label">Phone:</span>
                    <span className="detail-value">{institution.phone}</span>
                  </div>
                )}
              </div>

              <div className="institution-description">
                {institution.description || 'No description provided.'}
              </div>

              {/* Action Buttons */}
              <div className="action-buttons">
                {institution.status === 'pending' && (
                  <>
                    <button
                      onClick={() => updateInstitutionStatus(institution.id, 'approved')}
                      className="btn-approve"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => updateInstitutionStatus(institution.id, 'suspended')}
                      className="btn-reject"
                    >
                      Reject
                    </button>
                  </>
                )}
                
                {institution.status === 'approved' && (
                  <button
                    onClick={() => updateInstitutionStatus(institution.id, 'suspended')}
                    className="btn-suspend"
                  >
                    Suspend
                  </button>
                )}
                
                {institution.status === 'suspended' && (
                  <button
                    onClick={() => updateInstitutionStatus(institution.id, 'approved')}
                    className="btn-reactivate"
                  >
                    Reactivate
                  </button>
                )}
              </div>

              {institution.createdAt && (
                <div className="card-footer">
                  <p className="registration-date">
                    Registered: {institution.createdAt.toDate?.().toLocaleDateString() || 'N/A'}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        {filteredInstitutions.length === 0 && (
          <div className="empty-state">
            <div className="empty-avatar"></div>
            <h3 className="empty-title">No institutions found</h3>
            <p className="empty-description">
              {institutions.length === 0 ? 'No institutions registered yet.' : 'Try changing your filters.'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default InstitutionManagement