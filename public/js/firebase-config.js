
// Import the functions needed from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/13.0.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/13.0.0/firebase-auth.js";

// Web app's Firebase configuration
const firebaseConfig = {
 apiKey: "AIzaSyD0QYDu30pKVgiGTR_v2s6eE0hCpLq1is4",
 authDomain: "fir-setup-91da4.firebaseapp.com",
 projectId: "fir-setup-91da4",
 storageBucket: "fir-setup-91da4.firebasestorage.app",
 messagingSenderId: "716566448447",
 appId: "1:716566448447:web:794097accaf9076f272b8a"
};

// Initialize Firebase
let app = initializeApp(firebaseConfig);

let auth = getAuth(app);

export { auth };