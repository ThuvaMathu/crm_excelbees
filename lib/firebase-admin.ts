// lib/firebase-admin.ts
import { getApps, initializeApp, cert, type App } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

let adminApp: App;

// Check if the service account key is available
if (!process.env.FIREBASE_ADMIN_PRIVATE_KEY) {
  console.error(
    "FATAL ERROR: FIREBASE_ADMIN_PRIVATE_KEY environment variable is not set."
  );
  // You might want to throw an error to prevent the application from starting
  throw new Error("Firebase service account key is missing.");
}

try {
  // Attempt to parse the service account key and initialize the app
  const serviceAccount = JSON.parse(process.env.FIREBASE_ADMIN_PRIVATE_KEY);
  const existingApps = getApps();

  if (!existingApps.length) {
    console.log("Initializing new Firebase Admin app...");
    adminApp = initializeApp({
      credential: cert(serviceAccount),
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    });
    console.log("Firebase Admin app initialized successfully.");
  } else {
    // If an app already exists, use it. This prevents the "default app already exists" error.
    console.log(
      "Firebase Admin app already initialized. Reusing existing app."
    );
    adminApp = existingApps[0];
  }
} catch (error) {
  console.error("ERROR: Failed to initialize Firebase Admin app.");
  console.error("Details:", error);
  // Log the error and re-throw or handle it as appropriate for your application
  throw error;
}

// FIXED: Use default database instead of specific database name
export const adminDb = getFirestore(adminApp);

try {
  adminDb.settings({ ignoreUndefinedProperties: true });
} catch (error) {
  // Ignore error if settings are already locked/initialized
  console.log("Firestore settings already initialized, skipping.");
}

export const adminStorage = getStorage(adminApp);
