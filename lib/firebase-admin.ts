// lib/firebase-admin.ts
import { getApps, initializeApp, cert, type App } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import { getAuth } from "firebase-admin/auth";

let adminApp: App | null = null;

/**
 * Get or initialize Firebase Admin app
 * Implements singleton pattern for Lambda compatibility
 * Reuses existing app instance across Lambda invocations
 */
export function getAdminApp(): App {
  if (adminApp) {
    return adminApp;
  }

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
    // Check if an app is already initialized
    const existingApps = getApps();
    if (existingApps.length > 0) {
      console.log("Firebase Admin app already initialized. Reusing existing app.");
      adminApp = existingApps[0];
    } else {
      console.log("Initializing new Firebase Admin app...");
      adminApp = initializeApp({
        credential: cert({ projectId, clientEmail, privateKey }),
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      });
      console.log("Firebase Admin app initialized successfully.");
    }
  } catch (error) {
    console.error("ERROR: Failed to initialize Firebase Admin app.");
    console.error("Details:", error);
    throw error;
  }

  return adminApp;
}

/**
 * Get Firestore instance
 * Lazy initialization for Lambda compatibility
 */
export function getAdminDb() {
  const db = getFirestore(getAdminApp());
  try {
    db.settings({ ignoreUndefinedProperties: true });
  } catch {
    // Ignore error if settings are already locked/initialized
    console.log("Firestore settings already initialized, skipping.");
  }
  return db;
}

/**
 * Get Storage instance
 * Lazy initialization for Lambda compatibility
 */
export function getAdminStorage() {
  return getStorage(getAdminApp());
}

/**
 * Get Auth instance
 * Lazy initialization for Lambda compatibility
 */
export function getAdminAuth() {
  return getAuth(getAdminApp());
}

// Backward compatibility: Export direct accessors
// These will initialize the app on first access
export const adminDb = getAdminDb();
export const adminStorage = getAdminStorage();
export const adminAuth = getAdminAuth();
