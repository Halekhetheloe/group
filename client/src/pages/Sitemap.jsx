import React from 'react';
import { Link } from 'react-router-dom';

const Sitemap = () => {
  const siteSections = [
    {
      title: 'Main Pages',
      color: 'blue',
      pages: [
        { name: 'Home', path: '/', description: 'Platform overview and landing page' },
        { name: 'About Us', path: '/about', description: 'Learn about our mission and team' },
        { name: 'Contact', path: '/contact', description: 'Get in touch with our support team' },
      ]
    },
    {
      title: 'Student Section',
      color: 'green',
      pages: [
        { name: 'Student Dashboard', path: '/student/dashboard', description: 'Personal dashboard for students', loginRequired: true },
        { name: 'Browse Courses', path: '/courses', description: 'Explore available courses and programs' },
        { name: 'Browse Institutions', path: '/institutions', description: 'Find educational institutions' },
        { name: 'Application Form', path: '/apply/:courseId', description: 'Submit course applications', dynamic: true, loginRequired: true },
        { name: 'My Applications', path: '/student/applications', description: 'Track application status', loginRequired: true },
        { name: 'Admissions Results', path: '/student/admissions', description: 'View admission decisions', loginRequired: true },
        { name: 'Student Profile', path: '/student/profile', description: 'Manage personal information', loginRequired: true },
        { name: 'Transcript Upload', path: '/student/transcripts', description: 'Upload academic transcripts', loginRequired: true },
        { name: 'Job Browser', path: '/student/jobs', description: 'Browse job opportunities', loginRequired: true },
        { name: 'My Job Applications', path: '/student/job-applications', description: 'Track job applications', loginRequired: true },
      ]
    },
    {
      title: 'Career & Jobs',
      color: 'purple',
      pages: [
        { name: 'Job Browser', path: '/jobs', description: 'Browse job opportunities' },
        { name: 'Job Application', path: '/jobs/:jobId/apply', description: 'Apply for jobs', dynamic: true, loginRequired: true },
      ]
    },
    {
      title: 'Institution Portal',
      color: 'orange',
      pages: [
        { name: 'Institution Dashboard', path: '/institution/dashboard', description: 'Institution management portal', loginRequired: true, roleRequired: 'institution' },
        { name: 'Faculty Management', path: '/institution/faculties', description: 'Manage faculties and departments', loginRequired: true, roleRequired: 'institution' },
        { name: 'Course Management', path: '/institution/courses', description: 'Manage courses and programs', loginRequired: true, roleRequired: 'institution' },
        { name: 'Application Review', path: '/institution/applications', description: 'Review student applications', loginRequired: true, roleRequired: 'institution' },
        { name: 'Admissions Management', path: '/institution/admissions', description: 'Process student applications', loginRequired: true, roleRequired: 'institution' },
        { name: 'Student Management', path: '/institution/students', description: 'Manage enrolled students', loginRequired: true, roleRequired: 'institution' },
        { name: 'Institution Profile', path: '/institution/profile', description: 'Manage institution information', loginRequired: true, roleRequired: 'institution' },
      ]
    },
    {
      title: 'Company Portal',
      color: 'indigo',
      pages: [
        { name: 'Company Dashboard', path: '/company/dashboard', description: 'Company management portal', loginRequired: true, roleRequired: 'company' },
        { name: 'Job Posting', path: '/company/post-job', description: 'Create new job postings', loginRequired: true, roleRequired: 'company' },
        { name: 'Job Management', path: '/company/jobs', description: 'Manage job postings', loginRequired: true, roleRequired: 'company' },
        { name: 'Applicant Management', path: '/company/applicants', description: 'Review job applicants', loginRequired: true, roleRequired: 'company' },
        { name: 'Applicant View', path: '/company/applicant/:applicantId', description: 'View applicant details', dynamic: true, loginRequired: true, roleRequired: 'company' },
        { name: 'Company Profile', path: '/company/profile', description: 'Manage company information', loginRequired: true, roleRequired: 'company' },
      ]
    },
    {
      title: 'Admin Portal',
      color: 'red',
      pages: [
        { name: 'Admin Dashboard', path: '/admin/dashboard', description: 'System administration portal', loginRequired: true, roleRequired: 'admin' },
        { name: 'User Management', path: '/admin/users', description: 'Manage platform users', loginRequired: true, roleRequired: 'admin' },
        { name: 'Institution Management', path: '/admin/institutions', description: 'Manage educational institutions', loginRequired: true, roleRequired: 'admin' },
        { name: 'Company Management', path: '/admin/companies', description: 'Manage employer accounts', loginRequired: true, roleRequired: 'admin' },
        { name: 'Course Management', path: '/admin/courses', description: 'Manage platform courses', loginRequired: true, roleRequired: 'admin' },
        { name: 'System Analytics', path: '/admin/analytics', description: 'Platform usage statistics', loginRequired: true, roleRequired: 'admin' },
        { name: 'Reports', path: '/admin/reports', description: 'Generate system reports', loginRequired: true, roleRequired: 'admin' },
        { name: 'Applications', path: '/admin/applications', description: 'Manage all applications', loginRequired: true, roleRequired: 'admin' },
        { name: 'Admin Settings', path: '/admin/settings', description: 'System configuration', loginRequired: true, roleRequired: 'admin' },
        { name: 'Admin Profile', path: '/admin/profile', description: 'Admin profile management', loginRequired: true, roleRequired: 'admin' },
      ]
    },
    {
      title: 'Authentication',
      color: 'gray',
      pages: [
        { name: 'Login', path: '/login', description: 'Sign in to your account' },
        { name: 'Register', path: '/register', description: 'Create a new account' },
        { name: 'Forgot Password', path: '/forgot-password', description: 'Reset your password' },
        { name: 'Email Verification', path: '/verify-email', description: 'Verify your email address' },
        { name: 'Pending Approval', path: '/pending-approval', description: 'Account approval status' },
      ]
    },
    {
      title: 'Legal & Support',
      color: 'yellow',
      pages: [
        { name: 'Privacy Policy', path: '/privacy', description: 'Data protection and privacy information' },
        { name: 'Terms of Service', path: '/terms', description: 'Platform terms and conditions' },
        { name: 'FAQ', path: '/faq', description: 'Frequently asked questions' },
        { name: 'Site Map', path: '/sitemap', description: 'Complete platform navigation' },
      ]
    }
  ];

  const getColorClasses = (color) => {
    const colorMap = {
      blue: 'bg-blue-100 text-blue-600',
      green: 'bg-green-100 text-green-600',
      purple: 'bg-purple-100 text-purple-600',
      orange: 'bg-orange-100 text-orange-600',
      indigo: 'bg-indigo-100 text-indigo-600',
      red: 'bg-red-100 text-red-600',
      gray: 'bg-gray-100 text-gray-600',
      yellow: 'bg-yellow-100 text-yellow-600'
    };
    return colorMap[color] || 'bg-gray-100 text-gray-600';
  };

  const getBadgeColor = (type) => {
    const colorMap = {
      login: 'bg-purple-100 text-purple-800',
      role: 'bg-orange-100 text-orange-800',
      dynamic: 'bg-blue-100 text-blue-800'
    };
    return colorMap[type] || 'bg-gray-100 text-gray-800';
  };

  const routeExists = (path) => {
    const existingRoutes = [
      '/', '/about', '/contact', '/privacy', '/terms', '/sitemap', '/faq',
      '/login', '/register', '/verify-email', '/forgot-password', '/pending-approval',
      '/dashboard', '/profile', '/courses', '/jobs', '/institutions',
      '/apply/:courseId', '/jobs/:jobId/apply',
      // Student routes
      '/student/dashboard', '/student/courses', '/student/applications', 
      '/student/admissions', '/student/transcripts', '/student/jobs',
      '/student/job-applications', '/student/profile',
      // Institution routes
      '/institution/dashboard', '/institution/faculties', '/institution/courses',
      '/institution/applications', '/institution/admissions', '/institution/students',
      '/institution/profile',
      // Company routes
      '/company/dashboard', '/company/post-job', '/company/jobs',
      '/company/applicants', '/company/applicant/:applicantId', '/company/profile',
      // Admin routes
      '/admin/dashboard', '/admin/applications', '/admin/settings', '/admin/users',
      '/admin/institutions', '/admin/courses', '/admin/companies', '/admin/reports',
      '/admin/analytics', '/admin/profile'
    ];
    
    // Check if path matches any existing route pattern
    return existingRoutes.some(route => {
      if (route.includes(':')) {
        // For dynamic routes, check if the base path matches
        const basePath = route.split('/:')[0];
        return path.startsWith(basePath);
      }
      return route === path;
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <div className="h-12 w-12 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-lg">🗺️</span>
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Site Map
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Explore all the pages and features available on Lesotho CareerGuide platform. 
            Find exactly what you're looking for with our comprehensive site navigation.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { count: siteSections.reduce((acc, section) => acc + section.pages.length, 0), label: 'Total Pages' },
            { count: siteSections.find(s => s.title === 'Student Section')?.pages.length || 0, label: 'Student Pages' },
            { count: siteSections.find(s => s.title === 'Institution Portal')?.pages.length || 0, label: 'Institution Pages' },
            { count: siteSections.find(s => s.title === 'Main Pages')?.pages.length + siteSections.find(s => s.title === 'Legal & Support')?.pages.length || 0, label: 'Public Pages' },
          ].map((stat, index) => (
            <div key={index} className="bg-white rounded-lg shadow-sm border p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{stat.count}</div>
              <div className="text-sm text-gray-600">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Access Legend</h3>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center space-x-2">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getBadgeColor('login')}`}>
                Login Required
              </span>
              <span className="text-sm text-gray-600">- Requires user authentication</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getBadgeColor('role')}`}>
                Role Specific
              </span>
              <span className="text-sm text-gray-600">- Requires specific user role</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getBadgeColor('dynamic')}`}>
                Dynamic Route
              </span>
              <span className="text-sm text-gray-600">- URL contains parameters</span>
            </div>
          </div>
        </div>

        {/* Site Sections */}
        <div className="space-y-8">
          {siteSections.map((section, sectionIndex) => (
            <div key={sectionIndex} className="bg-white rounded-lg shadow-sm border overflow-hidden">
              {/* Section Header */}
              <div className="bg-gray-50 px-6 py-4 border-b">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${getColorClasses(section.color)}`}>
                    <span className="text-lg font-bold">📁</span>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{section.title}</h2>
                    <p className="text-gray-600 text-sm">
                      {section.pages.length} pages in this section
                    </p>
                  </div>
                </div>
              </div>

              {/* Pages Grid */}
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {section.pages.map((page, pageIndex) => (
                    <div key={pageIndex} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-gray-900">
                          {page.name}
                        </h3>
                        <div className="flex space-x-1">
                          {page.loginRequired && (
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getBadgeColor('login')}`}>
                              Login
                            </span>
                          )}
                          {page.roleRequired && (
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getBadgeColor('role')}`}>
                              {page.roleRequired}
                            </span>
                          )}
                          {page.dynamic && (
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getBadgeColor('dynamic')}`}>
                              Dynamic
                            </span>
                          )}
                        </div>
                      </div>
                      <p className="text-gray-600 text-sm mb-3">{page.description}</p>
                      <div className="flex justify-between items-center">
                        <code className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                          {page.path}
                        </code>
                        {routeExists(page.path) ? (
                          <Link 
                            to={page.path}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                          >
                            Visit →
                          </Link>
                        ) : (
                          <span className="text-gray-400 text-sm font-medium">Coming Soon</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Help Section */}
        <div className="mt-12 bg-blue-50 rounded-lg p-6">
          <div className="text-center">
            <div className="h-12 w-12 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-white font-bold text-lg">❓</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Need Help Navigating?</h3>
            <p className="text-gray-600 mb-4">
              Can't find what you're looking for? Our support team is here to help.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                to="/contact" 
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors duration-200"
              >
                <span className="mr-2">📧</span>
                Contact Support
              </Link>
              <Link 
                to="/faq" 
                className="inline-flex items-center px-6 py-3 bg-white text-blue-600 border border-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-colors duration-200"
              >
                <span className="mr-2">❓</span>
                View FAQ
              </Link>
            </div>
          </div>
        </div>

        {/* Last Updated */}
        <div className="mt-8 text-center text-gray-500 text-sm">
          <p>Site map last updated: {new Date().toLocaleDateString()}</p>
          <p className="mt-1">Platform Version: 1.0.0</p>
        </div>
      </div>
    </div>
  );
};

export default Sitemap;