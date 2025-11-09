// client/src/firebase-config.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDwL-b6LR4QlJEHJ6dD_kK4J-xYs8Bv2lo",
  authDomain: "career-guidance-platform-bf353.firebaseapp.com",
  projectId: "career-guidance-platform-bf353",
  storageBucket: "career-guidance-platform-bf353.firebasestorage.app",
  messagingSenderId: "424074645679",
  appId: "1:424074645679:web:1c295e57acb6c56683c45a",
  measurementId: "G-L9LJT53W75"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

// Initialize Firebase Storage and get a reference to the service
export const storage = getStorage(app);

// Initialize Analytics (optional)
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

export default app;