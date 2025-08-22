// Import the functions you need from the SDKs you need
import firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import { getDatabase } from "firebase/database";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyC8vJgau5Z_7conJekbXaf0yaxOl7K8Mq0",
  authDomain: "pay-api-gg.firebaseapp.com",
  projectId: "pay-api-gg",
  storageBucket: "pay-api-gg.firebasestorage.app",
  messagingSenderId: "155527522724",
  appId: "1:155527522724:web:f6860f22fde4a5e6a23931",
  measurementId: "G-BNQEE2RM1Q",
};

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);

// Explicitly provide the database URL to getDatabase to fix the warning.
// This is the most reliable way to ensure the connection is made correctly.
export const db = getDatabase(app, "https://pay-api-gg-default-rtdb.firebaseio.com/");