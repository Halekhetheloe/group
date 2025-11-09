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
    this.requirements = data.requirements || {};
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
        // Basic search implementation
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

  // Static method to find jobs by company
  static async findByCompany(companyId, options = {}) {
    try {
      const { status, page = 1, limit = 10 } = options;

      let query = db.collection(collections.JOBS)
        .where('companyId', '==', companyId);

      if (status) {
        query = query.where('status', '==', status);
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
      snapshot.forEach(doc => {
        jobs.push(new Job({
          id: doc.id,
          ...doc.data()
        }));
      });

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
      throw new Error(`Failed to find company jobs: ${error.message}`);
    }
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

  // Get similar jobs
  async getSimilarJobs(limit = 4) {
    try {
      const snapshot = await db.collection(collections.JOBS)
        .where('companyId', '==', this.companyId)
        .where('status', '==', 'active')
        .where('id', '!=', this.id)
        .limit(limit)
        .get();

      const similarJobs = [];
      snapshot.forEach(doc => {
        const jobData = doc.data();
        similarJobs.push({
          id: doc.id,
          title: jobData.title,
          type: jobData.type,
          location: jobData.location,
          experienceLevel: jobData.experienceLevel
        });
      });

      return similarJobs;
    } catch (error) {
      throw new Error(`Failed to get similar jobs: ${error.message}`);
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

  // Check job match with student profile
  checkMatch(studentProfile) {
    const match = {
      score: 0,
      matchedCriteria: [],
      missingCriteria: []
    };

    const { education, skills, experience, transcripts } = studentProfile;

    // Education match
    if (this.requirements.education) {
      if (education && education.includes(this.requirements.education)) {
        match.score += 25;
        match.matchedCriteria.push('education');
      } else {
        match.missingCriteria.push('education');
      }
    }

    // Skills match
    if (this.requirements.skills && this.requirements.skills.length > 0) {
      const matchedSkills = this.requirements.skills.filter(skill => 
        skills && skills.includes(skill)
      );
      
      const skillMatchPercentage = (matchedSkills.length / this.requirements.skills.length) * 100;
      match.score += (skillMatchPercentage * 0.25); // 25% of total score
      
      if (skillMatchPercentage > 50) {
        match.matchedCriteria.push('skills');
      } else {
        match.missingCriteria.push('skills');
      }
    }

    // Experience match
    if (this.requirements.experience) {
      if (experience && experience >= this.parseExperience(this.requirements.experience)) {
        match.score += 25;
        match.matchedCriteria.push('experience');
      } else {
        match.missingCriteria.push('experience');
      }
    }

    // GPA match (if transcripts available)
    if (transcripts && transcripts.length > 0) {
      const averageGPA = transcripts.reduce((sum, t) => sum + (t.gpa || 0), 0) / transcripts.length;
      if (averageGPA >= 3.0) {
        match.score += 25;
        match.matchedCriteria.push('academic performance');
      }
    } else {
      match.score += 15; // Base score if no transcripts
    }

    // Round score to 2 decimal places
    match.score = Math.round(match.score * 100) / 100;

    return match;
  }

  // Helper method to parse experience requirements
  parseExperience(experienceString) {
    const years = experienceString.match(/\d+/);
    return years ? parseInt(years[0]) : 0;
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

    if (!jobData.requirements) {
      errors.push('Requirements are required');
    }

    return errors;
  }
}

export default Job;