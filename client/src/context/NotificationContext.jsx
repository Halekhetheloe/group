import React, { createContext, useContext, useReducer } from 'react'

const NotificationContext = createContext()

// Action types
const NOTIFICATION_ACTIONS = {
  ADD_NOTIFICATION: 'ADD_NOTIFICATION',
  REMOVE_NOTIFICATION: 'REMOVE_NOTIFICATION',
  CLEAR_ALL: 'CLEAR_ALL'
}

// Initial state
const initialState = {
  notifications: []
}

// Reducer
const notificationReducer = (state, action) => {
  switch (action.type) {
    case NOTIFICATION_ACTIONS.ADD_NOTIFICATION:
      return {
        ...state,
        notifications: [...state.notifications, action.payload]
      }

    case NOTIFICATION_ACTIONS.REMOVE_NOTIFICATION:
      return {
        ...state,
        notifications: state.notifications.filter(
          notification => notification.id !== action.payload
        )
      }

    case NOTIFICATION_ACTIONS.CLEAR_ALL:
      return {
        ...state,
        notifications: []
      }

    default:
      return state
  }
}

export const useNotification = () => {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider')
  }
  return context
}

export const NotificationProvider = ({ children }) => {
  const [state, dispatch] = useReducer(notificationReducer, initialState)

  const showNotification = (message, type = 'info', duration = 5000) => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9)
    
    const notification = {
      id,
      message,
      type,
      duration,
      timestamp: new Date()
    }

    dispatch({
      type: NOTIFICATION_ACTIONS.ADD_NOTIFICATION,
      payload: notification
    })

    // Auto-remove after duration
    if (duration > 0) {
      setTimeout(() => {
        removeNotification(id)
      }, duration)
    }

    return id
  }

  const removeNotification = (id) => {
    dispatch({
      type: NOTIFICATION_ACTIONS.REMOVE_NOTIFICATION,
      payload: id
    })
  }

  const clearAllNotifications = () => {
    dispatch({
      type: NOTIFICATION_ACTIONS.CLEAR_ALL
    })
  }

  // Convenience methods for different notification types
  const showSuccess = (message, duration = 5000) => {
    return showNotification(message, 'success', duration)
  }

  const showError = (message, duration = 5000) => {
    return showNotification(message, 'error', duration)
  }

  const showWarning = (message, duration = 5000) => {
    return showNotification(message, 'warning', duration)
  }

  const showInfo = (message, duration = 5000) => {
    return showNotification(message, 'info', duration)
  }

  const value = {
    notifications: state.notifications,
    showNotification,
    removeNotification,
    clearAllNotifications,
    showSuccess,
    showError,
    showWarning,
    showInfo
  }

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  )
}

// Higher-order component for easy notification access
export const withNotifications = (Component) => {
  return (props) => {
    const notification = useNotification()
    return <Component {...props} notification={notification} />
  }
}

export default NotificationContext