import React, { createContext, useContext, useReducer, useEffect } from 'react'
import { useAuth } from './AuthContext'
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore'
import { db } from '../firebase-config'

const AppContext = createContext()

// Action types
const ACTIONS = {
  SET_NOTIFICATIONS: 'SET_NOTIFICATIONS',
  ADD_NOTIFICATION: 'ADD_NOTIFICATION',
  MARK_NOTIFICATION_READ: 'MARK_NOTIFICATION_READ',
  SET_LOADING: 'SET_LOADING',
  SET_STATS: 'SET_STATS',
  SET_RECENT_ACTIVITY: 'SET_RECENT_ACTIVITY'
}

// Initial state
const initialState = {
  notifications: [],
  loading: false,
  stats: {},
  recentActivity: [],
  unreadCount: 0
}

// Reducer
const appReducer = (state, action) => {
  switch (action.type) {
    case ACTIONS.SET_NOTIFICATIONS:
      const notifications = action.payload
      const unreadCount = notifications.filter(n => !n.read).length
      return {
        ...state,
        notifications,
        unreadCount
      }

    case ACTIONS.ADD_NOTIFICATION:
      const newNotification = action.payload
      return {
        ...state,
        notifications: [newNotification, ...state.notifications],
        unreadCount: state.unreadCount + 1
      }

    case ACTIONS.MARK_NOTIFICATION_READ:
      const updatedNotifications = state.notifications.map(notification =>
        notification.id === action.payload 
          ? { ...notification, read: true, readAt: new Date() }
          : notification
      )
      return {
        ...state,
        notifications: updatedNotifications,
        unreadCount: Math.max(0, state.unreadCount - 1)
      }

    case ACTIONS.SET_LOADING:
      return {
        ...state,
        loading: action.payload
      }

    case ACTIONS.SET_STATS:
      return {
        ...state,
        stats: action.payload
      }

    case ACTIONS.SET_RECENT_ACTIVITY:
      return {
        ...state,
        recentActivity: action.payload
      }

    default:
      return state
  }
}

export const useApp = () => {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useApp must be used within an AppProvider')
  }
  return context
}

export const AppProvider = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState)
  const { user, userData } = useAuth()

  // Fetch notifications in real-time
  useEffect(() => {
    if (!user) return

    let unsubscribe

    const setupNotifications = async () => {
      try {
        const notificationsQuery = query(
          collection(db, 'notifications'),
          where('userId', '==', user.uid),
          orderBy('createdAt', 'desc')
        )

        unsubscribe = onSnapshot(notificationsQuery, (snapshot) => {
          const notifications = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }))
          dispatch({ type: ACTIONS.SET_NOTIFICATIONS, payload: notifications })
        })
      } catch (error) {
        console.error('Error setting up notifications:', error)
      }
    }

    setupNotifications()

    return () => {
      if (unsubscribe) {
        unsubscribe()
      }
    }
  }, [user])

  // Fetch dashboard stats based on user role
  useEffect(() => {
    if (!user || !userData) return

    const fetchStats = async () => {
      try {
        dispatch({ type: ACTIONS.SET_LOADING, payload: true })

        let stats = {}

        switch (userData.role) {
          case 'student':
            // Student stats: applications, admissions, jobs
            const applicationsQuery = query(
              collection(db, 'applications'),
              where('studentId', '==', user.uid)
            )
            const jobApplicationsQuery = query(
              collection(db, 'jobApplications'),
              where('studentId', '==', user.uid)
            )
            
            // In a real app, you'd fetch these and calculate stats
            stats = {
              totalApplications: 0,
              pendingApplications: 0,
              acceptedApplications: 0,
              jobApplications: 0,
              interviews: 0
            }
            break

          case 'institution':
            // Institution stats: courses, applications, students
            const coursesQuery = query(
              collection(db, 'courses'),
              where('institutionId', '==', user.uid)
            )
            const institutionApplicationsQuery = query(
              collection(db, 'applications'),
              where('institutionId', '==', user.uid)
            )
            
            stats = {
              totalCourses: 0,
              totalApplications: 0,
              enrolledStudents: 0,
              pendingApplications: 0
            }
            break

          case 'company':
            // Company stats: jobs, applications, hires
            const jobsQuery = query(
              collection(db, 'jobs'),
              where('companyId', '==', user.uid)
            )
            const companyApplicationsQuery = query(
              collection(db, 'jobApplications'),
              where('companyId', '==', user.uid)
            )
            
            stats = {
              activeJobs: 0,
              totalApplications: 0,
              interviews: 0,
              hires: 0
            }
            break

          case 'admin':
            // Admin stats: users, institutions, companies
            const usersQuery = collection(db, 'users')
            const institutionsQuery = collection(db, 'institutions')
            const companiesQuery = collection(db, 'companies')
            
            stats = {
              totalUsers: 0,
              totalInstitutions: 0,
              totalCompanies: 0,
              pendingApprovals: 0
            }
            break

          default:
            stats = {}
        }

        dispatch({ type: ACTIONS.SET_STATS, payload: stats })
      } catch (error) {
        console.error('Error fetching stats:', error)
      } finally {
        dispatch({ type: ACTIONS.SET_LOADING, payload: false })
      }
    }

    fetchStats()
  }, [user, userData])

  // Fetch recent activity
  useEffect(() => {
    if (!user) return

    const fetchRecentActivity = async () => {
      try {
        let activity = []

        switch (userData?.role) {
          case 'student':
            // Recent applications, admission decisions
            activity = [
              { type: 'application', message: 'Applied for BSc IT', time: '2 hours ago' },
              { type: 'admission', message: 'Admitted to Limkokwing University', time: '1 day ago' }
            ]
            break

          case 'institution':
            // New applications, course updates
            activity = [
              { type: 'application', message: 'New application received', time: '30 minutes ago' },
              { type: 'course', message: 'Course updated successfully', time: '2 hours ago' }
            ]
            break

          case 'company':
            // New job applications, profile views
            activity = [
              { type: 'application', message: 'New job application received', time: '1 hour ago' },
              { type: 'job', message: 'Job posted successfully', time: '3 hours ago' }
            ]
            break

          default:
            activity = []
        }

        dispatch({ type: ACTIONS.SET_RECENT_ACTIVITY, payload: activity })
      } catch (error) {
        console.error('Error fetching recent activity:', error)
      }
    }

    fetchRecentActivity()
  }, [user, userData])

  // Actions
  const markNotificationAsRead = (notificationId) => {
    dispatch({ type: ACTIONS.MARK_NOTIFICATION_READ, payload: notificationId })
  }

  const addNotification = (notification) => {
    dispatch({ type: ACTIONS.ADD_NOTIFICATION, payload: notification })
  }

  const setLoading = (loading) => {
    dispatch({ type: ACTIONS.SET_LOADING, payload: loading })
  }

  const value = {
    // State
    notifications: state.notifications,
    loading: state.loading,
    stats: state.stats,
    recentActivity: state.recentActivity,
    unreadCount: state.unreadCount,

    // Actions
    markNotificationAsRead,
    addNotification,
    setLoading
  }

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  )
}

export default AppContext