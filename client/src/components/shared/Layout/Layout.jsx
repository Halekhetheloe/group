import React from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../../../hooks/useAuth'
import Navbar from './Navbar'
import Sidebar from './Sidebar'
import Footer from './Footer'

const Layout = ({ children }) => {
  const { userData } = useAuth()
  const location = useLocation()

  // Check if current route is auth page
  const isAuthPage = ['/login', '/register', '/forgot-password', '/verify-email'].includes(location.pathname)
  
  // Check if current route is dashboard
  const isDashboard = location.pathname.includes('/dashboard') || 
                     location.pathname.includes('/student/') ||
                     location.pathname.includes('/institution/') ||
                     location.pathname.includes('/company/') ||
                     location.pathname.includes('/admin/')

  if (isAuthPage) {
    return (
      <div className="min-h-screen bg-gray-50">
        {children}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      
      <div className="flex-1 flex">
        {/* Sidebar - Only show for authenticated users in dashboard sections */}
        {userData && isDashboard && (
          <div className="hidden lg:block">
            <Sidebar userRole={userData.role} />
          </div>
        )}
        
        {/* Main Content */}
        <main className={`flex-1 ${userData && isDashboard ? 'lg:ml-0' : ''}`}>
          <div className={`${userData && isDashboard ? 'p-6' : ''}`}>
            {children}
          </div>
        </main>
      </div>
      
      <Footer />
    </div>
  )
}

export default Layout