import { db } from '../config/firebase-admin.js';
import { collections } from '../config/database.js';

class Transcript {
  constructor(data) {
    this.id = data.id;
    this.studentId = data.studentId;
    this.institutionId = data.institutionId;
    this.institutionName = data.institutionName;
    this.degree = data.degree;
    this.graduationYear = data.graduationYear;
    this.gpa = data.gpa || null;
    this.courses = data.courses || [];
    this.fileUrl = data.fileUrl;
    this.filePath = data.filePath;
    this.verified = data.verified || false;
    this.verifiedAt = data.verifiedAt || null;
    this.verifiedBy = data.verifiedBy || null;
    this.uploadedAt = data.uploadedAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  // Static method to create a new transcript
  static async create(transcriptData) {
    try {
      const transcriptRef = db.collection(collections.TRANSCRIPTS).doc(transcriptData.id);
      const transcript = new Transcript({
        ...transcriptData,
        uploadedAt: new Date(),
        updatedAt: new Date()
      });

      await transcriptRef.set(transcript.toFirestore());
      return transcript;
    } catch (error) {
      throw new Error(`Failed to create transcript: ${error.message}`);
    }
  }

  // Static method to find transcript by ID
  static async findById(transcriptId) {
    try {
      const transcriptDoc = await db.collection(collections.TRANSCRIPTS).doc(transcriptId).get();
      
      if (!transcriptDoc.exists) {
        return null;
      }

      return new Transcript({
        id: transcriptDoc.id,
        ...transcriptDoc.data()
      });
    } catch (error) {
      throw new Error(`Failed to find transcript: ${error.message}`);
    }
  }

  // Static method to find transcripts with filtering and pagination
  static async find(filter = {}, options = {}) {
    try {
      const { 
        studentId,
        institutionId,
        verified,
        page = 1, 
        limit = 10 
      } = filter;

      let query = db.collection(collections.TRANSCRIPTS);

      // Apply filters
      if (studentId) {
        query = query.where('studentId', '==', studentId);
      }

      if (institutionId) {
        query = query.where('institutionId', '==', institutionId);
      }

      if (verified !== undefined) {
        query = query.where('verified', '==', verified);
      }

      // Get total count
      const countSnapshot = await query.get();
      const total = countSnapshot.size;

      // Apply pagination
      const startAfter = (page - 1) * limit;
      const snapshot = await query
        .orderBy('uploadedAt', 'desc')
        .offset(startAfter)
        .limit(limit)
        .get();

      const transcripts = [];
      snapshot.forEach(doc => {
        transcripts.push(new Transcript({
          id: doc.id,
          ...doc.data()
        }));
      });

      return {
        transcripts,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      throw new Error(`Failed to find transcripts: ${error.message}`);
    }
  }

  // Static method to find transcripts by student
  static async findByStudent(studentId, options = {}) {
    try {
      const { verified, page = 1, limit = 10 } = options;

      let query = db.collection(collections.TRANSCRIPTS)
        .where('studentId', '==', studentId);

      if (verified !== undefined) {
        query = query.where('verified', '==', verified);
      }

      // Get total count
      const countSnapshot = await query.get();
      const total = countSnapshot.size;

      // Apply pagination
      const startAfter = (page - 1) * limit;
      const snapshot = await query
        .orderBy('uploadedAt', 'desc')
        .offset(startAfter)
        .limit(limit)
        .get();

      const transcripts = [];
      snapshot.forEach(doc => {
        transcripts.push(new Transcript({
          id: doc.id,
          ...doc.data()
        }));
      });

      return {
        transcripts,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      throw new Error(`Failed to find student transcripts: ${error.message}`);
    }
  }

  // Update transcript
  async update(updateData) {
    try {
      const transcriptRef = db.collection(collections.TRANSCRIPTS).doc(this.id);
      
      const updatedData = {
        ...updateData,
        updatedAt: new Date()
      };

      await transcriptRef.update(updatedData);

      // Update instance properties
      Object.assign(this, updatedData);
      
      return this;
    } catch (error) {
      throw new Error(`Failed to update transcript: ${error.message}`);
    }
  }

  // Verify transcript
  async verify(verifiedBy) {
    try {
      return await this.update({
        verified: true,
        verifiedAt: new Date(),
        verifiedBy,
        updatedAt: new Date()
      });
    } catch (error) {
      throw new Error(`Failed to verify transcript: ${error.message}`);
    }
  }

  // Unverify transcript
  async unverify() {
    try {
      return await this.update({
        verified: false,
        verifiedAt: null,
        verifiedBy: null,
        updatedAt: new Date()
      });
    } catch (error) {
      throw new Error(`Failed to unverify transcript: ${error.message}`);
    }
  }

  // Get transcript with full details
  async getFullDetails() {
    try {
      // Get student details
      const studentDoc = await db.collection(collections.USERS).doc(this.studentId).get();
      const studentData = studentDoc.data();

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
          email: studentData.email
        },
        institution: {
          id: institutionData.id,
          name: institutionData.name,
          location: institutionData.location
        }
      };
    } catch (error) {
      throw new Error(`Failed to get transcript details: ${error.message}`);
    }
  }

  // Calculate overall GPA from courses
  calculateGPA() {
    if (!this.courses || this.courses.length === 0) {
      return null;
    }

    const gradePoints = {
      'A': 4.0, 'A-': 3.7, 'B+': 3.3, 'B': 3.0, 'B-': 2.7,
      'C+': 2.3, 'C': 2.0, 'C-': 1.7, 'D+': 1.3, 'D': 1.0, 'F': 0.0
    };

    let totalPoints = 0;
    let totalCredits = 0;

    this.courses.forEach(course => {
      const grade = course.grade?.toUpperCase();
      const credits = course.credits || 1;

      if (gradePoints[grade] !== undefined) {
        totalPoints += gradePoints[grade] * credits;
        totalCredits += credits;
      }
    });

    return totalCredits > 0 ? totalPoints / totalCredits : null;
  }

  // Get academic performance summary
  getPerformanceSummary() {
    if (!this.courses || this.courses.length === 0) {
      return null;
    }

    const summary = {
      totalCourses: this.courses.length,
      completedCredits: 0,
      gradeDistribution: {},
      averageGPA: this.calculateGPA()
    };

    const gradePoints = {
      'A': 4.0, 'A-': 3.7, 'B+': 3.3, 'B': 3.0, 'B-': 2.7,
      'C+': 2.3, 'C': 2.0, 'C-': 1.7, 'D+': 1.3, 'D': 1.0, 'F': 0.0
    };

    this.courses.forEach(course => {
      const grade = course.grade?.toUpperCase();
      const credits = course.credits || 1;

      summary.completedCredits += credits;

      if (grade) {
        summary.gradeDistribution[grade] = (summary.gradeDistribution[grade] || 0) + 1;
      }
    });

    return summary;
  }

  // Check if transcript is verified
  isVerified() {
    return this.verified;
  }

  // Convert to plain object
  toObject() {
    return {
      id: this.id,
      studentId: this.studentId,
      institutionId: this.institutionId,
      institutionName: this.institutionName,
      degree: this.degree,
      graduationYear: this.graduationYear,
      gpa: this.gpa,
      courses: this.courses,
      fileUrl: this.fileUrl,
      filePath: this.filePath,
      verified: this.verified,
      verifiedAt: this.verifiedAt,
      verifiedBy: this.verifiedBy,
      uploadedAt: this.uploadedAt,
      updatedAt: this.updatedAt
    };
  }

  // Convert to Firestore format
  toFirestore() {
    return {
      id: this.id,
      studentId: this.studentId,
      institutionId: this.institutionId,
      institutionName: this.institutionName,
      degree: this.degree,
      graduationYear: this.graduationYear,
      gpa: this.gpa,
      courses: this.courses,
      fileUrl: this.fileUrl,
      filePath: this.filePath,
      verified: this.verified,
      verifiedAt: this.verifiedAt,
      verifiedBy: this.verifiedBy,
      uploadedAt: this.uploadedAt,
      updatedAt: this.updatedAt
    };
  }

  // Validate transcript data
  static validate(transcriptData) {
    const errors = [];

    if (!transcriptData.studentId) {
      errors.push('Student ID is required');
    }

    if (!transcriptData.institutionId) {
      errors.push('Institution ID is required');
    }

    if (!transcriptData.degree || transcriptData.degree.length < 2) {
      errors.push('Degree name is required');
    }

    if (!transcriptData.graduationYear || transcriptData.graduationYear < 1900 || transcriptData.graduationYear > new Date().getFullYear() + 5) {
      errors.push('Valid graduation year is required');
    }

    if (!transcriptData.fileUrl) {
      errors.push('File URL is required');
    }

    return errors;
  }
}

export default Transcript;