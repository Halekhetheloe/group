import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Lock, Eye, UserCheck, Database, Mail } from 'lucide-react';

const Privacy = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <Shield className="h-12 w-12 text-blue-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Privacy Policy
          </h1>
          <p className="text-xl text-gray-600">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-8">
          {/* Introduction */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Introduction</h2>
            <p className="text-gray-700 mb-4">
              Welcome to Lesotho CareerGuide ("we," "our," or "us"). We are committed to protecting 
              your personal information and your right to privacy. This Privacy Policy explains how 
              we collect, use, disclose, and safeguard your information when you use our platform.
            </p>
            <p className="text-gray-700">
              By using Lesotho CareerGuide, you agree to the collection and use of information in 
              accordance with this policy.
            </p>
          </section>

          {/* Information We Collect */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
              <Database className="h-6 w-6 mr-2 text-blue-600" />
              2. Information We Collect
            </h2>
            
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">Personal Information</h3>
                <ul className="list-disc list-inside text-gray-700 space-y-1">
                  <li>Full name and contact information</li>
                  <li>Email address and phone number</li>
                  <li>Academic records and transcripts</li>
                  <li>Educational background and qualifications</li>
                  <li>Career preferences and interests</li>
                </ul>
              </div>

              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">Automatically Collected Information</h3>
                <ul className="list-disc list-inside text-gray-700 space-y-1">
                  <li>IP address and browser type</li>
                  <li>Device information and operating system</li>
                  <li>Usage patterns and platform interactions</li>
                  <li>Cookies and similar tracking technologies</li>
                </ul>
              </div>

              <div className="bg-purple-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">Institution/Company Information</h3>
                <ul className="list-disc list-inside text-gray-700 space-y-1">
                  <li>Organization details and contact information</li>
                  <li>Course and program information</li>
                  <li>Job postings and requirements</li>
                  <li>Admission and recruitment data</li>
                </ul>
              </div>
            </div>
          </section>

          {/* How We Use Your Information */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
              <UserCheck className="h-6 w-6 mr-2 text-blue-600" />
              3. How We Use Your Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                {
                  title: "Platform Functionality",
                  items: ["User authentication and account management", "Course and job applications", "Communication between users and institutions"]
                },
                {
                  title: "Service Improvement",
                  items: ["Platform optimization and feature development", "Personalized recommendations", "Analytics and performance monitoring"]
                },
                {
                  title: "Communication",
                  items: ["Application status updates", "Important platform announcements", "Support and customer service"]
                },
                {
                  title: "Legal Compliance",
                  items: ["Meeting legal obligations", "Fraud prevention and security", "Dispute resolution"]
                }
              ].map((use, index) => (
                <div key={index} className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-2">{use.title}</h3>
                  <ul className="list-disc list-inside text-gray-700 space-y-1 text-sm">
                    {use.items.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          {/* Data Sharing and Disclosure */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
              <Eye className="h-6 w-6 mr-2 text-blue-600" />
              4. Data Sharing and Disclosure
            </h2>
            
            <div className="space-y-4">
              <div className="border-l-4 border-blue-500 pl-4">
                <h3 className="font-semibold text-gray-900">With Educational Institutions</h3>
                <p className="text-gray-700">
                  We share your application information with institutions you apply to, including 
                  academic records, personal details, and application materials.
                </p>
              </div>

              <div className="border-l-4 border-green-500 pl-4">
                <h3 className="font-semibold text-gray-900">With Employers</h3>
                <p className="text-gray-700">
                  Job application data is shared with companies you apply to, including your resume, 
                  qualifications, and contact information.
                </p>
              </div>

              <div className="border-l-4 border-red-500 pl-4">
                <h3 className="font-semibold text-gray-900">Legal Requirements</h3>
                <p className="text-gray-700">
                  We may disclose information when required by law, to protect our rights, or to 
                  ensure the safety of our users.
                </p>
              </div>

              <div className="bg-yellow-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">Important Note</h3>
                <p className="text-gray-700">
                  We do not sell your personal information to third parties. Data sharing is limited 
                  to purposes directly related to our educational and career guidance services.
                </p>
              </div>
            </div>
          </section>

          {/* Data Security */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
              <Lock className="h-6 w-6 mr-2 text-blue-600" />
              5. Data Security
            </h2>
            <div className="bg-gray-50 p-6 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Security Measures</h3>
                  <ul className="space-y-2 text-gray-700">
                    <li>✅ SSL encryption for all data transmissions</li>
                    <li>✅ Secure Firebase infrastructure</li>
                    <li>✅ Regular security audits and updates</li>
                    <li>✅ Access controls and authentication</li>
                    <li>✅ Data backup and disaster recovery</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Your Responsibilities</h3>
                  <ul className="space-y-2 text-gray-700">
                    <li>🔒 Keep your login credentials secure</li>
                    <li>🔒 Use strong, unique passwords</li>
                    <li>🔒 Log out after each session</li>
                    <li>🔒 Report suspicious activity immediately</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Your Rights */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Your Rights</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { right: "Access", description: "View your personal data" },
                { right: "Correction", description: "Update inaccurate information" },
                { right: "Deletion", description: "Request data removal" },
                { right: "Export", description: "Download your data" },
                { right: "Objection", description: "Opt-out of certain processing" },
                { right: "Restriction", description: "Limit how we use your data" }
              ].map((item, index) => (
                <div key={index} className="bg-white border border-gray-200 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900">{item.right}</h3>
                  <p className="text-gray-600 text-sm">{item.description}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Contact Information */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
              <Mail className="h-6 w-6 mr-2 text-blue-600" />
              7. Contact Us
            </h2>
            <div className="bg-blue-50 p-6 rounded-lg">
              <p className="text-gray-700 mb-4">
                If you have any questions about this Privacy Policy or our data practices, 
                please contact us:
              </p>
              <div className="space-y-2">
                <p><strong>Email:</strong> mokhothuhalekhetheloe@gmail.com</p>
                <p><strong>Phone:</strong> +266 57944278</p>
                <p><strong>Address:</strong> Limkokwing University, Maseru, Lesotho</p>
              </div>
            </div>
          </section>

          {/* Policy Updates */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Policy Updates</h2>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-700">
                We may update this Privacy Policy from time to time. We will notify you of any 
                changes by posting the new Privacy Policy on this page and updating the 
                "Last updated" date.
              </p>
              <p className="text-gray-700 mt-2">
                You are advised to review this Privacy Policy periodically for any changes. 
                Changes to this Privacy Policy are effective when they are posted on this page.
              </p>
            </div>
          </section>

          {/* Footer Links */}
          <div className="mt-8 pt-6 border-t border-gray-200 text-center">
            <p className="text-gray-600">
              Need help? <Link to="/contact" className="text-blue-600 hover:text-blue-800 font-semibold">Contact our support team</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Privacy;