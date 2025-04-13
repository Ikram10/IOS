import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, getDocs, query, orderBy } from "firebase/firestore";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendEmailVerification } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCQ9zgcWNwYgQHpntJ9XpkpBINS71FtVzA",
  authDomain: "uniwhisper-c0f02.firebaseapp.com",
  projectId: "uniwhisper-c0f02",
  storageBucket: "uniwhisper-c0f02.firebasestorage.app",
  messagingSenderId: "327116139157",
  appId: "1:327116139157:web:4dea9792999c5023c7099c",
  measurementId: "G-D5T40GR34S"
};

// Initialise Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { auth, db, collection, addDoc, getDocs, query, orderBy, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendEmailVerification };