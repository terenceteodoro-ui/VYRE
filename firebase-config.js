// ===== PASTE YOUR FIREBASE WEB CONFIG HERE (Firebase Console > Project settings > Your apps) =====
import {initializeApp} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {getAuth} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {getFirestore} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
const firebaseConfig = {
  apiKey: "AIzaSyAp8ydTvSH1VC24SurS49Rqay0DTaDwt-U",
  authDomain: "vyre-8a3dc.firebaseapp.com",
  projectId: "vyre-8a3dc",
  storageBucket: "vyre-8a3dc.firebasestorage.app",
  messagingSenderId: "777891043022",
  appId: "1:777891043022:web:8d088780ce8c40809de29f"
};
// ===== END CONFIG (web config is public by design; privacy comes from the security rules) =====
export const configured = !firebaseConfig.apiKey.startsWith("YOUR_");
const app = configured ? initializeApp(firebaseConfig) : null;
export const auth = app ? getAuth(app) : null;
export const db = app ? getFirestore(app) : null;
