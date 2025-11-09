import { storage } from './firebase-admin.js';

// Storage configuration and utilities
export const storageConfig = {
  // Allowed file types
  allowedTypes: {
    images: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'],
    documents: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain'
    ],
    transcripts: ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']
  },

  // File size limits (in bytes)
  sizeLimits: {
    profilePicture: 5 * 1024 * 1024, // 5MB
    document: 10 * 1024 * 1024, // 10MB
    transcript: 10 * 1024 * 1024 // 10MB
  },

  // Storage paths
  paths: {
    users: (userId) => `users/${userId}/profile`,
    students: (studentId) => `students/${studentId}/documents`,
    institutions: (institutionId) => `institutions/${institutionId}/documents`,
    companies: (companyId) => `companies/${companyId}/documents`,
    system: 'system'
  }
};

// Storage service functions
export const storageService = {
  // Upload file to storage
  uploadFile: async (file, destinationPath, options = {}) => {
    try {
      const {
        contentType,
        metadata = {},
        public: isPublic = false
      } = options;

      const fileRef = storage.file(destinationPath);
      
      const uploadOptions = {
        metadata: {
          contentType,
          metadata: {
            ...metadata,
            uploadedAt: new Date().toISOString()
          }
        },
        public: isPublic
      };

      await fileRef.save(file.buffer, uploadOptions);
      
      if (isPublic) {
        await fileRef.makePublic();
      }

      const [metadataResult] = await fileRef.getMetadata();
      
      return {
        success: true,
        url: isPublic ? fileRef.publicUrl() : await fileRef.getSignedUrl({
          action: 'read',
          expires: '03-01-2500' // Far future expiration
        }),
        path: destinationPath,
        size: metadataResult.size,
        contentType: metadataResult.contentType,
        uploadedAt: metadataResult.metadata.uploadedAt
      };
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  },

  // Delete file from storage
  deleteFile: async (filePath) => {
    try {
      const fileRef = storage.file(filePath);
      const [exists] = await fileRef.exists();
      
      if (exists) {
        await fileRef.delete();
        return { success: true, message: 'File deleted successfully' };
      } else {
        return { success: false, message: 'File not found' };
      }
    } catch (error) {
      console.error('Error deleting file:', error);
      throw error;
    }
  },

  // Get file metadata
  getFileMetadata: async (filePath) => {
    try {
      const fileRef = storage.file(filePath);
      const [metadata] = await fileRef.getMetadata();
      
      return {
        name: metadata.name,
        size: metadata.size,
        contentType: metadata.contentType,
        created: metadata.timeCreated,
        updated: metadata.updated,
        metadata: metadata.metadata
      };
    } catch (error) {
      console.error('Error getting file metadata:', error);
      throw error;
    }
  },

  // Generate signed URL for private file
  generateSignedUrl: async (filePath, expiresIn = 3600) => {
    try {
      const fileRef = storage.file(filePath);
      const [url] = await fileRef.getSignedUrl({
        version: 'v4',
        action: 'read',
        expires: Date.now() + (expiresIn * 1000)
      });

      return url;
    } catch (error) {
      console.error('Error generating signed URL:', error);
      throw error;
    }
  },

  // Validate file before upload
  validateFile: (file, allowedTypes, maxSize) => {
    const errors = [];

    if (!file || !file.buffer) {
      errors.push('File is required');
      return { isValid: false, errors };
    }

    // Check file type
    if (allowedTypes && !allowedTypes.includes(file.mimetype)) {
      errors.push(`File type ${file.mimetype} is not allowed. Allowed types: ${allowedTypes.join(', ')}`);
    }

    // Check file size
    if (maxSize && file.size > maxSize) {
      const maxSizeMB = (maxSize / 1024 / 1024).toFixed(2);
      errors.push(`File size ${(file.size / 1024 / 1024).toFixed(2)}MB exceeds maximum allowed size of ${maxSizeMB}MB`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  },

  // Upload user profile picture
  uploadProfilePicture: async (userId, file) => {
    const validation = storageService.validateFile(
      file,
      storageConfig.allowedTypes.images,
      storageConfig.sizeLimits.profilePicture
    );

    if (!validation.isValid) {
      throw new Error(`Profile picture validation failed: ${validation.errors.join(', ')}`);
    }

    const fileExtension = file.originalname.split('.').pop();
    const destinationPath = `${storageConfig.paths.users(userId)}/profile.${fileExtension}`;

    return storageService.uploadFile(file, destinationPath, {
      contentType: file.mimetype,
      public: true
    });
  },

  // Upload student transcript
  uploadTranscript: async (studentId, file) => {
    const validation = storageService.validateFile(
      file,
      storageConfig.allowedTypes.transcripts,
      storageConfig.sizeLimits.transcript
    );

    if (!validation.isValid) {
      throw new Error(`Transcript validation failed: ${validation.errors.join(', ')}`);
    }

    const timestamp = Date.now();
    const fileExtension = file.originalname.split('.').pop();
    const destinationPath = `${storageConfig.paths.students(studentId)}/transcript_${timestamp}.${fileExtension}`;

    return storageService.uploadFile(file, destinationPath, {
      contentType: file.mimetype,
      metadata: {
        type: 'transcript',
        originalName: file.originalname
      }
    });
  },

  // Upload institution document
  uploadInstitutionDocument: async (institutionId, file, documentType) => {
    const validation = storageService.validateFile(
      file,
      [...storageConfig.allowedTypes.images, ...storageConfig.allowedTypes.documents],
      storageConfig.sizeLimits.document
    );

    if (!validation.isValid) {
      throw new Error(`Document validation failed: ${validation.errors.join(', ')}`);
    }

    const timestamp = Date.now();
    const fileExtension = file.originalname.split('.').pop();
    const destinationPath = `${storageConfig.paths.institutions(institutionId)}/${documentType}_${timestamp}.${fileExtension}`;

    return storageService.uploadFile(file, destinationPath, {
      contentType: file.mimetype,
      public: true,
      metadata: {
        type: documentType,
        originalName: file.originalname
      }
    });
  }
};

export default storageService;