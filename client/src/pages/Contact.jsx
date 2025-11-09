import React, { useState } from 'react'
import { 
  Mail, 
  Phone, 
  MapPin, 
  Send,
  Clock,
  Building,
  Users
} from 'lucide-react'
import toast from 'react-hot-toast'

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    userType: 'general'
  })
  const [loading, setLoading] = useState(false)

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Simulate form submission
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      toast.success('Message sent successfully! We will get back to you soon.')
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: '',
        userType: 'general'
      })
    } catch (error) {
      toast.error('Failed to send message. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const contactInfo = [
    {
      icon: Mail,
      title: 'Email Us',
      details: 'info@lesothocareerguide.co.ls',
      description: 'Send us an email anytime'
    },
    {
      icon: Phone,
      title: 'Call Us',
      details: '+266 2231 3751',
      description: 'Mon to Fri, 8am to 5pm'
    },
    {
      icon: MapPin,
      title: 'Visit Us',
      details: 'Limkokwing University',
      description: 'Maseru, Lesotho'
    },
    {
      icon: Clock,
      title: 'Office Hours',
      details: 'Monday - Friday',
      description: '8:00 AM - 5:00 PM'
    }
  ]

  const supportChannels = [
    {
      icon: Users,
      title: 'Student Support',
      description: 'Get help with applications, courses, and career guidance',
      contact: 'students@lesothocareerguide.co.ls'
    },
    {
      icon: Building,
      title: 'Institution Support',
      description: 'Assistance for partner institutions and course management',
      contact: 'institutions@lesothocareerguide.co.ls'
    },
    {
      icon: Users,
      title: 'Company Support',
      description: 'Help with job postings and applicant management',
      contact: 'companies@lesothocareerguide.co.ls'
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Contact Us
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Get in touch with our team. We're here to help you with any questions about our platform and services.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contact Information */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Get In Touch
              </h2>
              
              <div className="space-y-6">
                {contactInfo.map((info, index) => {
                  const Icon = info.icon
                  return (
                    <div key={index} className="flex items-start space-x-4">
                      <div className="bg-blue-100 p-3 rounded-lg flex-shrink-0">
                        <Icon className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-1">
                          {info.title}
                        </h3>
                        <p className="text-gray-900 font-medium">
                          {info.details}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          {info.description}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Support Channels */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Specialized Support
                </h3>
                <div className="space-y-4">
                  {supportChannels.map((channel, index) => {
                    const Icon = channel.icon
                    return (
                      <div key={index} className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center space-x-3 mb-2">
                          <Icon className="h-5 w-5 text-blue-600" />
                          <h4 className="font-semibold text-gray-900">
                            {channel.title}
                          </h4>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          {channel.description}
                        </p>
                        <a 
                          href={`mailto:${channel.contact}`}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          {channel.contact}
                        </a>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Send us a Message
              </h2>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Your full name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="your.email@example.com"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Subject *
                    </label>
                    <input
                      type="text"
                      name="subject"
                      value={formData.subject}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="What is this regarding?"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      I am a *
                    </label>
                    <select
                      name="userType"
                      value={formData.userType}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="general">General Inquiry</option>
                      <option value="student">Student/Parent</option>
                      <option value="institution">Educational Institution</option>
                      <option value="company">Employer/Company</option>
                      <option value="partner">Potential Partner</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Message *
                  </label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    required
                    rows="6"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Please describe your inquiry in detail..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 text-white py-4 px-6 rounded-lg font-semibold text-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-5 w-5 mr-2" />
                      Send Message
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* FAQ Section */}
            <div className="mt-8 bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Frequently Asked Questions
              </h3>
              <div className="space-y-4">
                {[
                  {
                    question: "How do I create an account as a student?",
                    answer: "Click on 'Get Started' and select 'Student' as your role. You'll need to provide basic information and verify your email address."
                  },
                  {
                    question: "Can I apply to multiple institutions?",
                    answer: "Yes, you can apply to multiple institutions, but you're limited to 2 courses per institution to ensure quality applications."
                  },
                  {
                    question: "How long does the application process take?",
                    answer: "Institutions typically respond within 2-4 weeks. You can track your application status in real-time through your dashboard."
                  },
                  {
                    question: "Is there a fee to use the platform?",
                    answer: "No, the platform is completely free for students. Institutions and companies may have partnership agreements."
                  }
                ].map((faq, index) => (
                  <div key={index} className="border-b border-gray-200 pb-4 last:border-b-0 last:pb-0">
                    <h4 className="font-semibold text-gray-900 mb-2">
                      {faq.question}
                    </h4>
                    <p className="text-gray-600 text-sm">
                      {faq.answer}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Map Section */}
        <div className="mt-12 bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Visit Our Campus
          </h2>
          <div className="bg-gray-200 rounded-lg h-64 flex items-center justify-center">
            <div className="text-center text-gray-600">
              <MapPin className="h-12 w-12 mx-auto mb-4" />
              <p className="text-lg font-semibold">Limkokwing University</p>
              <p className="text-sm">Maseru, Lesotho</p>
              <p className="text-sm mt-2">Campus map would be displayed here</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Contact