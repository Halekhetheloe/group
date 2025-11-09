import Joi from 'joi';

// Course application validation
export const validateCourseApplication = (data) => {
  const schema = Joi.object({
    courseId: Joi.string().required().messages({
      'any.required': 'Course ID is required'
    }),
    institutionId: Joi.string().required().messages({
      'any.required': 'Institution ID is required'
    }),
    personalStatement: Joi.string().max(2000).optional(),
    preferences: Joi.object({
      intakePeriod: Joi.string().valid('January', 'May', 'September').required(),
      studyMode: Joi.string().valid('full-time', 'part-time', 'online').required()
    }).required(),
    documents: Joi.object({
      transcript: Joi.string().optional(),
      identification: Joi.string().optional(),
      recommendationLetters: Joi.array().items(Joi.string()).optional(),
      certificates: Joi.array().items(Joi.string()).optional()
    }).optional()
  });

  return schema.validate(data, { abortEarly: false });
};

// Course search and filter validation
export const validateCourseSearch = (data) => {
  const schema = Joi.object({
    query: Joi.string().max(100).optional(),
    level: Joi.string().valid('certificate', 'diploma', 'bachelor', 'master', 'phd').optional(),
    faculty: Joi.string().optional(),
    institution: Joi.string().optional(),
    location: Joi.string().optional(),
    minDuration: Joi.number().integer().min(1).optional(),
    maxDuration: Joi.number().integer().min(1).optional(),
    intakePeriod: Joi.string().valid('January', 'May', 'September').optional(),
    studyMode: Joi.string().valid('full-time', 'part-time', 'online').optional(),
    minFees: Joi.number().min(0).optional(),
    maxFees: Joi.number().min(0).optional(),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    sortBy: Joi.string().valid('name', 'duration', 'fees', 'applicationDeadline').default('name'),
    sortOrder: Joi.string().valid('asc', 'desc').default('asc')
  });

  return schema.validate(data, { abortEarly: false });
};

// Course eligibility check validation
export const validateEligibilityCheck = (data) => {
  const schema = Joi.object({
    courseId: Joi.string().required(),
    studentGrades: Joi.object({
      overall: Joi.string().valid('A', 'B', 'C', 'D', 'E', 'F').required(),
      subjects: Joi.object().pattern(
        Joi.string(),
        Joi.alternatives().try(Joi.string(), Joi.number())
      ).optional(),
      points: Joi.number().min(0).max(100).optional(),
      certificates: Joi.array().items(Joi.string()).optional()
    }).required()
  });

  return schema.validate(data, { abortEarly: false });
};

// Course recommendation validation
export const validateCourseRecommendation = (data) => {
  const schema = Joi.object({
    studentProfile: Joi.object({
      educationLevel: Joi.string().valid('high school', 'diploma', 'bachelor', 'master', 'phd').required(),
      grades: Joi.object({
        overall: Joi.string().valid('A', 'B', 'C', 'D', 'E', 'F').required(),
        subjects: Joi.object().optional()
      }).required(),
      interests: Joi.array().items(Joi.string()).optional(),
      careerGoals: Joi.string().max(500).optional(),
      preferredLocation: Joi.string().optional(),
      budget: Joi.number().min(0).optional()
    }).required(),
    limit: Joi.number().integer().min(1).max(50).default(10)
  });

  return schema.validate(data, { abortEarly: false });
};

export default {
  validateCourseApplication,
  validateCourseSearch,
  validateEligibilityCheck,
  validateCourseRecommendation
};