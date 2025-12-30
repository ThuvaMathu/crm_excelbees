// Simple test page to verify Firebase is initialized correctly
"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";

export default function FirebaseTestPage() {
    const [status, setStatus] = useState("Checking Firebase...");
    const [user, setUser] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        try {
            // Check if Firebase is initialized
            if (!auth) {
                setError("Firebase Auth not initialized");
                return;
            }

            if (!db) {
                setError("Firebase Firestore not initialized");
                return;
            }

            setStatus("Firebase initialized successfully!");

            // Listen to auth state
            const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
                console.log("Auth state changed:", firebaseUser);
                setUser(firebaseUser);
                setStatus(firebaseUser ? "User logged in" : "No user logged in");
            });

            return () => unsubscribe();
        } catch (err: any) {
            setError(err.message);
        }
    }, []);

    return (
        <div className="p-8 space-y-4">
            <h1 className="text-2xl font-bold">Firebase Test Page</h1>

            <div className="space-y-2">
                <p><strong>Status:</strong> {status}</p>
                {error && <p className="text-red-500"><strong>Error:</strong> {error}</p>}
                {user && (
                    <div>
                        <p><strong>User Email:</strong> {user.email}</p>
                        <p><strong>User UID:</strong> {user.uid}</p>
                    </div>
                )}
            </div>

            <div className="mt-4 p-4 bg-gray-100 dark:bg-gray-800 rounded">
                <h2 className="font-semibold mb-2">Environment Variables:</h2>
                <pre className="text-xs">
                    {JSON.stringify({
                        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? "SET" : "NOT SET",
                        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ? "SET" : "NOT SET",
                        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ? "SET" : "NOT SET",
                    }, null, 2)}
                </pre>
            </div>
        </div>
    );
}
