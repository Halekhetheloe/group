import React from 'react'
import { Link } from 'react-router-dom'
import { 
  GraduationCap, 
  Building, 
  Briefcase, 
  Users,
  CheckCircle,
  ArrowRight,
  Star,
  Award
} from 'lucide-react'

const Landing = () => {
  const userTypes = [
    {
      icon: Users,
      title: 'Students',
      description: 'Find courses, apply to institutions, and launch your career',
      features: [
        'Browse courses from multiple institutions',
        'Apply online with easy document upload',
        'Track application status in real-time',
        'Get career guidance and job matching',
        'Upload transcripts and certificates'
      ],
      cta: 'Start as Student',
      path: '/register?role=student',
      color: 'blue'
    },
    {
      icon: Building,
      title: 'Institutions',
      description: 'Manage courses, applications, and student admissions',
      features: [
        'Create and manage course offerings',
        'Receive and review student applications',
        'Manage admissions and enrollment',
        'Track student progress and performance',
        'Publish admission results'
      ],
      cta: 'Join as Institution',
      path: '/register?role=institution',
      color: 'green'
    },
    {
      icon: Briefcase,
      title: 'Companies',
      description: 'Find qualified graduates and post job opportunities',
      features: [
        'Post job opportunities with detailed requirements',
        'Receive filtered applicant recommendations',
        'Manage job applications and interviews',
        'Access qualified graduate database',
        'Streamline hiring process'
      ],
      cta: 'Partner with Us',
      path: '/register?role=company',
      color: 'purple'
    }
  ]

  const benefits = [
    {
      icon: CheckCircle,
      title: 'Streamlined Process',
      description: 'Simplified application and admission process for all stakeholders'
    },
    {
      icon: Award,
      title: 'Quality Education',
      description: 'Access to accredited institutions and quality educational programs'
    },
    {
      icon: Star,
      title: 'Career Ready',
      description: 'Seamless transition from education to employment'
    },
    {
      icon: Users,
      title: 'Community Support',
      description: 'Join a growing community of students and professionals'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <Link to="/" className="flex items-center space-x-2">
              <div className="bg-blue-600 text-white p-2 rounded-lg">
                <GraduationCap className="h-6 w-6" />
              </div>
              <div>
                <span className="text-xl font-bold text-gray-900">Lesotho</span>
                <span className="text-xl font-bold text-blue-600">CareerGuide</span>
              </div>
            </Link>
            <div className="flex items-center space-x-4">
              <Link 
                to="/login" 
                className="text-gray-700 hover:text-blue-600 font-medium"
              >
                Sign In
              </Link>
              <Link 
                to="/register" 
                className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Empowering Lesotho's 
            <span className="text-blue-600"> Future</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Connect students with educational opportunities and bridge the gap to meaningful careers through our integrated platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link 
              to="/register" 
              className="bg-blue-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-blue-700 transition-colors flex items-center"
            >
              Join Now
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <Link 
              to="/about" 
              className="border-2 border-blue-600 text-blue-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-blue-600 hover:text-white transition-colors"
            >
              Learn More
            </Link>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Choose Lesotho CareerGuide?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              We're committed to transforming education and employment in Lesotho
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon
              return (
                <div key={index} className="text-center">
                  <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Icon className="h-8 w-8 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    {benefit.title}
                  </h3>
                  <p className="text-gray-600">
                    {benefit.description}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* User Types Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Who Can Join?
            </h2>
            <p className="text-xl text-gray-600">
              Our platform serves multiple stakeholders in the education ecosystem
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {userTypes.map((userType, index) => {
              const Icon = userType.icon
              const colorClasses = {
                blue: 'bg-blue-600 hover:bg-blue-700 border-blue-600',
                green: 'bg-green-600 hover:bg-green-700 border-green-600',
                purple: 'bg-purple-600 hover:bg-purple-700 border-purple-600'
              }

              return (
                <div key={index} className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
                  <div className={`p-6 text-white ${colorClasses[userType.color]}`}>
                    <div className="flex items-center space-x-3 mb-4">
                      <Icon className="h-8 w-8" />
                      <h3 className="text-2xl font-bold">{userType.title}</h3>
                    </div>
                    <p className="text-blue-100">{userType.description}</p>
                  </div>
                  
                  <div className="p-6">
                    <ul className="space-y-3 mb-6">
                      {userType.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-start space-x-3">
                          <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-700">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    
                    <Link 
                      to={userType.path}
                      className={`w-full block text-center ${colorClasses[userType.color]} text-white py-3 px-6 rounded-lg font-semibold transition-colors`}
                    >
                      {userType.cta}
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      

      {/* CTA Section */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Join our platform today and be part of Lesotho's educational transformation. Whether you're a student, institution, or employer, we have a place for you.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              to="/register" 
              className="bg-blue-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-blue-700 transition-colors"
            >
              Create Your Account
            </Link>
            <Link 
              to="/contact" 
              className="border-2 border-blue-600 text-blue-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-blue-600 hover:text-white transition-colors"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <div className="bg-blue-600 text-white p-2 rounded-lg">
                <GraduationCap className="h-6 w-6" />
              </div>
              <div>
                <span className="text-xl font-bold">Lesotho</span>
                <span className="text-xl font-bold text-blue-400">CareerGuide</span>
              </div>
            </div>
            <p className="text-gray-400 mb-6">
              Empowering Basotho youth through education and career opportunities
            </p>
            <div className="flex justify-center space-x-6 text-sm text-gray-400">
              <Link to="/about" className="hover:text-white transition-colors">About</Link>
              <Link to="/contact" className="hover:text-white transition-colors">Contact</Link>
              <Link to="/privacy" className="hover:text-white transition-colors">Privacy</Link>
              <Link to="/terms" className="hover:text-white transition-colors">Terms</Link>
            </div>
            <div className="mt-6 text-xs text-gray-500">
              &copy; {new Date().getFullYear()} Lesotho Career Guidance Platform. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Landing