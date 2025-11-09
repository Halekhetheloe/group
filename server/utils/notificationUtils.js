import { db } from '../config/firebase-admin.js';
import { collections } from '../config/database.js';

// Notification types and templates
export const notificationTypes = {
  APPLICATION_STATUS: 'application_status',
  JOB_MATCH: 'job_match',
  SYSTEM_ALERT: 'system_alert',
  PROFILE_UPDATE: 'profile_update',
  COURSE_DEADLINE: 'course_deadline',
  JOB_DEADLINE: 'job_deadline',
  TRANSCRIPT_VERIFIED: 'transcript_verified',
  NEW_MESSAGE: 'new_message'
};

export const notificationTemplates = {
  [notificationTypes.APPLICATION_STATUS]: {
    title: 'Application Status Update',
    generateMessage: (data) => {
      const { courseName, institutionName, status } = data;
      const statusMessages = {
        approved: `Congratulations! Your application for ${courseName} at ${institutionName} has been approved.`,
        rejected: `Your application for ${courseName} at ${institutionName} has been reviewed.`,
        waitlisted: `Your application for ${courseName} at ${institutionName} has been waitlisted.`,
        pending: `Your application for ${courseName} at ${institutionName} is being reviewed.`
      };
      return statusMessages[status] || `Your application status for ${courseName} has been updated.`;
    }
  },

  [notificationTypes.JOB_MATCH]: {
    title: 'New Job Match Found',
    generateMessage: (data) => {
      const { jobTitle, companyName, matchScore } = data;
      return `We found a job opportunity that matches your profile (${matchScore}% match): ${jobTitle} at ${companyName}`;
    }
  },

  [notificationTypes.SYSTEM_ALERT]: {
    title: 'System Alert',
    generateMessage: (data) => {
      return data.message || 'A system alert has been issued.';
    }
  },

  [notificationTypes.PROFILE_UPDATE]: {
    title: 'Profile Update Required',
    generateMessage: (data) => {
      return 'Please update your profile information to continue using the platform.';
    }
  },

  [notificationTypes.COURSE_DEADLINE]: {
    title: 'Course Application Deadline',
    generateMessage: (data) => {
      const { courseName, daysLeft } = data;
      return `Application deadline for ${courseName} is in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}. Apply now!`;
    }
  },

  [notificationTypes.JOB_DEADLINE]: {
    title: 'Job Application Deadline',
    generateMessage: (data) => {
      const { jobTitle, daysLeft } = data;
      return `Application deadline for ${jobTitle} is in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}. Apply now!`;
    }
  },

  [notificationTypes.TRANSCRIPT_VERIFIED]: {
    title: 'Transcript Verified',
    generateMessage: (data) => {
      const { institutionName } = data;
      return `Your transcript from ${institutionName} has been verified and is now available to potential employers.`;
    }
  }
};

// Notification creation utilities
export const createNotification = async (userId, type, data, relatedId = null) => {
  try {
    const template = notificationTemplates[type];
    if (!template) {
      throw new Error(`Notification template for type '${type}' not found`);
    }

    const notification = {
      id: db.collection(collections.NOTIFICATIONS).doc().id,
      userId,
      title: template.title,
      message: template.generateMessage(data),
      type,
      relatedId,
      relatedType: getRelatedType(type),
      read: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await db.collection(collections.NOTIFICATIONS).doc(notification.id).set(notification);
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

export const createBulkNotifications = async (userIds, type, data, relatedId = null) => {
  try {
    const batch = db.batch();
    const notifications = [];
    const template = notificationTemplates[type];

    if (!template) {
      throw new Error(`Notification template for type '${type}' not found`);
    }

    userIds.forEach(userId => {
      const notificationRef = db.collection(collections.NOTIFICATIONS).doc();
      const notification = {
        id: notificationRef.id,
        userId,
        title: template.title,
        message: template.generateMessage(data),
        type,
        relatedId,
        relatedType: getRelatedType(type),
        read: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      batch.set(notificationRef, notification);
      notifications.push(notification);
    });

    await batch.commit();
    return notifications;
  } catch (error) {
    console.error('Error creating bulk notifications:', error);
    throw error;
  }
};

// Notification delivery utilities
export const deliverNotification = async (notification, deliveryMethods = ['in_app']) => {
  const results = [];

  for (const method of deliveryMethods) {
    try {
      switch (method) {
        case 'in_app':
          // In-app notification is already created in the database
          results.push({ method, success: true });
          break;
        
        case 'email':
          // This would integrate with your email service
          // await emailService.sendNotificationEmail(notification);
          results.push({ method, success: true });
          break;
        
        case 'push':
          // This would integrate with a push notification service
          // await pushService.sendPushNotification(notification);
          results.push({ method, success: true });
          break;
        
        default:
          results.push({ method, success: false, error: `Unknown delivery method: ${method}` });
      }
    } catch (error) {
      results.push({ method, success: false, error: error.message });
    }
  }

  return results;
};

// Notification management utilities
export const markAsRead = async (notificationId, userId) => {
  try {
    const notificationRef = db.collection(collections.NOTIFICATIONS).doc(notificationId);
    const notificationDoc = await notificationRef.get();

    if (!notificationDoc.exists) {
      throw new Error('Notification not found');
    }

    const notification = notificationDoc.data();

    if (notification.userId !== userId) {
      throw new Error('Not authorized to update this notification');
    }

    await notificationRef.update({
      read: true,
      readAt: new Date(),
      updatedAt: new Date()
    });

    return { success: true };
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
};

export const markAllAsRead = async (userId) => {
  try {
    const snapshot = await db.collection(collections.NOTIFICATIONS)
      .where('userId', '==', userId)
      .where('read', '==', false)
      .get();

    const batch = db.batch();
    let count = 0;

    snapshot.forEach(doc => {
      batch.update(doc.ref, {
        read: true,
        readAt: new Date(),
        updatedAt: new Date()
      });
      count++;
    });

    await batch.commit();
    return { success: true, count };
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    throw error;
  }
};

export const deleteNotification = async (notificationId, userId) => {
  try {
    const notificationRef = db.collection(collections.NOTIFICATIONS).doc(notificationId);
    const notificationDoc = await notificationRef.get();

    if (!notificationDoc.exists) {
      throw new Error('Notification not found');
    }

    const notification = notificationDoc.data();

    if (notification.userId !== userId) {
      throw new Error('Not authorized to delete this notification');
    }

    await notificationRef.delete();
    return { success: true };
  } catch (error) {
    console.error('Error deleting notification:', error);
    throw error;
  }
};

// Notification query utilities
export const getUserNotifications = async (userId, options = {}) => {
  try {
    const { page = 1, limit = 20, unreadOnly = false, type = null } = options;

    let query = db.collection(collections.NOTIFICATIONS)
      .where('userId', '==', userId);

    if (unreadOnly) {
      query = query.where('read', '==', false);
    }

    if (type) {
      query = query.where('type', '==', type);
    }

    // Get total count
    const countSnapshot = await query.get();
    const total = countSnapshot.size;

    // Apply pagination
    const startAfter = (page - 1) * limit;
    const snapshot = await query
      .orderBy('createdAt', 'desc')
      .offset(startAfter)
      .limit(limit)
      .get();

    const notifications = [];
    snapshot.forEach(doc => {
      notifications.push({
        id: doc.id,
        ...doc.data()
      });
    });

    // Get unread count
    const unreadSnapshot = await db.collection(collections.NOTIFICATIONS)
      .where('userId', '==', userId)
      .where('read', '==', false)
      .get();
    const unreadCount = unreadSnapshot.size;

    return {
      notifications,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      unreadCount
    };
  } catch (error) {
    console.error('Error getting user notifications:', error);
    throw error;
  }
};

export const getUnreadCount = async (userId) => {
  try {
    const snapshot = await db.collection(collections.NOTIFICATIONS)
      .where('userId', '==', userId)
      .where('read', '==', false)
      .get();

    return snapshot.size;
  } catch (error) {
    console.error('Error getting unread count:', error);
    throw error;
  }
};

// Notification scheduling utilities
export const scheduleNotification = async (userId, type, data, deliverAt) => {
  try {
    const scheduledNotification = {
      userId,
      type,
      data,
      deliverAt,
      status: 'scheduled',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await db.collection('scheduled_notifications').add(scheduledNotification);
    return scheduledNotification;
  } catch (error) {
    console.error('Error scheduling notification:', error);
    throw error;
  }
};

export const processScheduledNotifications = async () => {
  try {
    const now = new Date();
    const snapshot = await db.collection('scheduled_notifications')
      .where('deliverAt', '<=', now)
      .where('status', '==', 'scheduled')
      .get();

    const results = [];

    for (const doc of snapshot.docs) {
      const scheduled = doc.data();
      
      try {
        // Create the actual notification
        await createNotification(
          scheduled.userId,
          scheduled.type,
          scheduled.data,
          scheduled.relatedId
        );

        // Mark as delivered
        await doc.ref.update({
          status: 'delivered',
          deliveredAt: new Date(),
          updatedAt: new Date()
        });

        results.push({ id: doc.id, success: true });
      } catch (error) {
        await doc.ref.update({
          status: 'failed',
          error: error.message,
          updatedAt: new Date()
        });

        results.push({ id: doc.id, success: false, error: error.message });
      }
    }

    return results;
  } catch (error) {
    console.error('Error processing scheduled notifications:', error);
    throw error;
  }
};

// Helper functions
const getRelatedType = (notificationType) => {
  const typeMap = {
    [notificationTypes.APPLICATION_STATUS]: 'application',
    [notificationTypes.JOB_MATCH]: 'job',
    [notificationTypes.COURSE_DEADLINE]: 'course',
    [notificationTypes.JOB_DEADLINE]: 'job',
    [notificationTypes.TRANSCRIPT_VERIFIED]: 'transcript'
  };

  return typeMap[notificationType] || null;
};

// Notification preferences utilities
export const getUserNotificationPreferences = async (userId) => {
  try {
    const userDoc = await db.collection(collections.USERS).doc(userId).get();
    
    if (!userDoc.exists) {
      throw new Error('User not found');
    }

    const userData = userDoc.data();
    
    // Default preferences
    const defaultPreferences = {
      email: true,
      push: true,
      in_app: true,
      application_updates: true,
      job_matches: true,
      system_alerts: true,
      course_deadlines: true,
      job_deadlines: true
    };

    return userData.notificationPreferences || defaultPreferences;
  } catch (error) {
    console.error('Error getting user notification preferences:', error);
    throw error;
  }
};

export const updateNotificationPreferences = async (userId, preferences) => {
  try {
    await db.collection(collections.USERS).doc(userId).update({
      notificationPreferences: preferences,
      updatedAt: new Date()
    });

    return { success: true };
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    throw error;
  }
};

// Export all utilities
export default {
  notificationTypes,
  notificationTemplates,
  createNotification,
  createBulkNotifications,
  deliverNotification,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getUserNotifications,
  getUnreadCount,
  scheduleNotification,
  processScheduledNotifications,
  getUserNotificationPreferences,
  updateNotificationPreferences
};