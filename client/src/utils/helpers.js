import { 
  APPLICATION_STATUS, 
  JOB_APPLICATION_STATUS, 
  JOB_TYPES, 
  EXPERIENCE_LEVELS,
  EDUCATION_LEVELS,
  DATE_FORMATS 
} from './constants'

// Format date to readable string
export const formatDate = (date, format = DATE_FORMATS.DISPLAY) => {
  if (!date) return 'N/A'
  
  try {
    const dateObj = date?.toDate ? date.toDate() : new Date(date)
    
    if (isNaN(dateObj.getTime())) return 'Invalid Date'
    
    const options = {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }
    
    if (format === DATE_FORMATS.DISPLAY_WITH_TIME) {
      options.hour = '2-digit'
      options.minute = '2-digit'
    }
    
    return dateObj.toLocaleDateString('en-US', options)
  } catch (error) {
    console.error('Date formatting error:', error)
    return 'Invalid Date'
  }
}

// Format relative time (e.g., "2 hours ago")
export const formatRelativeTime = (date) => {
  if (!date) return 'N/A'
  
  try {
    const dateObj = date?.toDate ? date.toDate() : new Date(date)
    const now = new Date()
    const diffInSeconds = Math.floor((now - dateObj) / 1000)
    
    if (diffInSeconds < 60) return 'Just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`
    
    return formatDate(date)
  } catch (error) {
    console.error('Relative time formatting error:', error)
    return 'Invalid Date'
  }
}

// Format file size to human readable string
export const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// Get application status badge configuration
export const getApplicationStatusConfig = (status) => {
  const config = {
    [APPLICATION_STATUS.PENDING]: {
      label: 'Under Review',
      color: 'yellow',
      icon: 'clock'
    },
    [APPLICATION_STATUS.ACCEPTED]: {
      label: 'Admitted',
      color: 'green',
      icon: 'check-circle'
    },
    [APPLICATION_STATUS.REJECTED]: {
      label: 'Not Admitted',
      color: 'red',
      icon: 'x-circle'
    },
    [APPLICATION_STATUS.WAITLISTED]: {
      label: 'Waitlisted',
      color: 'blue',
      icon: 'clock'
    },
    [APPLICATION_STATUS.WITHDRAWN]: {
      label: 'Withdrawn',
      color: 'gray',
      icon: 'x-circle'
    }
  }
  
  return config[status] || { label: status, color: 'gray', icon: 'help-circle' }
}

// Get job application status configuration
export const getJobApplicationStatusConfig = (status) => {
  const config = {
    [JOB_APPLICATION_STATUS.PENDING]: {
      label: 'Application Review',
      color: 'yellow',
      icon: 'clock'
    },
    [JOB_APPLICATION_STATUS.REVIEW]: {
      label: 'Under Review',
      color: 'blue',
      icon: 'eye'
    },
    [JOB_APPLICATION_STATUS.INTERVIEW]: {
      label: 'Interview Stage',
      color: 'purple',
      icon: 'calendar'
    },
    [JOB_APPLICATION_STATUS.ACCEPTED]: {
      label: 'Offer Received',
      color: 'green',
      icon: 'check-circle'
    },
    [JOB_APPLICATION_STATUS.REJECTED]: {
      label: 'Not Selected',
      color: 'red',
      icon: 'x-circle'
    }
  }
  
  return config[status] || { label: status, color: 'gray', icon: 'help-circle' }
}

// Get job type label
export const getJobTypeLabel = (jobType) => {
  const labels = {
    [JOB_TYPES.FULL_TIME]: 'Full Time',
    [JOB_TYPES.PART_TIME]: 'Part Time',
    [JOB_TYPES.CONTRACT]: 'Contract',
    [JOB_TYPES.INTERNSHIP]: 'Internship',
    [JOB_TYPES.REMOTE]: 'Remote'
  }
  
  return labels[jobType] || jobType
}

// Get experience level label
export const getExperienceLabel = (experience) => {
  const labels = {
    [EXPERIENCE_LEVELS.ENTRY]: 'Entry Level',
    [EXPERIENCE_LEVELS.MID]: 'Mid Level',
    [EXPERIENCE_LEVELS.SENIOR]: 'Senior Level',
    [EXPERIENCE_LEVELS.EXECUTIVE]: 'Executive'
  }
  
  return labels[experience] || experience
}

// Get education level label
export const getEducationLabel = (educationLevel) => {
  const labels = {
    [EDUCATION_LEVELS.HIGH_SCHOOL]: 'High School',
    [EDUCATION_LEVELS.ASSOCIATE]: 'Associate Degree',
    [EDUCATION_LEVELS.BACHELOR]: "Bachelor's Degree",
    [EDUCATION_LEVELS.MASTER]: "Master's Degree",
    [EDUCATION_LEVELS.PHD]: 'PhD',
    [EDUCATION_LEVELS.OTHER]: 'Other'
  }
  
  return labels[educationLevel] || educationLevel
}

// Generate random ID
export const generateId = (prefix = '') => {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substr(2, 9)
  return `${prefix}${timestamp}${random}`
}

// Debounce function for search inputs
export const debounce = (func, wait) => {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

// Throttle function for scroll events
export const throttle = (func, limit) => {
  let inThrottle
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

// Deep clone object
export const deepClone = (obj) => {
  if (obj === null || typeof obj !== 'object') return obj
  if (obj instanceof Date) return new Date(obj.getTime())
  if (obj instanceof Array) return obj.map(item => deepClone(item))
  if (obj instanceof Object) {
    const clonedObj = {}
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(obj[key])
      }
    }
    return clonedObj
  }
}

// Check if object is empty
export const isEmpty = (obj) => {
  if (!obj) return true
  if (Array.isArray(obj)) return obj.length === 0
  if (typeof obj === 'object') return Object.keys(obj).length === 0
  return !obj
}

// Get initials from name
export const getInitials = (name) => {
  if (!name) return '?'
  
  return name
    .split(' ')
    .map(part => part.charAt(0).toUpperCase())
    .join('')
    .substring(0, 2)
}

// Capitalize first letter of each word
export const capitalizeWords = (str) => {
  if (!str) return ''
  
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

// Truncate text with ellipsis
export const truncateText = (text, maxLength = 100) => {
  if (!text) return ''
  if (text.length <= maxLength) return text
  
  return text.substring(0, maxLength).trim() + '...'
}

// Validate email format
export const isValidEmail = (email) => {
  const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i
  return emailRegex.test(email)
}

// Validate phone number (basic)
export const isValidPhone = (phone) => {
  const phoneRegex = /^\+?[\d\s-()]+$/
  return phoneRegex.test(phone)
}

// Format currency
export const formatCurrency = (amount, currency = 'LSL') => {
  if (amount === null || amount === undefined) return 'N/A'
  
  return new Intl.NumberFormat('en-LS', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(amount)
}

// Calculate percentage
export const calculatePercentage = (value, total) => {
  if (!total || total === 0) return 0
  return Math.round((value / total) * 100)
}

// Get query parameters from URL
export const getQueryParams = (search = '') => {
  const params = new URLSearchParams(search)
  const result = {}
  
  for (const [key, value] of params) {
    result[key] = value
  }
  
  return result
}

// Set query parameters in URL
export const setQueryParams = (params, baseUrl = '') => {
  const urlParams = new URLSearchParams()
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      urlParams.set(key, value.toString())
    }
  })
  
  const queryString = urlParams.toString()
  return queryString ? `${baseUrl}?${queryString}` : baseUrl
}

// Remove empty properties from object
export const removeEmptyProperties = (obj) => {
  const cleaned = { ...obj }
  
  Object.keys(cleaned).forEach(key => {
    if (cleaned[key] === null || cleaned[key] === undefined || cleaned[key] === '') {
      delete cleaned[key]
    }
  })
  
  return cleaned
}

// Group array of objects by key
export const groupBy = (array, key) => {
  return array.reduce((groups, item) => {
    const group = item[key]
    groups[group] = groups[group] || []
    groups[group].push(item)
    return groups
  }, {})
}

// Sort array by key
export const sortBy = (array, key, direction = 'asc') => {
  return [...array].sort((a, b) => {
    let aValue = a[key]
    let bValue = b[key]
    
    // Handle nested keys (e.g., 'user.name')
    if (key.includes('.')) {
      aValue = key.split('.').reduce((o, i) => o?.[i], a)
      bValue = key.split('.').reduce((o, i) => o?.[i], b)
    }
    
    if (aValue < bValue) return direction === 'asc' ? -1 : 1
    if (aValue > bValue) return direction === 'asc' ? 1 : -1
    return 0
  })
}

// Generate color from string (for avatars)
export const stringToColor = (string) => {
  let hash = 0
  for (let i = 0; i < string.length; i++) {
    hash = string.charCodeAt(i) + ((hash << 5) - hash)
  }
  
  let color = '#'
  for (let i = 0; i < 3; i++) {
    const value = (hash >> (i * 8)) & 0xFF
    color += ('00' + value.toString(16)).substr(-2)
  }
  
  return color
}

// Check if value is within date range
export const isWithinDateRange = (date, startDate, endDate) => {
  const checkDate = date?.toDate ? date.toDate() : new Date(date)
  const start = startDate?.toDate ? startDate.toDate() : new Date(startDate)
  const end = endDate?.toDate ? endDate.toDate() : new Date(endDate)
  
  return checkDate >= start && checkDate <= end
}

// Get age from birth date
export const getAge = (birthDate) => {
  if (!birthDate) return null
  
  const today = new Date()
  const birth = birthDate?.toDate ? birthDate.toDate() : new Date(birthDate)
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--
  }
  
  return age
}

// Export all helpers
export default {
  formatDate,
  formatRelativeTime,
  formatFileSize,
  getApplicationStatusConfig,
  getJobApplicationStatusConfig,
  getJobTypeLabel,
  getExperienceLabel,
  generateId,
  debounce,
  deepClone,
  isEmpty,
  getInitials,
  capitalizeWords,
  truncateText,
  isValidEmail,
  isValidPhone,
  formatCurrency,
  calculatePercentage,
  getQueryParams,
  setQueryParams,
  removeEmptyProperties,
  groupBy,
  sortBy,
  stringToColor,
  isWithinDateRange,
  getAge
}