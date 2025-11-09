import React, { createContext, useContext, useEffect, useState } from 'react'
import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile,
  sendEmailVerification
} from 'firebase/auth'
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore'
import { auth, db } from '../firebase-config'
import toast from 'react-hot-toast'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [userData, setUserData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [userDataLoading, setUserDataLoading] = useState(true)

  // Function to get user status from both user and company documents
  const getUserStatus = async (userId, userRole) => {
    try {
      // First try to get user document
      const userDoc = await getDoc(doc(db, 'users', userId))
      if (userDoc.exists()) {
        const userData = userDoc.data()
        if (userData.status) {
          return userData.status
        }
      }

      // For company users, check company document status
      if (userRole === 'company') {
        const companyDoc = await getDoc(doc(db, 'companies', userId))
        if (companyDoc.exists()) {
          const companyData = companyDoc.data()
          return companyData.status || 'pending'
        }
      }

      // For institution users, check institution document status
      if (userRole === 'institution') {
        const institutionDoc = await getDoc(doc(db, 'institutions', userId))
        if (institutionDoc.exists()) {
          const institutionData = institutionDoc.data()
          return institutionData.status || 'pending'
        }
      }

      // Default status based on role
      return ['student', 'admin'].includes(userRole) ? 'active' : 'pending'
    } catch (error) {
      console.error('Error getting user status:', error)
      return 'active' // Fallback status
    }
  }

  useEffect(() => {
    let unsubscribeUserData = () => {}

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('🔄 Auth state changed:', user?.email)
      setUser(user)
      
      if (user) {
        setUserDataLoading(true)
        
        // Set up real-time listener for user data
        const userDocRef = doc(db, 'users', user.uid)
        
        unsubscribeUserData = onSnapshot(userDocRef, 
          async (docSnap) => {
            console.log('📡 User data snapshot received')
            if (docSnap.exists()) {
              const data = docSnap.data()
              console.log('✅ Real-time user data loaded:', {
                email: data.email,
                role: data.role,
                status: data.status,
                displayName: data.displayName
              })
              
              // If user document exists but has no status, get it from role-specific document
              if (!data.status && data.role) {
                const actualStatus = await getUserStatus(user.uid, data.role)
                const updatedData = { ...data, status: actualStatus }
                setUserData(updatedData)
                
                // Update the user document with the correct status
                try {
                  await setDoc(userDocRef, { status: actualStatus }, { merge: true })
                  console.log('✅ Updated user document with status:', actualStatus)
                } catch (error) {
                  console.error('Error updating user status:', error)
                }
              } else {
                setUserData(data)
              }
            } else {
              console.log('❌ No user data found for:', user.uid)
              
              // Try to get role-specific data to determine status
              let userStatus = 'active'
              let userRole = 'student'
              
              // Check if user has a company document
              try {
                const companyDoc = await getDoc(doc(db, 'companies', user.uid))
                if (companyDoc.exists()) {
                  userRole = 'company'
                  userStatus = companyDoc.data().status || 'pending'
                }
              } catch (error) {
                console.log('No company document found')
              }
              
              // Check if user has an institution document
              try {
                const institutionDoc = await getDoc(doc(db, 'institutions', user.uid))
                if (institutionDoc.exists()) {
                  userRole = 'institution'
                  userStatus = institutionDoc.data().status || 'pending'
                }
              } catch (error) {
                console.log('No institution document found')
              }
              
              // Create user document with correct status
              const userDocData = {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName || '',
                role: userRole,
                status: userStatus,
                profileCompleted: false,
                createdAt: new Date(),
                updatedAt: new Date()
              }
              
              try {
                await setDoc(userDocRef, userDocData)
                console.log('📝 Created user document with status:', userStatus)
                setUserData(userDocData)
              } catch (error) {
                console.error('Error creating user document:', error)
                setUserData(userDocData) // Set local state even if Firestore fails
              }
            }
            setUserDataLoading(false)
            setLoading(false)
          },
          (error) => {
            console.error('❌ Error listening to user data:', error)
            // Create fallback user data
            const fallbackUserData = {
              uid: user.uid,
              email: user.email,
              displayName: user.displayName || '',
              role: 'student',
              status: 'active',
              profileCompleted: false
            }
            setUserData(fallbackUserData)
            setUserDataLoading(false)
            setLoading(false)
          }
        )

        // Also try to get user data immediately as fallback
        try {
          const userDoc = await getDoc(userDocRef)
          if (userDoc.exists()) {
            const data = userDoc.data()
            console.log('✅ Initial user data loaded:', {
              email: data.email,
              role: data.role,
              status: data.status
            })
            
            // If no status in user document, get it from role-specific document
            if (!data.status && data.role) {
              const actualStatus = await getUserStatus(user.uid, data.role)
              const updatedData = { ...data, status: actualStatus }
              setUserData(updatedData)
              
              // Update the user document
              await setDoc(userDocRef, { status: actualStatus }, { merge: true })
            } else {
              setUserData(data)
            }
          } else {
            console.log('📝 Creating user document for:', user.uid)
            // Get status from role-specific documents
            const userStatus = await getUserStatus(user.uid, 'student') // Default to student
            const userDocData = {
              uid: user.uid,
              email: user.email,
              displayName: user.displayName || '',
              role: 'student',
              status: userStatus,
              profileCompleted: false,
              createdAt: new Date(),
              updatedAt: new Date()
            }
            await setDoc(userDocRef, userDocData)
            setUserData(userDocData)
          }
        } catch (error) {
          console.error('❌ Error fetching initial user data:', error)
        }
      } else {
        console.log('👤 No user signed in')
        setUserData(null)
        setUserDataLoading(false)
        setLoading(false)
      }
    })

    return () => {
      console.log('🧹 Cleaning up auth listeners')
      unsubscribe()
      unsubscribeUserData()
    }
  }, [])

  // Function to sync user status with role-specific documents
  const syncUserStatus = async (userId, newStatus) => {
    try {
      // Update user document
      const userRef = doc(db, 'users', userId)
      await setDoc(userRef, {
        status: newStatus,
        updatedAt: new Date()
      }, { merge: true })

      // Update role-specific document if it exists
      try {
        const userDoc = await getDoc(userRef)
        if (userDoc.exists()) {
          const userData = userDoc.data()
          
          if (userData.role === 'company') {
            const companyRef = doc(db, 'companies', userId)
            await setDoc(companyRef, {
              status: newStatus,
              updatedAt: new Date()
            }, { merge: true })
          } else if (userData.role === 'institution') {
            const institutionRef = doc(db, 'institutions', userId)
            await setDoc(institutionRef, {
              status: newStatus,
              updatedAt: new Date()
            }, { merge: true })
          }
        }
      } catch (error) {
        console.log('No role-specific document found for user:', userId)
      }

      console.log(`✅ Synced status to "${newStatus}" for user:`, userId)
      
      // Update local state
      if (user && user.uid === userId) {
        setUserData(prev => prev ? { ...prev, status: newStatus } : null)
      }
    } catch (error) {
      console.error('Error syncing status:', error)
      throw error
    }
  }

  const register = async (email, password, userData) => {
    try {
      console.log('📝 Starting registration for:', email)
      const { user: newUser } = await createUserWithEmailAndPassword(auth, email, password)
      
      // Send email verification
      await sendEmailVerification(newUser)
      
      // Create user document in Firestore
      const userDocData = {
        uid: newUser.uid,
        email: newUser.email,
        displayName: userData.displayName || '',
        role: userData.role || 'student',
        profileCompleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...userData
      }
      
      await setDoc(doc(db, 'users', newUser.uid), userDocData)
      
      // Create role-specific document
      if (userData.role === 'student') {
        await setDoc(doc(db, 'students', newUser.uid), {
          uid: newUser.uid,
          email: newUser.email,
          displayName: userData.displayName || '',
          createdAt: new Date(),
          updatedAt: new Date(),
          applications: [],
          transcripts: []
        })
      } else if (userData.role === 'institution') {
        await setDoc(doc(db, 'institutions', newUser.uid), {
          uid: newUser.uid,
          email: newUser.email,
          name: userData.displayName || '',
          status: 'pending',
          createdAt: new Date(),
          updatedAt: new Date(),
          courses: [],
          faculties: []
        })
      } else if (userData.role === 'company') {
        await setDoc(doc(db, 'companies', newUser.uid), {
          uid: newUser.uid,
          email: newUser.email,
          name: userData.displayName || '',
          status: 'pending',
          createdAt: new Date(),
          updatedAt: new Date(),
          jobs: []
        })
      }

      console.log('✅ Registration completed for:', email)
      toast.success('Registration successful! Please check your email for verification.')
      return newUser
    } catch (error) {
      console.error('Registration error:', error)
      let errorMessage = 'Registration failed. Please try again.'
      
      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = 'Email is already registered.'
          break
        case 'auth/invalid-email':
          errorMessage = 'Invalid email address.'
          break
        case 'auth/weak-password':
          errorMessage = 'Password should be at least 6 characters.'
          break
        default:
          errorMessage = error.message
      }
      
      toast.error(errorMessage)
      throw error
    }
  }

  const login = async (email, password) => {
    try {
      console.log('🔐 Attempting login for:', email)
      const { user: authUser } = await signInWithEmailAndPassword(auth, email, password)
      
      // Check if email is verified
      if (!authUser.emailVerified) {
        await sendEmailVerification(authUser)
        toast.error('Please verify your email before logging in. A new verification email has been sent.')
        await signOut(auth)
        throw new Error('Email not verified')
      }

      console.log('✅ Login successful for:', authUser.email)
      
      // Force refresh user data after login
      try {
        const userDoc = await getDoc(doc(db, 'users', authUser.uid))
        if (userDoc.exists()) {
          const data = userDoc.data()
          console.log('✅ User data after login:', {
            role: data.role,
            status: data.status,
            email: data.email
          })
          
          // Sync status if needed
          if (!data.status && data.role) {
            const actualStatus = await getUserStatus(authUser.uid, data.role)
            const updatedData = { ...data, status: actualStatus }
            setUserData(updatedData)
            await setDoc(doc(db, 'users', authUser.uid), { status: actualStatus }, { merge: true })
          } else {
            setUserData(data)
          }
        }
      } catch (error) {
        console.error('Error loading user data after login:', error)
      }

      toast.success('Login successful!')
      return authUser
    } catch (error) {
      console.error('Login error:', error)
      let errorMessage = 'Login failed. Please try again.'
      
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = 'No account found with this email.'
          break
        case 'auth/wrong-password':
          errorMessage = 'Incorrect password.'
          break
        case 'auth/invalid-email':
          errorMessage = 'Invalid email address.'
          break
        case 'auth/too-many-requests':
          errorMessage = 'Too many failed attempts. Please try again later.'
          break
        default:
          if (error.message === 'Email not verified') {
            throw error
          }
          errorMessage = error.message
      }
      
      toast.error(errorMessage)
      throw error
    }
  }

  const logout = async () => {
    try {
      console.log('🚪 Logging out user:', user?.email)
      await signOut(auth)
      setUser(null)
      setUserData(null)
      toast.success('Logged out successfully')
    } catch (error) {
      console.error('Logout error:', error)
      toast.error('Error logging out')
      throw error
    }
  }

  const resetPassword = async (email) => {
    try {
      console.log('📧 Sending password reset for:', email)
      await sendPasswordResetEmail(auth, email)
      toast.success('Password reset email sent!')
    } catch (error) {
      console.error('Password reset error:', error)
      let errorMessage = 'Failed to send reset email.'
      
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = 'No account found with this email.'
          break
        case 'auth/invalid-email':
          errorMessage = 'Invalid email address.'
          break
        default:
          errorMessage = error.message
      }
      
      toast.error(errorMessage)
      throw error
    }
  }

  const updateUserProfile = async (updates) => {
    try {
      console.log('📝 Updating profile for:', user?.email)
      // Update Firebase Auth profile
      if (updates.displayName || updates.photoURL) {
        await updateProfile(auth.currentUser, updates)
      }

      // Update Firestore user document
      const userRef = doc(db, 'users', user.uid)
      await setDoc(userRef, {
        ...userData,
        ...updates,
        updatedAt: new Date()
      }, { merge: true })

      // Update role-specific document
      if (userData.role === 'student') {
        const studentRef = doc(db, 'students', user.uid)
        await setDoc(studentRef, {
          ...updates,
          updatedAt: new Date()
        }, { merge: true })
      } else if (userData.role === 'institution') {
        const institutionRef = doc(db, 'institutions', user.uid)
        await setDoc(institutionRef, {
          ...updates,
          updatedAt: new Date()
        }, { merge: true })
      } else if (userData.role === 'company') {
        const companyRef = doc(db, 'companies', user.uid)
        await setDoc(companyRef, {
          ...updates,
          updatedAt: new Date()
        }, { merge: true })
      }

      // Update local state
      setUserData(prev => ({ ...prev, ...updates }))
      setUser(prev => ({ ...prev, ...updates }))

      console.log('✅ Profile updated successfully')
      toast.success('Profile updated successfully!')
    } catch (error) {
      console.error('Profile update error:', error)
      toast.error('Failed to update profile')
      throw error
    }
  }

  const refreshUserData = async () => {
    if (!user) {
      console.log('❌ Cannot refresh user data: No user')
      return
    }
    
    try {
      console.log('🔄 Manually refreshing user data for:', user.email)
      const userDoc = await getDoc(doc(db, 'users', user.uid))
      if (userDoc.exists()) {
        const data = userDoc.data()
        console.log('✅ Refreshed user data:', {
          role: data.role,
          status: data.status,
          email: data.email
        })
        
        // Sync status if needed
        if (!data.status && data.role) {
          const actualStatus = await getUserStatus(user.uid, data.role)
          const updatedData = { ...data, status: actualStatus }
          setUserData(updatedData)
          return updatedData
        } else {
          setUserData(data)
          return data
        }
      } else {
        console.log('❌ No user document found during refresh')
        setUserData(null)
        return null
      }
    } catch (error) {
      console.error('Error refreshing user data:', error)
      throw error
    }
  }

  const value = {
    user,
    userData,
    loading: loading || userDataLoading,
    login,
    logout,
    register,
    resetPassword,
    updateUserProfile,
    refreshUserData,
    syncUserStatus // Add this function
  }

  console.log('🔑 AuthProvider rendering - Loading:', loading, 'UserDataLoading:', userDataLoading)

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export default AuthContext