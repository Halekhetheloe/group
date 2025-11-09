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
  startAfter,
  endBefore,
  writeBatch,
  arrayUnion,
  arrayRemove,
  increment
} from 'firebase/firestore'
import { db } from '../firebase-config'

export const firestoreService = {
  // Generic document operations
  async getDocument(collectionName, docId) {
    try {
      const docRef = doc(db, collectionName, docId)
      const docSnap = await getDoc(docRef)
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() }
      } else {
        throw new Error('Document not found')
      }
    } catch (error) {
      console.error('Error getting document:', error)
      throw error
    }
  },

  async getDocuments(collectionName, constraints = []) {
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
    } catch (error) {
      console.error('Error getting documents:', error)
      throw error
    }
  },

  async addDocument(collectionName, data) {
    try {
      const docData = {
        ...data,
        createdAt: new Date(),
        updatedAt: new Date()
      }
      
      const docRef = await addDoc(collection(db, collectionName), docData)
      return docRef.id
    } catch (error) {
      console.error('Error adding document:', error)
      throw error
    }
  },

  async updateDocument(collectionName, docId, data) {
    try {
      const docRef = doc(db, collectionName, docId)
      await updateDoc(docRef, {
        ...data,
        updatedAt: new Date()
      })
    } catch (error) {
      console.error('Error updating document:', error)
      throw error
    }
  },

  async deleteDocument(collectionName, docId) {
    try {
      const docRef = doc(db, collectionName, docId)
      await deleteDoc(docRef)
    } catch (error) {
      console.error('Error deleting document:', error)
      throw error
    }
  },

  // Batch operations
  async batchOperation(operations) {
    try {
      const batch = writeBatch(db)
      
      operations.forEach(op => {
        if (op.type === 'set') {
          const docRef = doc(db, op.collection, op.id)
          batch.set(docRef, {
            ...op.data,
            createdAt: new Date(),
            updatedAt: new Date()
          })
        } else if (op.type === 'update') {
          const docRef = doc(db, op.collection, op.id)
          batch.update(docRef, {
            ...op.data,
            updatedAt: new Date()
          })
        } else if (op.type === 'delete') {
          const docRef = doc(db, op.collection, op.id)
          batch.delete(docRef)
        }
      })
      
      await batch.commit()
    } catch (error) {
      console.error('Batch operation error:', error)
      throw error
    }
  },

  // Array operations
  async addToArray(collectionName, docId, field, items) {
    try {
      const docRef = doc(db, collectionName, docId)
      await updateDoc(docRef, {
        [field]: arrayUnion(...items),
        updatedAt: new Date()
      })
    } catch (error) {
      console.error('Error adding to array:', error)
      throw error
    }
  },

  async removeFromArray(collectionName, docId, field, items) {
    try {
      const docRef = doc(db, collectionName, docId)
      await updateDoc(docRef, {
        [field]: arrayRemove(...items),
        updatedAt: new Date()
      })
    } catch (error) {
      console.error('Error removing from array:', error)
      throw error
    }
  },

  // Counter operations
  async incrementCounter(collectionName, docId, field, amount = 1) {
    try {
      const docRef = doc(db, collectionName, docId)
      await updateDoc(docRef, {
        [field]: increment(amount),
        updatedAt: new Date()
      })
    } catch (error) {
      console.error('Error incrementing counter:', error)
      throw error
    }
  },

  // Pagination
  async getPaginatedDocuments(collectionName, options = {}) {
    try {
      const {
        constraints = [],
        orderByField = 'createdAt',
        orderDirection = 'desc',
        pageSize = 10,
        startAfterDoc = null,
        endBeforeDoc = null
      } = options

      let q = query(collection(db, collectionName))
      
      // Apply constraints
      constraints.forEach(constraint => {
        q = query(q, ...constraint)
      })
      
      // Apply ordering
      q = query(q, orderBy(orderByField, orderDirection))
      
      // Apply pagination
      if (startAfterDoc) {
        q = query(q, startAfter(startAfterDoc))
      } else if (endBeforeDoc) {
        q = query(q, endBefore(endBeforeDoc))
      }
      
      // Apply limit
      q = query(q, limit(pageSize))
      
      const querySnapshot = await getDocs(q)
      const documents = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      
      return {
        documents,
        hasNext: querySnapshot.docs.length === pageSize,
        hasPrev: !!startAfterDoc,
        lastDoc: querySnapshot.docs[querySnapshot.docs.length - 1],
        firstDoc: querySnapshot.docs[0]
      }
    } catch (error) {
      console.error('Error getting paginated documents:', error)
      throw error
    }
  },

  // Search functionality
  async searchDocuments(collectionName, searchFields, searchTerm, additionalConstraints = []) {
    try {
      // Note: Firestore doesn't support native text search
      // This is a basic implementation that filters client-side
      // For production, consider using Algolia or Elasticsearch
      
      let q = query(collection(db, collectionName))
      
      // Apply additional constraints
      additionalConstraints.forEach(constraint => {
        q = query(q, ...constraint)
      })
      
      const querySnapshot = await getDocs(q)
      const documents = querySnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(doc => {
          return searchFields.some(field => {
            const value = doc[field]
            if (typeof value === 'string') {
              return value.toLowerCase().includes(searchTerm.toLowerCase())
            }
            return false
          })
        })
      
      return documents
    } catch (error) {
      console.error('Search error:', error)
      throw error
    }
  }
}

// Specialized services for common collections
export const userService = {
  async getUser(uid) {
    return firestoreService.getDocument('users', uid)
  },

  async updateUser(uid, data) {
    return firestoreService.updateDocument('users', uid, data)
  },

  async getUsersByRole(role) {
    return firestoreService.getDocuments('users', [
      [where('role', '==', role)]
    ])
  },

  async getPendingApprovals() {
    return firestoreService.getDocuments('users', [
      [where('status', '==', 'pending')]
    ])
  }
}

export const courseService = {
  async getCourse(courseId) {
    return firestoreService.getDocument('courses', courseId)
  },

  async getCoursesByInstitution(institutionId) {
    return firestoreService.getDocuments('courses', [
      [where('institutionId', '==', institutionId)],
      [where('status', '==', 'active')],
      [orderBy('createdAt', 'desc')]
    ])
  },

  async getActiveCourses() {
    return firestoreService.getDocuments('courses', [
      [where('status', '==', 'active')],
      [orderBy('createdAt', 'desc')]
    ])
  },

  async createCourse(courseData) {
    return firestoreService.addDocument('courses', courseData)
  },

  async updateCourse(courseId, courseData) {
    return firestoreService.updateDocument('courses', courseId, courseData)
  },

  async deleteCourse(courseId) {
    return firestoreService.deleteDocument('courses', courseId)
  }
}

export const applicationService = {
  async getApplication(applicationId) {
    return firestoreService.getDocument('applications', applicationId)
  },

  async getStudentApplications(studentId) {
    return firestoreService.getDocuments('applications', [
      [where('studentId', '==', studentId)],
      [orderBy('appliedAt', 'desc')]
    ])
  },

  async getInstitutionApplications(institutionId) {
    return firestoreService.getDocuments('applications', [
      [where('institutionId', '==', institutionId)],
      [orderBy('appliedAt', 'desc')]
    ])
  },

  async createApplication(applicationData) {
    return firestoreService.addDocument('applications', applicationData)
  },

  async updateApplicationStatus(applicationId, status, notes = '') {
    const updateData = {
      status,
      updatedAt: new Date()
    }
    
    if (notes) {
      updateData.notes = notes
    }
    
    if (status === 'accepted') {
      updateData.admittedAt = new Date()
    }
    
    return firestoreService.updateDocument('applications', applicationId, updateData)
  }
}

export const jobService = {
  async getJob(jobId) {
    return firestoreService.getDocument('jobs', jobId)
  },

  async getCompanyJobs(companyId) {
    return firestoreService.getDocuments('jobs', [
      [where('companyId', '==', companyId)],
      [orderBy('createdAt', 'desc')]
    ])
  },

  async getActiveJobs() {
    return firestoreService.getDocuments('jobs', [
      [where('status', '==', 'active')],
      [orderBy('createdAt', 'desc')]
    ])
  },

  async createJob(jobData) {
    return firestoreService.addDocument('jobs', jobData)
  },

  async updateJob(jobId, jobData) {
    return firestoreService.updateDocument('jobs', jobId, jobData)
  },

  async deleteJob(jobId) {
    return firestoreService.deleteDocument('jobs', jobId)
  }
}

export default firestoreService