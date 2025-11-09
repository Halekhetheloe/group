import Joi from 'joi';

// Application submission validation
export const validateApplication = (data) => {
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

// Application status update validation
export const validateApplicationStatusUpdate = (data) => {
  const schema = Joi.object({
    status: Joi.string().valid('pending', 'under_review', 'accepted', 'rejected', 'waiting_list').required(),
    feedback: Joi.string().max(1000).optional(),
    decisionDate: Joi.date().optional()
  });

  return schema.validate(data, { abortEarly: false });
};

// Application review validation
export const validateApplicationReview = (data) => {
  const schema = Joi.object({
    reviewerNotes: Joi.string().max(2000).optional(),
    rating: Joi.number().min(1).max(5).optional(),
    recommended: Joi.boolean().optional()
  });

  return schema.validate(data, { abortEarly: false });
};

// Application filter validation
export const validateApplicationFilter = (data) => {
  const schema = Joi.object({
    courseId: Joi.string().optional(),
    institutionId: Joi.string().optional(),
    status: Joi.string().valid('pending', 'under_review', 'accepted', 'rejected', 'waiting_list').optional(),
    intakePeriod: Joi.string().valid('January', 'May', 'September').optional(),
    studyMode: Joi.string().valid('full-time', 'part-time', 'online').optional(),
    applicationDateFrom: Joi.date().optional(),
    applicationDateTo: Joi.date().optional(),
    decisionDateFrom: Joi.date().optional(),
    decisionDateTo: Joi.date().optional(),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    sortBy: Joi.string().valid('applicationDate', 'decisionDate', 'name', 'status').default('applicationDate'),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc')
  });

  return schema.validate(data, { abortEarly: false });
};

// Bulk application update validation
export const validateBulkApplicationUpdate = (data) => {
  const schema = Joi.object({
    applicationIds: Joi.array().items(Joi.string()).min(1).max(100).required(),
    status: Joi.string().valid('pending', 'under_review', 'accepted', 'rejected', 'waiting_list').required(),
    feedback: Joi.string().max(1000).optional(),
    decisionDate: Joi.date().optional()
  });

  return schema.validate(data, { abortEarly: false });
};

// Application statistics validation
export const validateApplicationStats = (data) => {
  const schema = Joi.object({
    institutionId: Joi.string().optional(),
    courseId: Joi.string().optional(),
    startDate: Joi.date().optional(),
    endDate: Joi.date().optional(),
    groupBy: Joi.string().valid('day', 'week', 'month', 'year', 'status', 'course').default('month')
  });

  return schema.validate(data, { abortEarly: false });
};

export default {
  validateApplication,
  validateApplicationStatusUpdate,
  validateApplicationReview,
  validateApplicationFilter,
  validateBulkApplicationUpdate,
  validateApplicationStats
};