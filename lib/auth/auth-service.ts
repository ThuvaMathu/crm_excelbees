import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  User,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { auth } from "../firebase";
import { logger } from "@/lib/logger/client";

// Sign in with email and password
export async function signInWithEmail(email: string, password: string) {
  logger.debug("Attempting email sign-in", { module: "auth", action: "sign-in" });
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
    logger.info("Sign-in successful", {
      module: "auth",
      action: "sign-in",
      userId: userCredential.user.uid,
    });
    return { user: userCredential.user, error: null };
  } catch (error) {
    logger.warn("Sign-in failed", { module: "auth", action: "sign-in", error });
    const message = error instanceof Error ? error.message : String(error);
    return { user: null, error: message };
  }
}

// Sign up with email and password
export async function signUpWithEmail(
  email: string,
  password: string,
  displayName: string
) {
  logger.debug("Attempting sign-up", { module: "auth", action: "sign-up" });
  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    logger.info("User created", {
      module: "auth",
      action: "sign-up",
      userId: userCredential.user.uid,
    });

    // Update profile with display name
    if (userCredential.user) {
      logger.debug("Updating profile with display name", {
        module: "auth",
        action: "sign-up",
        userId: userCredential.user.uid,
      });
      await updateProfile(userCredential.user, { displayName });
      logger.info("Profile updated", {
        module: "auth",
        action: "sign-up",
        userId: userCredential.user.uid,
      });
    }

    return { user: userCredential.user, error: null };
  } catch (error) {
    logger.warn("Sign-up failed", { module: "auth", action: "sign-up", error });
    const message = error instanceof Error ? error.message : String(error);
    return { user: null, error: message };
  }
}



// Sign in / sign up with Google
export async function signInWithGoogle() {
  const provider = new GoogleAuthProvider();
  provider.addScope("email");
  provider.addScope("profile");
  try {
    const result = await signInWithPopup(auth, provider);
    // additionalUserInfo.isNewUser is true on first Google sign-in
    const isNewUser: boolean =
      (result as any)._tokenResponse?.isNewUser ?? false;
    logger.info("Google sign-in successful", { module: "auth", action: "sign-in-google", userId: result.user.uid });
    return { user: result.user, isNewUser, error: null };
  } catch (error) {
    const code = (error as { code?: string }).code ?? "unknown";
    if (code === "auth/popup-closed-by-user") {
      return { user: null, isNewUser: false, error: null }; // user dismissed — silent
    }
    // Log the exact Firebase error code — visible in browser console and helps
    // diagnose auth/unauthorized-domain, auth/popup-blocked, auth/cancelled-popup-request etc.
    logger.warn("Google sign-in failed", {
      module: "auth",
      action: "sign-in-google",
      metadata: { errorCode: code },
      error,
    });
    const message = error instanceof Error ? error.message : String(error);
    return { user: null, isNewUser: false, error: message };
  }
}

// Sign out
export async function signOut() {
  logger.debug("Signing out user", { module: "auth", action: "sign-out" });
  try {
    await firebaseSignOut(auth);
    logger.info("Sign-out successful", { module: "auth", action: "sign-out" });
    return { error: null };
  } catch (error) {
    logger.error("Sign-out failed", { module: "auth", action: "sign-out", error });
    const message = error instanceof Error ? error.message : String(error);
    return { error: message };
  }
}

// Send password reset email
export async function sendPasswordReset(email: string) {
  logger.debug("Sending password reset email", { module: "auth", action: "password-reset" });
  try {
    await sendPasswordResetEmail(auth, email);
    logger.info("Password reset email sent", { module: "auth", action: "password-reset" });
    return { error: null };
  } catch (error) {
    logger.warn("Password reset failed", { module: "auth", action: "password-reset", error });
    const message = error instanceof Error ? error.message : String(error);
    return { error: message };
  }
}

// Listen to auth state changes
export function onAuthStateChanged(callback: (user: User | null) => void) {
  logger.debug("Setting up auth state listener", { module: "auth", action: "auth-state-listener" });
  return firebaseOnAuthStateChanged(auth, (user) => {
    if (user) {
      logger.debug("Auth state changed: user logged in", {
        module: "auth",
        action: "auth-state-listener",
        userId: user.uid,
      });
    } else {
      logger.debug("Auth state changed: user logged out", {
        module: "auth",
        action: "auth-state-listener",
      });
    }
    callback(user);
  });
}
