import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  HelpCircle, 
  ChevronDown, 
  ChevronUp, 
  Search,
  User,
  Building,
  Briefcase,
  GraduationCap,
  FileText,
  Shield,
  Mail
} from 'lucide-react';

const FAQ = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [openCategory, setOpenCategory] = useState('general');
  const [expandedItems, setExpandedItems] = useState({});

  const toggleItem = (category, index) => {
    setExpandedItems(prev => ({
      ...prev,
      [`${category}-${index}`]: !prev[`${category}-${index}`]
    }));
  };

  const faqCategories = [
    {
      id: 'general',
      title: 'General Questions',
      icon: HelpCircle,
      color: 'blue',
      questions: [
        {
          question: "What is Lesotho CareerGuide?",
          answer: "Lesotho CareerGuide is a comprehensive platform connecting Basotho students with educational institutions and career opportunities. We provide a centralized system for course applications, job searches, and career guidance."
        },
        {
          question: "Is the platform free to use?",
          answer: "Yes, the platform is completely free for students. Educational institutions and companies may have partnership agreements, but there are no charges for students to browse courses, apply to institutions, or search for jobs."
        },
        {
          question: "How do I create an account?",
          answer: "Click on 'Get Started' or 'Register' from the homepage. Select your user type (Student, Institution, or Company), fill in the required information, verify your email, and your account will be ready to use."
        },
        {
          question: "What browsers are supported?",
          answer: "We support all modern browsers including Chrome, Firefox, Safari, and Edge. For the best experience, ensure your browser is updated to the latest version."
        }
      ]
    },
    {
      id: 'students',
      title: 'For Students',
      icon: User,
      color: 'green',
      questions: [
        {
          question: "How do I apply for courses?",
          answer: "Browse available courses, click on a course that interests you, and click 'Apply Now'. You'll need to complete the application form and upload required documents like transcripts. You can track your application status from your dashboard."
        },
        {
          question: "Can I apply to multiple institutions?",
          answer: "Yes, you can apply to multiple institutions and courses. However, we recommend focusing on programs that genuinely interest you to maintain application quality."
        },
        {
          question: "What documents do I need to apply?",
          answer: "Typically, you'll need: academic transcripts, identification document, passport photos, and sometimes recommendation letters. Specific requirements vary by institution and program."
        },
        {
          question: "How long does the application process take?",
          answer: "Institutions usually respond within 2-4 weeks. You'll receive notifications about your application status through the platform and can check progress in your dashboard at any time."
        },
        {
          question: "Can I edit my application after submitting?",
          answer: "You can edit your application while it's still 'Draft' status. Once submitted, you'll need to contact the institution directly for any changes."
        }
      ]
    },
    {
      id: 'institutions',
      title: 'For Institutions',
      icon: Building,
      color: 'orange',
      questions: [
        {
          question: "How can my institution join the platform?",
          answer: "Contact our partnership team at institutions@lesothocareerguide.co.ls. We'll guide you through the registration process and help set up your institution profile."
        },
        {
          question: "What features are available for institutions?",
          answer: "Institutions can manage courses, process applications, communicate with applicants, track admissions, and access analytics about their programs' performance."
        },
        {
          question: "Is there a cost for institutions to join?",
          answer: "We offer various partnership plans. Contact our team to discuss options that fit your institution's needs and budget."
        },
        {
          question: "How do we receive applications?",
          answer: "Applications are delivered directly to your institution dashboard. You'll receive notifications for new applications and can manage them through our streamlined interface."
        }
      ]
    },
    {
      id: 'companies',
      title: 'For Companies',
      icon: Briefcase,
      color: 'purple',
      questions: [
        {
          question: "How can companies post job opportunities?",
          answer: "Register as a company account, verify your business, and you'll gain access to the job posting dashboard where you can create and manage job listings."
        },
        {
          question: "What types of jobs can we post?",
          answer: "You can post internships, entry-level positions, experienced roles, and graduate programs. All opportunities should be legitimate and comply with Lesotho labor laws."
        },
        {
          question: "How do we review applications?",
          answer: "Applications are organized in your company dashboard. You can filter by qualifications, review candidate profiles, and communicate directly with applicants through the platform."
        },
        {
          question: "Is there a screening process for candidates?",
          answer: "The platform provides basic candidate information and qualifications. You can set additional screening questions in your job postings to gather specific information from applicants."
        }
      ]
    },
    {
      id: 'technical',
      title: 'Technical Support',
      icon: Shield,
      color: 'red',
      questions: [
        {
          question: "I forgot my password. How can I reset it?",
          answer: "Click 'Forgot Password' on the login page. Enter your email address, and we'll send you a link to reset your password. Check your spam folder if you don't see the email."
        },
        {
          question: "Why can't I upload my documents?",
          answer: "Ensure your files are in supported formats (PDF, JPG, PNG) and under 10MB each. If issues persist, try using a different browser or check your internet connection."
        },
        {
          question: "The platform is loading slowly. What should I do?",
          answer: "Clear your browser cache, ensure you have a stable internet connection, and try refreshing the page. If problems continue, contact our technical support team."
        },
        {
          question: "How do I update my profile information?",
          answer: "Go to your dashboard, click on 'My Profile', and use the edit buttons to update your information. Remember to save your changes."
        }
      ]
    },
    {
      id: 'privacy',
      title: 'Privacy & Security',
      icon: FileText,
      color: 'gray',
      questions: [
        {
          question: "How is my personal data protected?",
          answer: "We use industry-standard encryption, secure servers, and follow data protection best practices. Your information is only shared with institutions you apply to or employers you contact."
        },
        {
          question: "Who can see my application information?",
          answer: "Only the specific institutions you apply to can see your application details. We never sell your data to third parties."
        },
        {
          question: "Can I delete my account?",
          answer: "Yes, you can delete your account from the settings page. Note that this will remove your profile and application history from our system."
        },
        {
          question: "How long is my data stored?",
          answer: "We retain your data for as long as your account is active. After account deletion, we remove personal data within 30 days, though some anonymized data may be kept for analytics."
        }
      ]
    }
  ];

  const filteredCategories = faqCategories.map(category => ({
    ...category,
    questions: category.questions.filter(q => 
      q.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.answer.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(category => category.questions.length > 0);

  const getColorClasses = (color) => {
    const colorMap = {
      blue: 'bg-blue-100 text-blue-600',
      green: 'bg-green-100 text-green-600',
      orange: 'bg-orange-100 text-orange-600',
      purple: 'bg-purple-100 text-purple-600',
      red: 'bg-red-100 text-red-600',
      gray: 'bg-gray-100 text-gray-600'
    };
    return colorMap[color] || 'bg-gray-100 text-gray-600';
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <HelpCircle className="h-12 w-12 text-blue-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Frequently Asked Questions
          </h1>
          <p className="text-xl text-gray-600">
            Find answers to common questions about Lesotho CareerGuide
          </p>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search for questions or topics..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          {searchTerm && (
            <p className="text-sm text-gray-600 mt-2">
              Found {filteredCategories.reduce((acc, cat) => acc + cat.questions.length, 0)} results for "{searchTerm}"
            </p>
          )}
        </div>

        {/* Category Navigation */}
        <div className="flex overflow-x-auto pb-4 mb-8 space-x-2">
          {faqCategories.map((category) => {
            const Icon = category.icon;
            return (
              <button
                key={category.id}
                onClick={() => setOpenCategory(category.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg whitespace-nowrap transition-colors duration-200 ${
                  openCategory === category.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{category.title}</span>
              </button>
            );
          })}
        </div>

        {/* FAQ Content */}
        <div className="space-y-6">
          {filteredCategories
            .filter(category => category.id === openCategory)
            .map((category) => {
              const Icon = category.icon;
              return (
                <div key={category.id} className="bg-white rounded-lg shadow-sm border overflow-hidden">
                  {/* Category Header */}
                  <div className="bg-gray-50 px-6 py-4 border-b">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${getColorClasses(category.color)}`}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-gray-900">{category.title}</h2>
                        <p className="text-gray-600 text-sm">
                          {category.questions.length} questions in this category
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Questions */}
                  <div className="divide-y divide-gray-200">
                    {category.questions.map((item, index) => (
                      <div key={index} className="p-6">
                        <button
                          onClick={() => toggleItem(category.id, index)}
                          className="flex justify-between items-center w-full text-left"
                        >
                          <h3 className="text-lg font-semibold text-gray-900 pr-4">
                            {item.question}
                          </h3>
                          {expandedItems[`${category.id}-${index}`] ? (
                            <ChevronUp className="h-5 w-5 text-gray-400 flex-shrink-0" />
                          ) : (
                            <ChevronDown className="h-5 w-5 text-gray-400 flex-shrink-0" />
                          )}
                        </button>
                        {expandedItems[`${category.id}-${index}`] && (
                          <div className="mt-4 text-gray-600 leading-relaxed">
                            {item.answer}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
        </div>

        {/* Still Need Help Section */}
        <div className="mt-12 bg-blue-50 rounded-lg p-8 text-center">
          <Mail className="h-12 w-12 text-blue-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">Still have questions?</h3>
          <p className="text-gray-600 mb-6">
            Can't find the answer you're looking for? Our support team is here to help.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              to="/contact" 
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors duration-200"
            >
              <Mail className="h-4 w-4 mr-2" />
              Contact Support
            </Link>
            <a 
              href="mailto:support@lesothocareerguide.co.ls"
              className="inline-flex items-center px-6 py-3 bg-white text-blue-600 border border-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-colors duration-200"
            >
              Email Us Directly
            </a>
          </div>
        </div>

        {/* Quick Links */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link 
            to="/privacy" 
            className="bg-white p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow duration-200 text-center"
          >
            <Shield className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <h4 className="font-semibold text-gray-900">Privacy Policy</h4>
            <p className="text-sm text-gray-600">Learn about data protection</p>
          </Link>
          <Link 
            to="/terms" 
            className="bg-white p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow duration-200 text-center"
          >
            <FileText className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <h4 className="font-semibold text-gray-900">Terms of Service</h4>
            <p className="text-sm text-gray-600">Read our platform terms</p>
          </Link>
          <Link 
            to="/sitemap" 
            className="bg-white p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow duration-200 text-center"
          >
            <GraduationCap className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <h4 className="font-semibold text-gray-900">Site Map</h4>
            <p className="text-sm text-gray-600">Explore all pages</p>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default FAQ;