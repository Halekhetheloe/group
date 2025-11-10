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
  Heart,
  Users
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

  const developmentTeam = [
    { 
      name: 'Mokhothu Halekhetheloe', 
      email: 'mokhothuhalekhetheloe@gmail.com',
      role: 'Lead Developer'
    },
    { 
      name: 'Nthethe Sekete', 
      email: 'nthethesekete280@gmail.com',
      role: 'Backend Developer'
    },
    { 
      name: 'Phone Contact', 
      phone: '+266 5794 4278',
      role: 'Support'
    },
    { 
      name: 'Admin Access', 
      credential: 'ID: 5123456',
      role: 'System Admin'
    }
  ]

  return (
    <footer className="bg-gray-900 text-white">
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Brand Section */}
          <div className="lg:col-span-2">
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

          {/* Contact & Development Team */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-blue-400">Contact & Team</h3>
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

            {/* Development Team */}
            <div className="mt-6">
              <h4 className="text-md font-medium mb-2 text-blue-400 flex items-center">
                <Users className="h-4 w-4 mr-2" />
                Development Team
              </h4>
              <div className="space-y-2 text-xs text-gray-300">
                {developmentTeam.map((member, index) => (
                  <div key={index} className="border-l-2 border-blue-400 pl-2">
                    <p className="font-medium">{member.name}</p>
                    <p className="text-gray-400">{member.role}</p>
                    {member.email && (
                      <p className="text-gray-500">{member.email}</p>
                    )}
                    {member.phone && (
                      <p className="text-gray-500">{member.phone}</p>
                    )}
                    {member.credential && (
                      <p className="text-gray-500">{member.credential}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Institution Resources */}
            <div className="mt-4">
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
            <p className="text-xs text-gray-400 mt-2 font-medium">
              System Credentials Available for Authorized Personnel
            </p>
          </div>

          {/* Security Notice */}
          <div className="mt-3 p-3 bg-gray-800 rounded-lg">
            <p className="text-xs text-gray-400 text-center">
              🔒 <strong>Secure Access:</strong> This platform is protected. Contact development team for authorized access.
              <br />
              <span className="text-yellow-400">Authorized Emails: mokhothuhalekhetheloe@gmail.com | nthethesekete280@gmail.com</span>
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer