import Joi from 'joi';

// Job creation validation (alias for validateJobPosting)
export const validateJob = (data) => {
  const schema = Joi.object({
    title: Joi.string().min(2).max(200).required().messages({
      'string.min': 'Job title must be at least 2 characters long',
      'string.max': 'Job title cannot exceed 200 characters',
      'any.required': 'Job title is required'
    }),
    type: Joi.string().valid('full-time', 'part-time', 'contract', 'internship', 'remote').required(),
    location: Joi.string().max(100).required(),
    experienceLevel: Joi.string().valid('entry', 'mid', 'senior', 'executive').required(),
    description: Joi.string().max(5000).required(),
    requirements: Joi.object({
      education: Joi.string().optional(),
      experience: Joi.string().optional(),
      skills: Joi.array().items(Joi.string()).min(1).required(),
      certificates: Joi.array().items(Joi.string()).optional(),
      languages: Joi.array().items(
        Joi.object({
          language: Joi.string().required(),
          proficiency: Joi.string().valid('basic', 'intermediate', 'fluent', 'native').required()
        })
      ).optional()
    }).required(),
    responsibilities: Joi.array().items(Joi.string()).min(1).required(),
    benefits: Joi.array().items(Joi.string()).optional(),
    salary: Joi.object({
      min: Joi.number().min(0).optional(),
      max: Joi.number().min(0).optional(),
      currency: Joi.string().length(3).default('LSL'),
      isPublic: Joi.boolean().default(true)
    }).optional(),
    applicationDeadline: Joi.date().required(),
    applicationInstructions: Joi.string().max(1000).optional(),
    categories: Joi.array().items(Joi.string()).optional(),
    tags: Joi.array().items(Joi.string()).optional(),
    status: Joi.string().valid('draft', 'active', 'paused', 'closed').default('draft')
  });

  return schema.validate(data, { abortEarly: false });
};

// Job posting validation (same as validateJob)
export const validateJobPosting = (data) => {
  return validateJob(data);
};

// Job application validation
export const validateJobApplication = (data) => {
  const schema = Joi.object({
    jobId: Joi.string().required().messages({
      'any.required': 'Job ID is required'
    }),
    coverLetter: Joi.string().max(2000).optional(),
    resume: Joi.string().required().messages({
      'any.required': 'Resume is required'
    }),
    additionalDocuments: Joi.array().items(Joi.string()).optional(),
    answers: Joi.object().pattern(
      Joi.string(),
      Joi.alternatives().try(Joi.string(), Joi.number(), Joi.boolean(), Joi.array())
    ).optional(),
    availability: Joi.object({
      startDate: Joi.date().optional(),
      noticePeriod: Joi.number().integer().min(0).optional()
    }).optional()
  });

  return schema.validate(data, { abortEarly: false });
};

// Job search validation
export const validateJobSearch = (data) => {
  const schema = Joi.object({
    query: Joi.string().max(100).optional(),
    type: Joi.string().valid('full-time', 'part-time', 'contract', 'internship', 'remote').optional(),
    location: Joi.string().optional(),
    experienceLevel: Joi.string().valid('entry', 'mid', 'senior', 'executive').optional(),
    company: Joi.string().optional(),
    industry: Joi.string().optional(),
    skills: Joi.array().items(Joi.string()).optional(),
    minSalary: Joi.number().min(0).optional(),
    maxSalary: Joi.number().min(0).optional(),
    postedAfter: Joi.date().optional(),
    applicationDeadlineAfter: Joi.date().optional(),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(50).default(10),
    sortBy: Joi.string().valid('relevance', 'date', 'salary', 'applicationDeadline').default('date'),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc')
  });

  return schema.validate(data, { abortEarly: false });
};

// Job update validation
export const validateJobUpdate = (data) => {
  const schema = Joi.object({
    title: Joi.string().min(2).max(200).optional(),
    type: Joi.string().valid('full-time', 'part-time', 'contract', 'internship', 'remote').optional(),
    location: Joi.string().max(100).optional(),
    description: Joi.string().max(5000).optional(),
    requirements: Joi.object({
      education: Joi.string().optional(),
      experience: Joi.string().optional(),
      skills: Joi.array().items(Joi.string()).optional(),
      certificates: Joi.array().items(Joi.string()).optional()
    }).optional(),
    responsibilities: Joi.array().items(Joi.string()).optional(),
    benefits: Joi.array().items(Joi.string()).optional(),
    salary: Joi.object({
      min: Joi.number().min(0).optional(),
      max: Joi.number().min(0).optional(),
      currency: Joi.string().length(3).default('LSL'),
      isPublic: Joi.boolean().default(true)
    }).optional(),
    applicationDeadline: Joi.date().optional(),
    status: Joi.string().valid('draft', 'active', 'paused', 'closed').optional()
  });

  return schema.validate(data, { abortEarly: false });
};

// Applicant filter validation
export const validateApplicantFilter = (data) => {
  const schema = Joi.object({
    jobId: Joi.string().required(),
    minMatchScore: Joi.number().min(0).max(100).default(70),
    educationLevel: Joi.string().valid('high school', 'diploma', 'bachelor', 'master', 'phd').optional(),
    skills: Joi.array().items(Joi.string()).optional(),
    experienceMin: Joi.number().min(0).optional(),
    location: Joi.string().optional(),
    hasTranscripts: Joi.boolean().optional(),
    status: Joi.string().valid('pending', 'reviewed', 'shortlisted', 'rejected', 'hired').optional(),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(50).default(20),
    sortBy: Joi.string().valid('matchScore', 'applicationDate', 'experience', 'education').default('matchScore'),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc')
  });

  return schema.validate(data, { abortEarly: false });
};

export default {
  validateJob,
  validateJobPosting,
  validateJobApplication,
  validateJobSearch,
  validateJobUpdate,
  validateApplicantFilter
};