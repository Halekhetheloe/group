import express from 'express';
const router = express.Router();

// Simple middleware for development
const authenticateToken = (req, res, next) => {
  req.user = { 
    userId: 'dev-user-id', 
    email: 'user@example.com', 
    role: 'student' 
  };
  console.log('🔐 Authentication passed - development mode');
  next();
};

// Mock controller functions
const getUserProfile = (req, res) => {
  res.json({
    success: true,
    data: {
      user: req.user,
      profile: {
        firstName: 'John',
        lastName: 'Doe',
        email: req.user.email,
        phone: '+2661234567',
        educationLevel: 'high school'
      }
    }
  });
};

const updateUserProfile = (req, res) => {
  res.json({
    success: true,
    message: 'Profile updated successfully',
    data: {
      user: req.user,
      updates: req.body
    }
  });
};

const getUserStats = (req, res) => {
  res.json({
    success: true,
    data: {
      applications: 0,
      courses: 0,
      jobs: 0,
      notifications: 0
    }
  });
};

const getUserNotifications = (req, res) => {
  res.json({
    success: true,
    data: {
      notifications: [],
      total: 0
    }
  });
};

const markNotificationAsRead = (req, res) => {
  res.json({
    success: true,
    message: 'Notification marked as read'
  });
};

const markAllNotificationsAsRead = (req, res) => {
  res.json({
    success: true,
    message: 'All notifications marked as read'
  });
};

const deleteNotification = (req, res) => {
  res.json({
    success: true,
    message: 'Notification deleted'
  });
};

// All routes require authentication
router.use(authenticateToken);

// User profile routes
router.get('/profile', getUserProfile);
router.put('/profile', updateUserProfile);

// User stats
router.get('/stats', getUserStats);

// Notification routes
router.get('/notifications', getUserNotifications);
router.patch('/notifications/:notificationId/read', markNotificationAsRead);
router.patch('/notifications/read-all', markAllNotificationsAsRead);
router.delete('/notifications/:notificationId', deleteNotification);

// Test endpoint
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'User API is working!',
    user: req.user
  });
});

export default router;