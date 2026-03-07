// lib/firebase-admin.ts
import { getApps, initializeApp, cert, type App } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import { getAuth } from "firebase-admin/auth";

let adminApp: App;

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
// Handle environments that store \n as a literal escape sequence
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

if (!projectId || !clientEmail || !privateKey) {
  throw new Error(
    "Firebase Admin: Missing required env vars. Ensure FIREBASE_PROJECT_ID, " +
      "FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY are set."
  );
}

try {
  const existingApps = getApps();

  if (!existingApps.length) {
    console.log("Initializing new Firebase Admin app...");
    adminApp = initializeApp({
      credential: cert({ projectId, clientEmail, privateKey }),
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    });
    console.log("Firebase Admin app initialized successfully.");
  } else {
    console.log("Firebase Admin app already initialized. Reusing existing app.");
    adminApp = existingApps[0];
  }
} catch (error) {
  console.error("ERROR: Failed to initialize Firebase Admin app.");
  console.error("Details:", error);
  throw error;
}

// FIXED: Use default database instead of specific database name
export const adminDb = getFirestore(adminApp);

try {
  adminDb.settings({ ignoreUndefinedProperties: true });
} catch {
  // Ignore error if settings are already locked/initialized
  console.log("Firestore settings already initialized, skipping.");
}

export const adminStorage = getStorage(adminApp);
export const adminAuth = getAuth(adminApp);
