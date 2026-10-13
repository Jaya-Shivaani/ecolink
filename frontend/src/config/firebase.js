import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getAnalytics, isSupported } from "firebase/analytics";

// Your web app's Firebase configuration read from environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBPRO6fn_SicvvTRJWx561Y_WPUnZlh41U",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "ecolink-751bf.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "ecolink-751bf",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "ecolink-751bf.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "413104005135",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:413104005135:web:4e30c34a60cda03976c37a",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-RNP57R0M9J",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Custom prompt for account selection if desired
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

// Initialize Analytics safely
let analytics = null;
if (typeof window !== 'undefined') {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  }).catch((err) => {
    console.warn("Firebase Analytics initialization warning:", err);
  });
}

export { app, auth, googleProvider, analytics, firebaseConfig };
export default app;
