import { useState, useCallback } from 'react'
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore'
import { storage, db } from '../firebase-config'
import { useAuth } from './useAuth'
import { useNotifications } from './useNotifications'

export const useUpload = () => {
  const { user } = useAuth()
  const { notifySuccess, notifyError, notifyDocumentUploaded } = useNotifications()
  
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)

  // Generic file upload function
  const uploadFile = useCallback(async (file, path, metadata = {}) => {
    if (!user) {
      throw new Error('User must be authenticated to upload files')
    }

    setUploading(true)
    setProgress(0)
    
    try {
      // Create storage reference
      const fileExtension = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExtension}`
      const filePath = `${path}/${user.uid}/${fileName}`
      const storageRef = ref(storage, filePath)

      // Upload file
      const snapshot = await uploadBytes(storageRef, file, metadata)
      
      // Get download URL
      const downloadURL = await getDownloadURL(snapshot.ref)
      
      setProgress(100)
      notifySuccess('File uploaded successfully')
      
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
      notifyError('Failed to upload file', error)
      throw error
    } finally {
      setUploading(false)
      setTimeout(() => setProgress(0), 1000)
    }
  }, [user, notifySuccess, notifyError])

  // Upload transcript
  const uploadTranscript = useCallback(async (file) => {
    try {
      const transcript = await uploadFile(file, 'transcripts', {
        customMetadata: {
          type: 'transcript',
          uploadedBy: user.uid
        }
      })

      // Update student document with transcript
      await updateDoc(doc(db, 'students', user.uid), {
        transcripts: arrayUnion(transcript),
        updatedAt: new Date()
      })

      notifyDocumentUploaded('Transcript')
      return transcript
    } catch (error) {
      throw error
    }
  }, [user, uploadFile, notifyDocumentUploaded])

  // Upload resume
  const uploadResume = useCallback(async (file) => {
    try {
      const resume = await uploadFile(file, 'resumes', {
        customMetadata: {
          type: 'resume',
          uploadedBy: user.uid
        }
      })

      // Update student document with resume
      await updateDoc(doc(db, 'students', user.uid), {
        resume: resume,
        updatedAt: new Date()
      })

      notifyDocumentUploaded('Resume')
      return resume
    } catch (error) {
      throw error
    }
  }, [user, uploadFile, notifyDocumentUploaded])

  // Upload profile picture
  const uploadProfilePicture = useCallback(async (file) => {
    try {
      // Validate image file
      if (!file.type.startsWith('image/')) {
        throw new Error('Please select an image file')
      }

      if (file.size > 5 * 1024 * 1024) {
        throw new Error('Image size should be less than 5MB')
      }

      const profilePicture = await uploadFile(file, 'profile-pictures', {
        customMetadata: {
          type: 'profile-picture',
          uploadedBy: user.uid
        }
      })

      // Update user document with profile picture URL
      await updateDoc(doc(db, 'users', user.uid), {
        photoURL: profilePicture.url,
        updatedAt: new Date()
      })

      notifySuccess('Profile picture updated successfully')
      return profilePicture
    } catch (error) {
      throw error
    }
  }, [user, uploadFile, notifySuccess])

  // Upload application documents
  const uploadApplicationDocuments = useCallback(async (files, applicationId) => {
    try {
      const uploadPromises = files.map(file => 
        uploadFile(file, `applications/${applicationId}/documents`, {
          customMetadata: {
            type: 'application-document',
            applicationId,
            uploadedBy: user.uid
          }
        })
      )

      const documents = await Promise.all(uploadPromises)

      // Update application with documents
      await updateDoc(doc(db, 'applications', applicationId), {
        documents: arrayUnion(...documents),
        updatedAt: new Date()
      })

      notifySuccess('Application documents uploaded successfully')
      return documents
    } catch (error) {
      throw error
    }
  }, [user, uploadFile, notifySuccess])

  // Upload institution/company logo
  const uploadLogo = useCallback(async (file, entityType) => {
    if (!['institution', 'company'].includes(entityType)) {
      throw new Error('Invalid entity type')
    }

    try {
      // Validate image file
      if (!file.type.startsWith('image/')) {
        throw new Error('Please select an image file')
      }

      if (file.size > 2 * 1024 * 1024) {
        throw new Error('Logo size should be less than 2MB')
      }

      const logo = await uploadFile(file, `${entityType}-logos`, {
        customMetadata: {
          type: 'logo',
          entityType,
          uploadedBy: user.uid
        }
      })

      // Update entity document with logo URL
      await updateDoc(doc(db, `${entityType}s`, user.uid), {
        logoURL: logo.url,
        updatedAt: new Date()
      })

      notifySuccess('Logo updated successfully')
      return logo
    } catch (error) {
      throw error
    }
  }, [user, uploadFile, notifySuccess])

  // Delete file
  const deleteFile = useCallback(async (filePath, documentPath = null, field = null) => {
    try {
      // Delete from storage
      const fileRef = ref(storage, filePath)
      await deleteObject(fileRef)

      // Remove from Firestore if document path and field are provided
      if (documentPath && field) {
        await updateDoc(doc(db, documentPath.collection, documentPath.id), {
          [field]: arrayRemove({
            path: filePath,
            // Include other identifiers if available
          }),
          updatedAt: new Date()
        })
      }

      notifySuccess('File deleted successfully')
    } catch (error) {
      console.error('Delete error:', error)
      notifyError('Failed to delete file', error)
      throw error
    }
  }, [notifySuccess, notifyError])

  // Validate file
  const validateFile = useCallback((file, options = {}) => {
    const {
      allowedTypes = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png'],
      maxSize = 10 * 1024 * 1024, // 10MB
      allowedExtensions = []
    } = options

    // Check file type
    const fileExtension = '.' + file.name.split('.').pop().toLowerCase()
    const allowed = [...allowedTypes, ...allowedExtensions]
    
    if (allowed.length > 0 && !allowed.includes(fileExtension)) {
      return {
        valid: false,
        error: `File type not allowed. Allowed types: ${allowed.join(', ')}`
      }
    }

    // Check file size
    if (file.size > maxSize) {
      return {
        valid: false,
        error: `File too large. Maximum size: ${maxSize / 1024 / 1024}MB`
      }
    }

    return { valid: true }
  }, [])

  // Get file preview (for images)
  const getFilePreview = useCallback((file) => {
    return new Promise((resolve, reject) => {
      if (!file.type.startsWith('image/')) {
        resolve(null)
        return
      }

      const reader = new FileReader()
      reader.onload = (e) => resolve(e.target.result)
      reader.onerror = (error) => reject(error)
      reader.readAsDataURL(file)
    })
  }, [])

  return {
    uploading,
    progress,
    uploadFile,
    uploadTranscript,
    uploadResume,
    uploadProfilePicture,
    uploadApplicationDocuments,
    uploadLogo,
    deleteFile,
    validateFile,
    getFilePreview
  }
}

export default useUpload