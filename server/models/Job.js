import { db } from '../config/firebase-admin.js';
import { collections } from '../config/database.js';

class Job {
  constructor(data) {
    this.id = data.id;
    this.title = data.title;
    this.companyId = data.companyId;
    this.companyName = data.companyName;
    this.type = data.type;
    this.location = data.location;
    this.category = data.category;
    this.experienceLevel = data.experienceLevel;
    this.description = data.description;
    this.responsibilities = data.responsibilities || [];
    
    // SIMPLIFIED: Only educational level and GPA requirements
    this.requirements = {
      educationalLevel: data.requirements?.educationalLevel || '', // high_school, bachelor, master, phd
      minGPA: data.requirements?.minGPA || 0, // 0-4.0 scale
      ...data.requirements
    };
    
    this.benefits = data.benefits || [];
    this.salary = data.salary || {};
    this.applicationDeadline = data.applicationDeadline;
    this.status = data.status || 'active';
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  // Static method to create a new job
  static async create(jobData) {
    try {
      const jobRef = db.collection(collections.JOBS).doc(jobData.id);
      const job = new Job({
        ...jobData,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      await jobRef.set(job.toFirestore());
      return job;
    } catch (error) {
      throw new Error(`Failed to create job: ${error.message}`);
    }
  }

  // Static method to find job by ID
  static async findById(jobId) {
    try {
      const jobDoc = await db.collection(collections.JOBS).doc(jobId).get();
      
      if (!jobDoc.exists) {
        return null;
      }

      return new Job({
        id: jobDoc.id,
        ...jobDoc.data()
      });
    } catch (error) {
      throw new Error(`Failed to find job: ${error.message}`);
    }
  }

  // Static method to find jobs with filtering and pagination
  static async find(filter = {}, options = {}) {
    try {
      const { 
        company, 
        type, 
        category, 
        location, 
        experienceLevel,
        search,
        status = 'active',
        page = 1, 
        limit = 10 
      } = filter;

      let query = db.collection(collections.JOBS);

      // Apply filters
      if (company) {
        query = query.where('companyId', '==', company);
      }

      if (type) {
        query = query.where('type', '==', type);
      }

      if (category) {
        query = query.where('category', '==', category);
      }

      if (location) {
        query = query.where('location', '==', location);
      }

      if (experienceLevel) {
        query = query.where('experienceLevel', '==', experienceLevel);
      }

      if (status) {
        query = query.where('status', '==', status);
      }

      if (search) {
        query = query.where('title', '>=', search).where('title', '<=', search + '\uf8ff');
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

      const jobs = [];
      
      // Get company details for each job
      for (const doc of snapshot.docs) {
        const jobData = doc.data();
        
        // Get company details
        const companyDoc = await db.collection(collections.COMPANIES)
          .doc(jobData.companyId)
          .get();
        const companyData = companyDoc.data();

        jobs.push(new Job({
          id: doc.id,
          ...jobData,
          companyName: companyData?.name
        }));
      }

      return {
        jobs,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      throw new Error(`Failed to find jobs: ${error.message}`);
    }
  }

  // NEW: Static method to find jobs qualified for a student
  static async findQualifiedForStudent(studentProfile, options = {}) {
    try {
      const { page = 1, limit = 10 } = options;

      // Get all active jobs
      let query = db.collection(collections.JOBS)
        .where('status', '==', 'active');

      const snapshot = await query
        .orderBy('createdAt', 'desc')
        .get();

      const allJobs = [];
      snapshot.forEach(doc => {
        allJobs.push(new Job({
          id: doc.id,
          ...doc.data()
        }));
      });

      // Filter jobs based on student qualifications
      const qualifiedJobs = allJobs.filter(job => {
        return job.checkStudentQualification(studentProfile);
      });

      // Apply pagination
      const startIndex = (page - 1) * limit;
      const paginatedJobs = qualifiedJobs.slice(startIndex, startIndex + limit);

      return {
        jobs: paginatedJobs,
        pagination: {
          page,
          limit,
          total: qualifiedJobs.length,
          pages: Math.ceil(qualifiedJobs.length / limit)
        }
      };
    } catch (error) {
      throw new Error(`Failed to find qualified jobs: ${error.message}`);
    }
  }

  // NEW: Check if student qualifies for this job
  checkStudentQualification(studentProfile) {
    const studentEducation = studentProfile?.qualifications || {};
    const studentGPA = parseFloat(studentEducation.gpa) || 0;
    const studentLevel = studentEducation.educationLevel || '';
    
    // Check educational level
    const educationLevels = ['high_school', 'associate', 'bachelor', 'master', 'phd'];
    const studentLevelIndex = educationLevels.indexOf(studentLevel);
    const requiredLevelIndex = educationLevels.indexOf(this.requirements.educationalLevel);
    
    const meetsEducationLevel = studentLevelIndex >= requiredLevelIndex;
    
    // Check GPA
    const meetsGPA = studentGPA >= this.requirements.minGPA;
    
    return meetsEducationLevel && meetsGPA;
  }

  // NEW: Get qualification breakdown for display
  getQualificationBreakdown(studentProfile) {
    const studentEducation = studentProfile?.qualifications || {};
    const studentGPA = parseFloat(studentEducation.gpa) || 0;
    const studentLevel = studentEducation.educationLevel || '';
    
    const educationLevels = {
      'high_school': 'High School Diploma',
      'associate': 'Associate Degree',
      'bachelor': "Bachelor's Degree",
      'master': "Master's Degree",
      'phd': 'PhD'
    };

    const breakdown = [];

    // Education level check
    const studentLevelIndex = ['high_school', 'associate', 'bachelor', 'master', 'phd'].indexOf(studentLevel);
    const requiredLevelIndex = ['high_school', 'associate', 'bachelor', 'master', 'phd'].indexOf(this.requirements.educationalLevel);
    
    breakdown.push({
      requirement: `Education Level: ${educationLevels[this.requirements.educationalLevel] || this.requirements.educationalLevel}`,
      studentValue: educationLevels[studentLevel] || studentLevel || 'Not specified',
      meets: studentLevelIndex >= requiredLevelIndex
    });

    // GPA check
    breakdown.push({
      requirement: `Minimum GPA: ${this.requirements.minGPA}`,
      studentValue: studentGPA > 0 ? studentGPA.toFixed(1) : 'Not specified',
      meets: studentGPA >= this.requirements.minGPA
    });

    return breakdown;
  }

  // Update job
  async update(updateData) {
    try {
      const jobRef = db.collection(collections.JOBS).doc(this.id);
      
      const updatedData = {
        ...updateData,
        updatedAt: new Date()
      };

      await jobRef.update(updatedData);

      // Update instance properties
      Object.assign(this, updatedData);
      
      return this;
    } catch (error) {
      throw new Error(`Failed to update job: ${error.message}`);
    }
  }

  // Update job status
  async updateStatus(status) {
    try {
      return await this.update({
        status,
        updatedAt: new Date()
      });
    } catch (error) {
      throw new Error(`Failed to update job status: ${error.message}`);
    }
  }

  // Close job (stop accepting applications)
  async close() {
    try {
      return await this.update({
        status: 'closed',
        updatedAt: new Date()
      });
    } catch (error) {
      throw new Error(`Failed to close job: ${error.message}`);
    }
  }

  // Get job applications
  async getApplications(options = {}) {
    try {
      const { status, page = 1, limit = 20 } = options;

      let query = db.collection(collections.JOB_APPLICATIONS)
        .where('jobId', '==', this.id);

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
            email: studentData.email
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
      throw new Error(`Failed to get job applications: ${error.message}`);
    }
  }

  // Check if job is active
  isActive() {
    return this.status === 'active';
  }

  // Check if job is accepting applications
  isAcceptingApplications() {
    if (!this.isActive()) {
      return false;
    }

    if (this.applicationDeadline && new Date(this.applicationDeadline) < new Date()) {
      return false;
    }

    return true;
  }

  // Convert to plain object
  toObject() {
    return {
      id: this.id,
      title: this.title,
      companyId: this.companyId,
      companyName: this.companyName,
      type: this.type,
      location: this.location,
      category: this.category,
      experienceLevel: this.experienceLevel,
      description: this.description,
      responsibilities: this.responsibilities,
      requirements: this.requirements,
      benefits: this.benefits,
      salary: this.salary,
      applicationDeadline: this.applicationDeadline,
      status: this.status,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  // Convert to Firestore format
  toFirestore() {
    return {
      id: this.id,
      title: this.title,
      companyId: this.companyId,
      companyName: this.companyName,
      type: this.type,
      location: this.location,
      category: this.category,
      experienceLevel: this.experienceLevel,
      description: this.description,
      responsibilities: this.responsibilities,
      requirements: this.requirements,
      benefits: this.benefits,
      salary: this.salary,
      applicationDeadline: this.applicationDeadline,
      status: this.status,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  // Validate job data
  static validate(jobData) {
    const errors = [];

    if (!jobData.title || jobData.title.length < 2) {
      errors.push('Job title must be at least 2 characters long');
    }

    if (!jobData.companyId) {
      errors.push('Company ID is required');
    }

    if (!jobData.type || !['full-time', 'part-time', 'contract', 'internship', 'remote'].includes(jobData.type)) {
      errors.push('Valid job type is required');
    }

    if (!jobData.location || jobData.location.length < 2) {
      errors.push('Location is required');
    }

    if (!jobData.description || jobData.description.length < 10) {
      errors.push('Description must be at least 10 characters long');
    }

    // Validate educational requirements
    if (jobData.requirements) {
      const validEducationLevels = ['high_school', 'associate', 'bachelor', 'master', 'phd'];
      if (jobData.requirements.educationalLevel && !validEducationLevels.includes(jobData.requirements.educationalLevel)) {
        errors.push('Valid educational level is required: high_school, associate, bachelor, master, phd');
      }

      if (jobData.requirements.minGPA && (jobData.requirements.minGPA < 0 || jobData.requirements.minGPA > 4.0)) {
        errors.push('Minimum GPA must be between 0 and 4.0');
      }
    }

    return errors;
  }
}

export default Job;