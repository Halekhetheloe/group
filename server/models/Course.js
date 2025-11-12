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
    this.requirements = data.requirements || {
      minGrade: data.requirements?.minGrade || null,
      minPoints: data.requirements?.minPoints || null,
      subjects: data.requirements?.subjects || [],
      certificates: data.requirements?.certificates || []
    };
    this.curriculum = data.curriculum || [];
    this.intake = data.intake || {};
    this.fees = data.fees || {};
    this.status = data.status || 'active';
    this.applicationDeadline = data.applicationDeadline || null;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  // ... existing static methods ...

  // Check course eligibility for a student
  async checkEligibility(studentId) {
    try {
      // Get student data
      const studentDoc = await db.collection(collections.USERS).doc(studentId).get();
      if (!studentDoc.exists()) {
        throw new Error('Student not found');
      }

      const studentData = studentDoc.data();
      const studentGrades = studentData.grades || studentData.academicRecords;

      if (!studentGrades) {
        return {
          eligible: false,
          missingRequirements: ['No grade information available'],
          meetsRequirements: []
        };
      }

      return this.checkEligibilityWithGrades(studentGrades);
    } catch (error) {
      console.error('Error checking course eligibility:', error);
      throw error;
    }
  }

  // Check eligibility with provided grades
  checkEligibilityWithGrades(studentGrades) {
    const eligibility = {
      eligible: true,
      missingRequirements: [],
      meetsRequirements: [],
      suggestions: []
    };

    // Check minimum grade requirement
    if (this.requirements.minGrade) {
      const gradeOrder = { 'A': 5, 'B': 4, 'C': 3, 'D': 2, 'E': 1, 'F': 0 };
      const studentOverallGrade = studentGrades.overall || 'F';
      
      if (gradeOrder[studentOverallGrade] < gradeOrder[this.requirements.minGrade]) {
        eligibility.eligible = false;
        eligibility.missingRequirements.push(`Minimum grade of ${this.requirements.minGrade} required (your grade: ${studentOverallGrade})`);
      } else {
        eligibility.meetsRequirements.push(`Meets grade requirement (${this.requirements.minGrade})`);
      }
    }

    // Check subject requirements
    if (this.requirements.subjects && this.requirements.subjects.length > 0) {
      const missingSubjects = this.requirements.subjects.filter(subject => 
        !studentGrades.subjects || !studentGrades.subjects[subject]
      );

      if (missingSubjects.length > 0) {
        eligibility.eligible = false;
        eligibility.missingRequirements.push(`Missing required subjects: ${missingSubjects.join(', ')}`);
      } else {
        eligibility.meetsRequirements.push('Meets all subject requirements');
      }
    }

    // Check minimum points
    if (this.requirements.minPoints) {
      const studentPoints = studentGrades.points || 0;
      if (studentPoints < this.requirements.minPoints) {
        eligibility.eligible = false;
        eligibility.missingRequirements.push(`Minimum ${this.requirements.minPoints} points required (your points: ${studentPoints})`);
      } else {
        eligibility.meetsRequirements.push(`Meets points requirement (${this.requirements.minPoints})`);
      }
    }

    // Provide suggestions if not eligible
    if (!eligibility.eligible) {
      eligibility.suggestions.push(
        'Consider improving your grades in the required subjects',
        'Explore alternative courses with lower requirements',
        'Contact the institution for special consideration'
      );
    }

    return eligibility;
  }

  // Get similar eligible courses for a student
  static async getSimilarEligibleCourses(courseId, studentId, limit = 4) {
    try {
      // Get current course
      const currentCourse = await Course.findById(courseId);
      if (!currentCourse) {
        throw new Error('Course not found');
      }

      // Get student grades
      const studentDoc = await db.collection(collections.USERS).doc(studentId).get();
      const studentData = studentDoc.data();
      const studentGrades = studentData.grades || studentData.academicRecords;

      // Get courses from same institution and faculty
      const snapshot = await db.collection(collections.COURSES)
        .where('institutionId', '==', currentCourse.institutionId)
        .where('faculty', '==', currentCourse.faculty)
        .where('status', '==', 'active')
        .where('id', '!=', courseId)
        .limit(limit * 2) // Get more to filter by eligibility
        .get();

      const similarCourses = [];

      for (const doc of snapshot.docs) {
        const courseData = doc.data();
        const course = new Course({
          id: doc.id,
          ...courseData
        });

        // Check eligibility if student grades are available
        if (studentGrades) {
          const eligibility = course.checkEligibilityWithGrades(studentGrades);
          if (eligibility.eligible) {
            similarCourses.push({
              id: course.id,
              name: course.name,
              faculty: course.faculty,
              duration: course.duration,
              eligibility
            });
          }
        } else {
          // Include all courses if no grades available
          similarCourses.push({
            id: course.id,
            name: course.name,
            faculty: course.faculty,
            duration: course.duration
          });
        }

        if (similarCourses.length >= limit) break;
      }

      return similarCourses;
    } catch (error) {
      throw new Error(`Failed to get similar courses: ${error.message}`);
    }
  }

  // ... rest of existing methods ...

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
      if (courseData.requirements.minGrade && !['A', 'B', 'C', 'D', 'E', 'F'].includes(courseData.requirements.minGrade)) {
        errors.push('Minimum grade must be A, B, C, D, E, or F');
      }

      if (courseData.requirements.minPoints && (courseData.requirements.minPoints < 0 || courseData.requirements.minPoints > 100)) {
        errors.push('Minimum points must be between 0 and 100');
      }
    }

    return errors;
  }
}

export default Course;