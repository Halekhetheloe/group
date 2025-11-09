import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import StudentDashboard from '../student/StudentDashboard';
import InstitutionDashboard from '../institution/InstitutionDashboard';
import CompanyDashboard from '../company/CompanyDashboard';
import AdminDashboard from '../admin/AdminDashboard';

const DashboardRedirect = () => {
  const { user, userData, loading } = useAuth();
  const navigate = useNavigate();
  const [debugInfo, setDebugInfo] = useState('');
  
  useEffect(() => {
    console.log('🔍 DashboardRedirect Debug:');
    console.log(' - User:', user);
    console.log(' - UserData:', userData);
    console.log(' - Loading:', loading);
    
    setDebugInfo(`User: ${user?.email}, Role: ${userData?.role || 'undefined'}, Loading: ${loading}`);
  }, [user, userData, loading]);

  // Show loading while auth is initializing
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If no user, redirect to login
  if (!user) {
    console.log('❌ No user found, redirecting to login');
    navigate('/login');
    return null;
  }

  // If user exists but no userData, show loading
  if (!userData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading user profile...</p>
          <p className="text-sm text-gray-500 mt-2">User: {user.email}</p>
        </div>
      </div>
    );
  }

  // Check if role is missing
  if (!userData.role) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md p-6">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Profile Setup Required</h1>
          <p className="text-gray-600 mb-4">
            Your account doesn't have a role assigned. Please complete your profile setup.
          </p>
          <p className="text-sm text-gray-500 mb-4">
            Debug: {debugInfo}
          </p>
          <button
            onClick={() => navigate('/profile-setup')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Complete Profile
          </button>
        </div>
      </div>
    );
  }

  console.log('🎯 Rendering dashboard for role:', userData.role);

  // Redirect based on user role
  switch (userData.role) {
    case 'student':
      return <StudentDashboard />;
    case 'institution':
      return <InstitutionDashboard />;
    case 'company':
      return <CompanyDashboard />;
    case 'admin':
      return <AdminDashboard />;
    default:
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Unknown Role</h1>
            <p className="text-gray-600">Role "{userData.role}" is not recognized.</p>
            <p className="text-sm text-gray-500 mt-2">Debug: {debugInfo}</p>
          </div>
        </div>
      );
  }
};

export default DashboardRedirect;