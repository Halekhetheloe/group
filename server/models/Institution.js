import { db } from '../config/firebase-admin.js';
import { collections } from '../config/database.js';

class Institution {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.type = data.type;
    this.location = data.location;
    this.description = data.description;
    this.contact = data.contact || {};
    this.faculties = data.faculties || [];
    this.status = data.status || 'active';
    this.adminId = data.adminId;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  // Static method to create a new institution
  static async create(institutionData) {
    try {
      const institutionRef = db.collection(collections.INSTITUTIONS).doc(institutionData.id);
      const institution = new Institution({
        ...institutionData,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      await institutionRef.set(institution.toFirestore());
      return institution;
    } catch (error) {
      throw new Error(`Failed to create institution: ${error.message}`);
    }
  }

  // Static method to find institution by ID
  static async findById(institutionId) {
    try {
      const institutionDoc = await db.collection(collections.INSTITUTIONS).doc(institutionId).get();
      
      if (!institutionDoc.exists) {
        return null;
      }

      return new Institution({
        id: institutionDoc.id,
        ...institutionDoc.data()
      });
    } catch (error) {
      throw new Error(`Failed to find institution: ${error.message}`);
    }
  }

  // Static method to find institutions with filtering and pagination
  static async find(filter = {}, options = {}) {
    try {
      const { 
        type, 
        location, 
        status = 'active',
        page = 1, 
        limit = 10 
      } = filter;

      let query = db.collection(collections.INSTITUTIONS);

      // Apply filters
      if (type) {
        query = query.where('type', '==', type);
      }

      if (location) {
        query = query.where('location', '==', location);
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
        .orderBy('name')
        .offset(startAfter)
        .limit(limit)
        .get();

      const institutions = [];
      snapshot.forEach(doc => {
        institutions.push(new Institution({
          id: doc.id,
          ...doc.data()
        }));
      });

      return {
        institutions,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      throw new Error(`Failed to find institutions: ${error.message}`);
    }
  }

  // Static method to find institutions by admin ID
  static async findByAdminId(adminId) {
    try {
      const snapshot = await db.collection(collections.INSTITUTIONS)
        .where('adminId', '==', adminId)
        .where('status', '==', 'active')
        .get();

      const institutions = [];
      snapshot.forEach(doc => {
        institutions.push(new Institution({
          id: doc.id,
          ...doc.data()
        }));
      });

      return institutions;
    } catch (error) {
      throw new Error(`Failed to find institutions by admin: ${error.message}`);
    }
  }

  // Update institution
  async update(updateData) {
    try {
      const institutionRef = db.collection(collections.INSTITUTIONS).doc(this.id);
      
      const updatedData = {
        ...updateData,
        updatedAt: new Date()
      };

      await institutionRef.update(updatedData);

      // Update instance properties
      Object.assign(this, updatedData);
      
      return this;
    } catch (error) {
      throw new Error(`Failed to update institution: ${error.message}`);
    }
  }

  // Update institution status
  async updateStatus(status) {
    try {
      return await this.update({
        status,
        updatedAt: new Date()
      });
    } catch (error) {
      throw new Error(`Failed to update institution status: ${error.message}`);
    }
  }

  // Add faculty
  async addFaculty(facultyName) {
    try {
      const updatedFaculties = [...this.faculties, facultyName];
      return await this.update({
        faculties: updatedFaculties
      });
    } catch (error) {
      throw new Error(`Failed to add faculty: ${error.message}`);
    }
  }

  // Remove faculty
  async removeFaculty(facultyName) {
    try {
      const updatedFaculties = this.faculties.filter(faculty => faculty !== facultyName);
      return await this.update({
        faculties: updatedFaculties
      });
    } catch (error) {
      throw new Error(`Failed to remove faculty: ${error.message}`);
    }
  }

  // Get institution courses
  async getCourses(options = {}) {
    try {
      const { faculty, status = 'active', page = 1, limit = 10 } = options;

      let query = db.collection(collections.COURSES)
        .where('institutionId', '==', this.id);

      if (faculty) {
        query = query.where('faculty', '==', faculty);
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
        .orderBy('name')
        .offset(startAfter)
        .limit(limit)
        .get();

      const courses = [];
      snapshot.forEach(doc => {
        courses.push({
          id: doc.id,
          ...doc.data()
        });
      });

      return {
        courses,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      throw new Error(`Failed to get institution courses: ${error.message}`);
    }
  }

  // Get institution applications
  async getApplications(options = {}) {
    try {
      const { status, courseId, page = 1, limit = 20 } = options;

      let query = db.collection(collections.APPLICATIONS)
        .where('institutionId', '==', this.id);

      if (status) {
        query = query.where('status', '==', status);
      }

      if (courseId) {
        query = query.where('courseId', '==', courseId);
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
        
        // Get student details
        const studentDoc = await db.collection(collections.USERS).doc(applicationData.studentId).get();
        const studentData = studentDoc.data();

        // Get course details
        const courseDoc = await db.collection(collections.COURSES).doc(applicationData.courseId).get();
        const courseData = courseDoc.data();

        applications.push({
          id: doc.id,
          ...applicationData,
          student: {
            id: studentData.id,
            firstName: studentData.firstName,
            lastName: studentData.lastName,
            email: studentData.email
          },
          course: {
            id: courseData.id,
            name: courseData.name,
            faculty: courseData.faculty
          }
        });
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
      throw new Error(`Failed to get institution applications: ${error.message}`);
    }
  }

  // Get institution statistics
  async getStats() {
    try {
      const coursesSnapshot = await db.collection(collections.COURSES)
        .where('institutionId', '==', this.id)
        .get();

      const applicationsSnapshot = await db.collection(collections.APPLICATIONS)
        .where('institutionId', '==', this.id)
        .get();

      const stats = {
        totalCourses: coursesSnapshot.size,
        totalApplications: applicationsSnapshot.size,
        applicationsByStatus: {
          pending: 0,
          approved: 0,
          rejected: 0,
          waitlisted: 0
        },
        applicationsByCourse: {}
      };

      applicationsSnapshot.forEach(doc => {
        const applicationData = doc.data();
        stats.applicationsByStatus[applicationData.status] = 
          (stats.applicationsByStatus[applicationData.status] || 0) + 1;

        stats.applicationsByCourse[applicationData.courseId] = 
          (stats.applicationsByCourse[applicationData.courseId] || 0) + 1;
      });

      return stats;
    } catch (error) {
      throw new Error(`Failed to get institution stats: ${error.message}`);
    }
  }

  // Check if institution is active
  isActive() {
    return this.status === 'active';
  }

  // Convert to plain object
  toObject() {
    return {
      id: this.id,
      name: this.name,
      type: this.type,
      location: this.location,
      description: this.description,
      contact: this.contact,
      faculties: this.faculties,
      status: this.status,
      adminId: this.adminId,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  // Convert to Firestore format
  toFirestore() {
    return {
      id: this.id,
      name: this.name,
      type: this.type,
      location: this.location,
      description: this.description,
      contact: this.contact,
      faculties: this.faculties,
      status: this.status,
      adminId: this.adminId,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  // Validate institution data
  static validate(institutionData) {
    const errors = [];

    if (!institutionData.name || institutionData.name.length < 2) {
      errors.push('Institution name must be at least 2 characters long');
    }

    if (!institutionData.type || !['university', 'college', 'vocational'].includes(institutionData.type)) {
      errors.push('Valid institution type is required (university, college, vocational)');
    }

    if (!institutionData.location || institutionData.location.length < 2) {
      errors.push('Location is required');
    }

    if (!institutionData.description || institutionData.description.length < 10) {
      errors.push('Description must be at least 10 characters long');
    }

    if (!institutionData.contact || !institutionData.contact.email) {
      errors.push('Contact email is required');
    }

    return errors;
  }
}

export default Institution;