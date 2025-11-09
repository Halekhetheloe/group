import { db } from '../config/firebase-admin.js';
import { collections } from '../config/database.js';

export const getUserProfile = async (req, res) => {
  try {
    const userId = req.user.userId;

    const userDoc = await db.collection(collections.USERS).doc(userId).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'USER_NOT_FOUND',
        message: 'User not found'
      });
    }

    const userData = userDoc.data();

    // Return user profile without sensitive data
    const userProfile = {
      id: userData.id,
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      role: userData.role,
      phone: userData.phone,
      emailVerified: userData.emailVerified,
      profileCompleted: userData.profileCompleted,
      status: userData.status,
      createdAt: userData.createdAt,
      lastLogin: userData.lastLogin
    };

    res.json({
      success: true,
      user: userProfile
    });

  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({
      success: false,
      error: 'PROFILE_FETCH_FAILED',
      message: 'Failed to fetch user profile'
    });
  }
};

export const updateUserProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const updateData = req.body;

    // Fields that can be updated
    const allowedFields = ['firstName', 'lastName', 'phone', 'profileCompleted'];
    const updates = {};

    Object.keys(updateData).forEach(key => {
      if (allowedFields.includes(key)) {
        updates[key] = updateData[key];
      }
    });

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'NO_VALID_FIELDS',
        message: 'No valid fields to update'
      });
    }

    updates.updatedAt = new Date();

    await db.collection(collections.USERS).doc(userId).update(updates);

    // Get updated user data
    const userDoc = await db.collection(collections.USERS).doc(userId).get();
    const userData = userDoc.data();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: userData
    });

  } catch (error) {
    console.error('Update user profile error:', error);
    res.status(500).json({
      success: false,
      error: 'PROFILE_UPDATE_FAILED',
      message: 'Failed to update user profile'
    });
  }
};

export const getUserNotifications = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { page = 1, limit = 20, unreadOnly = false } = req.query;

    const notificationsRef = db.collection(collections.NOTIFICATIONS);
    let query = notificationsRef.where('userId', '==', userId);

    if (unreadOnly === 'true') {
      query = query.where('read', '==', false);
    }

    // Get total count for pagination
    const countSnapshot = await query.get();
    const total = countSnapshot.size;

    // Apply pagination
    const startAfter = (page - 1) * limit;
    const snapshot = await query
      .orderBy('createdAt', 'desc')
      .offset(startAfter)
      .limit(parseInt(limit))
      .get();

    const notifications = [];
    snapshot.forEach(doc => {
      notifications.push({
        id: doc.id,
        ...doc.data()
      });
    });

    // Get unread count
    const unreadSnapshot = await notificationsRef
      .where('userId', '==', userId)
      .where('read', '==', false)
      .get();
    const unreadCount = unreadSnapshot.size;

    res.json({
      success: true,
      notifications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      },
      unreadCount
    });

  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      error: 'NOTIFICATIONS_FETCH_FAILED',
      message: 'Failed to fetch notifications'
    });
  }
};

export const markNotificationAsRead = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { notificationId } = req.params;

    const notificationRef = db.collection(collections.NOTIFICATIONS).doc(notificationId);
    const notificationDoc = await notificationRef.get();

    if (!notificationDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'NOTIFICATION_NOT_FOUND',
        message: 'Notification not found'
      });
    }

    const notificationData = notificationDoc.data();

    // Check if notification belongs to user
    if (notificationData.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'UNAUTHORIZED',
        message: 'Not authorized to update this notification'
      });
    }

    await notificationRef.update({
      read: true,
      readAt: new Date(),
      updatedAt: new Date()
    });

    res.json({
      success: true,
      message: 'Notification marked as read'
    });

  } catch (error) {
    console.error('Mark notification as read error:', error);
    res.status(500).json({
      success: false,
      error: 'NOTIFICATION_UPDATE_FAILED',
      message: 'Failed to update notification'
    });
  }
};

export const markAllNotificationsAsRead = async (req, res) => {
  try {
    const userId = req.user.userId;

    const notificationsRef = db.collection(collections.NOTIFICATIONS);
    const snapshot = await notificationsRef
      .where('userId', '==', userId)
      .where('read', '==', false)
      .get();

    const batch = db.batch();
    snapshot.forEach(doc => {
      batch.update(doc.ref, {
        read: true,
        readAt: new Date(),
        updatedAt: new Date()
      });
    });

    await batch.commit();

    res.json({
      success: true,
      message: 'All notifications marked as read'
    });

  } catch (error) {
    console.error('Mark all notifications as read error:', error);
    res.status(500).json({
      success: false,
      error: 'NOTIFICATIONS_UPDATE_FAILED',
      message: 'Failed to update notifications'
    });
  }
};

export const deleteNotification = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { notificationId } = req.params;

    const notificationRef = db.collection(collections.NOTIFICATIONS).doc(notificationId);
    const notificationDoc = await notificationRef.get();

    if (!notificationDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'NOTIFICATION_NOT_FOUND',
        message: 'Notification not found'
      });
    }

    const notificationData = notificationDoc.data();

    // Check if notification belongs to user
    if (notificationData.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'UNAUTHORIZED',
        message: 'Not authorized to delete this notification'
      });
    }

    await notificationRef.delete();

    res.json({
      success: true,
      message: 'Notification deleted successfully'
    });

  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({
      success: false,
      error: 'NOTIFICATION_DELETE_FAILED',
      message: 'Failed to delete notification'
    });
  }
};

export const getUserStats = async (req, res) => {
  try {
    const userId = req.user.userId;
    const userRole = req.user.role;

    let stats = {};

    if (userRole === 'student') {
      // Student-specific stats
      const applicationsSnapshot = await db.collection(collections.APPLICATIONS)
        .where('studentId', '==', userId)
        .get();

      const jobApplicationsSnapshot = await db.collection(collections.JOB_APPLICATIONS)
        .where('studentId', '==', userId)
        .get();

      const transcriptsSnapshot = await db.collection(collections.TRANSCRIPTS)
        .where('studentId', '==', userId)
        .get();

      stats = {
        totalApplications: applicationsSnapshot.size,
        pendingApplications: applicationsSnapshot.docs.filter(doc => doc.data().status === 'pending').length,
        approvedApplications: applicationsSnapshot.docs.filter(doc => doc.data().status === 'approved').length,
        totalJobApplications: jobApplicationsSnapshot.size,
        transcriptsCount: transcriptsSnapshot.size
      };

    } else if (userRole === 'institution') {
      // Institution-specific stats
      const coursesSnapshot = await db.collection(collections.COURSES)
        .where('institutionId', '==', userId)
        .get();

      const applicationsSnapshot = await db.collection(collections.APPLICATIONS)
        .where('institutionId', '==', userId)
        .get();

      stats = {
        totalCourses: coursesSnapshot.size,
        totalApplications: applicationsSnapshot.size,
        pendingApplications: applicationsSnapshot.docs.filter(doc => doc.data().status === 'pending').length,
        approvedApplications: applicationsSnapshot.docs.filter(doc => doc.data().status === 'approved').length
      };

    } else if (userRole === 'company') {
      // Company-specific stats
      const jobsSnapshot = await db.collection(collections.JOBS)
        .where('companyId', '==', userId)
        .get();

      const jobApplicationsSnapshot = await db.collection(collections.JOB_APPLICATIONS)
        .where('companyId', '==', userId)
        .get();

      stats = {
        totalJobs: jobsSnapshot.size,
        activeJobs: jobsSnapshot.docs.filter(doc => doc.data().status === 'active').length,
        totalJobApplications: jobApplicationsSnapshot.size,
        pendingJobApplications: jobApplicationsSnapshot.docs.filter(doc => doc.data().status === 'pending').length
      };
    }

    res.json({
      success: true,
      stats
    });

  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({
      success: false,
      error: 'STATS_FETCH_FAILED',
      message: 'Failed to fetch user statistics'
    });
  }
};