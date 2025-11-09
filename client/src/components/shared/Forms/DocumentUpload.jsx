import React, { useState } from 'react'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { doc, updateDoc, arrayUnion } from 'firebase/firestore'
import { db, storage } from '../../../firebase-config'
import { useAuth } from '../../../hooks/useAuth'
import { Upload, File, X, CheckCircle, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'

const DocumentUpload = ({ 
  onUploadComplete, 
  allowedTypes = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png'],
  maxSize = 10 * 1024 * 1024, // 10MB
  multiple = false,
  label = 'Upload Documents',
  description = 'Supported formats: PDF, DOC, DOCX, JPG, PNG',
  folder = 'documents'
}) => {
  const { user } = useAuth()
  const [uploading, setUploading] = useState(false)
  const [files, setFiles] = useState([])

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files)
    
    // Validate files
    const validFiles = selectedFiles.filter(file => {
      // Check file type
      const fileExtension = '.' + file.name.split('.').pop().toLowerCase()
      if (!allowedTypes.includes(fileExtension)) {
        toast.error(`File type not allowed: ${file.name}`)
        return false
      }

      // Check file size
      if (file.size > maxSize) {
        toast.error(`File too large: ${file.name} (max ${maxSize / 1024 / 1024}MB)`)
        return false
      }

      return true
    })

    if (validFiles.length > 0) {
      setFiles(prev => multiple ? [...prev, ...validFiles] : [validFiles[0]])
    }
  }

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  const uploadFile = async (file) => {
    const fileExtension = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExtension}`
    const filePath = `${folder}/${user.uid}/${fileName}`
    
    const storageRef = ref(storage, filePath)
    const snapshot = await uploadBytes(storageRef, file)
    const downloadURL = await getDownloadURL(snapshot.ref)
    
    return {
      name: file.name,
      url: downloadURL,
      size: file.size,
      type: file.type,
      uploadedAt: new Date()
    }
  }

  const handleUpload = async () => {
    if (files.length === 0) {
      toast.error('Please select files to upload')
      return
    }

    setUploading(true)
    try {
      const uploadPromises = files.map(file => uploadFile(file))
      const uploadedFiles = await Promise.all(uploadPromises)

      // Update user document with uploaded files
      await updateDoc(doc(db, 'users', user.uid), {
        documents: arrayUnion(...uploadedFiles),
        updatedAt: new Date()
      })

      toast.success(`Successfully uploaded ${uploadedFiles.length} file(s)`)
      setFiles([])
      
      if (onUploadComplete) {
        onUploadComplete(uploadedFiles)
      }
    } catch (error) {
      console.error('Error uploading files:', error)
      toast.error('Failed to upload files')
    } finally {
      setUploading(false)
    }
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileIcon = (fileType) => {
    if (fileType.includes('pdf')) return '📄'
    if (fileType.includes('word') || fileType.includes('document')) return '📝'
    if (fileType.includes('image')) return '🖼️'
    return '📎'
  }

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
        <input
          type="file"
          multiple={multiple}
          onChange={handleFileSelect}
          accept={allowedTypes.join(',')}
          className="hidden"
          id="document-upload"
        />
        <label
          htmlFor="document-upload"
          className="cursor-pointer flex flex-col items-center space-y-3"
        >
          <Upload className="h-12 w-12 text-gray-400" />
          <div>
            <p className="text-lg font-medium text-gray-900">
              {label}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {description}
            </p>
            <p className="text-xs text-gray-400 mt-2">
              Maximum file size: {maxSize / 1024 / 1024}MB
            </p>
          </div>
          <span className="btn-primary">
            Choose Files
          </span>
        </label>
      </div>

      {/* Selected Files List */}
      {files.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900">
            Selected Files ({files.length})
          </h4>
          {files.map((file, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
            >
              <div className="flex items-center space-x-3">
                <div className="text-2xl">
                  {getFileIcon(file.type)}
                </div>
                <div>
                  <p className="font-medium text-gray-900 text-sm">
                    {file.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(file.size)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => removeFile(index)}
                className="text-gray-400 hover:text-red-500 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}

          {/* Upload Button */}
          <div className="flex justify-end">
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="btn-primary flex items-center space-x-2"
            >
              {uploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Uploading...</span>
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  <span>Upload {files.length} File(s)</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Upload Guidelines */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h5 className="font-medium text-blue-900 mb-2 flex items-center">
          <CheckCircle className="h-4 w-4 mr-2" />
          Upload Guidelines
        </h5>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Ensure documents are clear and legible</li>
          <li>• File names should be descriptive</li>
          <li>• Maximum file size: {maxSize / 1024 / 1024}MB per file</li>
          <li>• Supported formats: {allowedTypes.join(', ')}</li>
          <li>• Remove any password protection from documents</li>
        </ul>
      </div>
    </div>
  )
}

export default DocumentUpload