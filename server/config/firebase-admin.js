import { initializeApp, cert, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { getStorage } from 'firebase-admin/storage';

let adminApp;
let db;
let auth;
let storage;

try {
  // Check if we have proper Firebase credentials
  const hasServiceAccount = 
    process.env.FIREBASE_PROJECT_ID &&
    process.env.FIREBASE_PRIVATE_KEY &&
    process.env.FIREBASE_CLIENT_EMAIL;

  if (hasServiceAccount) {
    // Use service account credentials from environment variables
    const serviceAccount = {
      type: "service_account",
      project_id: process.env.FIREBASE_PROJECT_ID,
      private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
      private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      client_id: process.env.FIREBASE_CLIENT_ID,
      auth_uri: "https://accounts.google.com/o/oauth2/auth",
      token_uri: "https://oauth2.googleapis.com/token",
      auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
      client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL,
      universe_domain: "googleapis.com"
    };

    adminApp = initializeApp({
      credential: cert(serviceAccount),
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET || `${process.env.FIREBASE_PROJECT_ID}.appspot.com`
    });

    console.log('✅ Firebase Admin initialized with service account credentials');
  } else {
    // Fallback to mock mode for development without Firebase
    console.warn('⚠️  Firebase credentials not found. Running in mock mode.');
    console.warn('⚠️  To use Firebase features, set FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY, and FIREBASE_CLIENT_EMAIL environment variables.');
    
    // Create mock objects for development
    adminApp = {
      name: '[Mock] Firebase Admin App',
      options: { projectId: 'mock-project' }
    };
    
    db = {
      collection: () => ({
        doc: () => ({
          get: () => Promise.resolve({ exists: false, data: () => null }),
          set: () => Promise.resolve(),
          update: () => Promise.resolve(),
          delete: () => Promise.resolve()
        }),
        where: () => ({ get: () => Promise.resolve({ empty: true, docs: [] }) }),
        get: () => Promise.resolve({ empty: true, docs: [] })
      })
    };
    
    auth = {
      verifyIdToken: () => Promise.resolve({ uid: 'mock-user', email: 'mock@example.com' }),
      createCustomToken: () => Promise.resolve('mock-token'),
      getUserByEmail: () => Promise.resolve(null),
      createUser: () => Promise.resolve({ uid: 'mock-user' }),
      updateUser: () => Promise.resolve({ uid: 'mock-user' }),
      deleteUser: () => Promise.resolve()
    };
    
    storage = {
      file: () => ({
        save: () => Promise.resolve(),
        getSignedUrl: () => Promise.resolve(['mock-url']),
        delete: () => Promise.resolve()
      })
    };
    
    console.log('✅ Mock Firebase services initialized for development');
  }

  // Initialize real Firebase services if we have a real adminApp and project ID
  if (adminApp && 
      typeof adminApp.name === 'string' && 
      !adminApp.name.includes('[Mock]') && 
      adminApp.options?.projectId) {
    
    db = getFirestore(adminApp);
    auth = getAuth(adminApp);
    
    // Configure Firestore settings
    db.settings({ ignoreUndefinedProperties: true });
    
    // Initialize storage only if we have a valid bucket name
    const storageBucket = process.env.FIREBASE_STORAGE_BUCKET || `${adminApp.options.projectId}.appspot.com`;
    if (storageBucket && !storageBucket.includes('undefined')) {
      storage = getStorage(adminApp).bucket(storageBucket);
      console.log('✅ Firebase Storage configured');
    } else {
      console.warn('⚠️  Firebase Storage not configured - invalid bucket name');
      storage = {
        file: () => ({
          save: () => Promise.reject(new Error('Storage not configured')),
          getSignedUrl: () => Promise.reject(new Error('Storage not configured'))
        })
      };
    }
    
    console.log('✅ Real Firebase services initialized');
  }

} catch (error) {
  console.error('❌ Failed to initialize Firebase Admin:', error.message);
  console.error('❌ Please check your Firebase credentials and environment variables');
  
  // Create mock services to allow server to start
  adminApp = { name: '[Error] Firebase App', options: {} };
  db = { 
    collection: () => ({ 
      doc: () => ({ 
        get: () => Promise.reject(new Error('Firebase not configured')),
        set: () => Promise.reject(new Error('Firebase not configured'))
      }) 
    }) 
  };
  auth = { 
    verifyIdToken: () => Promise.reject(new Error('Firebase not configured')) 
  };
  storage = { 
    file: () => ({ 
      save: () => Promise.reject(new Error('Firebase not configured')) 
    }) 
  };
}

export { db, auth, storage };
export default adminApp;