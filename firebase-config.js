// ===== PASTE YOUR FIREBASE WEB CONFIG HERE (Firebase Console > Project settings > Your apps) =====
import {initializeApp} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {getAuth} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {getFirestore} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.firebasestorage.app",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};
// ===== END CONFIG (web config is public by design; privacy comes from the security rules) =====
export const configured = !firebaseConfig.apiKey.startsWith("YOUR_");
const app = configured ? initializeApp(firebaseConfig) : null;
export const auth = app ? getAuth(app) : null;
export const db = app ? getFirestore(app) : null;
