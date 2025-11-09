import React from 'react'
import { Link } from 'react-router-dom'
import { 
  GraduationCap, 
  Target, 
  Users, 
  Award,
  Heart,
  Shield,
  TrendingUp,
  Globe
} from 'lucide-react'

const About = () => {
  const team = [
    {
      name: 'Development Team',
      role: 'Limkokwing University Students',
      description: 'BSc in Information Technology & Business Information Technology',
      contribution: 'Platform Design & Development'
    }
  ]

  const values = [
    {
      icon: Target,
      title: 'Our Mission',
      description: 'To empower Basotho youth by providing seamless access to quality education and meaningful career opportunities through innovative technology solutions.'
    },
    {
      icon: Globe,
      title: 'Our Vision',
      description: 'To become Lesotho\'s leading platform that bridges the gap between education and employment, creating a thriving ecosystem for students, institutions, and employers.'
    },
    {
      icon: Heart,
      title: 'Our Values',
      description: 'We believe in accessibility, quality, innovation, and community. Every student deserves the opportunity to pursue their dreams and build a successful career.'
    }
  ]

  const features = [
    {
      icon: Users,
      title: 'For Students',
      items: [
        'Discover courses from multiple institutions',
        'Streamlined application process',
        'Real-time application tracking',
        'Career guidance and job matching',
        'Document management system'
      ]
    },
    {
      icon: GraduationCap,
      title: 'For Institutions',
      items: [
        'Course and program management',
        'Digital application processing',
        'Student enrollment management',
        'Admission decision publishing',
        'Performance analytics'
      ]
    },
    {
      icon: TrendingUp,
      title: 'For Companies',
      items: [
        'Access to qualified graduates',
        'Automated applicant filtering',
        'Job posting and management',
        'Interview scheduling',
        'Talent pipeline development'
      ]
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              About Lesotho CareerGuide
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Transforming education and employment in Lesotho through technology, innovation, and community partnership.
            </p>
          </div>
        </div>
      </div>

      {/* Mission, Vision, Values */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {values.map((value, index) => {
              const Icon = value.icon
              return (
                <div key={index} className="text-center">
                  <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Icon className="h-8 w-8 text-blue-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">
                    {value.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {value.description}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* What We Offer */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              What We Offer
            </h2>
            <p className="text-xl text-gray-600">
              Comprehensive solutions for all stakeholders in the education ecosystem
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <div key={index} className="bg-white rounded-lg shadow-sm border p-6">
                  <div className="flex items-center mb-4">
                    <div className="bg-blue-100 p-3 rounded-lg mr-4">
                      <Icon className="h-6 w-6 text-blue-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900">
                      {feature.title}
                    </h3>
                  </div>
                  <ul className="space-y-3">
                    {feature.items.map((item, itemIndex) => (
                      <li key={itemIndex} className="flex items-start">
                        <Award className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-600">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              Our Story
            </h2>
          </div>
          
          <div className="prose prose-lg max-w-none text-gray-600">
            <p className="text-xl leading-relaxed mb-6">
              Lesotho CareerGuide was born from a final year project by Limkokwing University students 
              in the Faculty of Information & Communication Technology. Recognizing the challenges 
              faced by students in navigating higher education opportunities and career pathways in Lesotho, 
              we set out to create a comprehensive solution.
            </p>
            
            <p className="text-xl leading-relaxed mb-6">
              Our platform addresses critical needs in the education sector: simplifying the application 
              process for students, streamlining admissions for institutions, and connecting qualified 
              graduates with employers. By leveraging modern web technologies and user-centered design, 
              we've created an ecosystem that benefits all stakeholders.
            </p>
            
            <p className="text-xl leading-relaxed">
              Today, we're proud to be contributing to Lesotho's educational development and economic 
              growth by making quality education more accessible and career opportunities more visible 
              to the youth of our nation.
            </p>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Our Team
            </h2>
            <p className="text-xl text-gray-600">
              Developed by passionate students committed to making a difference
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-4xl mx-auto">
            {team.map((member, index) => (
              <div key={index} className="bg-white rounded-lg shadow-sm border p-6 text-center">
                <div className="bg-blue-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="h-10 w-10 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {member.name}
                </h3>
                <p className="text-blue-600 font-medium mb-2">
                  {member.role}
                </p>
                <p className="text-sm text-gray-600 mb-3">
                  {member.description}
                </p>
                <p className="text-xs text-gray-500">
                  {member.contribution}
                </p>
              </div>
            ))}
          </div>

          {/* Academic Context */}
          <div className="mt-12 bg-blue-600 rounded-lg p-8 text-center text-white max-w-4xl mx-auto">
            <h3 className="text-2xl font-bold mb-4">
              Academic Context
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
              <div>
                <h4 className="font-semibold mb-2">Course Information</h4>
                <ul className="text-blue-100 space-y-1 text-sm">
                  <li>• B/DIWA2110 Web Application Development</li>
                  <li>• Faculty of Information & Communication Technology</li>
                  <li>• Limkokwing University of Creative Technology</li>
                  <li>• Maseru, Lesotho</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Supervision</h4>
                <ul className="text-blue-100 space-y-1 text-sm">
                  <li>• Mr Thokoana & Mr 'Molaoa</li>
                  <li>• Contact: ext. 117</li>
                  <li>• Email: liteboho.molaoa@limkokwing.ac.ls</li>
                  <li>• Email: tsekiso.thokoana@limkokwing.ac.ls</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Technology Stack */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Technology Stack
            </h2>
            <p className="text-xl text-gray-600">
              Built with modern technologies for performance and scalability
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { name: 'React.js', description: 'Frontend Framework' },
              { name: 'Node.js', description: 'Backend Runtime' },
              { name: 'Firebase', description: 'Database & Auth' },
              { name: 'Tailwind CSS', description: 'Styling Framework' }
            ].map((tech, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-6">
                <div className="text-lg font-semibold text-gray-900 mb-2">
                  {tech.name}
                </div>
                <div className="text-sm text-gray-600">
                  {tech.description}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-blue-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Join Our Mission
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Whether you're a student, institution, or employer, there's a place for you in our growing community.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              to="/register" 
              className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-blue-50 transition-colors"
            >
              Get Started
            </Link>
            <Link 
              to="/contact" 
              className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-white hover:text-blue-600 transition-colors"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

export default About