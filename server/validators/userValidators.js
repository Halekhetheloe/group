import Joi from 'joi';

// User profile update validation
export const validateUserProfileUpdate = (data) => {
  const schema = Joi.object({
    firstName: Joi.string().min(2).max(50).optional(),
    lastName: Joi.string().min(2).max(50).optional(),
    phone: Joi.string().pattern(/^[+]?[0-9\s\-()]{10,}$/).optional().messages({
      'string.pattern.base': 'Please provide a valid phone number'
    }),
    dateOfBirth: Joi.date().max('now').optional().messages({
      'date.max': 'Date of birth cannot be in the future'
    }),
    nationality: Joi.string().min(2).max(50).optional(),
    address: Joi.object({
      street: Joi.string().required(),
      city: Joi.string().required(),
      state: Joi.string().required(),
      postalCode: Joi.string().optional()
    }).optional(),
    avatar: Joi.string().uri().optional()
  });

  return schema.validate(data, { abortEarly: false });
};

// Student profile validation
export const validateStudentProfile = (data) => {
  const schema = Joi.object({
    educationLevel: Joi.string().valid('high school', 'diploma', 'bachelor', 'master', 'phd').required(),
    highSchool: Joi.object({
      name: Joi.string().required(),
      graduationYear: Joi.number().integer().min(1900).max(new Date().getFullYear()).required(),
      grades: Joi.object().pattern(
        Joi.string(),
        Joi.alternatives().try(Joi.string(), Joi.number())
      ).optional()
    }).required(),
    skills: Joi.array().items(Joi.string().min(2).max(50)).optional(),
    interests: Joi.array().items(Joi.string().min(2).max(50)).optional(),
    careerGoals: Joi.string().max(500).optional(),
    workExperience: Joi.array().items(
      Joi.object({
        company: Joi.string().required(),
        position: Joi.string().required(),
        startDate: Joi.date().required(),
        endDate: Joi.date().optional().allow(null),
        current: Joi.boolean().optional(),
        description: Joi.string().max(1000).optional()
      })
    ).optional(),
    certificates: Joi.array().items(
      Joi.object({
        name: Joi.string().required(),
        issuingOrganization: Joi.string().required(),
        issueDate: Joi.date().required(),
        expiryDate: Joi.date().optional().allow(null),
        credentialId: Joi.string().optional()
      })
    ).optional()
  });

  return schema.validate(data, { abortEarly: false });
};

// Institution profile validation
export const validateInstitutionProfile = (data) => {
  const schema = Joi.object({
    institutionName: Joi.string().min(2).max(100).required(),
    institutionType: Joi.string().valid('university', 'college', 'polytechnic', 'vocational').required(),
    accreditationNumber: Joi.string().required(),
    accreditationBody: Joi.string().required(),
    accreditationExpiry: Joi.date().required(),
    address: Joi.object({
      street: Joi.string().required(),
      city: Joi.string().required(),
      state: Joi.string().required(),
      postalCode: Joi.string().optional()
    }).required(),
    contactPerson: Joi.object({
      name: Joi.string().required(),
      position: Joi.string().required(),
      email: Joi.string().email().required(),
      phone: Joi.string().pattern(/^[+]?[0-9\s\-()]{10,}$/).required()
    }).required(),
    website: Joi.string().uri().optional(),
    description: Joi.string().max(2000).optional(),
    logo: Joi.string().uri().optional(),
    establishedYear: Joi.number().integer().min(1800).max(new Date().getFullYear()).required()
  });

  return schema.validate(data, { abortEarly: false });
};

// Company profile validation
export const validateCompanyProfile = (data) => {
  const schema = Joi.object({
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
    contactPerson: Joi.object({
      name: Joi.string().required(),
      position: Joi.string().required(),
      email: Joi.string().email().required(),
      phone: Joi.string().pattern(/^[+]?[0-9\s\-()]{10,}$/).required()
    }).required(),
    website: Joi.string().uri().optional(),
    description: Joi.string().max(2000).optional(),
    logo: Joi.string().uri().optional(),
    size: Joi.string().valid('1-10', '11-50', '51-200', '201-500', '501-1000', '1000+').required(),
    foundedYear: Joi.number().integer().min(1800).max(new Date().getFullYear()).optional(),
    socialMedia: Joi.object({
      linkedin: Joi.string().uri().optional(),
      twitter: Joi.string().uri().optional(),
      facebook: Joi.string().uri().optional()
    }).optional()
  });

  return schema.validate(data, { abortEarly: false });
};

// User status update validation
export const validateUserStatusUpdate = (data) => {
  const schema = Joi.object({
    status: Joi.string().valid('active', 'suspended', 'inactive').required(),
    reason: Joi.string().max(500).optional()
  });

  return schema.validate(data, { abortEarly: false });
};

// User role update validation (admin only)
export const validateUserRoleUpdate = (data) => {
  const schema = Joi.object({
    role: Joi.string().valid('student', 'institution', 'company', 'admin').required()
  });

  return schema.validate(data, { abortEarly: false });
};

export default {
  validateUserProfileUpdate,
  validateStudentProfile,
  validateInstitutionProfile,
  validateCompanyProfile,
  validateUserStatusUpdate,
  validateUserRoleUpdate
};