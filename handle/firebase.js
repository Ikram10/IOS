import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, getDocs, query, orderBy } from "firebase/firestore";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendEmailVerification } from "firebase/auth";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBwyowMUs8UUZDewt2riStrzYa-jA-qNzM",
  authDomain: "uniwhisper-3feee.firebaseapp.com",
  projectId: "uniwhisper-3feee",
  storageBucket: "uniwhisper-3feee.firebasestorage.app",
  messagingSenderId: "741497912850",
  appId: "1:741497912850:web:a0729216c33c343287a2cb",
  measurementId: "G-M00RQQC18N"
};

// Initialise Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { auth, db, collection, addDoc, getDocs, query, orderBy, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendEmailVerification };