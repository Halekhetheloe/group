import toast from 'react-hot-toast'
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from './constants'

// Success notifications
export const showSuccess = (message, options = {}) => {
  const defaultOptions = {
    duration: 4000,
    position: 'top-right',
    style: {
      background: '#10B981',
      color: 'white',
      fontWeight: '500'
    }
  }
  
  return toast.success(message, { ...defaultOptions, ...options })
}

// Error notifications
export const showError = (message, options = {}) => {
  const defaultOptions = {
    duration: 5000,
    position: 'top-right',
    style: {
      background: '#EF4444',
      color: 'white',
      fontWeight: '500'
    }
  }
  
  return toast.error(message, { ...defaultOptions, ...options })
}

// Warning notifications
export const showWarning = (message, options = {}) => {
  const defaultOptions = {
    duration: 4000,
    position: 'top-right',
    style: {
      background: '#F59E0B',
      color: 'white',
      fontWeight: '500'
    }
  }
  
  return toast(message, { ...defaultOptions, ...options })
}

// Info notifications
export const showInfo = (message, options = {}) => {
  const defaultOptions = {
    duration: 4000,
    position: 'top-right',
    style: {
      background: '#3B82F6',
      color: 'white',
      fontWeight: '500'
    }
  }
  
  return toast(message, { ...defaultOptions, ...options })
}

// Loading notifications
export const showLoading = (message, options = {}) => {
  const defaultOptions = {
    duration: Infinity,
    position: 'top-right'
  }
  
  return toast.loading(message, { ...defaultOptions, ...options })
}

// Promise notifications
export const showPromise = (promise, messages, options = {}) => {
  const defaultOptions = {
    loading: 'Processing...',
    success: 'Operation completed successfully',
    error: 'Operation failed',
    position: 'top-right'
  }
  
  return toast.promise(promise, { ...defaultOptions, ...messages }, options)
}

// Dismiss notification
export const dismissNotification = (toastId) => {
  toast.dismiss(toastId)
}

// Dismiss all notifications
export const dismissAllNotifications = () => {
  toast.dismiss()
}

// Predefined notification templates
export const notificationTemplates = {
  // Auth notifications
  loginSuccess: () => showSuccess('Login successful!'),
  loginError: (error) => showError(error || ERROR_MESSAGES.INVALID_CREDENTIALS),
  registerSuccess: () => showSuccess('Registration successful! Please check your email for verification.'),
  registerError: (error) => showError(error || 'Registration failed. Please try again.'),
  logoutSuccess: () => showSuccess('Logged out successfully'),
  passwordResetSent: () => showSuccess(SUCCESS_MESSAGES.PASSWORD_RESET_SENT),
  
  // Profile notifications
  profileUpdated: () => showSuccess(SUCCESS_MESSAGES.PROFILE_UPDATED),
  profileUpdateError: () => showError('Failed to update profile'),
  
  // Application notifications
  applicationSubmitted: () => showSuccess(SUCCESS_MESSAGES.APPLICATION_SUBMITTED),
  applicationSubmitError: () => showError('Failed to submit application'),
  applicationLimitReached: () => showError(ERROR_MESSAGES.APPLICATION_LIMIT_EXCEEDED),
  duplicateApplication: () => showError(ERROR_MESSAGES.DUPLICATE_APPLICATION),
  
  // Job notifications
  jobApplicationSubmitted: () => showSuccess(SUCCESS_MESSAGES.JOB_APPLICATION_SUBMITTED),
  jobApplicationError: () => showError('Failed to submit job application'),
  jobPosted: () => showSuccess('Job posted successfully'),
  jobPostError: () => showError('Failed to post job'),
  
  // Document notifications
  documentUploaded: () => showSuccess(SUCCESS_MESSAGES.DOCUMENT_UPLOADED),
  documentUploadError: () => showError(ERROR_MESSAGES.UPLOAD_FAILED),
  fileTooLarge: () => showError(ERROR_MESSAGES.FILE_TOO_LARGE),
  invalidFileType: () => showError(ERROR_MESSAGES.INVALID_FILE_TYPE),
  
  // Course notifications
  courseCreated: () => showSuccess('Course created successfully'),
  courseCreateError: () => showError('Failed to create course'),
  courseUpdated: () => showSuccess('Course updated successfully'),
  courseUpdateError: () => showError('Failed to update course'),
  
  // System notifications
  networkError: () => showError(ERROR_MESSAGES.NETWORK_ERROR),
  serverError: () => showError(ERROR_MESSAGES.SERVER_ERROR),
  validationError: () => showError(ERROR_MESSAGES.VALIDATION_ERROR),
  unauthorized: () => showError(ERROR_MESSAGES.UNAUTHORIZED)
}

// Custom notification with actions
export const showActionNotification = (message, actions, options = {}) => {
  const defaultOptions = {
    duration: 6000,
    position: 'top-right'
  }
  
  return toast((t) => (
    <div className="flex items-center justify-between">
      <span className="flex-1">{message}</span>
      <div className="flex space-x-2 ml-4">
        {actions.map((action, index) => (
          <button
            key={index}
            onClick={() => {
              action.onClick()
              toast.dismiss(t.id)
            }}
            className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
              action.primary 
                ? 'bg-blue-600 text-white hover:bg-blue-700' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {action.label}
          </button>
        ))}
      </div>
    </div>
  ), { ...defaultOptions, ...options })
}

// Notification with custom content
export const showCustomNotification = (content, options = {}) => {
  const defaultOptions = {
    duration: 5000,
    position: 'top-right'
  }
  
  return toast.custom(content, { ...defaultOptions, ...options })
}

// Progress notification
export const showProgressNotification = (progress, message, options = {}) => {
  const defaultOptions = {
    duration: Infinity,
    position: 'top-right'
  }
  
  return toast.custom((t) => (
    <div className="bg-white rounded-lg shadow-lg p-4 min-w-80">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-900">{message}</span>
        <span className="text-sm text-gray-500">{progress}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        ></div>
      </div>
      {progress >= 100 && (
        <button
          onClick={() => toast.dismiss(t.id)}
          className="mt-2 text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
          Dismiss
        </button>
      )}
    </div>
  ), { ...defaultOptions, ...options })
}

// Export notification manager
export const notificationManager = {
  success: showSuccess,
  error: showError,
  warning: showWarning,
  info: showInfo,
  loading: showLoading,
  promise: showPromise,
  dismiss: dismissNotification,
  dismissAll: dismissAllNotifications,
  templates: notificationTemplates,
  action: showActionNotification,
  custom: showCustomNotification,
  progress: showProgressNotification
}

export default notificationManager