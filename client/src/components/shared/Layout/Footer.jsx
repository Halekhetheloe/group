import React from 'react'
import { Link } from 'react-router-dom'
import { 
  GraduationCap, 
  Mail, 
  Phone, 
  MapPin, 
  Facebook, 
  Twitter, 
  Linkedin,
  Heart
} from 'lucide-react'

const Footer = () => {
  const currentYear = new Date().getFullYear()

  const quickLinks = [
    { name: 'Browse Courses', path: '/courses' },
    { name: 'Find Institutions', path: '/institutions' },
    { name: 'Job Opportunities', path: '/jobs' },
    { name: 'About Us', path: '/about' },
    { name: 'Contact', path: '/contact' }
  ]

  const studentResources = [
    { name: 'Application Guide', path: '/guide/application' },
    { name: 'Career Counseling', path: '/career-counseling' },
    { name: 'Scholarships', path: '/scholarships' },
    { name: 'FAQ', path: '/faq' }
  ]

  const institutionResources = [
    { name: 'Partner with Us', path: '/institution/partner' },
    { name: 'Admission Guidelines', path: '/institution/guidelines' },
    { name: 'System Documentation', path: '/docs' }
  ]

  return (
    <footer className="bg-gray-900 text-white">
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="lg:col-span-1">
            <Link to="/" className="flex items-center space-x-2 mb-4">
              <div className="bg-blue-600 text-white p-2 rounded-lg">
                <GraduationCap className="h-6 w-6" />
              </div>
              <div>
                <span className="text-xl font-bold">Lesotho</span>
                <span className="text-xl font-bold text-blue-400">CareerGuide</span>
              </div>
            </Link>
            <p className="text-gray-300 mb-4 text-sm">
              Empowering Basotho youth with seamless access to higher education 
              and career opportunities through our integrated platform.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-blue-400 transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-blue-400 transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-blue-400 transition-colors">
                <Linkedin className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-blue-400">Quick Links</h3>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.path}>
                  <Link 
                    to={link.path}
                    className="text-gray-300 hover:text-blue-400 transition-colors text-sm"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Student Resources */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-blue-400">Student Resources</h3>
            <ul className="space-y-2">
              {studentResources.map((resource) => (
                <li key={resource.path}>
                  <Link 
                    to={resource.path}
                    className="text-gray-300 hover:text-blue-400 transition-colors text-sm"
                  >
                    {resource.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Information */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-blue-400">Contact Info</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <MapPin className="h-4 w-4 text-blue-400" />
                <span className="text-sm text-gray-300">
                  Limkokwing University<br />
                  Maseru, Lesotho
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="h-4 w-4 text-blue-400" />
                <span className="text-sm text-gray-300">+266 2231 3751</span>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="h-4 w-4 text-blue-400" />
                <span className="text-sm text-gray-300">
                  info@lesothocareerguide.co.ls
                </span>
              </div>
            </div>

            {/* Institution Resources */}
            <div className="mt-6">
              <h4 className="text-md font-medium mb-2 text-blue-400">For Institutions</h4>
              <ul className="space-y-1">
                {institutionResources.map((resource) => (
                  <li key={resource.path}>
                    <Link 
                      to={resource.path}
                      className="text-gray-300 hover:text-blue-400 transition-colors text-xs"
                    >
                      {resource.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Footer */}
      <div className="border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="flex items-center space-x-2 text-sm text-gray-400">
              <span>&copy; {currentYear} Lesotho Career Guidance Platform</span>
              <span>•</span>
              <span>All rights reserved</span>
            </div>
            
            <div className="flex items-center space-x-6 text-sm text-gray-400">
              <Link to="/privacy" className="hover:text-blue-400 transition-colors">
                Privacy Policy
              </Link>
              <Link to="/terms" className="hover:text-blue-400 transition-colors">
                Terms of Service
              </Link>
              <Link to="/sitemap" className="hover:text-blue-400 transition-colors">
                Sitemap
              </Link>
            </div>

            <div className="flex items-center space-x-1 text-sm text-gray-400">
              <span>Made with</span>
              <Heart className="h-4 w-4 text-red-400" />
              <span>for Lesotho</span>
            </div>
          </div>

          {/* Academic Credit */}
          <div className="mt-4 text-center md:text-left">
            <p className="text-xs text-gray-500">
              Developed for Limkokwing University - Faculty of Information & Communication Technology
            </p>
            <p className="text-xs text-gray-500 mt-1">
              BSc. in Information Technology | BSc. in Business Information Technology | Diploma in IT
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer