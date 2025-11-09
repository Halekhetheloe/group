import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject,
  listAll,
  getMetadata
} from 'firebase/storage'
import { storage } from '../firebase-config'

export const storageService = {
  // Upload file
  async uploadFile(file, path, metadata = {}) {
    try {
      // Create storage reference
      const fileExtension = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExtension}`
      const filePath = `${path}/${fileName}`
      const storageRef = ref(storage, filePath)

      // Upload file with metadata
      const uploadMetadata = {
        contentType: file.type,
        customMetadata: {
          originalName: file.name,
          uploadedAt: new Date().toISOString(),
          size: file.size.toString(),
          ...metadata
        }
      }

      const snapshot = await uploadBytes(storageRef, file, uploadMetadata)
      
      // Get download URL
      const downloadURL = await getDownloadURL(snapshot.ref)
      
      return {
        name: file.name,
        url: downloadURL,
        path: filePath,
        size: file.size,
        type: file.type,
        uploadedAt: new Date()
      }
    } catch (error) {
      console.error('Upload error:', error)
      throw error
    }
  },

  // Get download URL
  async getFileURL(filePath) {
    try {
      const storageRef = ref(storage, filePath)
      return await getDownloadURL(storageRef)
    } catch (error) {
      console.error('Error getting file URL:', error)
      throw error
    }
  },

  // Delete file
  async deleteFile(filePath) {
    try {
      const storageRef = ref(storage, filePath)
      await deleteObject(storageRef)
    } catch (error) {
      console.error('Error deleting file:', error)
      throw error
    }
  },

  // List files in a directory
  async listFiles(path) {
    try {
      const listRef = ref(storage, path)
      const result = await listAll(listRef)
      
      const files = await Promise.all(
        result.items.map(async (itemRef) => {
          const url = await getDownloadURL(itemRef)
          const metadata = await getMetadata(itemRef)
          
          return {
            name: itemRef.name,
            url,
            path: itemRef.fullPath,
            size: metadata.size,
            type: metadata.contentType,
            uploadedAt: new Date(metadata.timeCreated),
            customMetadata: metadata.customMetadata || {}
          }
        })
      )
      
      return files
    } catch (error) {
      console.error('Error listing files:', error)
      throw error
    }
  },

  // Get file metadata
  async getFileMetadata(filePath) {
    try {
      const storageRef = ref(storage, filePath)
      const metadata = await getMetadata(storageRef)
      
      return {
        name: storageRef.name,
        path: storageRef.fullPath,
        size: metadata.size,
        type: metadata.contentType,
        uploadedAt: new Date(metadata.timeCreated),
        customMetadata: metadata.customMetadata || {}
      }
    } catch (error) {
      console.error('Error getting file metadata:', error)
      throw error
    }
  },

  // Validate file before upload
  validateFile(file, options = {}) {
    const {
      allowedTypes = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png'],
      maxSize = 10 * 1024 * 1024, // 10MB
      allowedExtensions = []
    } = options

    const errors = []

    // Check file type
    const fileExtension = '.' + file.name.split('.').pop().toLowerCase()
    const allowed = [...allowedTypes, ...allowedExtensions]
    
    if (allowed.length > 0 && !allowed.includes(fileExtension)) {
      errors.push(`File type not allowed. Allowed types: ${allowed.join(', ')}`)
    }

    // Check file size
    if (file.size > maxSize) {
      errors.push(`File too large. Maximum size: ${maxSize / 1024 / 1024}MB`)
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }
}

// Specialized storage services
export const documentService = {
  async uploadTranscript(file, userId) {
    const metadata = {
      type: 'transcript',
      uploadedBy: userId,
      documentType: 'academic_transcript'
    }
    
    return storageService.uploadFile(file, `transcripts/${userId}`, metadata)
  },

  async uploadResume(file, userId) {
    const metadata = {
      type: 'resume',
      uploadedBy: userId,
      documentType: 'resume'
    }
    
    return storageService.uploadFile(file, `resumes/${userId}`, metadata)
  },

  async uploadApplicationDocument(file, applicationId, userId) {
    const metadata = {
      type: 'application_document',
      uploadedBy: userId,
      applicationId,
      documentType: 'supporting_document'
    }
    
    return storageService.uploadFile(file, `applications/${applicationId}/documents`, metadata)
  },

  async uploadProfilePicture(file, userId) {
    const metadata = {
      type: 'profile_picture',
      uploadedBy: userId,
      documentType: 'image'
    }
    
    return storageService.uploadFile(file, `profile-pictures/${userId}`, metadata)
  },

  async uploadInstitutionLogo(file, institutionId) {
    const metadata = {
      type: 'institution_logo',
      uploadedBy: institutionId,
      documentType: 'image'
    }
    
    return storageService.uploadFile(file, `institution-logos/${institutionId}`, metadata)
  },

  async uploadCompanyLogo(file, companyId) {
    const metadata = {
      type: 'company_logo',
      uploadedBy: companyId,
      documentType: 'image'
    }
    
    return storageService.uploadFile(file, `company-logos/${companyId}`, metadata)
  },

  async getUserDocuments(userId) {
    return storageService.listFiles(`documents/${userId}`)
  },

  async deleteUserDocument(filePath, userId) {
    // Add security check to ensure user can only delete their own files
    if (!filePath.includes(userId)) {
      throw new Error('Unauthorized to delete this file')
    }
    
    return storageService.deleteFile(filePath)
  }
}

export default storageService