// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
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
  databaseURL: "https://pay-api-gg-default-rtdb.firebaseio.com/",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
