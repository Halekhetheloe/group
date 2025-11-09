import { db } from '../config/firebase-admin.js';
import { collections } from '../config/database.js';

class User {
  constructor(data) {
    this.id = data.id;
    this.email = data.email;
    this.firstName = data.firstName;
    this.lastName = data.lastName;
    this.role = data.role;
    this.phone = data.phone || '';
    this.status = data.status || 'active';
    this.emailVerified = data.emailVerified || false;
    this.profileCompleted = data.profileCompleted || false;
    this.hasTranscripts = data.hasTranscripts || false;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
    this.lastLogin = data.lastLogin || null;
    this.lastPasswordChange = data.lastPasswordChange || null;
  }

  // Static method to create a new user
  static async create(userData) {
    try {
      const userRef = db.collection(collections.USERS).doc(userData.id);
      const user = new User({
        ...userData,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      await userRef.set(user.toFirestore());
      return user;
    } catch (error) {
      throw new Error(`Failed to create user: ${error.message}`);
    }
  }

  // Static method to find user by ID
  static async findById(userId) {
    try {
      const userDoc = await db.collection(collections.USERS).doc(userId).get();
      
      if (!userDoc.exists) {
        return null;
      }

      return new User({
        id: userDoc.id,
        ...userDoc.data()
      });
    } catch (error) {
      throw new Error(`Failed to find user: ${error.message}`);
    }
  }

  // Static method to find user by email
  static async findByEmail(email) {
    try {
      const snapshot = await db.collection(collections.USERS)
        .where('email', '==', email.toLowerCase())
        .limit(1)
        .get();

      if (snapshot.empty) {
        return null;
      }

      const userDoc = snapshot.docs[0];
      return new User({
        id: userDoc.id,
        ...userDoc.data()
      });
    } catch (error) {
      throw new Error(`Failed to find user by email: ${error.message}`);
    }
  }

  // Static method to find users by role
  static async findByRole(role, options = {}) {
    try {
      const { page = 1, limit = 10, status = 'active' } = options;
      let query = db.collection(collections.USERS)
        .where('role', '==', role)
        .where('status', '==', status);

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

      const users = [];
      snapshot.forEach(doc => {
        users.push(new User({
          id: doc.id,
          ...doc.data()
        }));
      });

      return {
        users,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      throw new Error(`Failed to find users by role: ${error.message}`);
    }
  }

  // Update user
  async update(updateData) {
    try {
      const userRef = db.collection(collections.USERS).doc(this.id);
      
      const updatedData = {
        ...updateData,
        updatedAt: new Date()
      };

      await userRef.update(updatedData);

      // Update instance properties
      Object.assign(this, updatedData);
      
      return this;
    } catch (error) {
      throw new Error(`Failed to update user: ${error.message}`);
    }
  }

  // Update user status
  async updateStatus(status, reason = null) {
    try {
      const updateData = {
        status,
        updatedAt: new Date()
      };

      if (reason) {
        updateData.statusReason = reason;
      }

      return await this.update(updateData);
    } catch (error) {
      throw new Error(`Failed to update user status: ${error.message}`);
    }
  }

  // Verify email
  async verifyEmail() {
    try {
      return await this.update({
        emailVerified: true,
        updatedAt: new Date()
      });
    } catch (error) {
      throw new Error(`Failed to verify email: ${error.message}`);
    }
  }

  // Mark profile as completed
  async completeProfile() {
    try {
      return await this.update({
        profileCompleted: true,
        updatedAt: new Date()
      });
    } catch (error) {
      throw new Error(`Failed to complete profile: ${error.message}`);
    }
  }

  // Update last login
  async updateLastLogin() {
    try {
      return await this.update({
        lastLogin: new Date()
      });
    } catch (error) {
      throw new Error(`Failed to update last login: ${error.message}`);
    }
  }

  // Check if user is active
  isActive() {
    return this.status === 'active';
  }

  // Check if user has verified email
  isEmailVerified() {
    return this.emailVerified;
  }

  // Check if user has completed profile
  isProfileCompleted() {
    return this.profileCompleted;
  }

  // Get user statistics
  async getStats() {
    try {
      let stats = {};

      if (this.role === 'student') {
        const applicationsSnapshot = await db.collection(collections.APPLICATIONS)
          .where('studentId', '==', this.id)
          .get();

        const jobApplicationsSnapshot = await db.collection(collections.JOB_APPLICATIONS)
          .where('studentId', '==', this.id)
          .get();

        const transcriptsSnapshot = await db.collection(collections.TRANSCRIPTS)
          .where('studentId', '==', this.id)
          .get();

        stats = {
          totalApplications: applicationsSnapshot.size,
          pendingApplications: applicationsSnapshot.docs.filter(doc => doc.data().status === 'pending').length,
          approvedApplications: applicationsSnapshot.docs.filter(doc => doc.data().status === 'approved').length,
          totalJobApplications: jobApplicationsSnapshot.size,
          transcriptsCount: transcriptsSnapshot.size
        };
      } else if (this.role === 'institution') {
        const coursesSnapshot = await db.collection(collections.COURSES)
          .where('institutionId', '==', this.id)
          .get();

        const applicationsSnapshot = await db.collection(collections.APPLICATIONS)
          .where('institutionId', '==', this.id)
          .get();

        stats = {
          totalCourses: coursesSnapshot.size,
          totalApplications: applicationsSnapshot.size,
          pendingApplications: applicationsSnapshot.docs.filter(doc => doc.data().status === 'pending').length,
          approvedApplications: applicationsSnapshot.docs.filter(doc => doc.data().status === 'approved').length
        };
      } else if (this.role === 'company') {
        const jobsSnapshot = await db.collection(collections.JOBS)
          .where('companyId', '==', this.id)
          .get();

        const jobApplicationsSnapshot = await db.collection(collections.JOB_APPLICATIONS)
          .where('companyId', '==', this.id)
          .get();

        stats = {
          totalJobs: jobsSnapshot.size,
          activeJobs: jobsSnapshot.docs.filter(doc => doc.data().status === 'active').length,
          totalJobApplications: jobApplicationsSnapshot.size,
          pendingJobApplications: jobApplicationsSnapshot.docs.filter(doc => doc.data().status === 'pending').length
        };
      }

      return stats;
    } catch (error) {
      throw new Error(`Failed to get user stats: ${error.message}`);
    }
  }

  // Convert to plain object
  toObject() {
    return {
      id: this.id,
      email: this.email,
      firstName: this.firstName,
      lastName: this.lastName,
      role: this.role,
      phone: this.phone,
      status: this.status,
      emailVerified: this.emailVerified,
      profileCompleted: this.profileCompleted,
      hasTranscripts: this.hasTranscripts,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      lastLogin: this.lastLogin
    };
  }

  // Convert to Firestore format
  toFirestore() {
    return {
      id: this.id,
      email: this.email,
      firstName: this.firstName,
      lastName: this.lastName,
      role: this.role,
      phone: this.phone,
      status: this.status,
      emailVerified: this.emailVerified,
      profileCompleted: this.profileCompleted,
      hasTranscripts: this.hasTranscripts,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      lastLogin: this.lastLogin,
      lastPasswordChange: this.lastPasswordChange
    };
  }

  // Validate user data
  static validate(userData) {
    const errors = [];

    if (!userData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userData.email)) {
      errors.push('Valid email is required');
    }

    if (!userData.firstName || userData.firstName.length < 2) {
      errors.push('First name must be at least 2 characters long');
    }

    if (!userData.lastName || userData.lastName.length < 2) {
      errors.push('Last name must be at least 2 characters long');
    }

    if (!userData.role || !['student', 'institution', 'company', 'admin'].includes(userData.role)) {
      errors.push('Valid role is required');
    }

    return errors;
  }
}

export default User;