import { db } from '../config/firebase-admin.js';
import { collections } from '../config/database.js';
import { validateJob, validateJobApplication } from '../validators/jobValidators.js';

export const getJobs = async (req, res) => {
  try {
    const { 
      company, 
      type, 
      category, 
      location, 
      experienceLevel,
      search, 
      page = 1, 
      limit = 10 
    } = req.query;

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

    if (search) {
      // Basic search implementation
      query = query.where('title', '>=', search).where('title', '<=', search + '\uf8ff');
    }

    // Get total count for pagination
    const countSnapshot = await query.get();
    const total = countSnapshot.size;

    // Apply pagination
    const startAfter = (page - 1) * limit;
    const snapshot = await query
      .where('status', '==', 'active')
      .orderBy('createdAt', 'desc')
      .offset(startAfter)
      .limit(parseInt(limit))
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

      jobs.push({
        id: doc.id,
        title: jobData.title,
        companyId: jobData.companyId,
        companyName: companyData?.name || 'Unknown Company',
        type: jobData.type,
        location: jobData.location,
        category: jobData.category,
        experienceLevel: jobData.experienceLevel,
        description: jobData.description,
        requirements: jobData.requirements,
        salary: jobData.salary,
        applicationDeadline: jobData.applicationDeadline,
        createdAt: jobData.createdAt
      });
    }

    res.json({
      success: true,
      jobs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get jobs error:', error);
    res.status(500).json({
      success: false,
      error: 'JOBS_FETCH_FAILED',
      message: 'Failed to fetch jobs'
    });
  }
};

export const getJobById = async (req, res) => {
  try {
    const { id } = req.params;

    const jobDoc = await db.collection(collections.JOBS).doc(id).get();
    
    if (!jobDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'JOB_NOT_FOUND',
        message: 'Job not found'
      });
    }

    const jobData = jobDoc.data();

    // Get company details
    const companyDoc = await db.collection(collections.COMPANIES)
      .doc(jobData.companyId)
      .get();
    const companyData = companyDoc.data();

    // Get similar jobs from same company
    const similarJobsSnapshot = await db.collection(collections.JOBS)
      .where('companyId', '==', jobData.companyId)
      .where('status', '==', 'active')
      .where('id', '!=', id)
      .limit(4)
      .get();

    const similarJobs = [];
    similarJobsSnapshot.forEach(doc => {
      const similarData = doc.data();
      similarJobs.push({
        id: doc.id,
        title: similarData.title,
        type: similarData.type,
        location: similarData.location,
        experienceLevel: similarData.experienceLevel
      });
    });

    const job = {
      id: jobDoc.id,
      ...jobData,
      company: {
        id: companyData.id,
        name: companyData.name,
        industry: companyData.industry,
        size: companyData.size,
        location: companyData.location,
        description: companyData.description,
        contact: companyData.contact
      },
      similarJobs
    };

    res.json({
      success: true,
      job
    });

  } catch (error) {
    console.error('Get job error:', error);
    res.status(500).json({
      success: false,
      error: 'JOB_FETCH_FAILED',
      message: 'Failed to fetch job details'
    });
  }
};

export const createJob = async (req, res) => {
  try {
    const companyId = req.user.userId;

    // Check if user is a company
    if (req.user.role !== 'company') {
      return res.status(403).json({
        success: false,
        error: 'FORBIDDEN',
        message: 'Only companies can create job postings'
      });
    }

    const { error, value } = validateJob(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: error.details[0].message
      });
    }

    // Check if company exists and is approved
    const companyDoc = await db.collection(collections.COMPANIES).doc(companyId).get();
    if (!companyDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'COMPANY_NOT_FOUND',
        message: 'Company not found'
      });
    }

    const companyData = companyDoc.data();
    if (companyData.status !== 'approved') {
      return res.status(403).json({
        success: false,
        error: 'COMPANY_NOT_APPROVED',
        message: 'Company account must be approved to post jobs'
      });
    }

    const jobId = db.collection(collections.JOBS).doc().id;

    const jobData = {
      ...value,
      id: jobId,
      companyId,
      companyName: companyData.name,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await db.collection(collections.JOBS).doc(jobId).set(jobData);

    res.status(201).json({
      success: true,
      message: 'Job posted successfully',
      job: jobData
    });

  } catch (error) {
    console.error('Create job error:', error);
    res.status(500).json({
      success: false,
      error: 'JOB_CREATION_FAILED',
      message: 'Failed to create job posting'
    });
  }
};

export const updateJob = async (req, res) => {
  try {
    const { id } = req.params;
    const companyId = req.user.userId;

    // Check if user is a company
    if (req.user.role !== 'company') {
      return res.status(403).json({
        success: false,
        error: 'FORBIDDEN',
        message: 'Only companies can update job postings'
      });
    }

    const jobDoc = await db.collection(collections.JOBS).doc(id).get();
    if (!jobDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'JOB_NOT_FOUND',
        message: 'Job not found'
      });
    }

    const jobData = jobDoc.data();

    // Check if job belongs to company
    if (jobData.companyId !== companyId) {
      return res.status(403).json({
        success: false,
        error: 'FORBIDDEN',
        message: 'Not authorized to update this job'
      });
    }

    const { error, value } = validateJob(req.body, true);
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: error.details[0].message
      });
    }

    const updateData = {
      ...value,
      updatedAt: new Date()
    };

    await db.collection(collections.JOBS).doc(id).update(updateData);

    // Get updated job
    const updatedDoc = await db.collection(collections.JOBS).doc(id).get();
    const updatedJob = updatedDoc.data();

    res.json({
      success: true,
      message: 'Job updated successfully',
      job: updatedJob
    });

  } catch (error) {
    console.error('Update job error:', error);
    res.status(500).json({
      success: false,
      error: 'JOB_UPDATE_FAILED',
      message: 'Failed to update job'
    });
  }
};

export const applyForJob = async (req, res) => {
  try {
    const studentId = req.user.userId;
    const { id: jobId } = req.params;
    const { coverLetter, resumeUrl } = req.body;

    // Check if user is a student
    if (req.user.role !== 'student') {
      return res.status(403).json({
        success: false,
        error: 'FORBIDDEN',
        message: 'Only students can apply for jobs'
      });
    }

    const { error } = validateJobApplication(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: error.details[0].message
      });
    }

    // Check if job exists and is active
    const jobDoc = await db.collection(collections.JOBS).doc(jobId).get();
    if (!jobDoc.exists || jobDoc.data().status !== 'active') {
      return res.status(404).json({
        success: false,
        error: 'JOB_NOT_FOUND',
        message: 'Job not found or not accepting applications'
      });
    }

    const jobData = jobDoc.data();

    // Check if application deadline has passed
    if (jobData.applicationDeadline && new Date(jobData.applicationDeadline) < new Date()) {
      return res.status(400).json({
        success: false,
        error: 'APPLICATION_DEADLINE_PASSED',
        message: 'Application deadline has passed'
      });
    }

    // Check for duplicate application
    const duplicateApplicationSnapshot = await db.collection(collections.JOB_APPLICATIONS)
      .where('studentId', '==', studentId)
      .where('jobId', '==', jobId)
      .get();

    if (!duplicateApplicationSnapshot.empty) {
      return res.status(409).json({
        success: false,
        error: 'DUPLICATE_APPLICATION',
        message: 'You have already applied to this job'
      });
    }

    // Create job application
    const applicationId = db.collection(collections.JOB_APPLICATIONS).doc().id;
    
    const applicationData = {
      id: applicationId,
      studentId,
      jobId,
      companyId: jobData.companyId,
      coverLetter: coverLetter || '',
      resumeUrl,
      status: 'pending',
      appliedAt: new Date(),
      updatedAt: new Date()
    };

    await db.collection(collections.JOB_APPLICATIONS).doc(applicationId).set(applicationData);

    res.status(201).json({
      success: true,
      message: 'Job application submitted successfully',
      applicationId,
      application: applicationData
    });

  } catch (error) {
    console.error('Apply for job error:', error);
    res.status(500).json({
      success: false,
      error: 'JOB_APPLICATION_FAILED',
      message: 'Failed to submit job application'
    });
  }
};

export const getCompanyJobs = async (req, res) => {
  try {
    const companyId = req.user.userId;
    const { status, page = 1, limit = 10 } = req.query;

    // Check if user is a company
    if (req.user.role !== 'company') {
      return res.status(403).json({
        success: false,
        error: 'FORBIDDEN',
        message: 'Only companies can view their jobs'
      });
    }

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
      .limit(parseInt(limit))
      .get();

    const jobs = [];
    snapshot.forEach(doc => {
      const jobData = doc.data();
      jobs.push({
        id: doc.id,
        ...jobData
      });
    });

    res.json({
      success: true,
      jobs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get company jobs error:', error);
    res.status(500).json({
      success: false,
      error: 'JOBS_FETCH_FAILED',
      message: 'Failed to fetch company jobs'
    });
  }
};