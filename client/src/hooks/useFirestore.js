import { useState, useEffect } from 'react'
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  onSnapshot,
  writeBatch
} from 'firebase/firestore'
import { db } from '../firebase-config'

export const useFirestore = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Generic document operations
  const getDocument = async (collectionName, docId) => {
    setLoading(true)
    setError(null)
    
    try {
      const docRef = doc(db, collectionName, docId)
      const docSnap = await getDoc(docRef)
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() }
      } else {
        throw new Error('Document not found')
      }
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const getDocuments = async (collectionName, constraints = []) => {
    setLoading(true)
    setError(null)
    
    try {
      let q = query(collection(db, collectionName))
      
      // Apply constraints
      constraints.forEach(constraint => {
        q = query(q, ...constraint)
      })
      
      const querySnapshot = await getDocs(q)
      const documents = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      
      return documents
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const addDocument = async (collectionName, data) => {
    setLoading(true)
    setError(null)
    
    try {
      const docRef = await addDoc(collection(db, collectionName), {
        ...data,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      return docRef.id
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const updateDocument = async (collectionName, docId, data) => {
    setLoading(true)
    setError(null)
    
    try {
      const docRef = doc(db, collectionName, docId)
      await updateDoc(docRef, {
        ...data,
        updatedAt: new Date()
      })
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const deleteDocument = async (collectionName, docId) => {
    setLoading(true)
    setError(null)
    
    try {
      const docRef = doc(db, collectionName, docId)
      await deleteDoc(docRef)
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  // Real-time subscription
  const useCollection = (collectionName, constraints = [], dependencies = []) => {
    const [documents, setDocuments] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
      setLoading(true)
      
      let q = query(collection(db, collectionName))
      
      // Apply constraints
      constraints.forEach(constraint => {
        q = query(q, ...constraint)
      })
      
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const docs = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }))
          setDocuments(docs)
          setLoading(false)
        },
        (err) => {
          setError(err.message)
          setLoading(false)
        }
      )

      return () => unsubscribe()
    }, dependencies)

    return { documents, loading, error }
  }

  // Batch operations
  const batchOperation = async (operations) => {
    setLoading(true)
    setError(null)
    
    try {
      const batch = writeBatch(db)
      
      operations.forEach(op => {
        if (op.type === 'set') {
          const docRef = doc(db, op.collection, op.id)
          batch.set(docRef, op.data)
        } else if (op.type === 'update') {
          const docRef = doc(db, op.collection, op.id)
          batch.update(docRef, op.data)
        } else if (op.type === 'delete') {
          const docRef = doc(db, op.collection, op.id)
          batch.delete(docRef)
        }
      })
      
      await batch.commit()
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  return {
    loading,
    error,
    getDocument,
    getDocuments,
    addDocument,
    updateDocument,
    deleteDocument,
    useCollection,
    batchOperation
  }
}

// Specialized hooks for common collections
export const useUsers = () => {
  const { useCollection, getDocument, updateDocument } = useFirestore()
  
  const users = useCollection('users')
  const pendingUsers = useCollection('users', [
    [where('status', '==', 'pending')]
  ])
  
  const getUser = (userId) => getDocument('users', userId)
  const updateUser = (userId, data) => updateDocument('users', userId, data)
  
  return {
    users,
    pendingUsers,
    getUser,
    updateUser
  }
}

export const useCourses = () => {
  const { useCollection, getDocument, addDocument, updateDocument, deleteDocument } = useFirestore()
  
  const courses = useCollection('courses')
  const activeCourses = useCollection('courses', [
    [where('status', '==', 'active')]
  ])
  
  const getCourse = (courseId) => getDocument('courses', courseId)
  const addCourse = (data) => addDocument('courses', data)
  const updateCourse = (courseId, data) => updateDocument('courses', courseId, data)
  const deleteCourse = (courseId) => deleteDocument('courses', courseId)
  
  return {
    courses,
    activeCourses,
    getCourse,
    addCourse,
    updateCourse,
    deleteCourse
  }
}

export const useApplications = () => {
  const { useCollection, getDocument, addDocument, updateDocument } = useFirestore()
  
  const applications = useCollection('applications')
  
  const getApplication = (appId) => getDocument('applications', appId)
  const addApplication = (data) => addDocument('applications', data)
  const updateApplication = (appId, data) => updateDocument('applications', appId, data)
  
  // Student-specific applications
  const useStudentApplications = (studentId) => 
    useCollection('applications', [
      [where('studentId', '==', studentId)],
      [orderBy('appliedAt', 'desc')]
    ], [studentId])
  
  // Institution-specific applications
  const useInstitutionApplications = (institutionId) => 
    useCollection('applications', [
      [where('institutionId', '==', institutionId)],
      [orderBy('appliedAt', 'desc')]
    ], [institutionId])
  
  return {
    applications,
    getApplication,
    addApplication,
    updateApplication,
    useStudentApplications,
    useInstitutionApplications
  }
}

export const useJobs = () => {
  const { useCollection, getDocument, addDocument, updateDocument, deleteDocument } = useFirestore()
  
  const jobs = useCollection('jobs')
  const activeJobs = useCollection('jobs', [
    [where('status', '==', 'active')],
    [orderBy('createdAt', 'desc')]
  ])
  
  const getJob = (jobId) => getDocument('jobs', jobId)
  const addJob = (data) => addDocument('jobs', data)
  const updateJob = (jobId, data) => updateDocument('jobs', jobId, data)
  const deleteJob = (jobId) => deleteDocument('jobs', jobId)
  
  // Company-specific jobs
  const useCompanyJobs = (companyId) => 
    useCollection('jobs', [
      [where('companyId', '==', companyId)],
      [orderBy('createdAt', 'desc')]
    ], [companyId])
  
  return {
    jobs,
    activeJobs,
    getJob,
    addJob,
    updateJob,
    deleteJob,
    useCompanyJobs
  }
}

export default useFirestore