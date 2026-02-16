import { cookies, headers } from "next/headers";
import { getAuth } from "firebase-admin/auth";
import { adminDb } from "@/lib/firebase-admin";
import type { UserRole } from "@/types/crm";

export interface SessionUser {
  uid: string;
  email?: string;
  displayName?: string;
  role: UserRole;
}

export interface Session {
  user: SessionUser;
}

export async function auth(): Promise<Session | null> {
  try {
    const headerList = await headers();
    const cookieStore = await cookies();
    
    const header = headerList.get("Authorization");
    const cookie = cookieStore.get("session")?.value || cookieStore.get("token")?.value;
    
    let token = "";
    if (header && header.startsWith("Bearer ")) {
      token = header.split("Bearer ")[1];
    } else if (cookie) {
      token = cookie;
    }

    if (!token) return null;

    const decodedToken = await getAuth().verifyIdToken(token);
    
    // Fetch user permissions/role to ensure we have fresh data
    const userDoc = await adminDb.collection("users").doc(decodedToken.uid).get();
    const userData = userDoc.data();

    return {
      user: {
        uid: decodedToken.uid,
        email: decodedToken.email,
        displayName: userData?.displayName || "",
        role: (userData?.role as UserRole) || "team",
      }
    };
  } catch (error) {
    console.error("Server Action Auth Error:", error);
    return null;
  }
}
