import { db } from './firebase-admin.js';

// Database configuration and utilities
export const collections = {
  USERS: 'users',
  INSTITUTIONS: 'institutions',
  COURSES: 'courses',
  APPLICATIONS: 'applications',
  COMPANIES: 'companies',
  JOBS: 'jobs',
  JOB_APPLICATIONS: 'jobApplications',
  TRANSCRIPTS: 'transcripts',
  NOTIFICATIONS: 'notifications',
  SYSTEM: 'system'
};

// Database helpers
export const dbHelpers = {
  // Convert Firestore timestamp to JS Date
  convertTimestamp: (timestamp) => {
    if (!timestamp) return null;
    return timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  },

  // Generate unique ID
  generateId: (prefix = '') => {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2);
    return `${prefix}${timestamp}${random}`;
  },

  // Batch operations helper
  batchOperation: async (operations, batchSize = 500) => {
    const batches = [];
    let currentBatch = db.batch();
    let operationCount = 0;

    for (const operation of operations) {
      currentBatch[operation.type](operation.ref, operation.data);
      operationCount++;

      if (operationCount % batchSize === 0) {
        batches.push(currentBatch.commit());
        currentBatch = db.batch();
      }
    }

    // Commit remaining operations
    if (operationCount % batchSize !== 0) {
      batches.push(currentBatch.commit());
    }

    return Promise.all(batches);
  },

  // Pagination helper
  paginateQuery: (query, page = 1, limit = 10) => {
    const startAfter = (page - 1) * limit;
    return query.limit(limit).offset(startAfter);
  },

  // Safe document creation with ID check
  safeCreate: async (collection, id, data) => {
    const docRef = db.collection(collection).doc(id);
    const docSnap = await docRef.get();

    if (docSnap.exists) {
      throw new Error(`Document with ID ${id} already exists in ${collection}`);
    }

    await docRef.set({
      ...data,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    return docRef.id;
  }
};

// Database indexes configuration
export const indexes = {
  users: [
    { fields: ['email'], unique: true },
    { fields: ['role', 'createdAt'] },
    { fields: ['status', 'createdAt'] }
  ],
  institutions: [
    { fields: ['name'] },
    { fields: ['type', 'location'] },
    { fields: ['status', 'createdAt'] }
  ],
  courses: [
    { fields: ['name', 'institutionId'] },
    { fields: ['institutionId', 'faculty'] },
    { fields: ['requirements.minGrade', 'createdAt'] }
  ],
  applications: [
    { fields: ['studentId', 'status'] },
    { fields: ['institutionId', 'courseId'] },
    { fields: ['courseId', 'appliedAt'] }
  ],
  jobs: [
    { fields: ['companyId', 'status'] },
    { fields: ['title', 'type'] },
    { fields: ['location', 'category'] }
  ]
};

export default db;