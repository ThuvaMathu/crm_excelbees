import { cookies, headers } from "next/headers";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { logger, getRequestId } from "@/lib/logger";
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
  const log = logger.child({ requestId: (await getRequestId()) ?? undefined });

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

    const decodedToken = await adminAuth.verifyIdToken(token);
    
    // Fetch user permissions/role to ensure we have fresh data, fallback if adminDb errors out
    let userData: Record<string, any> | undefined;
    try {
      const userDoc = await adminDb.collection("users").doc(decodedToken.uid).get();
      userData = userDoc.data();
    } catch (dbError) {
      log.warn("Could not fetch user doc from adminDb, falling back to token data", {
        module: "auth",
        action: "server-auth",
        userId: decodedToken.uid,
        error: dbError,
      });
    }

    return {
      user: {
        uid: decodedToken.uid,
        email: decodedToken.email,
        displayName: userData?.displayName || (decodedToken.name as string) || "",
        role: (userData?.role as UserRole) || (decodedToken.role as UserRole) || "team",
      }
    };
  } catch (error) {
    log.error("Server action auth failed", { module: "auth", action: "server-auth", error });
    return null;
  }
}
