import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Debug: Log Firebase configuration (without sensitive data)
console.log("🔥 Firebase Initialization:");
console.log("  - Project ID:", firebaseConfig.projectId || "❌ MISSING");
console.log("  - Auth Domain:", firebaseConfig.authDomain || "❌ MISSING");
console.log("  - API Key:", firebaseConfig.apiKey ? "✅ Set" : "❌ MISSING");
console.log("  - App ID:", firebaseConfig.appId ? "✅ Set" : "❌ MISSING");

// Check if all required config values are present
const missingConfig = Object.entries(firebaseConfig)
  .filter(([_, value]) => !value)
  .map(([key]) => key);

if (missingConfig.length > 0) {
  console.error("❌ Missing Firebase configuration:", missingConfig);
  console.error("Please check your .env.local file!");
}

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
console.log("✅ Firebase app initialized:", app.name);

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

console.log("✅ Firebase services initialized:");
console.log("  - Auth:", auth ? "Ready" : "Failed");
console.log("  - Firestore:", db ? "Ready" : "Failed");
console.log("  - Storage:", storage ? "Ready" : "Failed");

export default app;
