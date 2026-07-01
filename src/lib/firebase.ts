import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAu2Y6qK0PTr6gxoTEIFOmyQA3GVv1HqUU",
  authDomain: "onlyprofit-4e98f.firebaseapp.com",
  projectId: "onlyprofit-4e98f",
  storageBucket: "onlyprofit-4e98f.firebasestorage.app",
  messagingSenderId: "997862126362",
  appId: "1:997862126362:web:7a20d4eb8856302ab132a3"
};

// Prevent duplicate initialization in Next.js hot reloads
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

export { app, auth, db, googleProvider };
