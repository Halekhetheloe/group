import path from 'path';
import { storageService } from '../config/storage.js';

// File type detection and validation
export const fileTypes = {
  images: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
  documents: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'application/rtf'
  ],
  transcripts: ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'],
  archives: ['application/zip', 'application/x-rar-compressed']
};

export const getFileType = (mimetype) => {
  for (const [type, mimes] of Object.entries(fileTypes)) {
    if (mimes.includes(mimetype)) {
      return type;
    }
  }
  return 'other';
};

export const isImage = (mimetype) => {
  return fileTypes.images.includes(mimetype);
};

export const isDocument = (mimetype) => {
  return fileTypes.documents.includes(mimetype);
};

export const isTranscript = (mimetype) => {
  return fileTypes.transcripts.includes(mimetype);
};

// File size utilities
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const validateFileSize = (file, maxSize) => {
  if (!file || !file.size) {
    return { isValid: false, error: 'File is required' };
  }
  
  if (file.size > maxSize) {
    const maxSizeFormatted = formatFileSize(maxSize);
    const fileSizeFormatted = formatFileSize(file.size);
    
    return {
      isValid: false,
      error: `File size ${fileSizeFormatted} exceeds maximum allowed size of ${maxSizeFormatted}`
    };
  }
  
  return { isValid: true };
};

// File name and path utilities
export const generateSafeFileName = (originalName) => {
  const extension = path.extname(originalName);
  const baseName = path.basename(originalName, extension);
  
  // Remove special characters and replace spaces with underscores
  const safeBaseName = baseName
    .replace(/[^a-zA-Z0-9]/g, '_')
    .replace(/_+/g, '_')
    .toLowerCase();
  
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 8);
  
  return `${safeBaseName}_${timestamp}_${randomString}${extension}`;
};

export const getFileExtension = (filename) => {
  return path.extname(filename).toLowerCase();
};

export const isValidExtension = (filename, allowedExtensions) => {
  const extension = getFileExtension(filename);
  return allowedExtensions.includes(extension);
};

// File validation
export const validateFile = (file, options = {}) => {
  const {
    allowedTypes = [],
    maxSize = 10 * 1024 * 1024, // 10MB default
    required = true
  } = options;

  // Check if file exists
  if (required && !file) {
    return { isValid: false, error: 'File is required' };
  }

  if (!file) {
    return { isValid: true };
  }

  // Check file type
  if (allowedTypes.length > 0 && !allowedTypes.includes(file.mimetype)) {
    return {
      isValid: false,
      error: `File type '${file.mimetype}' is not allowed. Allowed types: ${allowedTypes.join(', ')}`
    };
  }

  // Check file size
  const sizeValidation = validateFileSize(file, maxSize);
  if (!sizeValidation.isValid) {
    return sizeValidation;
  }

  // Additional security checks
  if (isImage(file.mimetype)) {
    const imageValidation = validateImageFile(file);
    if (!imageValidation.isValid) {
      return imageValidation;
    }
  }

  return { isValid: true };
};

// Image-specific validation
export const validateImageFile = (file) => {
  if (!isImage(file.mimetype)) {
    return { isValid: false, error: 'File is not a valid image' };
  }

  // Check for common image vulnerabilities
  const dangerousPatterns = [
    /<\?php/,
    /<script/,
    /eval\(/,
    /base64_decode/,
    /gopher:/,
    /php:/,
    /data:/
  ];

  // Read first few bytes to check for magic numbers
  const buffer = file.buffer.slice(0, 8);
  const fileHeader = buffer.toString('hex');

  // Validate common image magic numbers
  const magicNumbers = {
    'jpeg': 'ffd8ffe0',
    'jpg': 'ffd8ffe0',
    'png': '89504e47',
    'gif': '47494638'
  };

  const expectedMagicNumber = magicNumbers[file.mimetype.split('/')[1]];
  if (expectedMagicNumber && !fileHeader.startsWith(expectedMagicNumber)) {
    return { isValid: false, error: 'Invalid file format' };
  }

  for (const pattern of dangerousPatterns) {
    if (pattern.test(file.buffer.toString('utf8'))) {
      return { isValid: false, error: 'File contains potentially dangerous content' };
    }
  }

  return { isValid: true };
};

// File upload utilities
export const generateUploadPath = (userId, fileType, fileName) => {
  const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const safeFileName = generateSafeFileName(fileName);
  
  switch (fileType) {
    case 'profile':
      return `users/${userId}/profile/${safeFileName}`;
    case 'transcript':
      return `students/${userId}/transcripts/${timestamp}/${safeFileName}`;
    case 'institution_logo':
      return `institutions/${userId}/logo/${safeFileName}`;
    case 'company_logo':
      return `companies/${userId}/logo/${safeFileName}`;
    case 'document':
      return `documents/${userId}/${timestamp}/${safeFileName}`;
    default:
      return `uploads/${userId}/${timestamp}/${safeFileName}`;
  }
};

export const getPublicUrl = (filePath) => {
  // This would generate a public URL based on your storage configuration
  // For Firebase Storage, it would be something like:
  // `https://storage.googleapis.com/${bucketName}/${filePath}`
  return filePath; // Placeholder - implement based on your storage solution
};

// File processing utilities
export const processImage = async (file, options = {}) => {
  const {
    maxWidth = 1200,
    maxHeight = 1200,
    quality = 80
  } = options;

  // This would typically use a library like sharp for image processing
  // For now, we'll return the original file
  console.log(`Processing image: ${file.originalname} (${file.size} bytes)`);
  
  return {
    processed: true,
    originalSize: file.size,
    processedSize: file.size,
    dimensions: { width: maxWidth, height: maxHeight }
  };
};

export const compressFile = async (file, options = {}) => {
  const { quality = 80, maxSize = 5 * 1024 * 1024 } = options;
  
  if (file.size <= maxSize) {
    return file; // No compression needed
  }

  // This would implement actual compression logic
  // For now, we'll just log the operation
  console.log(`Compressing file: ${file.originalname} from ${formatFileSize(file.size)}`);
  
  return file;
};

// File metadata extraction
export const extractFileMetadata = (file) => {
  return {
    originalName: file.originalname,
    size: file.size,
    mimetype: file.mimetype,
    extension: getFileExtension(file.originalname),
    type: getFileType(file.mimetype),
    uploadDate: new Date(),
    checksum: generateFileChecksum(file.buffer)
  };
};

export const generateFileChecksum = (buffer) => {
  // Simple checksum implementation
  // In production, use a proper hashing algorithm like SHA-256
  let checksum = 0;
  for (let i = 0; i < buffer.length; i++) {
    checksum = ((checksum << 5) - checksum) + buffer[i];
    checksum = checksum & checksum; // Convert to 32-bit integer
  }
  return checksum.toString(16);
};

// Batch file operations
export const processMultipleFiles = async (files, processor) => {
  const results = [];
  const errors = [];

  for (const file of files) {
    try {
      const result = await processor(file);
      results.push(result);
    } catch (error) {
      errors.push({
        fileName: file.originalname,
        error: error.message
      });
    }
  }

  return {
    successful: results,
    failed: errors,
    totalProcessed: results.length,
    totalFailed: errors.length
  };
};

// File cleanup utilities
export const cleanupTempFiles = async (filePaths) => {
  const results = [];
  
  for (const filePath of filePaths) {
    try {
      await storageService.deleteFile(filePath);
      results.push({ filePath, success: true });
    } catch (error) {
      results.push({ filePath, success: false, error: error.message });
    }
  }
  
  return results;
};

// Export all utilities
export default {
  fileTypes,
  getFileType,
  isImage,
  isDocument,
  isTranscript,
  formatFileSize,
  validateFileSize,
  generateSafeFileName,
  getFileExtension,
  isValidExtension,
  validateFile,
  validateImageFile,
  generateUploadPath,
  getPublicUrl,
  processImage,
  compressFile,
  extractFileMetadata,
  generateFileChecksum,
  processMultipleFiles,
  cleanupTempFiles
};