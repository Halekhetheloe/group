import { db } from '../config/firebase-admin.js';
import { collections } from '../config/database.js';

class Course {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.institutionId = data.institutionId;
    this.institutionName = data.institutionName;
    this.faculty = data.faculty;
    this.duration = data.duration;
    this.description = data.description;
    this.requirements = data.requirements || {};
    this.curriculum = data.curriculum || [];
    this.intake = data.intake || {};
    this.fees = data.fees || {};
    this.status = data.status || 'active';
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  // Static method to create a new course
  static async create(courseData) {
    try {
      const courseRef = db.collection(collections.COURSES).doc(courseData.id);
      const course = new Course({
        ...courseData,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      await courseRef.set(course.toFirestore());
      return course;
    } catch (error) {
      throw new Error(`Failed to create course: ${error.message}`);
    }
  }

  // Static method to find course by ID
  static async findById(courseId) {
    try {
      const courseDoc = await db.collection(collections.COURSES).doc(courseId).get();
      
      if (!courseDoc.exists) {
        return null;
      }

      return new Course({
        id: courseDoc.id,
        ...courseDoc.data()
      });
    } catch (error) {
      throw new Error(`Failed to find course: ${error.message}`);
    }
  }

  // Static method to find courses with filtering and pagination
  static async find(filter = {}, options = {}) {
    try {
      const { 
        institution, 
        faculty, 
        search,
        status = 'active',
        page = 1, 
        limit = 10 
      } = filter;

      let query = db.collection(collections.COURSES);

      // Apply filters
      if (institution) {
        query = query.where('institutionId', '==', institution);
      }

      if (faculty) {
        query = query.where('faculty', '==', faculty);
      }

      if (status) {
        query = query.where('status', '==', status);
      }

      if (search) {
        // Basic search implementation
        query = query.where('name', '>=', search).where('name', '<=', search + '\uf8ff');
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
      
      // Get institution details for each course
      for (const doc of snapshot.docs) {
        const courseData = doc.data();
        
        // Get institution details
        const institutionDoc = await db.collection(collections.INSTITUTIONS)
          .doc(courseData.institutionId)
          .get();
        const institutionData = institutionDoc.data();

        courses.push(new Course({
          id: doc.id,
          ...courseData,
          institutionName: institutionData?.name
        }));
      }

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
      throw new Error(`Failed to find courses: ${error.message}`);
    }
  }

  // Static method to find popular courses
  static async findPopular(limit = 10) {
    try {
      // Get courses with most applications
      const applicationsSnapshot = await db.collection(collections.APPLICATIONS)
        .where('status', '==', 'pending')
        .get();

      // Count applications per course
      const courseApplicationCount = {};
      applicationsSnapshot.forEach(doc => {
        const applicationData = doc.data();
        const courseId = applicationData.courseId;
        courseApplicationCount[courseId] = (courseApplicationCount[courseId] || 0) + 1;
      });

      // Get top courses by application count
      const popularCourseIds = Object.entries(courseApplicationCount)
        .sort(([, a], [, b]) => b - a)
        .slice(0, limit)
        .map(([courseId]) => courseId);

      const popularCourses = [];

      for (const courseId of popularCourseIds) {
        const course = await Course.findById(courseId);
        if (course) {
          popularCourses.push({
            ...course.toObject(),
            applicationCount: courseApplicationCount[courseId]
          });
        }
      }

      return popularCourses;
    } catch (error) {
      throw new Error(`Failed to find popular courses: ${error.message}`);
    }
  }

  // Update course
  async update(updateData) {
    try {
      const courseRef = db.collection(collections.COURSES).doc(this.id);
      
      const updatedData = {
        ...updateData,
        updatedAt: new Date()
      };

      await courseRef.update(updatedData);

      // Update instance properties
      Object.assign(this, updatedData);
      
      return this;
    } catch (error) {
      throw new Error(`Failed to update course: ${error.message}`);
    }
  }

  // Update course status
  async updateStatus(status) {
    try {
      return await this.update({
        status,
        updatedAt: new Date()
      });
    } catch (error) {
      throw new Error(`Failed to update course status: ${error.message}`);
    }
  }

  // Check course eligibility for a student
  async checkEligibility(studentData) {
    const eligibility = {
      isEligible: true,
      missingRequirements: [],
      meetsRequirements: [],
      suggestions: []
    };

    const { grades, certificates } = studentData;

    // Check minimum grade requirement
    if (this.requirements.minGrade) {
      const studentGrade = grades?.overall || 'F';
      const gradeOrder = { 'A': 5, 'B': 4, 'C': 3, 'D': 2, 'E': 1, 'F': 0 };
      
      if (gradeOrder[studentGrade] < gradeOrder[this.requirements.minGrade]) {
        eligibility.isEligible = false;
        eligibility.missingRequirements.push(`Minimum grade of ${this.requirements.minGrade} required`);
      } else {
        eligibility.meetsRequirements.push(`Meets minimum grade requirement (${this.requirements.minGrade})`);
      }
    }

    // Check required subjects
    if (this.requirements.subjects && this.requirements.subjects.length > 0) {
      const missingSubjects = this.requirements.subjects.filter(
        subject => !grades?.subjects || !grades.subjects[subject]
      );

      if (missingSubjects.length > 0) {
        eligibility.isEligible = false;
        eligibility.missingRequirements.push(`Missing required subjects: ${missingSubjects.join(', ')}`);
      } else {
        eligibility.meetsRequirements.push('Meets all subject requirements');
      }
    }

    // Check certificate requirements
    if (this.requirements.certificates && this.requirements.certificates.length > 0) {
      const missingCertificates = this.requirements.certificates.filter(
        cert => !certificates?.includes(cert)
      );

      if (missingCertificates.length > 0) {
        eligibility.isEligible = false;
        eligibility.missingRequirements.push(`Missing required certificates: ${missingCertificates.join(', ')}`);
      } else {
        eligibility.meetsRequirements.push('Meets all certificate requirements');
      }
    }

    // Check minimum points
    if (this.requirements.minPoints) {
      const studentPoints = grades?.points || 0;
      if (studentPoints < this.requirements.minPoints) {
        eligibility.isEligible = false;
        eligibility.missingRequirements.push(`Minimum of ${this.requirements.minPoints} points required`);
      } else {
        eligibility.meetsRequirements.push(`Meets minimum points requirement (${this.requirements.minPoints})`);
      }
    }

    // Provide suggestions if not eligible
    if (!eligibility.isEligible) {
      eligibility.suggestions.push(
        'Consider improving your grades in the required subjects',
        'Explore alternative courses with lower requirements',
        'Contact the institution for special consideration'
      );
    }

    return eligibility;
  }

  // Get course applications
  async getApplications(options = {}) {
    try {
      const { status, page = 1, limit = 20 } = options;

      let query = db.collection(collections.APPLICATIONS)
        .where('courseId', '==', this.id);

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
        
        // Get student details
        const studentDoc = await db.collection(collections.USERS).doc(applicationData.studentId).get();
        const studentData = studentDoc.data();

        applications.push({
          id: doc.id,
          ...applicationData,
          student: {
            id: studentData.id,
            firstName: studentData.firstName,
            lastName: studentData.lastName,
            email: studentData.email,
            phone: studentData.phone
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
      throw new Error(`Failed to get course applications: ${error.message}`);
    }
  }

  // Get similar courses
  async getSimilarCourses(limit = 4) {
    try {
      const snapshot = await db.collection(collections.COURSES)
        .where('institutionId', '==', this.institutionId)
        .where('status', '==', 'active')
        .where('id', '!=', this.id)
        .limit(limit)
        .get();

      const similarCourses = [];
      snapshot.forEach(doc => {
        const courseData = doc.data();
        similarCourses.push({
          id: doc.id,
          name: courseData.name,
          faculty: courseData.faculty,
          duration: courseData.duration
        });
      });

      return similarCourses;
    } catch (error) {
      throw new Error(`Failed to get similar courses: ${error.message}`);
    }
  }

  // Check if course is active
  isActive() {
    return this.status === 'active';
  }

  // Check if course is accepting applications
  isAcceptingApplications() {
    if (!this.isActive()) {
      return false;
    }

    if (this.intake?.deadline && new Date(this.intake.deadline) < new Date()) {
      return false;
    }

    return true;
  }

  // Convert to plain object
  toObject() {
    return {
      id: this.id,
      name: this.name,
      institutionId: this.institutionId,
      institutionName: this.institutionName,
      faculty: this.faculty,
      duration: this.duration,
      description: this.description,
      requirements: this.requirements,
      curriculum: this.curriculum,
      intake: this.intake,
      fees: this.fees,
      status: this.status,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  // Convert to Firestore format
  toFirestore() {
    return {
      id: this.id,
      name: this.name,
      institutionId: this.institutionId,
      institutionName: this.institutionName,
      faculty: this.faculty,
      duration: this.duration,
      description: this.description,
      requirements: this.requirements,
      curriculum: this.curriculum,
      intake: this.intake,
      fees: this.fees,
      status: this.status,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  // Validate course data
  static validate(courseData) {
    const errors = [];

    if (!courseData.name || courseData.name.length < 2) {
      errors.push('Course name must be at least 2 characters long');
    }

    if (!courseData.institutionId) {
      errors.push('Institution ID is required');
    }

    if (!courseData.faculty || courseData.faculty.length < 2) {
      errors.push('Faculty name is required');
    }

    if (!courseData.duration || courseData.duration.length < 2) {
      errors.push('Duration is required');
    }

    if (!courseData.description || courseData.description.length < 10) {
      errors.push('Description must be at least 10 characters long');
    }

    if (!courseData.requirements) {
      errors.push('Requirements are required');
    }

    return errors;
  }
}

export default Course;