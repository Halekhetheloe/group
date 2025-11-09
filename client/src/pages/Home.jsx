import React from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { 
  GraduationCap, 
  Briefcase, 
  Building, 
  Users, 
  ArrowRight,
  CheckCircle,
  Star,
  TrendingUp
} from 'lucide-react'

const Home = () => {
  const { user, userData } = useAuth()

  const features = [
    {
      icon: GraduationCap,
      title: 'Find Your Course',
      description: 'Discover courses from top institutions in Lesotho that match your interests and career goals.',
      color: 'blue'
    },
    {
      icon: Building,
      title: 'Apply to Institutions',
      description: 'Seamlessly apply to multiple institutions with our streamlined application process.',
      color: 'green'
    },
    {
      icon: Briefcase,
      title: 'Career Opportunities',
      description: 'Connect with employers and find job opportunities that match your qualifications.',
      color: 'purple'
    },
    {
      icon: Users,
      title: 'Guidance & Support',
      description: 'Get expert career guidance and support throughout your educational journey.',
      color: 'orange'
    }
  ]

  const stats = [
    { number: '50+', label: 'Partner Institutions' },
    { number: '500+', label: 'Courses Available' },
    { number: '10,000+', label: 'Students Helped' },
    { number: '200+', label: 'Partner Companies' }
  ]

  const steps = [
    {
      step: 1,
      title: 'Create Your Profile',
      description: 'Sign up and complete your student profile with your academic information.'
    },
    {
      step: 2,
      title: 'Browse Courses',
      description: 'Explore courses from institutions across Lesotho and find your perfect match.'
    },
    {
      step: 3,
      title: 'Apply Online',
      description: 'Submit applications to up to 2 courses per institution with required documents.'
    },
    {
      step: 4,
      title: 'Track Progress',
      description: 'Monitor your application status and receive admission decisions.'
    },
    {
      step: 5,
      title: 'Career Placement',
      description: 'After graduation, connect with employers for job opportunities.'
    }
  ]

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 to-blue-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Your Future Starts in 
              <span className="text-yellow-300"> Lesotho</span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100 max-w-3xl mx-auto">
              Discover higher education opportunities and launch your career with Lesotho's premier career guidance platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              {!user ? (
                <>
                  <Link 
                    to="/register" 
                    className="bg-yellow-400 text-blue-900 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-yellow-300 transition-colors flex items-center"
                  >
                    Get Started Free
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                  <Link 
                    to="/courses" 
                    className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-white hover:text-blue-900 transition-colors"
                  >
                    Browse Courses
                  </Link>
                </>
              ) : (
                <Link 
                  to={userData?.role === 'student' ? '/student/dashboard' : 
                      userData?.role === 'institution' ? '/institution/dashboard' :
                      userData?.role === 'company' ? '/company/dashboard' : '/admin/dashboard'}
                  className="bg-yellow-400 text-blue-900 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-yellow-300 transition-colors flex items-center"
                >
                  Go to Dashboard
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-blue-600 mb-2">
                  {stat.number}
                </div>
                <div className="text-gray-600 font-medium">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Everything You Need for Your Educational Journey
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              From course discovery to career placement, we provide comprehensive support for students in Lesotho.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon
              const colorClasses = {
                blue: 'bg-blue-100 text-blue-600',
                green: 'bg-green-100 text-green-600',
                purple: 'bg-purple-100 text-purple-600',
                orange: 'bg-orange-100 text-orange-600'
              }

              return (
                <div key={index} className="bg-white rounded-lg p-6 shadow-lg hover:shadow-xl transition-shadow">
                  <div className={`w-12 h-12 rounded-lg ${colorClasses[feature.color]} flex items-center justify-center mb-4`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600">
                    {feature.description}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Simple steps to unlock your educational and career potential
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            {steps.map((step, index) => (
              <div key={step.step} className="flex items-start space-x-6 mb-12 last:mb-0">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
                    {step.step}
                  </div>
                  {index < steps.length - 1 && (
                    <div className="h-16 w-0.5 bg-blue-200 mx-auto mt-2"></div>
                  )}
                </div>
                <div className="flex-1 pt-2">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {step.title}
                  </h3>
                  <p className="text-gray-600 text-lg">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-blue-600 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Start Your Journey?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of students who have found their path through our platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {!user ? (
              <>
                <Link 
                  to="/register" 
                  className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-blue-50 transition-colors"
                >
                  Create Account
                </Link>
                <Link 
                  to="/about" 
                  className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-white hover:text-blue-600 transition-colors"
                >
                  Learn More
                </Link>
              </>
            ) : (
              <Link 
                to="/courses" 
                className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-blue-50 transition-colors"
              >
                Browse Available Courses
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Success Stories
            </h2>
            <p className="text-xl text-gray-600">
              Hear from students who found their path through our platform
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: 'Thato Mokoena',
                role: 'BSc IT Graduate',
                testimonial: 'This platform helped me get into Limkokwing University and land my first job as a software developer.',
                rating: 5
              },
              {
                name: 'Matseliso Mphuthing',
                role: 'Business Student',
                testimonial: 'The application process was so smooth. I got accepted to my dream course within two weeks!',
                rating: 5
              },
              {
                name: 'Teboho Moloi',
                role: 'Recent Graduate',
                testimonial: 'The career guidance and job matching helped me transition from student to professional seamlessly.',
                rating: 5
              }
            ].map((testimonial, index) => (
              <div key={index} className="bg-white p-6 rounded-lg shadow-lg">
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-600 mb-4 italic">
                  "{testimonial.testimonial}"
                </p>
                <div>
                  <div className="font-semibold text-gray-900">
                    {testimonial.name}
                  </div>
                  <div className="text-gray-500 text-sm">
                    {testimonial.role}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

export default Home