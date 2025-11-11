import React from 'react'
import { Link } from 'react-router-dom'
import { 
  GraduationCap, 
  Mail, 
  MapPin, 
  Facebook, 
  Twitter, 
  Linkedin,
  Heart,
  Users,
  Phone,
  X
} from 'lucide-react'

const Footer = () => {
  const currentYear = new Date().getFullYear()
  const [showFullTeam, setShowFullTeam] = React.useState(false)

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
      name: 'Thomonyane Neo', 
      email: 'thomonyaneneo@gmail.com',
      role: 'Lead Developer',
      phone: '+266 56956364',
      avatar: 'TN'
    },
    { 
      name: 'Nthethe Sekete', 
      email: 'nthethesekete280@gmail.com',
      role: 'Backend Developer',
      phone: '+266 5794 4278',
      avatar: 'NS'
    },
    { 
      name: 'Mokhothu Halekhetheloe', 
      email: 'mokhothuhalekhetheloe@gmail.com',
      role: 'System Administrator',
      credential: 'ID: 5123456',
      avatar: 'MH'
    }
  ]

  return (
    <>
      {/* Full Screen Development Team Modal */}
      {showFullTeam && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-gray-900 p-6 border-b border-gray-800 flex justify-between items-center">
              <div>
                <h2 className="text-3xl font-bold text-white">Development Team</h2>
                <p className="text-gray-400 mt-2">Meet the team behind Lesotho CareerGuide</p>
              </div>
              <button
                onClick={() => setShowFullTeam(false)}
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
              >
                <X className="h-6 w-6 text-white" />
              </button>
            </div>

            {/* Team Grid */}
            <div className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {developmentTeam.map((member, index) => (
                  <div 
                    key={index}
                    className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl p-8 text-white transform hover:scale-105 transition-all duration-300"
                  >
                    <div className="text-center">
                      {/* Avatar */}
                      <div className="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                        {member.avatar}
                      </div>
                      
                      {/* Name & Role */}
                      <h3 className="text-2xl font-bold mb-2">{member.name}</h3>
                      <p className="text-blue-200 text-lg mb-4">{member.role}</p>
                      
                      {/* Contact Info */}
                      <div className="space-y-2 text-left">
                        <div className="flex items-center space-x-3">
                          <Mail className="h-4 w-4" />
                          <span className="text-sm">{member.email}</span>
                        </div>
                        {member.phone && (
                          <div className="flex items-center space-x-3">
                            <Phone className="h-4 w-4" />
                            <span className="text-sm">{member.phone}</span>
                          </div>
                        )}
                        {member.credential && (
                          <div className="flex items-center space-x-3">
                            <Users className="h-4 w-4" />
                            <span className="text-sm">{member.credential}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Project Info */}
              <div className="mt-12 bg-gray-800 rounded-2xl p-8">
                <h3 className="text-2xl font-bold text-white mb-4">About This Project</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-gray-300">
                  <div>
                    <h4 className="text-lg font-semibold text-blue-400 mb-3">Platform Features</h4>
                    <ul className="space-y-2">
                      <li>• Student Course Applications</li>
                      <li>• Institution Management</li>
                      <li>• Job Postings & Applications</li>
                      <li>• Real-time Notifications</li>
                      <li>• Admin Dashboard</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-blue-400 mb-3">Technologies Used</h4>
                    <ul className="space-y-2">
                      <li>• React.js & Vite</li>
                      <li>• Firebase & Firestore</li>
                      <li>• Tailwind CSS</li>
                      <li>• Node.js Backend</li>
                      <li>• Real-time Database</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Footer - Now stretches to fill space */}
      <footer className="bg-gray-900 text-white mt-auto">
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
            <div className="lg:col-span-1">
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
                  <span className="text-sm text-gray-300">+266 56956364</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Mail className="h-4 w-4 text-blue-400" />
                  <span className="text-sm text-gray-300">
                    thomonyaneneo@gmail.com
                  </span>
                </div>
              </div>

              {/* Development Team - Full Screen Trigger */}
              <div className="mt-6">
                <button
                  onClick={() => setShowFullTeam(true)}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3 px-4 rounded-lg transition-all duration-300 transform hover:scale-105 flex items-center justify-center space-x-2"
                >
                  <Users className="h-5 w-5" />
                  <span className="font-semibold">Meet Our Development Team</span>
                </button>
                <p className="text-xs text-gray-400 text-center mt-2">
                  Click to view full team details
                </p>
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
                <Link to="/faq" className="hover:text-blue-400 transition-colors">
                  FAQ
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
                Developed by Limkokwing students (Nthethe Sekete, Halekhetheloe Mokhothu and Neo Thomonyane) from the Faculty of Information & Communication Technology
              </p>
              <p className="text-xs text-gray-500 mt-1">
                BSc. in Information Technology 
              </p>
              <p className="text-xs text-gray-400 mt-2 font-medium">
                System Credentials Available for Authorized Personnel
              </p>
            </div>

            {/* Security Notice */}
            <div className="mt-3 p-3 bg-gray-800 rounded-lg">
              <p className="text-xs text-gray-400 text-center">
                 <strong>Secure Access:</strong> This platform is protected. Contact development team for authorized access.
                <br />
                <span className="text-yellow-400">Authorized Emails: mokhothuhalekhetheloe@gmail.com | nthethesekete280@gmail.com | thomonyaneneo@gmail.com</span>
              </p>
            </div>
          </div>
        </div>
      </footer>
    </>
  )
}

export default Footer