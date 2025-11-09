import { db } from '../config/firebase-admin.js';
import { collections } from '../config/database.js';

class Application {
  constructor(data) {
    this.id = data.id;
    this.studentId = data.studentId;
    this.courseId = data.courseId;
    this.institutionId = data.institutionId;
    this.personalInfo = data.personalInfo || {};
    this.academicBackground = data.academicBackground || {};
    this.documents = data.documents || {};
    this.status = data.status || 'pending';
    this.appliedAt = data.appliedAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
    this.reviewedAt = data.reviewedAt || null;
    this.reviewedBy = data.reviewedBy || null;
    this.notes = data.notes || '';
    this.withdrawnAt = data.withdrawnAt || null;
  }

  // Static method to create a new application
  static async create(applicationData) {
    try {
      const applicationRef = db.collection(collections.APPLICATIONS).doc(applicationData.id);
      const application = new Application({
        ...applicationData,
        appliedAt: new Date(),
        updatedAt: new Date()
      });

      await applicationRef.set(application.toFirestore());
      return application;
    } catch (error) {
      throw new Error(`Failed to create application: ${error.message}`);
    }
  }

  // Static method to find application by ID
  static async findById(applicationId) {
    try {
      const applicationDoc = await db.collection(collections.APPLICATIONS).doc(applicationId).get();
      
      if (!applicationDoc.exists) {
        return null;
      }

      return new Application({
        id: applicationDoc.id,
        ...applicationDoc.data()
      });
    } catch (error) {
      throw new Error(`Failed to find application: ${error.message}`);
    }
  }

  // Static method to find applications with filtering and pagination
  static async find(filter = {}, options = {}) {
    try {
      const { 
        studentId,
        institutionId,
        courseId,
        status,
        page = 1, 
        limit = 10 
      } = filter;

      let query = db.collection(collections.APPLICATIONS);

      // Apply filters
      if (studentId) {
        query = query.where('studentId', '==', studentId);
      }

      if (institutionId) {
        query = query.where('institutionId', '==', institutionId);
      }

      if (courseId) {
        query = query.where('courseId', '==', courseId);
      }

      if (status) {
        query = query.where('status', '==', status);
      }

      // Get total count
      const countSnapshot = await query.get();
      const total = countSnapshot.size;

      // Apply pagination
      const startAfter = (page - 1) * limit;
      const snapshot = await query
        .orderBy('appliedAt', 'desc')
        .offset(startAfter)
        .limit(limit)
        .get();

      const applications = [];
      
      for (const doc of snapshot.docs) {
        const applicationData = doc.data();
        
        // Get course details
        const courseDoc = await db.collection(collections.COURSES).doc(applicationData.courseId).get();
        const courseData = courseDoc.data();

        // Get institution details
        const institutionDoc = await db.collection(collections.INSTITUTIONS)
          .doc(applicationData.institutionId)
          .get();
        const institutionData = institutionDoc.data();

        applications.push(new Application({
          id: doc.id,
          ...applicationData,
          course: {
            id: courseData.id,
            name: courseData.name,
            faculty: courseData.faculty,
            duration: courseData.duration
          },
          institution: {
            id: institutionData.id,
            name: institutionData.name,
            location: institutionData.location
          }
        }));
      }

      return {
        applications,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      throw new Error(`Failed to find applications: ${error.message}`);
    }
  }

  // Static method to check for duplicate application
  static async checkDuplicate(studentId, courseId) {
    try {
      const snapshot = await db.collection(collections.APPLICATIONS)
        .where('studentId', '==', studentId)
        .where('courseId', '==', courseId)
        .limit(1)
        .get();

      return !snapshot.empty;
    } catch (error) {
      throw new Error(`Failed to check duplicate application: ${error.message}`);
    }
  }

  // Static method to check application limits
  static async checkApplicationLimit(studentId, institutionId) {
    try {
      const snapshot = await db.collection(collections.APPLICATIONS)
        .where('studentId', '==', studentId)
        .where('institutionId', '==', institutionId)
        .where('status', 'in', ['pending', 'approved', 'waitlisted'])
        .get();

      return snapshot.size >= 2;
    } catch (error) {
      throw new Error(`Failed to check application limit: ${error.message}`);
    }
  }

  // Update application
  async update(updateData) {
    try {
      const applicationRef = db.collection(collections.APPLICATIONS).doc(this.id);
      
      const updatedData = {
        ...updateData,
        updatedAt: new Date()
      };

      await applicationRef.update(updatedData);

      // Update instance properties
      Object.assign(this, updatedData);
      
      return this;
    } catch (error) {
      throw new Error(`Failed to update application: ${error.message}`);
    }
  }

  // Update application status
  async updateStatus(status, reviewedBy = null, notes = '') {
    try {
      const updateData = {
        status,
        updatedAt: new Date(),
        notes
      };

      if (status === 'approved' || status === 'rejected') {
        updateData.reviewedAt = new Date();
        updateData.reviewedBy = reviewedBy;
      }

      return await this.update(updateData);
    } catch (error) {
      throw new Error(`Failed to update application status: ${error.message}`);
    }
  }

  // Withdraw application
  async withdraw() {
    try {
      if (this.status !== 'pending') {
        throw new Error('Cannot withdraw application that is already processed');
      }

      return await this.update({
        status: 'withdrawn',
        withdrawnAt: new Date(),
        updatedAt: new Date()
      });
    } catch (error) {
      throw new Error(`Failed to withdraw application: ${error.message}`);
    }
  }

  // Get application with full details
  async getFullDetails() {
    try {
      // Get student details
      const studentDoc = await db.collection(collections.USERS).doc(this.studentId).get();
      const studentData = studentDoc.data();

      // Get course details
      const courseDoc = await db.collection(collections.COURSES).doc(this.courseId).get();
      const courseData = courseDoc.data();

      // Get institution details
      const institutionDoc = await db.collection(collections.INSTITUTIONS)
        .doc(this.institutionId)
        .get();
      const institutionData = institutionDoc.data();

      return {
        ...this.toObject(),
        student: {
          id: studentData.id,
          firstName: studentData.firstName,
          lastName: studentData.lastName,
          email: studentData.email,
          phone: studentData.phone
        },
        course: {
          id: courseData.id,
          name: courseData.name,
          faculty: courseData.faculty,
          duration: courseData.duration,
          requirements: courseData.requirements
        },
        institution: {
          id: institutionData.id,
          name: institutionData.name,
          location: institutionData.location,
          contact: institutionData.contact
        }
      };
    } catch (error) {
      throw new Error(`Failed to get application details: ${error.message}`);
    }
  }

  // Check if application can be withdrawn
  canWithdraw() {
    return this.status === 'pending';
  }

  // Check if application is pending
  isPending() {
    return this.status === 'pending';
  }

  // Check if application is approved
  isApproved() {
    return this.status === 'approved';
  }

  // Check if application is rejected
  isRejected() {
    return this.status === 'rejected';
  }

  // Convert to plain object
  toObject() {
    return {
      id: this.id,
      studentId: this.studentId,
      courseId: this.courseId,
      institutionId: this.institutionId,
      personalInfo: this.personalInfo,
      academicBackground: this.academicBackground,
      documents: this.documents,
      status: this.status,
      appliedAt: this.appliedAt,
      updatedAt: this.updatedAt,
      reviewedAt: this.reviewedAt,
      reviewedBy: this.reviewedBy,
      notes: this.notes,
      withdrawnAt: this.withdrawnAt
    };
  }

  // Convert to Firestore format
  toFirestore() {
    return {
      id: this.id,
      studentId: this.studentId,
      courseId: this.courseId,
      institutionId: this.institutionId,
      personalInfo: this.personalInfo,
      academicBackground: this.academicBackground,
      documents: this.documents,
      status: this.status,
      appliedAt: this.appliedAt,
      updatedAt: this.updatedAt,
      reviewedAt: this.reviewedAt,
      reviewedBy: this.reviewedBy,
      notes: this.notes,
      withdrawnAt: this.withdrawnAt
    };
  }

  // Validate application data
  static validate(applicationData) {
    const errors = [];

    if (!applicationData.studentId) {
      errors.push('Student ID is required');
    }

    if (!applicationData.courseId) {
      errors.push('Course ID is required');
    }

    if (!applicationData.institutionId) {
      errors.push('Institution ID is required');
    }

    if (!applicationData.personalInfo || !applicationData.personalInfo.dateOfBirth) {
      errors.push('Personal information is required');
    }

    if (!applicationData.academicBackground || !applicationData.academicBackground.highSchool) {
      errors.push('Academic background is required');
    }

    return errors;
  }
}

export default Application;