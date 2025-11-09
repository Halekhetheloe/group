import React, { useState, useEffect } from 'react'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { db } from '../../firebase-config'
import { Download, Filter, Calendar, Users, Building2, Briefcase, FileText, TrendingUp } from 'lucide-react'

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

  const StatCard = ({ title, value, subtitle, icon: Icon, color, trend }) => (
    <div className="card">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
          {trend && (
            <p className={`text-sm ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}% from last period
            </p>
          )}
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
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
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">System Reports</h1>
            <p className="text-gray-600 mt-2">Comprehensive analytics and insights</p>
          </div>
          <div className="flex space-x-4 mt-4 md:mt-0">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="input-field"
            >
              <option value="7days">Last 7 days</option>
              <option value="30days">Last 30 days</option>
              <option value="90days">Last 90 days</option>
              <option value="1year">Last year</option>
            </select>
            <button className="btn-primary flex items-center">
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Users"
            value={reports.userGrowth[reports.userGrowth.length - 1]?.users || 0}
            icon={Users}
            color="bg-blue-500"
            trend={12}
          />
          <StatCard
            title="Applications"
            value={reports.applicationStats.total || 0}
            subtitle={`${reports.applicationStats.approvalRate}% approval rate`}
            icon={FileText}
            color="bg-green-500"
            trend={8}
          />
          <StatCard
            title="Institutions"
            value={reports.institutionStats.total || 0}
            subtitle={`${reports.institutionStats.approved} approved`}
            icon={Building2}
            color="bg-purple-500"
            trend={15}
          />
          <StatCard
            title="Companies"
            value={reports.companyStats.total || 0}
            subtitle={`${reports.companyStats.approved} approved`}
            icon={Briefcase}
            color="bg-orange-500"
            trend={23}
          />
        </div>

        {/* Detailed Reports */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Application Statistics */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Application Statistics</h3>
              <button 
                onClick={() => exportReport('applications')}
                className="btn-secondary text-sm"
              >
                <Download className="h-4 w-4 mr-1" />
                Export
              </button>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium">Total Applications</span>
                <span className="font-bold">{reports.applicationStats.total}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                <span className="text-sm font-medium text-blue-700">Pending</span>
                <span className="font-bold text-blue-700">{reports.applicationStats.pending}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                <span className="text-sm font-medium text-green-700">Approved</span>
                <span className="font-bold text-green-700">{reports.applicationStats.approved}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                <span className="text-sm font-medium text-red-700">Rejected</span>
                <span className="font-bold text-red-700">{reports.applicationStats.rejected}</span>
              </div>
            </div>
          </div>

          {/* Institution & Company Status */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Partner Status</h3>
              <button 
                onClick={() => exportReport('partners')}
                className="btn-secondary text-sm"
              >
                <Download className="h-4 w-4 mr-1" />
                Export
              </button>
            </div>
            <div className="space-y-6">
              {/* Institutions */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Institutions</h4>
                <div className="grid grid-cols-3 gap-2">
                  <div className="text-center p-2 bg-green-50 rounded">
                    <div className="font-bold text-green-700">{reports.institutionStats.approved}</div>
                    <div className="text-xs text-green-600">Approved</div>
                  </div>
                  <div className="text-center p-2 bg-yellow-50 rounded">
                    <div className="font-bold text-yellow-700">{reports.institutionStats.pending}</div>
                    <div className="text-xs text-yellow-600">Pending</div>
                  </div>
                  <div className="text-center p-2 bg-red-50 rounded">
                    <div className="font-bold text-red-700">{reports.institutionStats.suspended}</div>
                    <div className="text-xs text-red-600">Suspended</div>
                  </div>
                </div>
              </div>

              {/* Companies */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Companies</h4>
                <div className="grid grid-cols-3 gap-2">
                  <div className="text-center p-2 bg-green-50 rounded">
                    <div className="font-bold text-green-700">{reports.companyStats.approved}</div>
                    <div className="text-xs text-green-600">Approved</div>
                  </div>
                  <div className="text-center p-2 bg-yellow-50 rounded">
                    <div className="font-bold text-yellow-700">{reports.companyStats.pending}</div>
                    <div className="text-xs text-yellow-600">Pending</div>
                  </div>
                  <div className="text-center p-2 bg-red-50 rounded">
                    <div className="font-bold text-red-700">{reports.companyStats.suspended}</div>
                    <div className="text-xs text-red-600">Suspended</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* User Growth Chart Placeholder */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">User Growth</h3>
          <div className="bg-gray-50 rounded-lg p-8 text-center">
            <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">User growth chart visualization</p>
            <p className="text-sm text-gray-500 mt-2">
              In a real implementation, this would show a line chart of user registration over time
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Reports