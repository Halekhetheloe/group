import React from 'react'
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'
import { NotificationProvider } from './context/NotificationContext'
import { AppProvider } from './context/AppContext'
import ProtectedRoute from './components/auth/ProtectedRoute'
import Layout from './components/shared/Layout/Layout'

// Auth Pages
import Login from './components/auth/Login'
import Register from './components/auth/Register'
import EmailVerification from './components/auth/EmailVerification'
import ForgotPassword from './components/auth/ForgotPassword'
import PendingApproval from './components/auth/PendingApproval'

// Public Pages
import Landing from './pages/Landing'
import Home from './pages/Home'
import Courses from './pages/Courses'
import Jobs from './pages/Jobs'
import Institutions from './pages/Institutions'
import About from './pages/About'
import Contact from './pages/Contact'
import Privacy from './pages/Privacy'
import Terms from './pages/Terms'
import Sitemap from './pages/Sitemap'
import FAQ from './pages/FAQ'
import Notifications from './pages/Notifications'

// Dashboard & Profile Redirects
import DashboardRedirect from './components/shared/DashboardRedirect'
import ProfileRedirect from './components/shared/ProfileRedirect'

// Student Pages
import StudentDashboard from './components/student/StudentDashboard'
import CourseBrowser from './components/student/CourseBrowser'
import ApplicationForm from './components/student/ApplicationForm'
import MyApplications from './components/student/MyApplications'
import AdmissionsResults from './components/student/AdmissionsResults'
import TranscriptUpload from './components/student/TranscriptUpload'
import JobBrowser from './components/student/JobBrowser'
import JobApplications from './components/student/JobApplications'
import StudentProfile from './components/student/StudentProfile'

// Institution Pages
import InstitutionDashboard from './components/institution/InstitutionDashboard'
import FacultyManagement from './components/institution/FacultyManagement'
import CourseManagement from './components/institution/CourseManagement'
import ApplicationReview from './components/institution/ApplicationReview'
import AdmissionsManagement from './components/institution/AdmissionsManagement'
import StudentManagement from './components/institution/StudentManagement'
import InstitutionProfile from './components/institution/InstitutionProfile'

// Company Pages
import CompanyDashboard from './components/company/CompanyDashboard'
import JobPosting from './components/company/JobPosting'
import JobManagement from './components/company/JobManagement'
import ApplicantFilter from './components/company/ApplicantFilter'
import ApplicantView from './components/company/ApplicantView'
import CompanyProfile from './components/company/CompanyProfile'

// Admin Pages
import AdminDashboard from './components/admin/AdminDashboard'
import UserManagement from './components/admin/UserManagement'
import InstitutionManagement from './components/admin/InstitutionManagement'
import CompanyManagement from './components/admin/CompanyManagement'
import Reports from './components/admin/Reports'
import SystemAnalytics from './components/admin/SystemAnalytics'
import AdminCourseManagement from './components/admin/CourseManagement'
import AdminSettings from './components/admin/AdminSettings'
import AdminApplications from './components/admin/AdminApplications'
import AdminProfile from './components/admin/AdminProfile'

// Job Application Component
import JobApplication from './components/student/JobApplication'

// Styles
import './styles/index.css'
import './styles/App.css'

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppProvider>
          <NotificationProvider>
            <div className="App min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
              <Toaster
                position="top-right"
                toastOptions={{
                  duration: 4000,
                  style: {
                    background: '#1e293b',
                    color: '#fff',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                  },
                  success: {
                    duration: 3000,
                    style: {
                      background: '#059669',
                    },
                  },
                  error: {
                    duration: 5000,
                    style: {
                      background: '#dc2626',
                    },
                  },
                }}
              />
              
              <Routes>
                {/* Root Route */}
                <Route path="/" element={<RootRoute />} />
                
                {/* Public Routes */}
                <Route path="/home" element={<Home />} />
                <Route path="/courses" element={<Courses />} />
                <Route path="/jobs" element={<Jobs />} />
                <Route path="/jobs/:jobId/apply" element={<JobApplication />} />
                <Route path="/institutions" element={<Institutions />} />
                <Route path="/about" element={<About />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/sitemap" element={<Sitemap />} />
                <Route path="/faq" element={<FAQ />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/terms" element={<Terms />} />
                <Route
  path="/notifications"
  element={
    <ProtectedRoute allowedRoles={['student', 'institution', 'company', 'admin']}>
      <Layout>
        <Notifications />
      </Layout>
    </ProtectedRoute>
  }
/>

                {/* Auth Routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/verify-email" element={<EmailVerification />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/pending-approval" element={<PendingApprovalRoute />} />

                {/* Main Dashboard Route */}
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute allowedRoles={['student', 'institution', 'company', 'admin']}>
                      <Layout>
                        <DashboardRedirect />
                      </Layout>
                    </ProtectedRoute>
                  }
                />

                {/* Profile Route */}
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute allowedRoles={['student', 'institution', 'company', 'admin']}>
                      <Layout>
                        <ProfileRedirect />
                      </Layout>
                    </ProtectedRoute>
                  }
                />

                {/* Course Application Route */}
                <Route
                  path="/apply/:courseId"
                  element={
                    <ProtectedRoute allowedRoles={['student']}>
                      <Layout>
                        <ApplicationForm />
                      </Layout>
                    </ProtectedRoute>
                  }
                />

                {/* Protected Routes - Student */}
                <Route
                  path="/student/dashboard"
                  element={
                    <ProtectedRoute allowedRoles={['student']}>
                      <Layout>
                        <StudentDashboard />
                      </Layout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/student/courses"
                  element={
                    <ProtectedRoute allowedRoles={['student']}>
                      <Layout>
                        <CourseBrowser />
                      </Layout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/student/apply/:courseId"
                  element={
                    <ProtectedRoute allowedRoles={['student']}>
                      <Layout>
                        <ApplicationForm />
                      </Layout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/student/applications"
                  element={
                    <ProtectedRoute allowedRoles={['student']}>
                      <Layout>
                        <MyApplications />
                      </Layout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/student/admissions"
                  element={
                    <ProtectedRoute allowedRoles={['student']}>
                      <Layout>
                        <AdmissionsResults />
                      </Layout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/student/transcripts"
                  element={
                    <ProtectedRoute allowedRoles={['student']}>
                      <Layout>
                        <TranscriptUpload />
                      </Layout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/student/jobs"
                  element={
                    <ProtectedRoute allowedRoles={['student']}>
                      <Layout>
                        <JobBrowser />
                      </Layout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/student/job-applications"
                  element={
                    <ProtectedRoute allowedRoles={['student']}>
                      <Layout>
                        <JobApplications />
                      </Layout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/student/profile"
                  element={
                    <ProtectedRoute allowedRoles={['student']}>
                      <Layout>
                        <StudentProfile />
                      </Layout>
                    </ProtectedRoute>
                  }
                />

                {/* Protected Routes - Institution */}
                <Route
                  path="/institution/dashboard"
                  element={
                    <ProtectedRoute allowedRoles={['institution']}>
                      <Layout>
                        <InstitutionDashboard />
                      </Layout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/institution/faculties"
                  element={
                    <ProtectedRoute allowedRoles={['institution']}>
                      <Layout>
                        <FacultyManagement />
                      </Layout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/institution/courses"
                  element={
                    <ProtectedRoute allowedRoles={['institution']}>
                      <Layout>
                        <CourseManagement />
                      </Layout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/institution/applications"
                  element={
                    <ProtectedRoute allowedRoles={['institution']}>
                      <Layout>
                        <ApplicationReview />
                      </Layout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/institution/admissions"
                  element={
                    <ProtectedRoute allowedRoles={['institution']}>
                      <Layout>
                        <AdmissionsManagement />
                      </Layout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/institution/students"
                  element={
                    <ProtectedRoute allowedRoles={['institution']}>
                      <Layout>
                        <StudentManagement />
                      </Layout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/institution/profile"
                  element={
                    <ProtectedRoute allowedRoles={['institution']}>
                      <Layout>
                        <InstitutionProfile />
                      </Layout>
                    </ProtectedRoute>
                  }
                />

                {/* Protected Routes - Company */}
                <Route
                  path="/company/dashboard"
                  element={
                    <ProtectedRoute allowedRoles={['company']}>
                      <Layout>
                        <CompanyDashboard />
                      </Layout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/company/post-job"
                  element={
                    <ProtectedRoute allowedRoles={['company']}>
                      <Layout>
                        <JobPosting />
                      </Layout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/company/jobs"
                  element={
                    <ProtectedRoute allowedRoles={['company']}>
                      <Layout>
                        <JobManagement />
                      </Layout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/company/applicants"
                  element={
                    <ProtectedRoute allowedRoles={['company']}>
                      <Layout>
                        <ApplicantFilter />
                      </Layout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/company/applicant/:applicantId"
                  element={
                    <ProtectedRoute allowedRoles={['company']}>
                      <Layout>
                        <ApplicantView />
                      </Layout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/company/profile"
                  element={
                    <ProtectedRoute allowedRoles={['company']}>
                      <Layout>
                        <CompanyProfile />
                      </Layout>
                    </ProtectedRoute>
                  }
                />

                {/* Protected Routes - Admin */}
                <Route
                  path="/admin/dashboard"
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <Layout>
                        <AdminDashboard />
                      </Layout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/applications"
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <Layout>
                        <AdminApplications />
                      </Layout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/settings"
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <Layout>
                        <AdminSettings />
                      </Layout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/users"
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <Layout>
                        <UserManagement />
                      </Layout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/institutions"
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <Layout>
                        <InstitutionManagement />
                      </Layout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/courses"
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <Layout>
                        <AdminCourseManagement />
                      </Layout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/companies"
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <Layout>
                        <CompanyManagement />
                      </Layout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/reports"
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <Layout>
                        <Reports />
                      </Layout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/analytics"
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <Layout>
                        <SystemAnalytics />
                      </Layout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/profile"
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <Layout>
                        <AdminProfile />
                      </Layout>
                    </ProtectedRoute>
                  }
                />

                {/* 404 Route */}
                <Route
                  path="*"
                  element={
                    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
                      <div className="text-center p-8 bg-white rounded-2xl shadow-lg border border-slate-200 max-w-md mx-4">
                        <div className="text-6xl font-bold text-slate-800 mb-4">404</div>
                        <h2 className="text-2xl font-semibold text-slate-700 mb-4">Page Not Found</h2>
                        <p className="text-slate-600 mb-8">
                          The page you're looking for doesn't exist or has been moved.
                        </p>
                        <a
                          href="/#/"
                          className="inline-block bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-3 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 transform hover:-translate-y-1 shadow-lg hover:shadow-xl font-medium"
                        >
                          Return Home
                        </a>
                      </div>
                    </div>
                  }
                />
              </Routes>
            </div>
          </NotificationProvider>
        </AppProvider>
      </AuthProvider>
    </Router>
  )
}

// Root route handler
function RootRoute() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-slate-600 text-lg font-medium">Loading Career Platform...</p>
        </div>
      </div>
    )
  }

  if (user) {
    return <Navigate to="/dashboard" replace />
  }

  return <Landing />
}

// Special route for pending approval that handles missing user data
function PendingApprovalRoute() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-slate-600 text-lg font-medium">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    console.log('🚫 No user in PendingApprovalRoute, redirecting to login')
    return <Navigate to="/login" replace />
  }

  return <PendingApproval />
}

export default App