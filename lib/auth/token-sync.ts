import { getAuth, onIdTokenChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";

let syncing = false;

/**
 * Keeps the Firebase ID token in a cookie that server actions (via
 * server-auth.ts) can read. Called once from AuthProvider on mount.
 *
 * Without this, server actions that call `auth()` to verify the caller
 * will always see no session and reject the request with
 * "Authentication required."
 */
export function syncTokenToCookie(): void {
  if (syncing) return;
  syncing = true;

  const firebaseAuth = getAuth();

  onIdTokenChanged(firebaseAuth, async (user) => {
    if (user) {
      const token = await user.getIdToken();
      document.cookie = `session=${token}; path=/; max-age=3600; SameSite=Lax`;
    } else {
      document.cookie = "session=; path=/; max-age=0; SameSite=Lax";
    }
  });
}