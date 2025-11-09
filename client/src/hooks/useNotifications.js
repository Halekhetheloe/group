import { useState, useCallback } from 'react'
import { useNotification } from '../context/NotificationContext'
import { collection, addDoc, updateDoc, doc, query, where, orderBy, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase-config'
import { useAuth } from './useAuth'

export const useNotifications = () => {
  const { showSuccess, showError, showWarning, showInfo } = useNotification()
  const { user } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)

  // Create a system notification in Firestore
  const createNotification = useCallback(async (notificationData) => {
    try {
      const notification = {
        ...notificationData,
        userId: user.uid,
        read: false,
        createdAt: new Date(),
        updatedAt: new Date()
      }
      
      await addDoc(collection(db, 'notifications'), notification)
    } catch (error) {
      console.error('Error creating notification:', error)
    }
  }, [user])

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId) => {
    try {
      await updateDoc(doc(db, 'notifications', notificationId), {
        read: true,
        readAt: new Date(),
        updatedAt: new Date()
      })
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }, [])

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    try {
      const unreadNotifications = notifications.filter(n => !n.read)
      const batch = unreadNotifications.map(notification => 
        updateDoc(doc(db, 'notifications', notification.id), {
          read: true,
          readAt: new Date(),
          updatedAt: new Date()
        })
      )
      
      await Promise.all(batch)
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
    }
  }, [notifications])

  // Subscribe to user notifications
  const subscribeToNotifications = useCallback(() => {
    if (!user) return () => {}

    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notificationsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      
      setNotifications(notificationsList)
      setUnreadCount(notificationsList.filter(n => !n.read).length)
    })

    return unsubscribe
  }, [user])

  // Notification templates for common actions
  const notifyApplicationSubmitted = useCallback((courseName) => {
    showSuccess(`Application submitted successfully for ${courseName}`)
    createNotification({
      type: 'application',
      title: 'Application Submitted',
      message: `Your application for ${courseName} has been submitted successfully.`,
      actionUrl: '/student/applications'
    })
  }, [showSuccess, createNotification])

  const notifyApplicationStatusChange = useCallback((courseName, status) => {
    const message = `Your application for ${courseName} has been ${status}.`
    
    if (status === 'accepted') {
      showSuccess(`Congratulations! ${message}`)
    } else if (status === 'rejected') {
      showWarning(message)
    } else {
      showInfo(message)
    }
    
    createNotification({
      type: 'admission',
      title: 'Application Status Updated',
      message,
      actionUrl: '/student/admissions'
    })
  }, [showSuccess, showWarning, showInfo, createNotification])

  const notifyJobApplicationSubmitted = useCallback((jobTitle, companyName) => {
    showSuccess(`Job application submitted for ${jobTitle} at ${companyName}`)
    createNotification({
      type: 'job_application',
      title: 'Job Application Submitted',
      message: `Your application for ${jobTitle} at ${companyName} has been submitted.`,
      actionUrl: '/student/job-applications'
    })
  }, [showSuccess, createNotification])

  const notifyNewApplicant = useCallback((studentName, courseName) => {
    showInfo(`New application received from ${studentName} for ${courseName}`)
    createNotification({
      type: 'new_application',
      title: 'New Application Received',
      message: `${studentName} has applied for ${courseName}.`,
      actionUrl: '/institution/applications'
    })
  }, [showInfo, createNotification])

  const notifyNewJobApplicant = useCallback((studentName, jobTitle) => {
    showInfo(`New job application from ${studentName} for ${jobTitle}`)
    createNotification({
      type: 'new_job_application',
      title: 'New Job Application',
      message: `${studentName} has applied for ${jobTitle}.`,
      actionUrl: '/company/applicants'
    })
  }, [showInfo, createNotification])

  const notifyProfileUpdate = useCallback(() => {
    showSuccess('Profile updated successfully')
    createNotification({
      type: 'profile',
      title: 'Profile Updated',
      message: 'Your profile has been updated successfully.',
      actionUrl: '/profile'
    })
  }, [showSuccess, createNotification])

  const notifyDocumentUploaded = useCallback((documentType) => {
    showSuccess(`${documentType} uploaded successfully`)
    createNotification({
      type: 'document',
      title: 'Document Uploaded',
      message: `Your ${documentType.toLowerCase()} has been uploaded successfully.`,
      actionUrl: '/student/documents'
    })
  }, [showSuccess, createNotification])

  const notifyError = useCallback((message, error = null) => {
    console.error('Application error:', error)
    showError(message || 'An error occurred. Please try again.')
  }, [showError])

  const notifyWarning = useCallback((message) => {
    showWarning(message)
  }, [showWarning])

  const notifyInfo = useCallback((message) => {
    showInfo(message)
  }, [showInfo])

  return {
    // State
    notifications,
    unreadCount,
    
    // Actions
    createNotification,
    markAsRead,
    markAllAsRead,
    subscribeToNotifications,
    
    // Notification templates
    notifyApplicationSubmitted,
    notifyApplicationStatusChange,
    notifyJobApplicationSubmitted,
    notifyNewApplicant,
    notifyNewJobApplicant,
    notifyProfileUpdate,
    notifyDocumentUploaded,
    notifyError,
    notifyWarning,
    notifyInfo
  }
}

// Hook for real-time notification updates
export const useNotificationSubscription = () => {
  const { notifications, unreadCount, subscribeToNotifications } = useNotifications()
  
  React.useEffect(() => {
    const unsubscribe = subscribeToNotifications()
    return unsubscribe
  }, [subscribeToNotifications])
  
  return {
    notifications,
    unreadCount
  }
}

export default useNotifications