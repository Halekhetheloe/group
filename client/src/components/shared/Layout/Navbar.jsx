import React, { useState, useEffect, useRef } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../../hooks/useAuth'
import { 
  GraduationCap, 
  Briefcase, 
  Building, 
  User, 
  LogOut, 
  Menu, 
  X,
  Bell,
  Search
} from 'lucide-react'
import toast from 'react-hot-toast'

const Navbar = () => {
  const { user, userData, logout } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [showNotifications, setShowNotifications] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const userMenuRef = useRef(null)

  const isActive = (path) => location.pathname === path

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false)
      }
      if (showNotifications && !event.target.closest('.notifications-container')) {
        setShowNotifications(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showNotifications])

  const handleLogout = async () => {
    try {
      await logout()
      toast.success('Logged out successfully')
      navigate('/')
      setShowUserMenu(false)
    } catch (error) {
      toast.error('Error logging out')
    }
  }

  const getDashboardPath = () => {
    if (!userData) return '/'
    
    switch (userData.role) {
      case 'student':
        return '/student/dashboard'
      case 'institution':
        return '/institution/dashboard'
      case 'company':
        return '/company/dashboard'
      case 'admin':
        return '/admin/dashboard'
      default:
        return '/'
    }
  }

  const getNavItems = () => {
    if (!userData) {
      return [
        { path: '/', label: 'Home', icon: GraduationCap },
        { path: '/courses', label: 'Courses', icon: GraduationCap },
        { path: '/institutions', label: 'Institutions', icon: Building },
        { path: '/jobs', label: 'Jobs', icon: Briefcase },
        { path: '/about', label: 'About', icon: User }
      ]
    }

    const baseItems = [
      { path: getDashboardPath(), label: 'Dashboard', icon: User }
    ]

    switch (userData.role) {
      case 'student':
        return [
          ...baseItems,
          { path: '/courses', label: 'Browse Courses', icon: GraduationCap },
          { path: '/jobs', label: 'Browse Jobs', icon: Briefcase },
          { path: '/student/applications', label: 'My Applications', icon: Briefcase },
          { path: '/student/transcripts', label: 'Transcripts', icon: GraduationCap }
        ]
      case 'institution':
        return [
          ...baseItems,
          { path: '/institution/courses', label: 'Manage Courses', icon: GraduationCap },
          { path: '/institution/applications', label: 'Applications', icon: Briefcase },
          { path: '/institution/students', label: 'Students', icon: User }
        ]
      case 'company':
        return [
          ...baseItems,
          { path: '/company/jobs', label: 'Manage Jobs', icon: Briefcase },
          { path: '/company/applicants', label: 'Applicants', icon: User }
        ]
      case 'admin':
        return [
          ...baseItems,
          { path: '/admin/institutions', label: 'Institutions', icon: Building },
          { path: '/admin/companies', label: 'Companies', icon: Briefcase },
          { path: '/admin/users', label: 'Users', icon: User },
          { path: '/admin/reports', label: 'Reports', icon: GraduationCap }
        ]
      default:
        return baseItems
    }
  }

  return (
    <nav className="bg-white shadow-lg border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and Brand */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <div className="bg-blue-600 text-white p-2 rounded-lg">
                <GraduationCap className="h-6 w-6" />
              </div>
              <div>
                <span className="text-xl font-bold text-gray-900">Lesotho</span>
                <span className="text-xl font-bold text-blue-600">CareerGuide</span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {getNavItems().map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                    isActive(item.path)
                      ? 'text-blue-600 bg-blue-50 border-b-2 border-blue-600'
                      : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </div>

          {/* Right side items */}
          <div className="flex items-center space-x-4">
            {/* Search Icon for larger screens */}
            <div className="hidden md:block">
              <Search className="h-5 w-5 text-gray-400 cursor-pointer hover:text-blue-600" />
            </div>

            {/* Notifications */}
            {user && (
              <div className="relative notifications-container">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-2 text-gray-400 hover:text-blue-600 relative"
                >
                  <Bell className="h-5 w-5" />
                  {notifications.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                      {notifications.length}
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown */}
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                    <div className="p-4 border-b border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.length > 0 ? (
                        notifications.map((notification) => (
                          <div
                            key={notification.id}
                            className="p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                          >
                            <p className="text-sm text-gray-800">{notification.message}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {new Date(notification.timestamp).toLocaleDateString()}
                            </p>
                          </div>
                        ))
                      ) : (
                        <div className="p-4 text-center text-gray-500">
                          No new notifications
                        </div>
                      )}
                    </div>
                    <div className="p-2 border-t border-gray-200">
                      <button className="w-full text-center text-sm text-blue-600 hover:text-blue-800 py-2">
                        View All Notifications
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* User Menu */}
            {user ? (
              <div className="flex items-center space-x-3" ref={userMenuRef}>
                <div className="hidden md:flex flex-col text-right">
                  <span className="text-sm font-medium text-gray-900">
                    {userData?.displayName || user.email}
                  </span>
                  <span className="text-xs text-gray-500 capitalize">
                    {userData?.role}
                  </span>
                </div>
                
                <div className="relative">
                  <button 
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-50 border border-transparent hover:border-gray-200 transition-colors"
                  >
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                      <User className="h-4 w-4 text-white" />
                    </div>
                  </button>
                  
                  {/* User Dropdown Menu */}
                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                      <div className="py-1">
                        <Link
                          to="/profile"
                          onClick={() => setShowUserMenu(false)}
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <User className="h-4 w-4 mr-2" />
                          My Profile
                        </Link>
                        <button
                          onClick={handleLogout}
                          className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <LogOut className="h-4 w-4 mr-2" />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  to="/login"
                  className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200"
                >
                  Sign Up
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 rounded-md text-gray-400 hover:text-blue-600 hover:bg-gray-50"
              >
                {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 bg-white border-t border-gray-200">
              {getNavItems().map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium ${
                      isActive(item.path)
                        ? 'text-blue-600 bg-blue-50'
                        : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Link>
                )
              })}
              
              {user && (
                <div className="border-t border-gray-200 pt-2">
                  <Link
                    to="/profile"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                  >
                    <User className="h-4 w-4" />
                    <span>My Profile</span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-2 w-full px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}

export default Navbar