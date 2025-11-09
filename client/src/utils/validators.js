import { VALIDATION_RULES } from './constants'

// Email validation
export const validateEmail = (email) => {
  if (!email) {
    return { isValid: false, message: VALIDATION_RULES.EMAIL.required }
  }
  
  if (!VALIDATION_RULES.EMAIL.pattern.value.test(email)) {
    return { isValid: false, message: VALIDATION_RULES.EMAIL.pattern.message }
  }
  
  return { isValid: true, message: '' }
}

// Password validation
export const validatePassword = (password) => {
  if (!password) {
    return { isValid: false, message: VALIDATION_RULES.PASSWORD.required }
  }
  
  if (password.length < VALIDATION_RULES.PASSWORD.minLength.value) {
    return { isValid: false, message: VALIDATION_RULES.PASSWORD.minLength.message }
  }
  
  return { isValid: true, message: '' }
}

// Phone number validation
export const validatePhone = (phone) => {
  if (!phone) {
    return { isValid: true, message: '' } // Phone is optional
  }
  
  if (!VALIDATION_RULES.PHONE.pattern.value.test(phone)) {
    return { isValid: false, message: VALIDATION_RULES.PHONE.pattern.message }
  }
  
  return { isValid: true, message: '' }
}

// Name validation
export const validateName = (name) => {
  if (!name) {
    return { isValid: false, message: VALIDATION_RULES.NAME.required }
  }
  
  if (name.length < VALIDATION_RULES.NAME.minLength.value) {
    return { isValid: false, message: VALIDATION_RULES.NAME.minLength.message }
  }
  
  return { isValid: true, message: '' }
}

// Required field validation
export const validateRequired = (value, fieldName) => {
  if (!value || value.toString().trim() === '') {
    return { isValid: false, message: `${fieldName} is required` }
  }
  
  return { isValid: true, message: '' }
}

// Number validation
export const validateNumber = (value, options = {}) => {
  const { min, max, required = true } = options
  
  if (!value && !required) {
    return { isValid: true, message: '' }
  }
  
  if (!value && required) {
    return { isValid: false, message: 'This field is required' }
  }
  
  const numValue = Number(value)
  
  if (isNaN(numValue)) {
    return { isValid: false, message: 'Please enter a valid number' }
  }
  
  if (min !== undefined && numValue < min) {
    return { isValid: false, message: `Value must be at least ${min}` }
  }
  
  if (max !== undefined && numValue > max) {
    return { isValid: false, message: `Value must be at most ${max}` }
  }
  
  return { isValid: true, message: '' }
}

// Date validation
export const validateDate = (date, options = {}) => {
  const { minDate, maxDate, required = true } = options
  
  if (!date && !required) {
    return { isValid: true, message: '' }
  }
  
  if (!date && required) {
    return { isValid: false, message: 'Date is required' }
  }
  
  const dateObj = new Date(date)
  
  if (isNaN(dateObj.getTime())) {
    return { isValid: false, message: 'Please enter a valid date' }
  }
  
  if (minDate) {
    const minDateObj = new Date(minDate)
    if (dateObj < minDateObj) {
      return { isValid: false, message: `Date must be after ${minDateObj.toLocaleDateString()}` }
    }
  }
  
  if (maxDate) {
    const maxDateObj = new Date(maxDate)
    if (dateObj > maxDateObj) {
      return { isValid: false, message: `Date must be before ${maxDateObj.toLocaleDateString()}` }
    }
  }
  
  return { isValid: true, message: '' }
}

// URL validation
export const validateURL = (url, options = {}) => {
  const { required = false } = options
  
  if (!url && !required) {
    return { isValid: true, message: '' }
  }
  
  if (!url && required) {
    return { isValid: false, message: 'URL is required' }
  }
  
  try {
    new URL(url)
    return { isValid: true, message: '' }
  } catch {
    return { isValid: false, message: 'Please enter a valid URL' }
  }
}

// File validation
export const validateFile = (file, options = {}) => {
  const { 
    allowedTypes = [], 
    maxSize = 10 * 1024 * 1024, // 10MB default
    required = false 
  } = options
  
  if (!file && !required) {
    return { isValid: true, message: '' }
  }
  
  if (!file && required) {
    return { isValid: false, message: 'File is required' }
  }
  
  // Check file type
  if (allowedTypes.length > 0) {
    const fileExtension = '.' + file.name.split('.').pop().toLowerCase()
    if (!allowedTypes.includes(fileExtension)) {
      return { 
        isValid: false, 
        message: `File type not allowed. Allowed types: ${allowedTypes.join(', ')}` 
      }
    }
  }
  
  // Check file size
  if (file.size > maxSize) {
    return { 
      isValid: false, 
      message: `File too large. Maximum size: ${maxSize / 1024 / 1024}MB` 
    }
  }
  
  return { isValid: true, message: '' }
}

// Array validation
export const validateArray = (array, options = {}) => {
  const { minLength = 0, maxLength, required = false } = options
  
  if (!array && !required) {
    return { isValid: true, message: '' }
  }
  
  if (!array && required) {
    return { isValid: false, message: 'This field is required' }
  }
  
  if (!Array.isArray(array)) {
    return { isValid: false, message: 'Please provide a valid list' }
  }
  
  if (array.length < minLength) {
    return { isValid: false, message: `Please provide at least ${minLength} item(s)` }
  }
  
  if (maxLength && array.length > maxLength) {
    return { isValid: false, message: `Please provide at most ${maxLength} item(s)` }
  }
  
  return { isValid: true, message: '' }
}

// Course application validation
export const validateCourseApplication = (applicationData) => {
  const errors = {}
  
  // Validate personal information
  const nameValidation = validateName(applicationData.fullName)
  if (!nameValidation.isValid) errors.fullName = nameValidation.message
  
  const emailValidation = validateEmail(applicationData.email)
  if (!emailValidation.isValid) errors.email = emailValidation.message
  
  const phoneValidation = validatePhone(applicationData.phone)
  if (!phoneValidation.isValid) errors.phone = phoneValidation.message
  
  // Validate academic information
  const educationValidation = validateRequired(applicationData.educationLevel, 'Education level')
  if (!educationValidation.isValid) errors.educationLevel = educationValidation.message
  
  const institutionValidation = validateRequired(applicationData.previousInstitution, 'Previous institution')
  if (!institutionValidation.isValid) errors.previousInstitution = institutionValidation.message
  
  // Validate documents
  if (applicationData.documents && applicationData.documents.length === 0) {
    errors.documents = 'At least one document is required'
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}

// Job application validation
export const validateJobApplication = (applicationData) => {
  const errors = {}
  
  // Validate contact information
  const nameValidation = validateName(applicationData.fullName)
  if (!nameValidation.isValid) errors.fullName = nameValidation.message
  
  const emailValidation = validateEmail(applicationData.email)
  if (!emailValidation.isValid) errors.email = emailValidation.message
  
  const phoneValidation = validatePhone(applicationData.phone)
  if (!phoneValidation.isValid) errors.phone = phoneValidation.message
  
  // Validate professional information
  const experienceValidation = validateRequired(applicationData.experience, 'Experience level')
  if (!experienceValidation.isValid) errors.experience = experienceValidation.message
  
  // Validate cover letter
  if (applicationData.coverLetter && applicationData.coverLetter.length < 50) {
    errors.coverLetter = 'Cover letter should be at least 50 characters long'
  }
  
  // Validate resume
  if (!applicationData.resume) {
    errors.resume = 'Resume is required'
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}

// Course creation validation
export const validateCourse = (courseData) => {
  const errors = {}
  
  // Basic information
  const titleValidation = validateRequired(courseData.title, 'Course title')
  if (!titleValidation.isValid) errors.title = titleValidation.message
  
  const codeValidation = validateRequired(courseData.code, 'Course code')
  if (!codeValidation.isValid) errors.code = codeValidation.message
  
  const descriptionValidation = validateRequired(courseData.description, 'Course description')
  if (!descriptionValidation.isValid) errors.description = descriptionValidation.message
  
  if (courseData.description && courseData.description.length < 50) {
    errors.description = 'Course description should be at least 50 characters long'
  }
  
  // Duration and capacity
  const durationValidation = validateNumber(courseData.duration, { min: 1, required: true })
  if (!durationValidation.isValid) errors.duration = durationValidation.message
  
  const capacityValidation = validateNumber(courseData.intakeCapacity, { min: 1, required: true })
  if (!capacityValidation.isValid) errors.intakeCapacity = capacityValidation.message
  
  // Fees (optional but if provided, must be valid)
  if (courseData.fees !== undefined && courseData.fees !== null && courseData.fees !== '') {
    const feesValidation = validateNumber(courseData.fees, { min: 0, required: false })
    if (!feesValidation.isValid) errors.fees = feesValidation.message
  }
  
  // Requirements
  const requirementsValidation = validateArray(courseData.requirements, { minLength: 1, required: true })
  if (!requirementsValidation.isValid) errors.requirements = requirementsValidation.message
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}

// Job posting validation
export const validateJobPosting = (jobData) => {
  const errors = {}
  
  // Basic information
  const titleValidation = validateRequired(jobData.title, 'Job title')
  if (!titleValidation.isValid) errors.title = titleValidation.message
  
  const descriptionValidation = validateRequired(jobData.description, 'Job description')
  if (!descriptionValidation.isValid) errors.description = descriptionValidation.message
  
  if (jobData.description && jobData.description.length < 50) {
    errors.description = 'Job description should be at least 50 characters long'
  }
  
  // Job details
  const typeValidation = validateRequired(jobData.jobType, 'Job type')
  if (!typeValidation.isValid) errors.jobType = typeValidation.message
  
  const experienceValidation = validateRequired(jobData.experience, 'Experience level')
  if (!experienceValidation.isValid) errors.experience = experienceValidation.message
  
  const locationValidation = validateRequired(jobData.location, 'Location')
  if (!locationValidation.isValid) errors.location = locationValidation.message
  
  // Vacancy
  const vacancyValidation = validateNumber(jobData.vacancy, { min: 1, required: true })
  if (!vacancyValidation.isValid) errors.vacancy = vacancyValidation.message
  
  // Requirements
  const requirementsValidation = validateArray(jobData.requirements, { minLength: 1, required: true })
  if (!requirementsValidation.isValid) errors.requirements = requirementsValidation.message
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}

// Profile validation
export const validateProfile = (profileData, userRole) => {
  const errors = {}
  
  // Common fields
  const nameValidation = validateName(profileData.displayName || profileData.name)
  if (!nameValidation.isValid) errors.displayName = nameValidation.message
  
  const emailValidation = validateEmail(profileData.email)
  if (!emailValidation.isValid) errors.email = emailValidation.message
  
  const phoneValidation = validatePhone(profileData.phone)
  if (!phoneValidation.isValid) errors.phone = phoneValidation.message
  
  // Role-specific validations
  if (userRole === 'student') {
    const educationValidation = validateRequired(profileData.educationLevel, 'Education level')
    if (!educationValidation.isValid) errors.educationLevel = educationValidation.message
    
    const institutionValidation = validateRequired(profileData.institution, 'Current institution')
    if (!institutionValidation.isValid) errors.institution = institutionValidation.message
  }
  
  if (userRole === 'institution' || userRole === 'company') {
    const descriptionValidation = validateRequired(profileData.description, 'Description')
    if (!descriptionValidation.isValid) errors.description = descriptionValidation.message
    
    if (profileData.description && profileData.description.length < 100) {
      errors.description = 'Description should be at least 100 characters long'
    }
    
    const addressValidation = validateRequired(profileData.address, 'Address')
    if (!addressValidation.isValid) errors.address = addressValidation.message
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}

// Create validator function for form fields
export const createValidator = (validations) => {
  return (values) => {
    const errors = {}
    
    Object.keys(validations).forEach(fieldName => {
      const validation = validations[fieldName]
      const value = values[fieldName]
      
      if (validation.required && (!value || value.toString().trim() === '')) {
        errors[fieldName] = validation.message || `${fieldName} is required`
        return
      }
      
      if (validation.pattern && value && !validation.pattern.test(value)) {
        errors[fieldName] = validation.message || `Invalid ${fieldName} format`
        return
      }
      
      if (validation.minLength && value && value.length < validation.minLength) {
        errors[fieldName] = validation.message || `${fieldName} must be at least ${validation.minLength} characters`
        return
      }
      
      if (validation.maxLength && value && value.length > validation.maxLength) {
        errors[fieldName] = validation.message || `${fieldName} must be at most ${validation.maxLength} characters`
        return
      }
      
      if (validation.min && value !== undefined && value !== null && Number(value) < validation.min) {
        errors[fieldName] = validation.message || `${fieldName} must be at least ${validation.min}`
        return
      }
      
      if (validation.max && value !== undefined && value !== null && Number(value) > validation.max) {
        errors[fieldName] = validation.message || `${fieldName} must be at most ${validation.max}`
        return
      }
      
      if (validation.validate && value) {
        const customValidation = validation.validate(value, values)
        if (!customValidation.isValid) {
          errors[fieldName] = customValidation.message
        }
      }
    })
    
    return errors
  }
}

// Export all validators
export default {
  validateEmail,
  validatePassword,
  validatePhone,
  validateName,
  validateRequired,
  validateNumber,
  validateDate,
  validateURL,
  validateFile,
  validateArray,
  validateCourseApplication,
  validateJobApplication,
  validateCourse,
  validateJobPosting,
  validateProfile,
  createValidator
}