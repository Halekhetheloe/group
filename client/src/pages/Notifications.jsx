import React from 'react';
import { Link } from 'react-router-dom';

const Notifications = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Notifications</h1>
          <p className="text-gray-600">Stay updated with your recent activities and alerts</p>
        </div>

        {/* Notifications Content */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button className="border-b-2 border-blue-500 text-blue-600 px-4 py-3 text-sm font-medium">
                All Notifications
              </button>
              <button className="border-b-2 border-transparent text-gray-500 hover:text-gray-700 px-4 py-3 text-sm font-medium">
                Unread
              </button>
            </nav>
          </div>

          {/* Notifications List */}
          <div className="p-6">
            <div className="text-center py-12">
              <div className="text-6xl text-gray-300 mb-4">🔔</div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No notifications yet</h3>
              <p className="text-gray-500 mb-6 max-w-md mx-auto">
                When you have notifications about your applications, courses, or account activities, they'll appear here.
              </p>
              
              {/* Quick Actions */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  to="/courses"
                  className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors duration-200"
                >
                  Browse Courses
                </Link>
                <Link
                  to="/jobs"
                  className="inline-flex items-center px-6 py-3 bg-white text-blue-600 border border-blue-600 rounded-lg font-medium hover:bg-blue-50 transition-colors duration-200"
                >
                  Find Jobs
                </Link>
              </div>
            </div>

            {/* Sample notification structure for future use */}
            {/* 
            <div className="space-y-4">
              <div className="flex items-start space-x-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 text-sm">📚</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-800">
                    <strong>New course available:</strong> Introduction to Web Development
                  </p>
                  <p className="text-xs text-gray-500 mt-1">2 hours ago</p>
                </div>
                <button className="flex-shrink-0 text-gray-400 hover:text-gray-600">
                  <span>×</span>
                </button>
              </div>
            </div>
            */}
          </div>
        </div>

        {/* Help Section */}
        <div className="mt-8 bg-blue-50 rounded-lg p-6">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Need help with notifications?</h3>
            <p className="text-gray-600 mb-4">
              If you're not receiving notifications or have questions, our support team can help.
            </p>
            <Link
              to="/contact"
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors duration-200"
            >
              Contact Support
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Notifications;