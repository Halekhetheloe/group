import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, Scale, AlertTriangle, BookOpen, Users, Shield } from 'lucide-react';

const Terms = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <Scale className="h-12 w-12 text-blue-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Terms of Service
          </h1>
          <p className="text-xl text-gray-600">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-8">
          {/* Acceptance of Terms */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Acceptance of Terms</h2>
            <p className="text-gray-700 mb-4">
              By accessing and using Lesotho CareerGuide ("the Platform"), you accept and agree 
              to be bound by the terms and provision of this agreement.
            </p>
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-gray-700">
                <strong>Important:</strong> If you do not agree to abide by these terms, please 
                do not use this Platform or any of our services.
              </p>
            </div>
          </section>

          {/* User Accounts */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
              <Users className="h-6 w-6 mr-2 text-blue-600" />
              2. User Accounts
            </h2>
            
            <div className="space-y-4">
              <div className="border-l-4 border-green-500 pl-4">
                <h3 className="font-semibold text-gray-900">Account Creation</h3>
                <p className="text-gray-700">
                  You must create an account to access most features of the Platform. You agree to 
                  provide accurate, current, and complete information during registration.
                </p>
              </div>

              <div className="border-l-4 border-red-500 pl-4">
                <h3 className="font-semibold text-gray-900">Account Security</h3>
                <p className="text-gray-700">
                  You are responsible for maintaining the confidentiality of your account credentials 
                  and for all activities that occur under your account.
                </p>
              </div>

              <div className="border-l-4 border-yellow-500 pl-4">
                <h3 className="font-semibold text-gray-900">Account Types</h3>
                <p className="text-gray-700">
                  The Platform supports three main user types: Students, Educational Institutions, 
                  and Employers. Each account type has specific privileges and responsibilities.
                </p>
              </div>
            </div>
          </section>

          {/* User Responsibilities */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. User Responsibilities</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {[
                {
                  title: "Students",
                  items: [
                    "Provide accurate academic information",
                    "Submit genuine applications",
                    "Maintain professional conduct",
                    "Respond to institution communications"
                  ]
                },
                {
                  title: "Institutions",
                  items: [
                    "Provide accurate course information",
                    "Process applications fairly",
                    "Maintain admission standards",
                    "Update application status promptly"
                  ]
                },
                {
                  title: "Employers",
                  items: [
                    "Post legitimate job opportunities",
                    "Provide accurate company information",
                    "Process applications fairly",
                    "Maintain professional standards"
                  ]
                },
                {
                  title: "All Users",
                  items: [
                    "Respect other users' privacy",
                    "Do not engage in harassment",
                    "Report suspicious activity",
                    "Follow platform guidelines"
                  ]
                }
              ].map((role, index) => (
                <div key={index} className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-2">{role.title}</h3>
                  <ul className="list-disc list-inside text-gray-700 space-y-1 text-sm">
                    {role.items.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          {/* Prohibited Activities */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
              <AlertTriangle className="h-6 w-6 mr-2 text-red-600" />
              4. Prohibited Activities
            </h2>
            
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <h3 className="font-semibold text-red-800 mb-4">Strictly Forbidden:</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ul className="list-disc list-inside text-red-700 space-y-2">
                  <li>Providing false or misleading information</li>
                  <li>Impersonating other individuals or organizations</li>
                  <li>Uploading malicious software or code</li>
                  <li>Attempting to gain unauthorized access</li>
                </ul>
                <ul className="list-disc list-inside text-red-700 space-y-2">
                  <li>Harassing or threatening other users</li>
                  <li>Sharing inappropriate content</li>
                  <li>Violating intellectual property rights</li>
                  <li>Engaging in fraudulent activities</li>
                </ul>
              </div>
              <div className="mt-4 p-3 bg-red-100 rounded">
                <p className="text-red-800 text-sm">
                  <strong>Consequences:</strong> Violation of these terms may result in account 
                  suspension, permanent banning, and legal action where appropriate.
                </p>
              </div>
            </div>
          </section>

          {/* Intellectual Property */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
              <FileText className="h-6 w-6 mr-2 text-blue-600" />
              5. Intellectual Property
            </h2>
            
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">Platform Content</h3>
                <p className="text-gray-700">
                  All platform design, text, graphics, logos, and software are the property of 
                  Lesotho CareerGuide and are protected by intellectual property laws.
                </p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">User Content</h3>
                <p className="text-gray-700">
                  You retain ownership of content you submit, but grant us license to use, display, 
                  and distribute it for platform operations.
                </p>
              </div>

              <div className="bg-yellow-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">Academic Integrity</h3>
                <p className="text-gray-700">
                  Students must ensure all submitted academic work is their own. Plagiarism or 
                  academic dishonesty may result in application rejection and platform banning.
                </p>
              </div>
            </div>
          </section>

          {/* Privacy and Data */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
              <Shield className="h-6 w-6 mr-2 text-blue-600" />
              6. Privacy and Data Protection
            </h2>
            
            <div className="bg-blue-50 p-6 rounded-lg">
              <p className="text-gray-700 mb-4">
                Your privacy is important to us. Please read our 
                <Link to="/privacy" className="text-blue-600 hover:text-blue-800 font-semibold mx-1">
                  Privacy Policy
                </Link>
                to understand how we collect, use, and protect your information.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Data Usage</h3>
                  <ul className="list-disc list-inside text-gray-700 space-y-1 text-sm">
                    <li>Application processing and matching</li>
                    <li>Platform improvement and analytics</li>
                    <li>Communication and notifications</li>
                    <li>Legal compliance and security</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Data Sharing</h3>
                  <ul className="list-disc list-inside text-gray-700 space-y-1 text-sm">
                    <li>With institutions you apply to</li>
                    <li>With employers for job applications</li>
                    <li>As required by law</li>
                    <li>For platform security</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Limitation of Liability */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Limitation of Liability</h2>
            
            <div className="bg-gray-50 p-6 rounded-lg">
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Platform Services</h3>
                  <p className="text-gray-700">
                    Lesotho CareerGuide acts as a platform connecting students, institutions, and 
                    employers. We are not responsible for:
                  </p>
                  <ul className="list-disc list-inside text-gray-700 mt-2 space-y-1">
                    <li>Admission decisions by institutions</li>
                    <li>Hiring decisions by employers</li>
                    <li>Accuracy of user-submitted information</li>
                    <li>Outcomes of applications or interviews</li>
                  </ul>
                </div>

                <div className="bg-yellow-50 p-4 rounded">
                  <h3 className="font-semibold text-gray-900 mb-2">Important Disclaimer</h3>
                  <p className="text-gray-700 text-sm">
                    While we strive to maintain accurate information and reliable services, 
                    we cannot guarantee admission, employment, or specific outcomes. Users 
                    should verify all information directly with relevant institutions and employers.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Termination */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Termination</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">User Termination</h3>
                <p className="text-gray-700">
                  You may delete your account at any time through account settings. Some information 
                  may be retained for legal or operational purposes.
                </p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">Platform Termination</h3>
                <p className="text-gray-700">
                  We reserve the right to suspend or terminate accounts that violate these terms, 
                  with or without notice, at our sole discretion.
                </p>
              </div>
            </div>
          </section>

          {/* Governing Law */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Governing Law</h2>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-700">
                These Terms shall be governed and construed in accordance with the laws of Lesotho, 
                without regard to its conflict of law provisions.
              </p>
              <p className="text-gray-700 mt-2">
                Any disputes shall be resolved in the courts of Maseru, Lesotho.
              </p>
            </div>
          </section>

          {/* Changes to Terms */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Changes to Terms</h2>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-700">
                We reserve the right to modify these terms at any time. We will notify users of 
                significant changes through platform notifications or email.
              </p>
              <p className="text-gray-700 mt-2">
                Continued use of the Platform after changes constitutes acceptance of the modified terms.
              </p>
            </div>
          </section>

          {/* Contact Information */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Contact Information</h2>
            <div className="bg-blue-50 p-6 rounded-lg">
              <p className="text-gray-700 mb-4">
                For questions about these Terms of Service, please contact us:
              </p>
              <div className="space-y-2 text-gray-700">
                <p><strong>Email:</strong> info@lesothocareerguide.co.ls</p>
                <p><strong>Phone:</strong> +266 2231 3751</p>
                <p><strong>Address:</strong> Limkokwing University, Maseru, Lesotho</p>
                <p><strong>Development Team:</strong> mokhothuhalekhetheloe@gmail.com</p>
              </div>
            </div>
          </section>

          {/* Footer Links */}
          <div className="mt-8 pt-6 border-t border-gray-200 text-center">
            <div className="flex flex-col sm:flex-row justify-center space-y-2 sm:space-y-0 sm:space-x-6">
              <Link to="/privacy" className="text-blue-600 hover:text-blue-800 font-semibold">
                Privacy Policy
              </Link>
              <Link to="/contact" className="text-blue-600 hover:text-blue-800 font-semibold">
                Contact Support
              </Link>
              <Link to="/" className="text-blue-600 hover:text-blue-800 font-semibold">
                Return to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Terms;