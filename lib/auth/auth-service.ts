import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  User,
  updateProfile,
} from "firebase/auth";
import { auth } from "../firebase";

// Sign in with email and password
export async function signInWithEmail(email: string, password: string) {
  console.log("🔐 Attempting email sign-in for:", email);
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
    console.log("✅ Sign-in successful:", userCredential.user.uid);
    return { user: userCredential.user, error: null };
  } catch (error: any) {
    console.error("❌ Sign-in failed:", error.code, error.message);
    return { user: null, error: error.message };
  }
}

// Sign up with email and password
export async function signUpWithEmail(
  email: string,
  password: string,
  displayName: string
) {
  console.log("📝 Attempting sign-up for:", email);
  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    console.log("✅ User created:", userCredential.user.uid);

    // Update profile with display name
    if (userCredential.user) {
      console.log("📝 Updating profile with display name:", displayName);
      await updateProfile(userCredential.user, { displayName });
      console.log("✅ Profile updated");
    }

    return { user: userCredential.user, error: null };
  } catch (error: any) {
    console.error("❌ Sign-up failed:", error.code, error.message);
    return { user: null, error: error.message };
  }
}



// Sign out
export async function signOut() {
  console.log("🚪 Signing out user");
  try {
    await firebaseSignOut(auth);
    console.log("✅ Sign-out successful");
    return { error: null };
  } catch (error: any) {
    console.error("❌ Sign-out failed:", error.message);
    return { error: error.message };
  }
}

// Send password reset email
export async function sendPasswordReset(email: string) {
  console.log("📧 Sending password reset email to:", email);
  try {
    await sendPasswordResetEmail(auth, email);
    console.log("✅ Password reset email sent");
    return { error: null };
  } catch (error: any) {
    console.error("❌ Password reset failed:", error.code, error.message);
    return { error: error.message };
  }
}

// Listen to auth state changes
export function onAuthStateChanged(callback: (user: User | null) => void) {
  console.log("👂 Setting up auth state listener");
  return firebaseOnAuthStateChanged(auth, (user) => {
    if (user) {
      console.log("👤 Auth state changed: User logged in -", user.uid);
    } else {
      console.log("👤 Auth state changed: User logged out");
    }
    callback(user);
  });
}
