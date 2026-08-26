/**
 * Direct Firestore/Auth admin access for test setup & teardown that can't be
 * driven through the UI (e.g. forcing isFirstLogin=true, deactivating a
 * user, inspecting activity logs). Playwright test files run in Node, so
 * firebase-admin can be used directly — no HTTP round-trip needed.
 *
 * Requires FIREBASE_PROJECT_ID / FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY
 * (loaded from .env.local by playwright.config.ts).
 */
// Static import (not dynamic `import()`) — playwright.config.ts loads
// .env.local/.env.test before any test file runs, so env vars are already
// populated here. A dynamic import() of a file outside the tests/ tree
// bypasses Playwright's transform pipeline and fails at runtime with
// "Cannot use import statement outside a module".
import { getAdminDb, getAdminAuth } from "../../lib/firebase-admin";

function getAdmin() {
  return { db: getAdminDb(), auth: getAdminAuth() };
}

export async function getUserIdByEmail(email: string): Promise<string> {
  const { auth } = await getAdmin();
  const record = await auth.getUserByEmail(email);
  return record.uid;
}

export async function setUserPassword(uid: string, password: string) {
  const { auth } = await getAdmin();
  await auth.updateUser(uid, { password });
}

export async function getOrgIdBySlug(slug: string): Promise<string> {
  const { db } = await getAdmin();
  const snap = await db.collection("organizations").where("slug", "==", slug).limit(1).get();
  if (snap.empty) throw new Error(`No organization found with slug "${slug}"`);
  return snap.docs[0].id;
}

export async function setUserFields(uid: string, fields: Record<string, unknown>) {
  const { db } = await getAdmin();
  await db.collection("users").doc(uid).set(fields, { merge: true });
}

export async function getUserFields(uid: string): Promise<FirebaseFirestore.DocumentData | undefined> {
  const { db } = await getAdmin();
  const snap = await db.collection("users").doc(uid).get();
  return snap.data();
}

export async function setMemberFields(orgId: string, uid: string, fields: Record<string, unknown>) {
  const { db } = await getAdmin();
  // `.update()`, not `.set(fields, {merge:true})`: only `.update()`
  // interprets dotted keys (e.g. "permissions.leads.editAll") as nested
  // field paths. `.set()` with merge treats them as literal top-level field
  // names containing dots — silently writing a bogus sibling field instead
  // of touching the actual nested value, with no error to signal it.
  await db.collection("organization_members").doc(`${orgId}_${uid}`).update(fields);
}

export async function createDoc(collection: string, data: Record<string, unknown>): Promise<string> {
  const { db } = await getAdmin();
  const ref = await db.collection(collection).add(data);
  return ref.id;
}

export async function setDocWithId(collection: string, id: string, data: Record<string, unknown>) {
  const { db } = await getAdmin();
  await db.collection(collection).doc(id).set(data, { merge: true });
}

export async function getDoc(collection: string, id: string): Promise<FirebaseFirestore.DocumentData | undefined> {
  const { db } = await getAdmin();
  const snap = await db.collection(collection).doc(id).get();
  return snap.data();
}

export async function docExists(collection: string, id: string): Promise<boolean> {
  const { db } = await getAdmin();
  const snap = await db.collection(collection).doc(id).get();
  return snap.exists;
}

export async function deleteDoc(collection: string, id: string) {
  const { db } = await getAdmin();
  await db.collection(collection).doc(id).delete();
}

export async function queryActivities(organizationId: string, relatedToId: string) {
  const { db } = await getAdmin();
  const snap = await db
    .collection("activities")
    .where("organizationId", "==", organizationId)
    .where("relatedTo.id", "==", relatedToId)
    .get();
  return snap.docs.map((d) => d.data());
}

export async function queryNotifications(userId: string) {
  const { db } = await getAdmin();
  const snap = await db.collection("notifications").where("userId", "==", userId).get();
  return snap.docs.map((d) => d.data());
}

/**
 * Create a throwaway Firebase Auth user + fully-onboarded (but org-less)
 * profile doc, for cases that need "a user with zero orgs" or "a user in
 * two orgs" — states the 4 shared fixture accounts don't cover. Caller is
 * responsible for calling deleteEphemeralUser() in a `finally` block.
 */
export async function createEphemeralUser(opts: {
  emailPrefix: string;
  password: string;
  displayName: string;
}): Promise<{ uid: string; email: string }> {
  const { auth, db } = await getAdmin();
  const email = `${opts.emailPrefix}.${Date.now()}@playwright.test`;
  const record = await auth.createUser({ email, password: opts.password, displayName: opts.displayName, emailVerified: true });
  await db.collection("users").doc(record.uid).set({
    uid: record.uid,
    email,
    displayName: opts.displayName,
    firstName: opts.displayName.split(" ")[0],
    lastName: opts.displayName.split(" ").slice(1).join(" "),
    role: "team",
    isActive: true,
    isApproved: true,
    isFirstLogin: false,
    isOnboarded: true,
    status: "active",
    createdBy: "e2e-ephemeral",
    provider: "password",
    documents: [],
    settings: { theme: "system", notifications: true, defaultCurrency: "USD" },
  });
  return { uid: record.uid, email };
}

export async function deleteEphemeralUser(uid: string) {
  const { auth, db } = await getAdmin();
  await auth.deleteUser(uid).catch(() => {});
  await db.collection("users").doc(uid).delete().catch(() => {});
  // Clean up any org memberships too, in case the test added one.
  const memberships = await db.collection("organization_members").where("userId", "==", uid).get();
  await Promise.all(memberships.docs.map((d) => d.ref.delete()));
}
