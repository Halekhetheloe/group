import { db } from '../config/firebase-admin.js';
import { collections } from '../config/database.js';

class Notification {
  constructor(data) {
    this.id = data.id;
    this.userId = data.userId;
    this.title = data.title;
    this.message = data.message;
    this.type = data.type;
    this.relatedId = data.relatedId;
    this.relatedType = data.relatedType;
    this.read = data.read || false;
    this.readAt = data.readAt || null;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  // Static method to create a new notification
  static async create(notificationData) {
    try {
      const notificationRef = db.collection(collections.NOTIFICATIONS).doc(notificationData.id);
      const notification = new Notification({
        ...notificationData,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      await notificationRef.set(notification.toFirestore());
      return notification;
    } catch (error) {
      throw new Error(`Failed to create notification: ${error.message}`);
    }
  }

  // Static method to create multiple notifications
  static async createMultiple(notificationsData) {
    try {
      const batch = db.batch();
      const notifications = [];

      notificationsData.forEach(notificationData => {
        const notificationRef = db.collection(collections.NOTIFICATIONS).doc(notificationData.id);
        const notification = new Notification({
          ...notificationData,
          createdAt: new Date(),
          updatedAt: new Date()
        });

        batch.set(notificationRef, notification.toFirestore());
        notifications.push(notification);
      });

      await batch.commit();
      return notifications;
    } catch (error) {
      throw new Error(`Failed to create multiple notifications: ${error.message}`);
    }
  }

  // Static method to find notification by ID
  static async findById(notificationId) {
    try {
      const notificationDoc = await db.collection(collections.NOTIFICATIONS).doc(notificationId).get();
      
      if (!notificationDoc.exists) {
        return null;
      }

      return new Notification({
        id: notificationDoc.id,
        ...notificationDoc.data()
      });
    } catch (error) {
      throw new Error(`Failed to find notification: ${error.message}`);
    }
  }

  // Static method to find notifications with filtering and pagination
  static async find(filter = {}, options = {}) {
    try {
      const { 
        userId,
        type,
        read,
        page = 1, 
        limit = 20 
      } = filter;

      let query = db.collection(collections.NOTIFICATIONS);

      // Apply filters
      if (userId) {
        query = query.where('userId', '==', userId);
      }

      if (type) {
        query = query.where('type', '==', type);
      }

      if (read !== undefined) {
        query = query.where('read', '==', read);
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
        notifications.push(new Notification({
          id: doc.id,
          ...doc.data()
        }));
      });

      return {
        notifications,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      throw new Error(`Failed to find notifications: ${error.message}`);
    }
  }

  // Static method to get user notifications
  static async findByUser(userId, options = {}) {
    try {
      const { read, type, page = 1, limit = 20 } = options;

      let query = db.collection(collections.NOTIFICATIONS)
        .where('userId', '==', userId);

      if (read !== undefined) {
        query = query.where('read', '==', read);
      }

      if (type) {
        query = query.where('type', '==', type);
      }

      // Get total count
      const countSnapshot = await query.get();
      const total = countSnapshot.size;

      // Get unread count
      const unreadSnapshot = await db.collection(collections.NOTIFICATIONS)
        .where('userId', '==', userId)
        .where('read', '==', false)
        .get();
      const unreadCount = unreadSnapshot.size;

      // Apply pagination
      const startAfter = (page - 1) * limit;
      const snapshot = await query
        .orderBy('createdAt', 'desc')
        .offset(startAfter)
        .limit(limit)
        .get();

      const notifications = [];
      snapshot.forEach(doc => {
        notifications.push(new Notification({
          id: doc.id,
          ...doc.data()
        }));
      });

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
      throw new Error(`Failed to find user notifications: ${error.message}`);
    }
  }

  // Update notification
  async update(updateData) {
    try {
      const notificationRef = db.collection(collections.NOTIFICATIONS).doc(this.id);
      
      const updatedData = {
        ...updateData,
        updatedAt: new Date()
      };

      await notificationRef.update(updatedData);

      // Update instance properties
      Object.assign(this, updatedData);
      
      return this;
    } catch (error) {
      throw new Error(`Failed to update notification: ${error.message}`);
    }
  }

  // Mark as read
  async markAsRead() {
    try {
      return await this.update({
        read: true,
        readAt: new Date(),
        updatedAt: new Date()
      });
    } catch (error) {
      throw new Error(`Failed to mark notification as read: ${error.message}`);
    }
  }

  // Mark as unread
  async markAsUnread() {
    try {
      return await this.update({
        read: false,
        readAt: null,
        updatedAt: new Date()
      });
    } catch (error) {
      throw new Error(`Failed to mark notification as unread: ${error.message}`);
    }
  }

  // Static method to mark all user notifications as read
  static async markAllAsRead(userId) {
    try {
      const snapshot = await db.collection(collections.NOTIFICATIONS)
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
      return snapshot.size;
    } catch (error) {
      throw new Error(`Failed to mark all notifications as read: ${error.message}`);
    }
  }

  // Delete notification
  async delete() {
    try {
      const notificationRef = db.collection(collections.NOTIFICATIONS).doc(this.id);
      await notificationRef.delete();
      return true;
    } catch (error) {
      throw new Error(`Failed to delete notification: ${error.message}`);
    }
  }

  // Static method to create application status notification
  static async createApplicationNotification(userId, application, status) {
    try {
      const title = 'Application Status Update';
    let message = '';

    switch (status) {
      case 'approved':
        message = `Congratulations! Your application for ${application.courseName} has been approved.`;
        break;
      case 'rejected':
        message = `Your application for ${application.courseName} has been reviewed.`;
        break;
      case 'waitlisted':
        message = `Your application for ${application.courseName} has been waitlisted.`;
        break;
      default:
        message = `Your application for ${application.courseName} has been updated.`;
    }

    const notificationData = {
      id: db.collection(collections.NOTIFICATIONS).doc().id,
      userId,
      title,
      message,
      type: 'application',
      relatedId: application.id,
      relatedType: 'application'
    };

    return await Notification.create(notificationData);
    } catch (error) {
      throw new Error(`Failed to create application notification: ${error.message}`);
    }
  }

  // Static method to create job match notification
  static async createJobMatchNotification(userId, job) {
    try {
      const notificationData = {
        id: db.collection(collections.NOTIFICATIONS).doc().id,
        userId,
        title: 'New Job Match',
        message: `We found a job opportunity that matches your profile: ${job.title} at ${job.companyName}`,
        type: 'job_match',
        relatedId: job.id,
        relatedType: 'job'
      };

      return await Notification.create(notificationData);
    } catch (error) {
      throw new Error(`Failed to create job match notification: ${error.message}`);
    }
  }

  // Static method to create system notification
  static async createSystemNotification(userId, title, message, relatedId = null, relatedType = null) {
    try {
      const notificationData = {
        id: db.collection(collections.NOTIFICATIONS).doc().id,
        userId,
        title,
        message,
        type: 'system',
        relatedId,
        relatedType
      };

      return await Notification.create(notificationData);
    } catch (error) {
      throw new Error(`Failed to create system notification: ${error.message}`);
    }
  }

  // Check if notification is read
  isRead() {
    return this.read;
  }

  // Convert to plain object
  toObject() {
    return {
      id: this.id,
      userId: this.userId,
      title: this.title,
      message: this.message,
      type: this.type,
      relatedId: this.relatedId,
      relatedType: this.relatedType,
      read: this.read,
      readAt: this.readAt,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  // Convert to Firestore format
  toFirestore() {
    return {
      id: this.id,
      userId: this.userId,
      title: this.title,
      message: this.message,
      type: this.type,
      relatedId: this.relatedId,
      relatedType: this.relatedType,
      read: this.read,
      readAt: this.readAt,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  // Validate notification data
  static validate(notificationData) {
    const errors = [];

    if (!notificationData.userId) {
      errors.push('User ID is required');
    }

    if (!notificationData.title || notificationData.title.length < 2) {
      errors.push('Title must be at least 2 characters long');
    }

    if (!notificationData.message || notificationData.message.length < 2) {
      errors.push('Message must be at least 2 characters long');
    }

    if (!notificationData.type || !['application', 'job_match', 'system', 'alert'].includes(notificationData.type)) {
      errors.push('Valid notification type is required');
    }

    return errors;
  }
}

export default Notification;