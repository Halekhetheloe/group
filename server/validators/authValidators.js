import Joi from 'joi';

// Registration validation schema
export const validateRegistration = (data) => {
  const schema = Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    }),
    password: Joi.string().min(6).required().messages({
      'string.min': 'Password must be at least 6 characters long',
      'any.required': 'Password is required'
    }),
    firstName: Joi.string().min(2).max(50).required().messages({
      'string.min': 'First name must be at least 2 characters long',
      'string.max': 'First name cannot exceed 50 characters',
      'any.required': 'First name is required'
    }),
    lastName: Joi.string().min(2).max(50).required().messages({
      'string.min': 'Last name must be at least 2 characters long',
      'string.max': 'Last name cannot exceed 50 characters',
      'any.required': 'Last name is required'
    }),
    role: Joi.string().valid('student', 'institution', 'company', 'admin').required().messages({
      'any.only': 'Role must be one of: student, institution, company, admin',
      'any.required': 'Role is required'
    }),
    phone: Joi.string().pattern(/^[+]?[0-9\s\-()]{10,}$/).optional().messages({
      'string.pattern.base': 'Please provide a valid phone number'
    })
  });

  return schema.validate(data, { abortEarly: false });
};

// Login validation schema
export const validateLogin = (data) => {
  const schema = Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    }),
    password: Joi.string().required().messages({
      'any.required': 'Password is required'
    })
  });

  return schema.validate(data, { abortEarly: false });
};

// Email verification validation
export const validateEmailVerification = (data) => {
  const schema = Joi.object({
    token: Joi.string().required().messages({
      'any.required': 'Verification token is required'
    }),
    email: Joi.string().email().required().messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    })
  });

  return schema.validate(data, { abortEarly: false });
};

// Password reset validation
export const validatePasswordReset = (data) => {
  const schema = Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    })
  });

  return schema.validate(data, { abortEarly: false });
};

// Password update validation
export const validatePasswordUpdate = (data) => {
  const schema = Joi.object({
    currentPassword: Joi.string().required().messages({
      'any.required': 'Current password is required'
    }),
    newPassword: Joi.string().min(6).required().messages({
      'string.min': 'New password must be at least 6 characters long',
      'any.required': 'New password is required'
    }),
    confirmPassword: Joi.string().valid(Joi.ref('newPassword')).required().messages({
      'any.only': 'Passwords do not match',
      'any.required': 'Please confirm your password'
    })
  });

  return schema.validate(data, { abortEarly: false });
};

// Role-specific registration validation
export const validateStudentRegistration = (data) => {
  const baseSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    firstName: Joi.string().min(2).max(50).required(),
    lastName: Joi.string().min(2).max(50).required(),
    phone: Joi.string().pattern(/^[+]?[0-9\s\-()]{10,}$/).optional(),
    dateOfBirth: Joi.date().max('now').required().messages({
      'date.max': 'Date of birth cannot be in the future'
    }),
    nationality: Joi.string().min(2).max(50).required(),
    address: Joi.object({
      street: Joi.string().required(),
      city: Joi.string().required(),
      state: Joi.string().required(),
      postalCode: Joi.string().optional()
    }).required(),
    educationLevel: Joi.string().valid('high school', 'diploma', 'bachelor', 'master', 'phd').required(),
    highSchool: Joi.object({
      name: Joi.string().required(),
      graduationYear: Joi.number().integer().min(1900).max(new Date().getFullYear()).required(),
      grades: Joi.object().optional()
    }).required()
  });

  return baseSchema.validate(data, { abortEarly: false });
};

export const validateInstitutionRegistration = (data) => {
  const schema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    firstName: Joi.string().min(2).max(50).required(),
    lastName: Joi.string().min(2).max(50).required(),
    phone: Joi.string().pattern(/^[+]?[0-9\s\-()]{10,}$/).required(),
    institutionName: Joi.string().min(2).max(100).required(),
    institutionType: Joi.string().valid('university', 'college', 'polytechnic', 'vocational').required(),
    accreditationNumber: Joi.string().required(),
    address: Joi.object({
      street: Joi.string().required(),
      city: Joi.string().required(),
      state: Joi.string().required(),
      postalCode: Joi.string().optional()
    }).required(),
    website: Joi.string().uri().optional(),
    description: Joi.string().max(1000).optional()
  });

  return schema.validate(data, { abortEarly: false });
};

export const validateCompanyRegistration = (data) => {
  const schema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    firstName: Joi.string().min(2).max(50).required(),
    lastName: Joi.string().min(2).max(50).required(),
    phone: Joi.string().pattern(/^[+]?[0-9\s\-()]{10,}$/).required(),
    companyName: Joi.string().min(2).max(100).required(),
    companyType: Joi.string().valid('private', 'public', 'ngo', 'government').required(),
    industry: Joi.string().required(),
    registrationNumber: Joi.string().required(),
    address: Joi.object({
      street: Joi.string().required(),
      city: Joi.string().required(),
      state: Joi.string().required(),
      postalCode: Joi.string().optional()
    }).required(),
    website: Joi.string().uri().optional(),
    description: Joi.string().max(1000).optional(),
    size: Joi.string().valid('1-10', '11-50', '51-200', '201-500', '501-1000', '1000+').required()
  });

  return schema.validate(data, { abortEarly: false });
};

export default {
  validateRegistration,
  validateLogin,
  validateEmailVerification,
  validatePasswordReset,
  validatePasswordUpdate,
  validateStudentRegistration,
  validateInstitutionRegistration,
  validateCompanyRegistration
};