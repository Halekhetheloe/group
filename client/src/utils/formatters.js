import { CURRENCIES, JOB_TYPES, EXPERIENCE_LEVELS, EDUCATION_LEVELS } from './constants'

// Currency formatting
export const formatCurrency = (amount, currency = CURRENCIES.LSL, locale = 'en-LS') => {
  if (amount === null || amount === undefined) return 'N/A'
  
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(amount)
  } catch (error) {
    // Fallback formatting
    return `${currency} ${amount?.toLocaleString() || '0'}`
  }
}

// Number formatting with thousands separators
export const formatNumber = (number, options = {}) => {
  if (number === null || number === undefined) return 'N/A'
  
  const { 
    decimals = 0,
    locale = 'en-LS'
  } = options
  
  try {
    return new Intl.NumberFormat(locale, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(number)
  } catch (error) {
    return number.toString()
  }
}

// Percentage formatting
export const formatPercentage = (value, total, decimals = 1) => {
  if (!total || total === 0) return '0%'
  
  const percentage = (value / total) * 100
  return `${percentage.toFixed(decimals)}%`
}

// Duration formatting
export const formatDuration = (duration, unit) => {
  if (!duration) return 'N/A'
  
  const durationNum = Number(duration)
  
  switch (unit) {
    case 'months':
      if (durationNum >= 12) {
        const years = durationNum / 12
        return `${years} year${years > 1 ? 's' : ''}`
      }
      return `${durationNum} month${durationNum > 1 ? 's' : ''}`
    
    case 'years':
      return `${durationNum} year${durationNum > 1 ? 's' : ''}`
    
    case 'semesters':
      return `${durationNum} semester${durationNum > 1 ? 's' : ''}`
    
    default:
      return `${durationNum} ${unit}`
  }
}

// File size formatting
export const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

// Phone number formatting
export const formatPhoneNumber = (phone) => {
  if (!phone) return ''
  
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '')
  
  // Format Lesotho phone numbers
  if (cleaned.length === 8) {
    return `+266 ${cleaned.substring(0, 4)} ${cleaned.substring(4)}`
  }
  
  if (cleaned.length === 12 && cleaned.startsWith('266')) {
    return `+${cleaned.substring(0, 3)} ${cleaned.substring(3, 6)} ${cleaned.substring(6, 9)} ${cleaned.substring(9)}`
  }
  
  // Return original if no specific format matches
  return phone
}

// Name formatting (title case)
export const formatName = (name) => {
  if (!name) return ''
  
  return name
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

// Email formatting (lowercase)
export const formatEmail = (email) => {
  if (!email) return ''
  return email.toLowerCase().trim()
}

// Address formatting
export const formatAddress = (address) => {
  if (!address) return ''
  
  // Basic address formatting - can be enhanced based on specific requirements
  return address
    .split(',')
    .map(part => part.trim())
    .filter(part => part)
    .join(', ')
}

// URL formatting
export const formatURL = (url) => {
  if (!url) return ''
  
  // Ensure URL has protocol
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return `https://${url}`
  }
  
  return url
}

// Social security number formatting (if needed)
export const formatSSN = (ssn) => {
  if (!ssn) return ''
  
  const cleaned = ssn.replace(/\D/g, '')
  
  if (cleaned.length === 9) {
    return `${cleaned.substring(0, 3)}-${cleaned.substring(3, 5)}-${cleaned.substring(5)}`
  }
  
  return ssn
}

// Credit card number formatting (if needed for payments)
export const formatCreditCard = (cardNumber) => {
  if (!cardNumber) return ''
  
  const cleaned = cardNumber.replace(/\D/g, '')
  
  if (cleaned.length === 16) {
    return `${cleaned.substring(0, 4)} ${cleaned.substring(4, 8)} ${cleaned.substring(8, 12)} ${cleaned.substring(12)}`
  }
  
  return cardNumber
}

// Date range formatting
export const formatDateRange = (startDate, endDate, options = {}) => {
  if (!startDate) return 'N/A'
  
  const start = startDate?.toDate ? startDate.toDate() : new Date(startDate)
  const end = endDate?.toDate ? endDate.toDate() : new Date(endDate)
  
  const { 
    format = 'short',
    separator = ' - ' 
  } = options
  
  const formatOptions = {
    short: { month: 'short', day: 'numeric' },
    medium: { month: 'short', day: 'numeric', year: 'numeric' },
    long: { month: 'long', day: 'numeric', year: 'numeric' }
  }
  
  const startFormatted = start.toLocaleDateString('en-US', formatOptions[format])
  
  if (!endDate || isNaN(end.getTime())) {
    return `${startFormatted}${separator}Present`
  }
  
  const endFormatted = end.toLocaleDateString('en-US', formatOptions[format])
  
  return `${startFormatted}${separator}${endFormatted}`
}

// List formatting (array to string)
export const formatList = (items, options = {}) => {
  if (!items || !Array.isArray(items)) return ''
  
  const {
    separator = ', ',
    maxItems,
    andConjunction = true
  } = options
  
  let formattedItems = items
  
  if (maxItems && items.length > maxItems) {
    formattedItems = items.slice(0, maxItems)
    const remaining = items.length - maxItems
    formattedItems.push(`+${remaining} more`)
  }
  
  if (andConjunction && formattedItems.length > 1 && !formattedItems.some(item => item.includes('more'))) {
    const lastItem = formattedItems.pop()
    return `${formattedItems.join(separator)} and ${lastItem}`
  }
  
  return formattedItems.join(separator)
}

// Sentence case formatting
export const formatSentenceCase = (text) => {
  if (!text) return ''
  
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()
}

// Camel case to human readable
export const camelCaseToHuman = (text) => {
  if (!text) return ''
  
  return text
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .trim()
}

// Snake case to human readable
export const snakeCaseToHuman = (text) => {
  if (!text) return ''
  
  return text
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

// Truncate text with custom ellipsis
export const formatTruncate = (text, maxLength, ellipsis = '...') => {
  if (!text) return ''
  if (text.length <= maxLength) return text
  
  return text.substring(0, maxLength - ellipsis.length).trim() + ellipsis
}

// Format enum values to human readable
export const formatEnum = (value, enumType) => {
  if (!value) return ''
  
  const formatters = {
    [JOB_TYPES.FULL_TIME]: 'Full Time',
    [JOB_TYPES.PART_TIME]: 'Part Time',
    [JOB_TYPES.CONTRACT]: 'Contract',
    [JOB_TYPES.INTERNSHIP]: 'Internship',
    [JOB_TYPES.REMOTE]: 'Remote',
    
    [EXPERIENCE_LEVELS.ENTRY]: 'Entry Level',
    [EXPERIENCE_LEVELS.MID]: 'Mid Level',
    [EXPERIENCE_LEVELS.SENIOR]: 'Senior Level',
    [EXPERIENCE_LEVELS.EXECUTIVE]: 'Executive',
    
    [EDUCATION_LEVELS.HIGH_SCHOOL]: 'High School',
    [EDUCATION_LEVELS.ASSOCIATE]: 'Associate Degree',
    [EDUCATION_LEVELS.BACHELOR]: "Bachelor's Degree",
    [EDUCATION_LEVELS.MASTER]: "Master's Degree",
    [EDUCATION_LEVELS.PHD]: 'PhD',
    [EDUCATION_LEVELS.OTHER]: 'Other'
  }
  
  return formatters[value] || camelCaseToHuman(value)
}

// Format boolean to yes/no
export const formatBoolean = (value, options = {}) => {
  const { 
    format = 'yesno', // 'yesno', 'truefalse', 'activeinactive'
    capitalize = true 
  } = options
  
  const formats = {
    yesno: { true: 'Yes', false: 'No' },
    truefalse: { true: 'True', false: 'False' },
    activeinactive: { true: 'Active', false: 'Inactive' },
    enableddisabled: { true: 'Enabled', false: 'Disabled' }
  }
  
  const selectedFormat = formats[format] || formats.yesno
  let result = value ? selectedFormat.true : selectedFormat.false
  
  if (!capitalize) {
    result = result.toLowerCase()
  }
  
  return result
}

// Format relative time (e.g., "2 hours ago")
export const formatRelativeTime = (date) => {
  if (!date) return 'N/A'
  
  try {
    const dateObj = date?.toDate ? date.toDate() : new Date(date)
    const now = new Date()
    const diffInSeconds = Math.floor((now - dateObj) / 1000)
    
    if (diffInSeconds < 60) return 'Just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 604800)}w ago`
    if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)}mo ago`
    
    return `${Math.floor(diffInSeconds / 31536000)}y ago`
  } catch (error) {
    return 'Invalid Date'
  }
}

// Format time duration (e.g., "2h 30m")
export const formatTimeDuration = (seconds) => {
  if (!seconds || seconds === 0) return '0s'
  
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const remainingSeconds = seconds % 60
  
  const parts = []
  
  if (hours > 0) parts.push(`${hours}h`)
  if (minutes > 0) parts.push(`${minutes}m`)
  if (remainingSeconds > 0 || parts.length === 0) parts.push(`${remainingSeconds}s`)
  
  return parts.join(' ')
}

// Format large numbers with K, M, B suffixes
export const formatCompactNumber = (number) => {
  if (!number && number !== 0) return 'N/A'
  
  const num = Number(number)
  
  if (num < 1000) return num.toString()
  if (num < 1000000) return `${(num / 1000).toFixed(1)}K`
  if (num < 1000000000) return `${(num / 1000000).toFixed(1)}M`
  
  return `${(num / 1000000000).toFixed(1)}B`
}

// Format file type from MIME type or extension
export const formatFileType = (fileTypeOrName) => {
  if (!fileTypeOrName) return 'Unknown'
  
  const typeMap = {
    // Documents
    'pdf': 'PDF Document',
    'doc': 'Word Document',
    'docx': 'Word Document',
    'txt': 'Text File',
    'rtf': 'Rich Text File',
    
    // Images
    'jpg': 'JPEG Image',
    'jpeg': 'JPEG Image',
    'png': 'PNG Image',
    'gif': 'GIF Image',
    'svg': 'SVG Image',
    
    // Spreadsheets
    'xls': 'Excel Spreadsheet',
    'xlsx': 'Excel Spreadsheet',
    'csv': 'CSV File',
    
    // Presentations
    'ppt': 'PowerPoint Presentation',
    'pptx': 'PowerPoint Presentation'
  }
  
  // Extract extension from filename or use the type directly
  const extension = fileTypeOrName.includes('.') 
    ? fileTypeOrName.split('.').pop().toLowerCase()
    : fileTypeOrName.split('/').pop().toLowerCase()
  
  return typeMap[extension] || camelCaseToHuman(extension) || 'File'
}

// Export all formatters
export default {
  formatCurrency,
  formatNumber,
  formatPercentage,
  formatDuration,
  formatFileSize,
  formatPhoneNumber,
  formatName,
  formatEmail,
  formatAddress,
  formatURL,
  formatSSN,
  formatCreditCard,
  formatDateRange,
  formatList,
  formatSentenceCase,
  camelCaseToHuman,
  snakeCaseToHuman,
  formatTruncate,
  formatEnum,
  formatBoolean,
  formatRelativeTime,
  formatTimeDuration,
  formatCompactNumber,
  formatFileType
}