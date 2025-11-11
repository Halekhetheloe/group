import React, { useState, useEffect, useRef } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../../hooks/useAuth'
import { User } from 'lucide-react'
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
  const notificationsRef = useRef(null)

  const isActive = (path) => location.pathname === path

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false)
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setShowNotifications(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showNotifications, showUserMenu])

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
        { path: '/', label: 'Home' },
        { path: '/courses', label: 'Courses' },
        { path: '/institutions', label: 'Institutions' },
        { path: '/jobs', label: 'Jobs' },
        { path: '/about', label: 'About' }
      ]
    }

    const baseItems = [
      { path: getDashboardPath(), label: 'Dashboard' }
    ]

    switch (userData.role) {
      case 'student':
        return [
          ...baseItems,
          { path: '/courses', label: 'Browse Courses' },
          { path: '/jobs', label: 'Browse Jobs' },
          { path: '/student/applications', label: 'My Applications' },
          { path: '/student/transcripts', label: 'Transcripts' }
        ]
      case 'institution':
        return [
          ...baseItems,
          { path: '/institution/courses', label: 'Manage Courses' },
          { path: '/institution/applications', label: 'Applications' },
          { path: '/institution/students', label: 'Students' }
        ]
      case 'company':
        return [
          ...baseItems,
          { path: '/company/jobs', label: 'Manage Jobs' },
          { path: '/company/applicants', label: 'Applicants' }
        ]
      case 'admin':
        return [
          ...baseItems,
          { path: '/admin/institutions', label: 'Institutions' },
          { path: '/admin/companies', label: 'Companies' },
          { path: '/admin/users', label: 'Users' },
          { path: '/admin/reports', label: 'Reports' }
        ]
      default:
        return baseItems
    }
  }

  return (
    <nav className="navbar">
      <div className="nav-container">
        {/* Logo and Brand */}
        <div className="nav-brand">
          <Link to="/" className="brand-link">
            <div className="brand-text">
              <span className="brand-name">LesothoCareerGuide</span>
            </div>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <div className="nav-desktop">
          {getNavItems().map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-link ${isActive(item.path) ? 'nav-link-active' : ''}`}
            >
              <span>{item.label}</span>
            </Link>
          ))}
        </div>

        {/* Right side items */}
        <div className="nav-right">
          {/* Notifications */}
          {user && (
            <div className="notifications-container" ref={notificationsRef}>
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="notifications-btn"
              >
                Notifications
                {notifications.length > 0 && (
                  <span className="notification-badge">
                    {notifications.length}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown */}
              {showNotifications && (
                <div className="notifications-dropdown">
                  <div className="notifications-header">
                    <h3 className="notifications-title">Notifications</h3>
                  </div>
                  <div className="notifications-list">
                    {notifications.length > 0 ? (
                      notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className="notification-item"
                        >
                          <p className="notification-message">{notification.message}</p>
                          <p className="notification-time">
                            {new Date(notification.timestamp).toLocaleDateString()}
                          </p>
                        </div>
                      ))
                    ) : (
                      <div className="notification-empty">
                        No new notifications
                      </div>
                    )}
                  </div>
                  <div className="notifications-footer">
                    <Link 
                      to="/notifications" 
                      className="notifications-view-all"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowNotifications(false);
                      }}
                    >
                      View All Notifications
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* User Menu */}
          {user ? (
            <div className="user-menu-container" ref={userMenuRef}>
              <div className="user-info">
                <span className="user-name">
                  {userData?.displayName || user.email}
                </span>
                <span className="user-role">
                  {userData?.role}
                </span>
              </div>
              
              <div className="user-avatar-container">
                <button 
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="user-avatar-btn"
                >
                  <User className="user-icon" />
                </button>
                
                {/* User Dropdown Menu */}
                {showUserMenu && (
                  <div className="user-dropdown">
                    <div className="dropdown-content">
                      <Link
                        to="/profile"
                        onClick={() => setShowUserMenu(false)}
                        className="dropdown-item"
                      >
                        <User className="dropdown-icon" />
                        My Profile
                      </Link>
                      <Link
                        to="/notifications"
                        onClick={() => setShowUserMenu(false)}
                        className="dropdown-item"
                      >
                        Notifications
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="dropdown-item"
                      >
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="auth-buttons">
              <Link
                to="/login"
                className="auth-btn login-btn"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="auth-btn register-btn"
              >
                Sign Up
              </Link>
            </div>
          )}

          {/* Mobile menu button */}
          <div className="mobile-menu-btn">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="mobile-menu-toggle"
            >
              {isOpen ? 'Close' : 'Menu'}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="mobile-nav">
            <div className="mobile-nav-content">
              {getNavItems().map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsOpen(false)}
                  className={`mobile-nav-link ${isActive(item.path) ? 'mobile-nav-link-active' : ''}`}
                >
                  <span>{item.label}</span>
                </Link>
              ))}
              
              {user && (
                <div className="mobile-nav-auth">
                  <Link
                    to="/profile"
                    onClick={() => setIsOpen(false)}
                    className="mobile-nav-link"
                  >
                    My Profile
                  </Link>
                  <Link
                    to="/notifications"
                    onClick={() => setIsOpen(false)}
                    className="mobile-nav-link"
                  >
                    Notifications
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="mobile-nav-link mobile-nav-logout"
                  >
                    Sign Out
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