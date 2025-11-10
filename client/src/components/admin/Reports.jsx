import React, { useState, useEffect } from 'react'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { db } from '../../firebase-config'

const Reports = () => {
  const [reports, setReports] = useState({
    userGrowth: [],
    applicationStats: {},
    institutionStats: {},
    companyStats: {}
  })
  const [dateRange, setDateRange] = useState('30days')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchReportData()
  }, [dateRange])

  const fetchReportData = async () => {
    try {
      setLoading(true)
      
      // Fetch users for growth data
      const usersQuery = query(collection(db, 'users'))
      const usersSnapshot = await getDocs(usersQuery)
      const users = usersSnapshot.docs.map(doc => doc.data())
      
      // Fetch applications
      const applicationsQuery = query(collection(db, 'applications'))
      const applicationsSnapshot = await getDocs(applicationsQuery)
      const applications = applicationsSnapshot.docs.map(doc => doc.data())
      
      // Fetch institutions
      const institutionsQuery = query(collection(db, 'institutions'))
      const institutionsSnapshot = await getDocs(institutionsQuery)
      const institutions = institutionsSnapshot.docs.map(doc => doc.data())
      
      // Fetch companies
      const companiesQuery = query(collection(db, 'companies'))
      const companiesSnapshot = await getDocs(companiesQuery)
      const companies = companiesSnapshot.docs.map(doc => doc.data())

      // Generate mock growth data (in real app, you'd aggregate by date)
      const userGrowth = generateGrowthData(users, 'users')
      const applicationStats = calculateApplicationStats(applications)
      const institutionStats = calculateInstitutionStats(institutions)
      const companyStats = calculateCompanyStats(companies)

      setReports({
        userGrowth,
        applicationStats,
        institutionStats,
        companyStats
      })

    } catch (error) {
      console.error('Error fetching report data:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateGrowthData = (data, type) => {
    // Mock growth data - in real app, you'd aggregate by actual dates
    return [
      { date: '2024-01', [type]: Math.floor(Math.random() * 100) + 50 },
      { date: '2024-02', [type]: Math.floor(Math.random() * 100) + 100 },
      { date: '2024-03', [type]: Math.floor(Math.random() * 100) + 150 },
      { date: '2024-04', [type]: Math.floor(Math.random() * 100) + 200 },
      { date: '2024-05', [type]: Math.floor(Math.random() * 100) + 250 },
      { date: '2024-06', [type]: Math.floor(Math.random() * 100) + 300 }
    ]
  }

  const calculateApplicationStats = (applications) => {
    const total = applications.length
    const pending = applications.filter(app => app.status === 'pending').length
    const approved = applications.filter(app => app.status === 'approved').length
    const rejected = applications.filter(app => app.status === 'rejected').length
    
    return {
      total,
      pending,
      approved,
      rejected,
      approvalRate: total > 0 ? ((approved / total) * 100).toFixed(1) : 0
    }
  }

  const calculateInstitutionStats = (institutions) => {
    const total = institutions.length
    const approved = institutions.filter(inst => inst.status === 'approved').length
    const pending = institutions.filter(inst => inst.status === 'pending').length
    const suspended = institutions.filter(inst => inst.status === 'suspended').length
    
    return { total, approved, pending, suspended }
  }

  const calculateCompanyStats = (companies) => {
    const total = companies.length
    const approved = companies.filter(comp => comp.status === 'approved').length
    const pending = companies.filter(comp => comp.status === 'pending').length
    const suspended = companies.filter(comp => comp.status === 'suspended').length
    
    return { total, approved, pending, suspended }
  }

  const exportReport = (type) => {
    // In real app, this would generate and download a CSV/PDF
    alert(`Exporting ${type} report...`)
  }

  const StatCard = ({ title, value, subtitle, color, trend }) => (
    <div className="stat-card">
      <div className="stat-content">
        <div>
          <p className="stat-title">{title}</p>
          <p className="stat-value">{value}</p>
          {subtitle && <p className="stat-subtitle">{subtitle}</p>}
          {trend && (
            <p className={`stat-trend ${trend > 0 ? 'positive' : 'negative'}`}>
              {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}% from last period
            </p>
          )}
        </div>
        <div className={`stat-icon ${color}`}></div>
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className="reports-page">
        <div className="reports-container">
          <div className="animate-pulse">
            <div className="loading-header"></div>
            <div className="stats-grid">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="loading-stat"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="reports-page">
      <div className="reports-container">
        {/* Header */}
        <div className="reports-header">
          <div className="header-content">
            <h1 className="reports-title">System Reports</h1>
            <p className="reports-subtitle">Comprehensive analytics and insights</p>
          </div>
          <div className="header-controls">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="date-select"
            >
              <option value="7days">Last 7 days</option>
              <option value="30days">Last 30 days</option>
              <option value="90days">Last 90 days</option>
              <option value="1year">Last year</option>
            </select>
            <button className="export-btn">
              Export Report
            </button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="stats-grid">
          <StatCard
            title="Total Users"
            value={reports.userGrowth[reports.userGrowth.length - 1]?.users || 0}
            color="bg-blue"
            trend={12}
          />
          <StatCard
            title="Applications"
            value={reports.applicationStats.total || 0}
            subtitle={`${reports.applicationStats.approvalRate}% approval rate`}
            color="bg-green"
            trend={8}
          />
          <StatCard
            title="Institutions"
            value={reports.institutionStats.total || 0}
            subtitle={`${reports.institutionStats.approved} approved`}
            color="bg-purple"
            trend={15}
          />
          <StatCard
            title="Companies"
            value={reports.companyStats.total || 0}
            subtitle={`${reports.companyStats.approved} approved`}
            color="bg-orange"
            trend={23}
          />
        </div>

        {/* Detailed Reports */}
        <div className="detailed-reports">
          {/* Application Statistics */}
          <div className="report-card">
            <div className="report-header">
              <h3 className="report-title">Application Statistics</h3>
              <button 
                onClick={() => exportReport('applications')}
                className="export-small-btn"
              >
                Export
              </button>
            </div>
            <div className="stats-list">
              <div className="stat-item total">
                <span className="stat-label">Total Applications</span>
                <span className="stat-number">{reports.applicationStats.total}</span>
              </div>
              <div className="stat-item pending">
                <span className="stat-label">Pending</span>
                <span className="stat-number">{reports.applicationStats.pending}</span>
              </div>
              <div className="stat-item approved">
                <span className="stat-label">Approved</span>
                <span className="stat-number">{reports.applicationStats.approved}</span>
              </div>
              <div className="stat-item rejected">
                <span className="stat-label">Rejected</span>
                <span className="stat-number">{reports.applicationStats.rejected}</span>
              </div>
            </div>
          </div>

          {/* Institution & Company Status */}
          <div className="report-card">
            <div className="report-header">
              <h3 className="report-title">Partner Status</h3>
              <button 
                onClick={() => exportReport('partners')}
                className="export-small-btn"
              >
                Export
              </button>
            </div>
            <div className="partner-stats">
              {/* Institutions */}
              <div className="partner-section">
                <h4 className="partner-title">Institutions</h4>
                <div className="status-grid">
                  <div className="status-item approved">
                    <div className="status-count">{reports.institutionStats.approved}</div>
                    <div className="status-label">Approved</div>
                  </div>
                  <div className="status-item pending">
                    <div className="status-count">{reports.institutionStats.pending}</div>
                    <div className="status-label">Pending</div>
                  </div>
                  <div className="status-item suspended">
                    <div className="status-count">{reports.institutionStats.suspended}</div>
                    <div className="status-label">Suspended</div>
                  </div>
                </div>
              </div>

              {/* Companies */}
              <div className="partner-section">
                <h4 className="partner-title">Companies</h4>
                <div className="status-grid">
                  <div className="status-item approved">
                    <div className="status-count">{reports.companyStats.approved}</div>
                    <div className="status-label">Approved</div>
                  </div>
                  <div className="status-item pending">
                    <div className="status-count">{reports.companyStats.pending}</div>
                    <div className="status-label">Pending</div>
                  </div>
                  <div className="status-item suspended">
                    <div className="status-count">{reports.companyStats.suspended}</div>
                    <div className="status-label">Suspended</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* User Growth Chart Placeholder */}
        <div className="report-card">
          <h3 className="report-title">User Growth</h3>
          <div className="chart-placeholder">
            <div className="chart-icon"></div>
            <p className="chart-text">User growth chart visualization</p>
            <p className="chart-description">
              In a real implementation, this would show a line chart of user registration over time
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Reports