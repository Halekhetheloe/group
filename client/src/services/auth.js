import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  sendEmailVerification,
  updateEmail,
  updatePassword
} from 'firebase/auth'
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore'
import { auth, db } from '../firebase-config'

export const authService = {
  // Register new user
  async register(email, password, userData) {
    try {
      const { user } = await createUserWithEmailAndPassword(auth, email, password)
      
      // Send email verification
      await sendEmailVerification(user)
      
      // Create user document in Firestore
      const userDoc = {
        uid: user.uid,
        email: user.email,
        displayName: userData.displayName || '',
        role: userData.role || 'student',
        profileCompleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...userData
      }
      
      await setDoc(doc(db, 'users', user.uid), userDoc)
      
      // Create role-specific document
      if (userData.role === 'student') {
        await setDoc(doc(db, 'students', user.uid), {
          uid: user.uid,
          email: user.email,
          displayName: userData.displayName || '',
          createdAt: new Date(),
          updatedAt: new Date(),
          applications: [],
          transcripts: [],
          profileCompleted: false
        })
      } else if (userData.role === 'institution') {
        await setDoc(doc(db, 'institutions', user.uid), {
          uid: user.uid,
          email: user.email,
          name: userData.displayName || '',
          status: 'pending', // Needs admin approval
          createdAt: new Date(),
          updatedAt: new Date(),
          courses: [],
          faculties: [],
          profileCompleted: false
        })
      } else if (userData.role === 'company') {
        await setDoc(doc(db, 'companies', user.uid), {
          uid: user.uid,
          email: user.email,
          name: userData.displayName || '',
          status: 'pending', // Needs admin approval
          createdAt: new Date(),
          updatedAt: new Date(),
          jobs: [],
          profileCompleted: false
        })
      }
      
      return { success: true, user }
    } catch (error) {
      console.error('Registration error:', error)
      throw error
    }
  },

  // Login user
  async login(email, password) {
    try {
      const { user } = await signInWithEmailAndPassword(auth, email, password)
      
      // Check if email is verified
      if (!user.emailVerified) {
        await sendEmailVerification(user)
        await signOut(auth)
        throw new Error('EMAIL_NOT_VERIFIED')
      }
      
      // Get user data from Firestore
      const userDoc = await getDoc(doc(db, 'users', user.uid))
      if (!userDoc.exists()) {
        throw new Error('USER_DATA_NOT_FOUND')
      }
      
      const userData = userDoc.data()
      
      // Check if institution/company is approved
      if ((userData.role === 'institution' || userData.role === 'company') && userData.status !== 'approved') {
        await signOut(auth)
        throw new Error('ACCOUNT_PENDING_APPROVAL')
      }
      
      return { success: true, user, userData: userData }
    } catch (error) {
      console.error('Login error:', error)
      throw error
    }
  },

  // Logout user
  async logout() {
    try {
      await signOut(auth)
      return { success: true }
    } catch (error) {
      console.error('Logout error:', error)
      throw error
    }
  },

  // Reset password
  async resetPassword(email) {
    try {
      await sendPasswordResetEmail(auth, email)
      return { success: true }
    } catch (error) {
      console.error('Password reset error:', error)
      throw error
    }
  },

  // Update user profile
  async updateProfile(updates) {
    try {
      const user = auth.currentUser
      if (!user) throw new Error('NO_USER_FOUND')

      // Update Firebase Auth profile
      if (updates.displayName || updates.photoURL) {
        await updateProfile(user, {
          displayName: updates.displayName,
          photoURL: updates.photoURL
        })
      }

      // Update Firestore user document
      await updateDoc(doc(db, 'users', user.uid), {
        ...updates,
        updatedAt: new Date()
      })

      // Update role-specific document
      const userDoc = await getDoc(doc(db, 'users', user.uid))
      const userData = userDoc.data()
      
      if (userData.role === 'student') {
        await updateDoc(doc(db, 'students', user.uid), {
          ...updates,
          updatedAt: new Date()
        })
      } else if (userData.role === 'institution') {
        await updateDoc(doc(db, 'institutions', user.uid), {
          ...updates,
          updatedAt: new Date()
        })
      } else if (userData.role === 'company') {
        await updateDoc(doc(db, 'companies', user.uid), {
          ...updates,
          updatedAt: new Date()
        })
      }

      return { success: true }
    } catch (error) {
      console.error('Profile update error:', error)
      throw error
    }
  },

  // Change email
  async changeEmail(newEmail) {
    try {
      const user = auth.currentUser
      if (!user) throw new Error('NO_USER_FOUND')

      await updateEmail(user, newEmail)
      await updateDoc(doc(db, 'users', user.uid), {
        email: newEmail,
        updatedAt: new Date()
      })

      return { success: true }
    } catch (error) {
      console.error('Email change error:', error)
      throw error
    }
  },

  // Change password
  async changePassword(newPassword) {
    try {
      const user = auth.currentUser
      if (!user) throw new Error('NO_USER_FOUND')

      await updatePassword(user, newPassword)
      return { success: true }
    } catch (error) {
      console.error('Password change error:', error)
      throw error
    }
  },

  // Check if user exists
  async checkUserExists(email) {
    try {
      // This is a simplified check - in a real app, you might use Firebase Admin SDK on backend
      const usersQuery = await getDocs(query(collection(db, 'users'), where('email', '==', email)))
      return !usersQuery.empty
    } catch (error) {
      console.error('User existence check error:', error)
      throw error
    }
  }
}

export default authService