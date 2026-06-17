import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCKKYBJWKbWAiXS4JxECKdSX6sFNhdNBbs",
  authDomain: "salary-app-d0a8d.firebaseapp.com",
  projectId: "salary-app-d0a8d",
  storageBucket: "salary-app-d0a8d.firebasestorage.app",
  messagingSenderId: "699436696461",
  appId: "1:699436696461:web:e92af8ca46f4c3215fb3c4",
  measurementId: "G-L7HZQRLS5T"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();