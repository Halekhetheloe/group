import React, { useState, useEffect } from 'react'
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore'
import { db } from '../../firebase-config'

const CompanyManagement = () => {
  const [companies, setCompanies] = useState([])
  const [filteredCompanies, setFilteredCompanies] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    fetchCompanies()
  }, [])

  useEffect(() => {
    filterCompanies()
  }, [companies, searchTerm, statusFilter])

  const fetchCompanies = async () => {
    try {
      setLoading(true)
      const companiesQuery = collection(db, 'companies')
      const companiesSnapshot = await getDocs(companiesQuery)
      const companiesData = companiesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      setCompanies(companiesData)
    } catch (error) {
      console.error('Error fetching companies:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterCompanies = () => {
    let filtered = companies

    if (searchTerm) {
      filtered = filtered.filter(company =>
        company.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        company.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        company.industry?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(company => company.status === statusFilter)
    }

    setFilteredCompanies(filtered)
  }

  const updateCompanyStatus = async (companyId, status) => {
    try {
      const companyRef = doc(db, 'companies', companyId)
      await updateDoc(companyRef, { status })
      
      setCompanies(companies.map(company => 
        company.id === companyId ? { ...company, status } : company
      ))
      
      alert(`Company ${status === 'approved' ? 'approved' : 'rejected'} successfully`)
    } catch (error) {
      console.error('Error updating company status:', error)
      alert('Error updating company status')
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
      <div className="company-management">
        <div className="management-container">
          <div className="animate-pulse">
            <div className="loading-header"></div>
            <div className="loading-search"></div>
            <div className="companies-grid">
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
    <div className="company-management">
      <div className="management-container">
        <div className="management-header">
          <h1 className="management-title">Company Management</h1>
          <p className="management-subtitle">Manage partner companies in the system</p>
        </div>

        <div className="filters-card">
          <div className="filters-container">
            <div className="search-container">
              <div className="search-wrapper">
                <input
                  type="text"
                  placeholder="Search companies by name, industry, or email..."
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

        <div className="companies-grid">
          {filteredCompanies.map((company) => (
            <div key={company.id} className="company-card">
              <div className="card-header">
                <div className="company-info">
                  <div className="company-avatar"></div>
                  <div>
                    <h3 className="company-name">{company.name}</h3>
                    {getStatusBadge(company.status)}
                  </div>
                </div>
              </div>

              <div className="company-details">
                <div className="detail-item">
                  <span className="detail-label">Email:</span>
                  <span className="detail-value">{company.email}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Location:</span>
                  <span className="detail-value">{company.location || 'Location not specified'}</span>
                </div>
                {company.phone && (
                  <div className="detail-item">
                    <span className="detail-label">Phone:</span>
                    <span className="detail-value">{company.phone}</span>
                  </div>
                )}
                {company.industry && (
                  <div className="detail-item">
                    <span className="detail-label">Industry:</span>
                    <span className="detail-value">{company.industry}</span>
                  </div>
                )}
              </div>

              <div className="company-description">
                {company.description || 'No description provided.'}
              </div>

              <div className="action-buttons">
                {company.status === 'pending' && (
                  <>
                    <button
                      onClick={() => updateCompanyStatus(company.id, 'approved')}
                      className="btn-approve"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => updateCompanyStatus(company.id, 'suspended')}
                      className="btn-reject"
                    >
                      Reject
                    </button>
                  </>
                )}
                
                {company.status === 'approved' && (
                  <button
                    onClick={() => updateCompanyStatus(company.id, 'suspended')}
                    className="btn-suspend"
                  >
                    Suspend
                  </button>
                )}
                
                {company.status === 'suspended' && (
                  <button
                    onClick={() => updateCompanyStatus(company.id, 'approved')}
                    className="btn-reactivate"
                  >
                    Reactivate
                  </button>
                )}
              </div>

              {company.createdAt && (
                <div className="card-footer">
                  <p className="registration-date">
                    Registered: {company.createdAt.toDate?.().toLocaleDateString() || 'N/A'}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        {filteredCompanies.length === 0 && (
          <div className="empty-state">
            <div className="empty-avatar"></div>
            <h3 className="empty-title">No companies found</h3>
            <p className="empty-description">
              {companies.length === 0 ? 'No companies registered yet.' : 'Try changing your filters.'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default CompanyManagement