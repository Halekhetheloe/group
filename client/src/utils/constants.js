// Application Constants

// User Roles
export const USER_ROLES = {
  STUDENT: 'student',
  INSTITUTION: 'institution',
  COMPANY: 'company',
  ADMIN: 'admin'
}

// Application Status
export const APPLICATION_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
  WAITLISTED: 'waitlisted',
  WITHDRAWN: 'withdrawn'
}

// Job Application Status
export const JOB_APPLICATION_STATUS = {
  PENDING: 'pending',
  REVIEW: 'review',
  INTERVIEW: 'interview',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected'
}

// Course Status
export const COURSE_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  ARCHIVED: 'archived'
}

// Job Status
export const JOB_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  FILLED: 'filled',
  EXPIRED: 'expired'
}

// Institution Status
export const INSTITUTION_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  SUSPENDED: 'suspended'
}

// Company Status
export const COMPANY_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  SUSPENDED: 'suspended'
}

// Job Types
export const JOB_TYPES = {
  FULL_TIME: 'full-time',
  PART_TIME: 'part-time',
  CONTRACT: 'contract',
  INTERNSHIP: 'internship',
  REMOTE: 'remote'
}

// Experience Levels
export const EXPERIENCE_LEVELS = {
  ENTRY: 'entry',
  MID: 'mid',
  SENIOR: 'senior',
  EXECUTIVE: 'executive'
}

// Education Levels
export const EDUCATION_LEVELS = {
  HIGH_SCHOOL: 'high-school',
  ASSOCIATE: 'associate',
  BACHELOR: 'bachelor',
  MASTER: 'master',
  PHD: 'phd',
  OTHER: 'other'
}

// Duration Units
export const DURATION_UNITS = {
  MONTHS: 'months',
  YEARS: 'years',
  SEMESTERS: 'semesters'
}

// Currency Codes
export const CURRENCIES = {
  LSL: 'LSL',
  USD: 'USD',
  ZAR: 'ZAR'
}

// Document Types
export const DOCUMENT_TYPES = {
  TRANSCRIPT: 'transcript',
  RESUME: 'resume',
  CERTIFICATE: 'certificate',
  ID: 'id',
  PROFILE_PICTURE: 'profile_picture',
  LOGO: 'logo'
}

// File Upload Limits (in bytes)
export const FILE_LIMITS = {
  PROFILE_PICTURE: 5 * 1024 * 1024, // 5MB
  DOCUMENT: 10 * 1024 * 1024, // 10MB
  LOGO: 2 * 1024 * 1024 // 2MB
}

// Allowed File Types
export const ALLOWED_FILE_TYPES = {
  IMAGES: ['.jpg', '.jpeg', '.png', '.gif'],
  DOCUMENTS: ['.pdf', '.doc', '.docx'],
  ALL: ['.jpg', '.jpeg', '.png', '.gif', '.pdf', '.doc', '.docx']
}

// Notification Types
export const NOTIFICATION_TYPES = {
  APPLICATION: 'application',
  ADMISSION: 'admission',
  JOB: 'job',
  SYSTEM: 'system',
  PROFILE: 'profile',
  DOCUMENT: 'document'
}

// Application Limits
export const APPLICATION_LIMITS = {
  MAX_COURSES_PER_INSTITUTION: 2,
  MAX_ACTIVE_APPLICATIONS: 10
}

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZES: [10, 25, 50, 100]
}

// Date Formats
export const DATE_FORMATS = {
  DISPLAY: 'DD MMM YYYY',
  DISPLAY_WITH_TIME: 'DD MMM YYYY, HH:mm',
  API: 'YYYY-MM-DD',
  TIME: 'HH:mm'
}

// Local Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  USER_PREFERENCES: 'user_preferences',
  RECENT_SEARCHES: 'recent_searches'
}

// API Endpoints
export const API_ENDPOINTS = {
  // Auth
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  LOGOUT: '/auth/logout',
  REFRESH_TOKEN: '/auth/refresh',
  
  // Users
  USERS: '/users',
  USER_PROFILE: '/users/profile',
  
  // Courses
  COURSES: '/courses',
  COURSE_APPLICATIONS: '/courses/applications',
  
  // Jobs
  JOBS: '/jobs',
  JOB_APPLICATIONS: '/jobs/applications',
  
  // Institutions
  INSTITUTIONS: '/institutions',
  
  // Companies
  COMPANIES: '/companies',
  
  // Files
  UPLOAD: '/upload',
  DOCUMENTS: '/documents'
}

// Error Messages
export const ERROR_MESSAGES = {
  // Auth Errors
  INVALID_CREDENTIALS: 'Invalid email or password',
  EMAIL_NOT_VERIFIED: 'Please verify your email before logging in',
  ACCOUNT_PENDING: 'Your account is pending approval',
  UNAUTHORIZED: 'You are not authorized to perform this action',
  
  // Application Errors
  APPLICATION_LIMIT_EXCEEDED: 'You can only apply to 2 courses per institution',
  DUPLICATE_APPLICATION: 'You have already applied to this course',
  COURSE_NOT_ACTIVE: 'This course is not currently accepting applications',
  DEADLINE_PASSED: 'The application deadline has passed',
  
  // File Upload Errors
  FILE_TOO_LARGE: 'File size exceeds the maximum limit',
  INVALID_FILE_TYPE: 'File type is not allowed',
  UPLOAD_FAILED: 'Failed to upload file',
  
  // General Errors
  NETWORK_ERROR: 'Network error. Please check your connection',
  SERVER_ERROR: 'Server error. Please try again later',
  VALIDATION_ERROR: 'Please check your input and try again'
}

// Success Messages
export const SUCCESS_MESSAGES = {
  PROFILE_UPDATED: 'Profile updated successfully',
  APPLICATION_SUBMITTED: 'Application submitted successfully',
  JOB_APPLICATION_SUBMITTED: 'Job application submitted successfully',
  DOCUMENT_UPLOADED: 'Document uploaded successfully',
  PASSWORD_RESET_SENT: 'Password reset email sent successfully'
}

// Validation Rules
export const VALIDATION_RULES = {
  EMAIL: {
    required: 'Email is required',
    pattern: {
      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
      message: 'Invalid email address'
    }
  },
  PASSWORD: {
    required: 'Password is required',
    minLength: {
      value: 6,
      message: 'Password must be at least 6 characters'
    }
  },
  PHONE: {
    pattern: {
      value: /^\+?[\d\s-()]+$/,
      message: 'Invalid phone number'
    }
  },
  NAME: {
    required: 'Name is required',
    minLength: {
      value: 2,
      message: 'Name must be at least 2 characters'
    }
  }
}

// Feature Flags
export const FEATURE_FLAGS = {
  ENABLE_JOB_APPLICATIONS: true,
  ENABLE_COURSE_RECOMMENDATIONS: true,
  ENABLE_EMAIL_NOTIFICATIONS: true,
  ENABLE_FILE_UPLOADS: true,
  ENABLE_ADVANCED_SEARCH: true
}

// Default Values
export const DEFAULTS = {
  AVATAR: '/images/default-avatar.png',
  LOGO: '/images/default-logo.png',
  COURSE_IMAGE: '/images/default-course.jpg',
  COMPANY_LOGO: '/images/default-company.png'
}

export default {
  USER_ROLES,
  APPLICATION_STATUS,
  JOB_TYPES,
  EXPERIENCE_LEVELS,
  EDUCATION_LEVELS,
  FILE_LIMITS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  VALIDATION_RULES
}