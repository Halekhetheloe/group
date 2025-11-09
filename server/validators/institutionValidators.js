import Joi from 'joi';

// Faculty creation validation
export const validateFacultyCreation = (data) => {
  const schema = Joi.object({
    name: Joi.string().min(2).max(100).required().messages({
      'string.min': 'Faculty name must be at least 2 characters long',
      'string.max': 'Faculty name cannot exceed 100 characters',
      'any.required': 'Faculty name is required'
    }),
    code: Joi.string().min(2).max(10).required().messages({
      'string.min': 'Faculty code must be at least 2 characters long',
      'string.max': 'Faculty code cannot exceed 10 characters',
      'any.required': 'Faculty code is required'
    }),
    description: Joi.string().max(1000).optional(),
    dean: Joi.string().min(2).max(100).optional(),
    contactEmail: Joi.string().email().optional().messages({
      'string.email': 'Please provide a valid contact email'
    }),
    departments: Joi.array().items(Joi.string()).optional()
  });

  return schema.validate(data, { abortEarly: false });
};

// Course creation validation
export const validateCourseCreation = (data) => {
  const schema = Joi.object({
    name: Joi.string().min(2).max(200).required().messages({
      'string.min': 'Course name must be at least 2 characters long',
      'string.max': 'Course name cannot exceed 200 characters',
      'any.required': 'Course name is required'
    }),
    code: Joi.string().min(2).max(20).required().messages({
      'string.min': 'Course code must be at least 2 characters long',
      'string.max': 'Course code cannot exceed 20 characters',
      'any.required': 'Course code is required'
    }),
    facultyId: Joi.string().required().messages({
      'any.required': 'Faculty ID is required'
    }),
    level: Joi.string().valid('certificate', 'diploma', 'bachelor', 'master', 'phd').required(),
    duration: Joi.number().integer().min(1).max(10).required().messages({
      'number.min': 'Duration must be at least 1 year',
      'number.max': 'Duration cannot exceed 10 years'
    }),
    durationUnit: Joi.string().valid('years', 'semesters', 'months').required(),
    description: Joi.string().max(2000).required(),
    requirements: Joi.object({
      minGrade: Joi.string().valid('A', 'B', 'C', 'D', 'E', 'F').optional(),
      minPoints: Joi.number().min(0).max(100).optional(),
      subjects: Joi.array().items(Joi.string()).optional(),
      certificates: Joi.array().items(Joi.string()).optional(),
      additionalRequirements: Joi.string().max(1000).optional()
    }).required(),
    fees: Joi.object({
      local: Joi.number().min(0).optional(),
      international: Joi.number().min(0).optional(),
      currency: Joi.string().length(3).default('LSL')
    }).optional(),
    intakePeriods: Joi.array().items(Joi.string().valid('January', 'May', 'September')).required(),
    applicationDeadline: Joi.date().required(),
    capacity: Joi.number().integer().min(1).required(),
    status: Joi.string().valid('active', 'inactive', 'full').default('active')
  });

  return schema.validate(data, { abortEarly: false });
};

// Course update validation
export const validateCourseUpdate = (data) => {
  const schema = Joi.object({
    name: Joi.string().min(2).max(200).optional(),
    description: Joi.string().max(2000).optional(),
    requirements: Joi.object({
      minGrade: Joi.string().valid('A', 'B', 'C', 'D', 'E', 'F').optional(),
      minPoints: Joi.number().min(0).max(100).optional(),
      subjects: Joi.array().items(Joi.string()).optional(),
      certificates: Joi.array().items(Joi.string()).optional(),
      additionalRequirements: Joi.string().max(1000).optional()
    }).optional(),
    fees: Joi.object({
      local: Joi.number().min(0).optional(),
      international: Joi.number().min(0).optional(),
      currency: Joi.string().length(3).default('LSL')
    }).optional(),
    intakePeriods: Joi.array().items(Joi.string().valid('January', 'May', 'September')).optional(),
    applicationDeadline: Joi.date().optional(),
    capacity: Joi.number().integer().min(1).optional(),
    status: Joi.string().valid('active', 'inactive', 'full').optional()
  });

  return schema.validate(data, { abortEarly: false });
};

// Institution profile update validation
export const validateInstitutionUpdate = (data) => {
  const schema = Joi.object({
    institutionName: Joi.string().min(2).max(100).optional(),
    description: Joi.string().max(2000).optional(),
    contactPerson: Joi.object({
      name: Joi.string().optional(),
      position: Joi.string().optional(),
      email: Joi.string().email().optional(),
      phone: Joi.string().pattern(/^[+]?[0-9\s\-()]{10,}$/).optional()
    }).optional(),
    address: Joi.object({
      street: Joi.string().optional(),
      city: Joi.string().optional(),
      state: Joi.string().optional(),
      postalCode: Joi.string().optional()
    }).optional(),
    website: Joi.string().uri().optional(),
    logo: Joi.string().uri().optional(),
    socialMedia: Joi.object({
      linkedin: Joi.string().uri().optional(),
      twitter: Joi.string().uri().optional(),
      facebook: Joi.string().uri().optional()
    }).optional()
  });

  return schema.validate(data, { abortEarly: false });
};

// Faculty update validation
export const validateFacultyUpdate = (data) => {
  const schema = Joi.object({
    name: Joi.string().min(2).max(100).optional(),
    description: Joi.string().max(1000).optional(),
    dean: Joi.string().min(2).max(100).optional(),
    contactEmail: Joi.string().email().optional(),
    departments: Joi.array().items(Joi.string()).optional(),
    status: Joi.string().valid('active', 'inactive').optional()
  });

  return schema.validate(data, { abortEarly: false });
};

// ADD MISSING EXPORTS THAT THE CONTROLLER NEEDS
export const validateInstitution = (data, isUpdate = false) => {
  // Simple validation for development
  if (!data.name || data.name.length < 2) {
    return { error: { details: [{ message: 'Institution name is required' }] } };
  }
  return { error: null, value: data };
};

export const validateCourse = (data, isUpdate = false) => {
  // Simple validation for development
  if (!data.name || data.name.length < 2) {
    return { error: { details: [{ message: 'Course name is required' }] } };
  }
  if (!data.facultyId) {
    return { error: { details: [{ message: 'Faculty ID is required' }] } };
  }
  return { error: null, value: data };
};

export default {
  validateFacultyCreation,
  validateCourseCreation,
  validateCourseUpdate,
  validateInstitutionUpdate,
  validateFacultyUpdate,
  validateInstitution,
  validateCourse
};