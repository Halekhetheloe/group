import React, { useEffect } from 'react'
import { CheckCircle, XCircle, AlertCircle, X, Info } from 'lucide-react'

const Notification = ({ 
  message, 
  type = 'info',
  onClose,
  duration = 5000,
  showCloseButton = true,
  className = ''
}) => {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose()
      }, duration)

      return () => clearTimeout(timer)
    }
  }, [duration, onClose])

  const typeConfig = {
    success: {
      icon: CheckCircle,
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      textColor: 'text-green-800',
      iconColor: 'text-green-400'
    },
    error: {
      icon: XCircle,
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      textColor: 'text-red-800',
      iconColor: 'text-red-400'
    },
    warning: {
      icon: AlertCircle,
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      textColor: 'text-yellow-800',
      iconColor: 'text-yellow-400'
    },
    info: {
      icon: Info,
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      textColor: 'text-blue-800',
      iconColor: 'text-blue-400'
    }
  }

  const config = typeConfig[type] || typeConfig.info
  const Icon = config.icon

  return (
    <div className={`
      fixed top-4 right-4 z-50 max-w-sm w-full
      ${config.bgColor} ${config.borderColor} border rounded-lg shadow-lg
      transform transition-all duration-300 ease-in-out
      ${className}
    `.trim()}>
      <div className="flex items-start p-4">
        <div className="flex-shrink-0">
          <Icon className={`h-5 w-5 ${config.iconColor}`} />
        </div>
        
        <div className="ml-3 flex-1">
          <p className={`text-sm font-medium ${config.textColor}`}>
            {message}
          </p>
        </div>
        
        {showCloseButton && (
          <div className="ml-4 flex-shrink-0">
            <button
              onClick={onClose}
              className={`inline-flex rounded-md ${config.bgColor} hover:bg-opacity-80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
            >
              <X className={`h-4 w-4 ${config.textColor}`} />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// Notification container for managing multiple notifications
export const NotificationContainer = ({ notifications, onRemoveNotification }) => {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {notifications.map((notification) => (
        <Notification
          key={notification.id}
          message={notification.message}
          type={notification.type}
          duration={notification.duration}
          onClose={() => onRemoveNotification(notification.id)}
        />
      ))}
    </div>
  )
}

// Hook for managing notifications
export const useNotifications = () => {
  const [notifications, setNotifications] = React.useState([])

  const addNotification = (message, type = 'info', duration = 5000) => {
    const id = Date.now().toString()
    const notification = { id, message, type, duration }
    
    setNotifications(prev => [...prev, notification])
    
    // Auto-remove after duration
    if (duration > 0) {
      setTimeout(() => {
        removeNotification(id)
      }, duration)
    }
    
    return id
  }

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id))
  }

  const clearAll = () => {
    setNotifications([])
  }

  return {
    notifications,
    addNotification,
    removeNotification,
    clearAll
  }
}

export default Notification