import multer from 'multer';
import path from 'path';

// Configure multer for memory storage
const storage = multer.memoryStorage();

// File filter function
const fileFilter = (req, file, cb) => {
  const allowedMimes = [
    'image/jpeg', 'image/jpg', 'image/png', 'image/gif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain'
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type: ${file.mimetype}`), false);
  }
};

// Create multer instance
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 5 // Maximum 5 files
  }
});

// File validation middleware - PROPER EXPRESS MIDDLEWARE
export const validateFileUpload = (req, res, next) => {
  // Check if files are present
  if (!req.files || (Array.isArray(req.files) && req.files.length === 0)) {
    return res.status(400).json({
      success: false,
      error: 'NO_FILES_UPLOADED',
      message: 'No files were uploaded'
    });
  }

  // Validate file types
  const allowedTypes = [
    'image/jpeg', 'image/jpg', 'image/png', 'image/gif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain'
  ];

  const files = Array.isArray(req.files) ? req.files : Object.values(req.files).flat();
  
  const invalidFiles = files.filter(file => !allowedTypes.includes(file.mimetype));

  if (invalidFiles.length > 0) {
    return res.status(400).json({
      success: false,
      error: 'INVALID_FILE_TYPE',
      message: 'Some files have invalid types. Allowed types: PDF, images, and documents',
      invalidFiles: invalidFiles.map(f => ({
        name: f.originalname,
        type: f.mimetype
      }))
    });
  }

  // Validate file sizes
  const maxSize = 10 * 1024 * 1024; // 10MB
  const oversizedFiles = files.filter(file => file.size > maxSize);

  if (oversizedFiles.length > 0) {
    return res.status(400).json({
      success: false,
      error: 'FILE_TOO_LARGE',
      message: 'Some files exceed the 10MB size limit',
      oversizedFiles: oversizedFiles.map(f => ({
        name: f.originalname,
        size: (f.size / (1024 * 1024)).toFixed(2) + 'MB'
      }))
    });
  }

  next();
};

// Pre-configured upload handlers
export const uploadSingle = (fieldName) => {
  return (req, res, next) => {
    upload.single(fieldName)(req, res, (err) => {
      if (err) {
        return handleUploadError(err, res);
      }
      next();
    });
  };
};

export const uploadMultiple = (fieldName, maxCount = 5) => {
  return (req, res, next) => {
    upload.array(fieldName, maxCount)(req, res, (err) => {
      if (err) {
        return handleUploadError(err, res);
      }
      next();
    });
  };
};

export const uploadFields = (fields) => {
  return (req, res, next) => {
    upload.fields(fields)(req, res, (err) => {
      if (err) {
        return handleUploadError(err, res);
      }
      next();
    });
  };
};

// Specific upload configurations
export const uploadTranscript = uploadSingle('transcript');
export const uploadDocuments = uploadMultiple('documents', 3);
export const uploadProfilePicture = uploadSingle('profilePicture');

// Error handler for upload errors
const handleUploadError = (err, res) => {
  if (err instanceof multer.MulterError) {
    switch (err.code) {
      case 'LIMIT_FILE_SIZE':
        return res.status(400).json({
          success: false,
          error: 'FILE_TOO_LARGE',
          message: 'File size exceeds the allowed limit of 10MB'
        });
      case 'LIMIT_FILE_COUNT':
        return res.status(400).json({
          success: false,
          error: 'TOO_MANY_FILES',
          message: 'Too many files uploaded'
        });
      case 'LIMIT_UNEXPECTED_FILE':
        return res.status(400).json({
          success: false,
          error: 'UNEXPECTED_FILE_FIELD',
          message: 'Unexpected file field'
        });
      default:
        return res.status(400).json({
          success: false,
          error: 'UPLOAD_ERROR',
          message: 'File upload failed'
        });
    }
  } else if (err.message.includes('Invalid file type')) {
    return res.status(400).json({
      success: false,
      error: 'INVALID_FILE_TYPE',
      message: err.message
    });
  } else {
    console.error('Upload error:', err);
    return res.status(500).json({
      success: false,
      error: 'UPLOAD_FAILED',
      message: 'File upload failed'
    });
  }
};

export { upload };