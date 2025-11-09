import React, { useState, useEffect } from 'react'
import { collection, getDocs, updateDoc, doc, query } from 'firebase/firestore'
import { db } from '../../firebase-config'
import {
  Search,
  Filter,
  MoreVertical,
  Mail,
  Shield,
  UserX,
  UserCheck,
  Users,
  CheckCircle, // ✅ Added for approve button
  XCircle,     // ✅ Added for reject button
} from 'lucide-react'

const UserManagement = () => {
  const [users, setUsers] = useState([])
  const [filteredUsers, setFilteredUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    fetchUsers()
  }, [])

  useEffect(() => {
    filterUsers()
  }, [users, searchTerm, roleFilter, statusFilter])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const usersQuery = query(collection(db, 'users'))
      const usersSnapshot = await getDocs(usersQuery)
      const usersData = usersSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      setUsers(usersData)
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterUsers = () => {
    let filtered = users

    if (searchTerm) {
      filtered = filtered.filter(
        (user) =>
          user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.displayName?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (roleFilter !== 'all') {
      filtered = filtered.filter((user) => user.role === roleFilter)
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((user) => user.status === statusFilter)
    }

    setFilteredUsers(filtered)
  }

  const updateUserStatus = async (userId, status) => {
    try {
      const userRef = doc(db, 'users', userId)
      await updateDoc(userRef, { status })

      // Update role-specific document if it exists
      try {
        const userDoc = await getDocs(collection(db, 'users'))
        const userData = users.find(u => u.id === userId)
        
        if (userData?.role === 'company') {
          const companyRef = doc(db, 'companies', userId)
          await updateDoc(companyRef, { status })
        } else if (userData?.role === 'institution') {
          const institutionRef = doc(db, 'institutions', userId)
          await updateDoc(institutionRef, { status })
        }
      } catch (error) {
        console.log('No role-specific document found')
      }

      setUsers(
        users.map((user) =>
          user.id === userId ? { ...user, status } : user
        )
      )

      alert(`User ${status === 'active' ? 'activated' : 'suspended'} successfully`)
    } catch (error) {
      console.error('Error updating user status:', error)
      alert('Error updating user status')
    }
  }

  const approveUser = async (userId) => {
    try {
      const userRef = doc(db, 'users', userId)
      await updateDoc(userRef, { 
        status: 'approved',
        updatedAt: new Date()
      })

      // Update role-specific document
      const userData = users.find(u => u.id === userId)
      if (userData?.role === 'company') {
        const companyRef = doc(db, 'companies', userId)
        await updateDoc(companyRef, { 
          status: 'approved',
          updatedAt: new Date()
        })
      } else if (userData?.role === 'institution') {
        const institutionRef = doc(db, 'institutions', userId)
        await updateDoc(institutionRef, { 
          status: 'approved',
          updatedAt: new Date()
        })
      }

      setUsers(
        users.map((user) =>
          user.id === userId ? { ...user, status: 'approved' } : user
        )
      )

      alert('User approved successfully!')
    } catch (error) {
      console.error('Error approving user:', error)
      alert('Error approving user')
    }
  }

  const rejectUser = async (userId) => {
    try {
      const userRef = doc(db, 'users', userId)
      await updateDoc(userRef, { 
        status: 'rejected',
        updatedAt: new Date()
      })

      // Update role-specific document
      const userData = users.find(u => u.id === userId)
      if (userData?.role === 'company') {
        const companyRef = doc(db, 'companies', userId)
        await updateDoc(companyRef, { 
          status: 'rejected',
          updatedAt: new Date()
        })
      } else if (userData?.role === 'institution') {
        const institutionRef = doc(db, 'institutions', userId)
        await updateDoc(institutionRef, { 
          status: 'rejected',
          updatedAt: new Date()
        })
      }

      setUsers(
        users.map((user) =>
          user.id === userId ? { ...user, status: 'rejected' } : user
        )
      )

      alert('User rejected successfully!')
    } catch (error) {
      console.error('Error rejecting user:', error)
      alert('Error rejecting user')
    }
  }

  const updateUserRole = async (userId, role) => {
    try {
      const userRef = doc(db, 'users', userId)
      await updateDoc(userRef, { role })

      setUsers(
        users.map((user) =>
          user.id === userId ? { ...user, role } : user
        )
      )

      alert('User role updated successfully')
    } catch (error) {
      console.error('Error updating user role:', error)
      alert('Error updating user role')
    }
  }

  const getRoleBadge = (role) => {
    const roleConfig = {
      student: { color: 'bg-blue-100 text-blue-800', label: 'Student' },
      institution: { color: 'bg-green-100 text-green-800', label: 'Institution' },
      company: { color: 'bg-purple-100 text-purple-800', label: 'Company' },
      admin: { color: 'bg-red-100 text-red-800', label: 'Admin' },
    }
    const config = roleConfig[role] || { color: 'bg-gray-100 text-gray-800', label: role }
    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}
      >
        {config.label}
      </span>
    )
  }

  const getStatusBadge = (status) => {
    const statusConfig = {
      active: { color: 'bg-green-100 text-green-800', label: 'Active' },
      approved: { color: 'bg-green-100 text-green-800', label: 'Approved' },
      suspended: { color: 'bg-red-100 text-red-800', label: 'Suspended' },
      pending: { color: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
      rejected: { color: 'bg-red-100 text-red-800', label: 'Rejected' },
    }
    const config = statusConfig[status] || { color: 'bg-gray-100 text-gray-800', label: status }
    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}
      >
        {config.label}
      </span>
    )
  }

  // Check if user needs approval (company/institution with pending status)
  const needsApproval = (user) => {
    return (user.role === 'company' || user.role === 'institution') && user.status === 'pending'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="h-12 bg-gray-200 rounded mb-6"></div>
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-20 bg-gray-200 rounded"></div>
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
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600 mt-2">Manage all users in the system</p>
        </div>

        {/* Filters and Search */}
        <div className="card mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search users by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input-field pl-10"
                />
              </div>
            </div>
            <div className="flex space-x-4">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="input-field"
              >
                <option value="all">All Roles</option>
                <option value="student">Students</option>
                <option value="institution">Institutions</option>
                <option value="company">Companies</option>
                <option value="admin">Admins</option>
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="input-field"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="approved">Approved</option>
                <option value="pending">Pending</option>
                <option value="suspended">Suspended</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="card">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Registered
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-gray-300 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-700">
                            {user.displayName?.charAt(0) || user.email?.charAt(0) || 'U'}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {user.displayName || 'No Name'}
                          </div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getRoleBadge(user.role)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(user.status || 'active')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.createdAt?.toDate?.().toLocaleDateString() || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        {/* Approve/Reject buttons for pending company/institution users */}
                        {needsApproval(user) && (
                          <>
                            <button
                              onClick={() => approveUser(user.id)}
                              className="text-green-600 hover:text-green-900 flex items-center"
                              title="Approve User"
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Approve
                            </button>
                            <button
                              onClick={() => rejectUser(user.id)}
                              className="text-red-600 hover:text-red-900 flex items-center"
                              title="Reject User"
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Reject
                            </button>
                          </>
                        )}

                        {/* Suspend/Activate buttons for non-pending users */}
                        {!needsApproval(user) && (
                          user.status === 'suspended' || user.status === 'rejected' ? (
                            <button
                              onClick={() => updateUserStatus(user.id, 'approved')}
                              className="text-green-600 hover:text-green-900 flex items-center"
                              title="Activate User"
                            >
                              <UserCheck className="h-4 w-4 mr-1" />
                              Activate
                            </button>
                          ) : (
                            <button
                              onClick={() => updateUserStatus(user.id, 'suspended')}
                              className="text-red-600 hover:text-red-900 flex items-center"
                              title="Suspend User"
                            >
                              <UserX className="h-4 w-4 mr-1" />
                              Suspend
                            </button>
                          )
                        )}

                        {/* Make Admin button for non-admin users */}
                        {user.role !== 'admin' && (
                          <button
                            onClick={() => updateUserRole(user.id, 'admin')}
                            className="text-blue-600 hover:text-blue-900 flex items-center"
                            title="Make Admin"
                          >
                            <Shield className="h-4 w-4 mr-1" />
                            Make Admin
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredUsers.length === 0 && (
            <div className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No users found
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {users.length === 0
                  ? 'No users in the system yet.'
                  : 'Try changing your filters.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default UserManagement