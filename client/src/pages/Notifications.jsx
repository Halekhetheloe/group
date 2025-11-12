import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy, updateDoc, doc, onSnapshot, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase-config';
import { useAuth } from '../hooks/useAuth';
import { Bell, CheckCircle, XCircle, AlertTriangle, Info, BookOpen, Briefcase, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

const Notifications = () => {
  const { userData } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    if (userData) {
      fetchNotifications();
      setupRealtimeListener();
    }
  }, [userData]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      
      // Try to fetch from Firestore first
      try {
        const notificationsQuery = query(
          collection(db, 'notifications'),
          where('userId', '==', userData.uid),
          orderBy('createdAt', 'desc')
        );
        const notificationsSnapshot = await getDocs(notificationsQuery);
        const notificationsData = notificationsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        if (notificationsData.length > 0) {
          setNotifications(notificationsData);
          return;
        }
      } catch (firestoreError) {
        console.log('No notifications in Firestore, using sample data:', firestoreError);
      }

      // Fallback to sample data if no notifications found
      const sampleNotifications = [
        {
          id: '1',
          userId: userData.uid,
          type: 'application_update',
          message: 'Your job application for Web Developer at Tech Corp has been reviewed',
          read: false,
          actionUrl: '/my-applications',
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
        },
        {
          id: '2',
          userId: userData.uid,
          type: 'course_update',
          message: 'You have been admitted to the Computer Science program',
          read: false,
          actionUrl: '/my-applications',
          createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000) // 1 day ago
        },
        {
          id: '3',
          userId: userData.uid,
          type: 'success',
          message: 'Your profile has been successfully updated',
          read: true,
          createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) // 3 days ago
        }
      ];

      setNotifications(sampleNotifications);
      
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeListener = () => {
    if (!userData) return;

    try {
      const notificationsQuery = query(
        collection(db, 'notifications'),
        where('userId', '==', userData.uid),
        orderBy('createdAt', 'desc')
      );

      const unsubscribe = onSnapshot(notificationsQuery, 
        (snapshot) => {
          const notificationsData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setNotifications(notificationsData);
        },
        (error) => {
          console.log('Realtime listener error, using static data:', error);
        }
      );

      return unsubscribe;
    } catch (error) {
      console.log('Could not setup realtime listener:', error);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      // Update local state first for immediate feedback
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId 
            ? { ...notif, read: true, readAt: new Date() }
            : notif
        )
      );

      // Try to update in Firestore if it's a real notification (not sample)
      if (!notificationId.startsWith('sample-')) {
        await updateDoc(doc(db, 'notifications', notificationId), {
          read: true,
          readAt: new Date()
        });
      }
      
      toast.success('Notification marked as read');
    } catch (error) {
      console.error('Error marking notification as read:', error);
      // Don't show error for sample data
      if (!notificationId.startsWith('sample-')) {
        toast.error('Failed to mark as read');
      }
    }
  };

  const markAllAsRead = async () => {
    try {
      // Update local state
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, read: true, readAt: new Date() }))
      );

      // Update real notifications in Firestore
      const realNotifications = notifications.filter(notification => !notification.id.startsWith('sample-'));
      const unreadRealNotifications = realNotifications.filter(notification => !notification.read);
      
      if (unreadRealNotifications.length > 0) {
        const updatePromises = unreadRealNotifications.map(notification =>
          updateDoc(doc(db, 'notifications', notification.id), {
            read: true,
            readAt: new Date()
          })
        );
        
        await Promise.all(updatePromises);
      }
      
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Error marking all as read:', error);
      toast.error('Failed to mark all as read');
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      // Update local state
      setNotifications(prev => prev.filter(notif => notif.id !== notificationId));

      // Delete from Firestore if it's a real notification
      if (!notificationId.startsWith('sample-')) {
        await deleteDoc(doc(db, 'notifications', notificationId));
      }
      
      toast.success('Notification deleted');
    } catch (error) {
      console.error('Error deleting notification:', error);
      // Don't show error for sample data
      if (!notificationId.startsWith('sample-')) {
        toast.error('Failed to delete notification');
      }
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'application_update':
        return <Briefcase className="h-5 w-5 text-blue-600" />;
      case 'course_update':
        return <BookOpen className="h-5 w-5 text-green-600" />;
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Info className="h-5 w-5 text-gray-600" />;
    }
  };

  const getNotificationBackground = (type, read) => {
    if (read) return 'bg-white';
    
    switch (type) {
      case 'application_update':
        return 'bg-blue-50 border-l-4 border-blue-500';
      case 'course_update':
        return 'bg-green-50 border-l-4 border-green-500';
      case 'success':
        return 'bg-green-50 border-l-4 border-green-500';
      case 'warning':
        return 'bg-yellow-50 border-l-4 border-yellow-500';
      case 'error':
        return 'bg-red-50 border-l-4 border-red-500';
      default:
        return 'bg-gray-50 border-l-4 border-gray-500';
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp instanceof Date ? timestamp : timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else if (diffInHours < 168) {
      return `${Math.floor(diffInHours / 24)}d ago`;
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
      });
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    if (activeTab === 'unread') {
      return !notification.read;
    }
    return true;
  });

  const unreadCount = notifications.filter(notification => !notification.read).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="h-12 bg-gray-200 rounded mb-6"></div>
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-20 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Notifications</h1>
            <p className="text-gray-600">Stay updated with your recent activities and alerts</p>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200"
            >
              Mark all as read
            </button>
          )}
        </div>

        {/* Notifications Content */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('all')}
                className={`flex items-center px-4 py-3 text-sm font-medium border-b-2 ${
                  activeTab === 'all'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                All Notifications
                {notifications.length > 0 && (
                  <span className="ml-2 bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
                    {notifications.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('unread')}
                className={`flex items-center px-4 py-3 text-sm font-medium border-b-2 ${
                  activeTab === 'unread'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Unread
                {unreadCount > 0 && (
                  <span className="ml-2 bg-blue-100 text-blue-600 text-xs px-2 py-1 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </button>
            </nav>
          </div>

          {/* Notifications List */}
          <div className="divide-y divide-gray-200">
            {filteredNotifications.length > 0 ? (
              filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-gray-50 transition-colors duration-200 ${getNotificationBackground(
                    notification.type,
                    notification.read
                  )}`}
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-white rounded-full flex items-center justify-center border">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-800">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatDate(notification.createdAt)}
                      </p>
                      {notification.actionUrl && (
                        <Link
                          to={notification.actionUrl}
                          className="inline-block mt-2 text-xs text-blue-600 hover:text-blue-800 font-medium"
                          onClick={() => markAsRead(notification.id)}
                        >
                          View details →
                        </Link>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      {!notification.read && (
                        <button
                          onClick={() => markAsRead(notification.id)}
                          className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
                          title="Mark as read"
                        >
                          <EyeOff className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={() => deleteNotification(notification.id)}
                        className="text-gray-400 hover:text-red-600 transition-colors duration-200"
                        title="Delete notification"
                      >
                        <XCircle className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <Bell className="mx-auto h-16 w-16 text-gray-300 mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                  {activeTab === 'unread' ? 'No unread notifications' : 'No notifications yet'}
                </h3>
                <p className="text-gray-500 mb-6 max-w-md mx-auto">
                  {activeTab === 'unread' 
                    ? "You're all caught up! No unread notifications."
                    : "When you have notifications about your applications, courses, or account activities, they'll appear here."
                  }
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
            )}
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