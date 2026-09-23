// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyD22y5x1w8AqSmN614G_McwEvr2vULGDz8",
  authDomain: "project1-61c69.firebaseapp.com",
  databaseURL: "https://project1-61c69-default-rtdb.firebaseio.com",
  projectId: "project1-61c69",
  storageBucket: "project1-61c69.firebasestorage.app",
  messagingSenderId: "993840544380",
  appId: "1:993840544380:web:28cd5a348ef1c7f5b167f9",
  measurementId: "G-82RRGQFHV1"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const firebaseDBInstance = firebase.database();

// Export للاستخدام في script.js
window.firebaseDB = firebaseDBInstance;
