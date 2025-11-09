// Common validation patterns and utilities
export const validationPatterns = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^\+?[\d\s-()]{10,}$/,
  name: /^[a-zA-Z\s'-]{2,50}$/,
  password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
  url: /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/,
  ssn: /^\d{3}-\d{2}-\d{4}$/,
  zipCode: /^\d{5}(-\d{4})?$/,
  date: /^\d{4}-\d{2}-\d{2}$/
};

// Common validation functions
export const validators = {
  // Required field validation
  required: (value) => {
    if (value === null || value === undefined || value === '') {
      return { isValid: false, message: 'This field is required' };
    }
    return { isValid: true };
  },

  // Email validation
  email: (value) => {
    if (!value) return { isValid: false, message: 'Email is required' };
    if (!validationPatterns.email.test(value)) {
      return { isValid: false, message: 'Please enter a valid email address' };
    }
    return { isValid: true };
  },

  // Phone number validation
  phone: (value) => {
    if (!value) return { isValid: true }; // Phone is optional
    if (!validationPatterns.phone.test(value)) {
      return { isValid: false, message: 'Please enter a valid phone number' };
    }
    return { isValid: true };
  },

  // Name validation
  name: (value) => {
    if (!value) return { isValid: false, message: 'Name is required' };
    if (!validationPatterns.name.test(value)) {
      return { isValid: false, message: 'Name can only contain letters, spaces, hyphens, and apostrophes' };
    }
    if (value.length < 2) {
      return { isValid: false, message: 'Name must be at least 2 characters long' };
    }
    return { isValid: true };
  },

  // Password validation
  password: (value) => {
    if (!value) return { isValid: false, message: 'Password is required' };
    if (value.length < 8) {
      return { isValid: false, message: 'Password must be at least 8 characters long' };
    }
    if (!/(?=.*[a-z])/.test(value)) {
      return { isValid: false, message: 'Password must contain at least one lowercase letter' };
    }
    if (!/(?=.*[A-Z])/.test(value)) {
      return { isValid: false, message: 'Password must contain at least one uppercase letter' };
    }
    if (!/(?=.*\d)/.test(value)) {
      return { isValid: false, message: 'Password must contain at least one number' };
    }
    if (!/(?=.*[@$!%*?&])/.test(value)) {
      return { isValid: false, message: 'Password must contain at least one special character' };
    }
    return { isValid: true };
  },

  // Confirm password validation
  confirmPassword: (value, originalPassword) => {
    if (!value) return { isValid: false, message: 'Please confirm your password' };
    if (value !== originalPassword) {
      return { isValid: false, message: 'Passwords do not match' };
    }
    return { isValid: true };
  },

  // URL validation
  url: (value) => {
    if (!value) return { isValid: true }; // URL is optional
    if (!validationPatterns.url.test(value)) {
      return { isValid: false, message: 'Please enter a valid URL' };
    }
    return { isValid: true };
  },

  // Date validation
  date: (value) => {
    if (!value) return { isValid: false, message: 'Date is required' };
    if (!validationPatterns.date.test(value)) {
      return { isValid: false, message: 'Please enter a valid date in YYYY-MM-DD format' };
    }
    
    const date = new Date(value);
    const today = new Date();
    
    if (isNaN(date.getTime())) {
      return { isValid: false, message: 'Please enter a valid date' };
    }
    
    if (date > today) {
      return { isValid: false, message: 'Date cannot be in the future' };
    }
    
    return { isValid: true };
  },

  // Number validation
  number: (value, options = {}) => {
    const { min, max, integer = false } = options;
    
    if (value === null || value === undefined || value === '') {
      return { isValid: false, message: 'This field is required' };
    }
    
    const num = Number(value);
    if (isNaN(num)) {
      return { isValid: false, message: 'Please enter a valid number' };
    }
    
    if (integer && !Number.isInteger(num)) {
      return { isValid: false, message: 'Please enter a whole number' };
    }
    
    if (min !== undefined && num < min) {
      return { isValid: false, message: `Value must be at least ${min}` };
    }
    
    if (max !== undefined && num > max) {
      return { isValid: false, message: `Value cannot exceed ${max}` };
    }
    
    return { isValid: true };
  },

  // Array validation
  array: (value, options = {}) => {
    const { minLength, maxLength, required = true } = options;
    
    if (required && (!Array.isArray(value) || value.length === 0)) {
      return { isValid: false, message: 'At least one item is required' };
    }
    
    if (!Array.isArray(value)) {
      return { isValid: false, message: 'Please provide a valid list' };
    }
    
    if (minLength !== undefined && value.length < minLength) {
      return { isValid: false, message: `At least ${minLength} items are required` };
    }
    
    if (maxLength !== undefined && value.length > maxLength) {
      return { isValid: false, message: `Cannot exceed ${maxLength} items` };
    }
    
    return { isValid: true };
  },

  // File validation
  file: (file, options = {}) => {
    const { 
      allowedTypes = [], 
      maxSize = 10 * 1024 * 1024, // 10MB default
      required = true 
    } = options;
    
    if (required && !file) {
      return { isValid: false, message: 'File is required' };
    }
    
    if (!file) {
      return { isValid: true }; // File is optional
    }
    
    if (allowedTypes.length > 0 && !allowedTypes.includes(file.mimetype)) {
      return { isValid: false, message: `File type not allowed. Allowed types: ${allowedTypes.join(', ')}` };
    }
    
    if (file.size > maxSize) {
      const maxSizeMB = (maxSize / 1024 / 1024).toFixed(2);
      return { isValid: false, message: `File size exceeds maximum allowed size of ${maxSizeMB}MB` };
    }
    
    return { isValid: true };
  }
};

// Form validation utility
export const validateForm = (data, rules) => {
  const errors = {};
  let isValid = true;

  Object.keys(rules).forEach(field => {
    const value = data[field];
    const fieldRules = rules[field];
    
    if (!Array.isArray(fieldRules)) {
      fieldRules = [fieldRules];
    }

    for (const rule of fieldRules) {
      let result;
      
      if (typeof rule === 'function') {
        result = rule(value, data);
      } else if (typeof rule === 'string' && validators[rule]) {
        result = validators[rule](value);
      } else if (typeof rule === 'object' && rule.validator) {
        result = rule.validator(value, data, rule.options);
      } else {
        continue;
      }

      if (!result.isValid) {
        errors[field] = result.message;
        isValid = false;
        break;
      }
    }
  });

  return { isValid, errors };
};

// Async validation support
export const validateAsync = async (data, rules) => {
  const errors = {};
  let isValid = true;

  const promises = Object.keys(rules).map(async (field) => {
    const value = data[field];
    const fieldRules = rules[field];
    
    if (!Array.isArray(fieldRules)) {
      fieldRules = [fieldRules];
    }

    for (const rule of fieldRules) {
      let result;
      
      if (typeof rule === 'function') {
        result = await rule(value, data);
      } else if (typeof rule === 'object' && rule.validator) {
        result = await rule.validator(value, data, rule.options);
      } else {
        continue;
      }

      if (!result.isValid) {
        errors[field] = result.message;
        isValid = false;
        return;
      }
    }
  });

  await Promise.all(promises);
  return { isValid, errors };
};

// Schema validation for common entities
export const schemas = {
  user: {
    firstName: ['required', 'name'],
    lastName: ['required', 'name'],
    email: ['required', 'email'],
    phone: ['phone'],
    role: ['required'],
    password: ['required', 'password']
  },

  institution: {
    name: ['required'],
    type: ['required'],
    location: ['required'],
    description: ['required'],
    'contact.email': ['required', 'email'],
    'contact.phone': ['phone']
  },

  course: {
    name: ['required'],
    institutionId: ['required'],
    faculty: ['required'],
    duration: ['required'],
    description: ['required'],
    'requirements.minGrade': ['required'],
    'requirements.subjects': [validators.array({ minLength: 1 })]
  },

  application: {
    courseId: ['required'],
    institutionId: ['required'],
    'personalInfo.dateOfBirth': ['required', 'date'],
    'personalInfo.nationality': ['required'],
    'academicBackground.highSchool': ['required'],
    'academicBackground.graduationYear': ['required', (value) => validators.number(value, { min: 1900, max: new Date().getFullYear() })]
  },

  job: {
    title: ['required'],
    type: ['required'],
    location: ['required'],
    description: ['required'],
    'requirements.education': ['required'],
    'requirements.skills': [validators.array({ minLength: 1 })],
    'salary.min': ['required', (value) => validators.number(value, { min: 0 })],
    'salary.max': ['required', (value) => validators.number(value, { min: 0 })]
  }
};

// Custom validators for business logic
export const customValidators = {
  // Check if email is unique
  uniqueEmail: async (email) => {
    // This would typically check against the database
    // For now, we'll return a mock response
    return { isValid: true };
  },

  // Check course eligibility
  courseEligibility: (studentData, courseRequirements) => {
    const errors = [];
    
    if (courseRequirements.minGrade) {
      const studentGrade = studentData.grades?.overall || 'F';
      const gradeOrder = { 'A': 5, 'B': 4, 'C': 3, 'D': 2, 'E': 1, 'F': 0 };
      
      if (gradeOrder[studentGrade] < gradeOrder[courseRequirements.minGrade]) {
        errors.push(`Minimum grade of ${courseRequirements.minGrade} required`);
      }
    }

    if (courseRequirements.subjects) {
      const missingSubjects = courseRequirements.subjects.filter(
        subject => !studentData.grades?.subjects || !studentData.grades.subjects[subject]
      );

      if (missingSubjects.length > 0) {
        errors.push(`Missing required subjects: ${missingSubjects.join(', ')}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  },

  // Check application limits
  applicationLimit: async (studentId, institutionId) => {
    // This would check against the database
    // Mock implementation
    return { isValid: true, remaining: 2 };
  },

  // Validate file upload
  validateFileUpload: (file, options = {}) => {
    return validators.file(file, options);
  }
};

// Export all utilities
export default {
  validationPatterns,
  validators,
  validateForm,
  validateAsync,
  schemas,
  customValidators
};