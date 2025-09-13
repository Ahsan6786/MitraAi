
// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD96j5pBO3Cyrq5xAyUiOtuRA1Mc2KK7nE",
  authDomain: "mitraai-x30cv.firebaseapp.com",
  projectId: "mitraai-x30cv",
  storageBucket: "mitraai-x30cv.appspot.com",
  messagingSenderId: "553364420519",
  appId: "1:553364420519:web:a9352d44e7d5b4dda16882"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };
