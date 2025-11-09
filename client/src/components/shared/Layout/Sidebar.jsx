import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { 
  LayoutDashboard, 
  GraduationCap, 
  Briefcase, 
  Users, 
  Building, 
  FileText, 
  BarChart3,
  Settings,
  User,
  BookOpen,
  ClipboardList,
  Upload
} from 'lucide-react'

const Sidebar = ({ userRole }) => {
  const location = useLocation()

  const isActive = (path) => location.pathname === path

  const getMenuItems = () => {
    switch (userRole) {
      case 'student':
        return [
          {
            title: 'Dashboard',
            path: '/student/dashboard',
            icon: LayoutDashboard
          },
          {
            title: 'Browse Courses',
            path: '/courses',
            icon: GraduationCap
          },
          {
            title: 'Browse Jobs',
            path: '/jobs',
            icon: Briefcase
          },
          {
            title: 'My Applications',
            path: '/student/applications',
            icon: ClipboardList,
            subItems: [
              { title: 'Course Applications', path: '/student/applications/courses' },
              { title: 'Job Applications', path: '/student/applications/jobs' }
            ]
          },
          {
            title: 'Admissions Results',
            path: '/student/admissions',
            icon: FileText
          },
          {
            title: 'My Transcripts',
            path: '/student/transcripts',
            icon: Upload
          },
          {
            title: 'Profile',
            path: '/student/profile',
            icon: User
          }
        ]

      case 'institution':
        return [
          {
            title: 'Dashboard',
            path: '/institution/dashboard',
            icon: LayoutDashboard
          },
          {
            title: 'Faculty Management',
            path: '/institution/faculties',
            icon: Building
          },
          {
            title: 'Course Management',
            path: '/institution/courses',
            icon: BookOpen
          },
          {
            title: 'Applications',
            path: '/institution/applications',
            icon: ClipboardList
          },
          {
            title: 'Admissions',
            path: '/institution/admissions',
            icon: FileText
          },
          {
            title: 'Student Management',
            path: '/institution/students',
            icon: Users
          },
          {
            title: 'Reports',
            path: '/institution/reports',
            icon: BarChart3
          },
          {
            title: 'Profile',
            path: '/institution/profile',
            icon: Settings
          }
        ]

      case 'company':
        return [
          {
            title: 'Dashboard',
            path: '/company/dashboard',
            icon: LayoutDashboard
          },
          {
            title: 'Post Job',
            path: '/company/jobs/post',
            icon: Briefcase
          },
          {
            title: 'Manage Jobs',
            path: '/company/jobs',
            icon: BookOpen
          },
          {
            title: 'Applicants',
            path: '/company/applicants',
            icon: Users
          },
          {
            title: 'Reports',
            path: '/company/reports',
            icon: BarChart3
          },
          {
            title: 'Profile',
            path: '/company/profile',
            icon: Settings
          }
        ]

      case 'admin':
        return [
          {
            title: 'Dashboard',
            path: '/admin/dashboard',
            icon: LayoutDashboard
          },
          {
            title: 'User Management',
            path: '/admin/users',
            icon: Users
          },
          {
            title: 'Institutions',
            path: '/admin/institutions',
            icon: Building
          },
          {
            title: 'Companies',
            path: '/admin/companies',
            icon: Briefcase
          },
          {
            title: 'Courses',
            path: '/admin/courses',
            icon: GraduationCap
          },
          {
            title: 'Applications',
            path: '/admin/applications',
            icon: ClipboardList
          },
          {
            title: 'Reports & Analytics',
            path: '/admin/reports',
            icon: BarChart3
          },
          {
            title: 'System Settings',
            path: '/admin/settings',
            icon: Settings
          }
        ]

      default:
        return []
    }
  }

  const menuItems = getMenuItems()

  return (
    <div className="bg-white h-full shadow-lg border-r border-gray-200 w-64">
      <div className="flex flex-col h-full">
        {/* Sidebar Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-600 text-white p-2 rounded-lg">
              <LayoutDashboard className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 capitalize">
                {userRole} Panel
              </h2>
              <p className="text-sm text-gray-500">Navigation Menu</p>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon
            return (
              <div key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center space-x-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors duration-200 group ${
                    isActive(item.path)
                      ? 'bg-blue-50 text-blue-600 border-r-2 border-blue-600'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-blue-600'
                  }`}
                >
                  <Icon className={`h-5 w-5 ${
                    isActive(item.path) ? 'text-blue-600' : 'text-gray-400 group-hover:text-blue-600'
                  }`} />
                  <span>{item.title}</span>
                </Link>

                {/* Sub-items */}
                {item.subItems && (
                  <div className="ml-8 mt-1 space-y-1">
                    {item.subItems.map((subItem) => (
                      <Link
                        key={subItem.path}
                        to={subItem.path}
                        className={`flex items-center space-x-2 px-3 py-2 rounded text-xs font-medium transition-colors duration-200 ${
                          isActive(subItem.path)
                            ? 'text-blue-600 bg-blue-25'
                            : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
                        }`}
                      >
                        <span>•</span>
                        <span>{subItem.title}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-gray-200">
          <div className="bg-blue-50 rounded-lg p-3">
            <p className="text-xs text-blue-800 text-center">
              Lesotho Career Guidance Platform
            </p>
            <p className="text-xs text-blue-600 text-center mt-1">
              Limkokwing University
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Sidebar