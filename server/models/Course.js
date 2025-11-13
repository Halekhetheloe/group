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
    
    // SIMPLIFIED: Only grades and points requirements
    this.requirements = {
      minGrade: data.requirements?.minGrade || null, // A, B, C, D
      minPoints: data.requirements?.minPoints || null, // Numeric points
      subjects: data.requirements?.subjects || [], // Required subjects
      ...data.requirements
    };
    
    this.curriculum = data.curriculum || [];
    this.intake = data.intake || {};
    this.fees = data.fees || {};
    this.status = data.status || 'active';
    this.applicationDeadline = data.applicationDeadline || null;
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

  // Static method to find courses with filtering
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
        query = query.where('name', '>=', search).where('name', '<=', search + '\uf8ff');
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

      const courses = [];
      snapshot.forEach(doc => {
        courses.push(new Course({
          id: doc.id,
          ...doc.data()
        }));
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
      throw new Error(`Failed to find courses: ${error.message}`);
    }
  }

  // NEW: Static method to find courses qualified for a student
  static async findQualifiedForStudent(studentProfile, options = {}) {
    try {
      const { page = 1, limit = 10 } = options;

      // Get all active courses
      let query = db.collection(collections.COURSES)
        .where('status', '==', 'active');

      const snapshot = await query
        .orderBy('createdAt', 'desc')
        .get();

      const allCourses = [];
      snapshot.forEach(doc => {
        allCourses.push(new Course({
          id: doc.id,
          ...doc.data()
        }));
      });

      // Filter courses based on student grades
      const qualifiedCourses = allCourses.filter(course => {
        return course.checkStudentQualification(studentProfile);
      });

      // Apply pagination
      const startIndex = (page - 1) * limit;
      const paginatedCourses = qualifiedCourses.slice(startIndex, startIndex + limit);

      return {
        courses: paginatedCourses,
        pagination: {
          page,
          limit,
          total: qualifiedCourses.length,
          pages: Math.ceil(qualifiedCourses.length / limit)
        }
      };
    } catch (error) {
      throw new Error(`Failed to find qualified courses: ${error.message}`);
    }
  }

  // NEW: Check if student qualifies for this course
  checkStudentQualification(studentProfile) {
    const studentEducation = studentProfile?.qualifications || {};
    const studentGrades = studentEducation.grades || {};
    
    const studentOverallGrade = studentGrades.overall || '';
    const studentSubjects = studentGrades.subjects || {};
    const studentPoints = studentGrades.points || 0;

    // Check minimum grade
    if (this.requirements.minGrade) {
      const gradeOrder = { 'A': 4, 'B': 3, 'C': 2, 'D': 1 };
      const studentGradeValue = gradeOrder[studentOverallGrade] || 0;
      const requiredGradeValue = gradeOrder[this.requirements.minGrade] || 0;
      
      if (studentGradeValue < requiredGradeValue) {
        return false;
      }
    }

    // Check minimum points
    if (this.requirements.minPoints && studentPoints < this.requirements.minPoints) {
      return false;
    }

    // Check required subjects
    if (this.requirements.subjects && this.requirements.subjects.length > 0) {
      const hasAllSubjects = this.requirements.subjects.every(subject => 
        studentSubjects.hasOwnProperty(subject)
      );
      
      if (!hasAllSubjects) {
        return false;
      }
    }

    return true;
  }

  // NEW: Get qualification breakdown for display
  getQualificationBreakdown(studentProfile) {
    const studentEducation = studentProfile?.qualifications || {};
    const studentGrades = studentEducation.grades || {};
    
    const studentOverallGrade = studentGrades.overall || '';
    const studentSubjects = studentGrades.subjects || {};
    const studentPoints = studentGrades.points || 0;

    const breakdown = [];

    // Minimum grade check
    if (this.requirements.minGrade) {
      const gradeOrder = { 'A': 4, 'B': 3, 'C': 2, 'D': 1 };
      const studentGradeValue = gradeOrder[studentOverallGrade] || 0;
      const requiredGradeValue = gradeOrder[this.requirements.minGrade] || 0;
      
      breakdown.push({
        requirement: `Minimum Grade: ${this.requirements.minGrade}`,
        studentValue: studentOverallGrade || 'Not specified',
        meets: studentGradeValue >= requiredGradeValue
      });
    }

    // Minimum points check
    if (this.requirements.minPoints) {
      breakdown.push({
        requirement: `Minimum Points: ${this.requirements.minPoints}`,
        studentValue: studentPoints > 0 ? studentPoints.toString() : 'Not specified',
        meets: studentPoints >= this.requirements.minPoints
      });
    }

    // Required subjects check
    if (this.requirements.subjects && this.requirements.subjects.length > 0) {
      const missingSubjects = this.requirements.subjects.filter(subject => 
        !studentSubjects.hasOwnProperty(subject)
      );
      
      breakdown.push({
        requirement: `Required Subjects: ${this.requirements.subjects.join(', ')}`,
        studentValue: Object.keys(studentSubjects).length > 0 ? Object.keys(studentSubjects).join(', ') : 'No subjects specified',
        meets: missingSubjects.length === 0
      });
    }

    return breakdown;
  }

  // Check course eligibility for a student
  async checkEligibility(studentId) {
    try {
      // Get student data
      const studentDoc = await db.collection(collections.USERS).doc(studentId).get();
      if (!studentDoc.exists()) {
        throw new Error('Student not found');
      }

      const studentData = studentDoc.data();
      const studentProfile = studentData.qualifications || {};

      return this.checkStudentQualification(studentProfile);
    } catch (error) {
      console.error('Error checking course eligibility:', error);
      throw error;
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
      applicationDeadline: this.applicationDeadline,
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
      applicationDeadline: this.applicationDeadline,
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

    // Validate requirements structure
    if (courseData.requirements) {
      if (courseData.requirements.minGrade && !['A', 'B', 'C', 'D'].includes(courseData.requirements.minGrade)) {
        errors.push('Minimum grade must be A, B, C, or D');
      }

      if (courseData.requirements.minPoints && (courseData.requirements.minPoints < 0 || courseData.requirements.minPoints > 100)) {
        errors.push('Minimum points must be between 0 and 100');
      }
    }

    return errors;
  }
}

export default Course;