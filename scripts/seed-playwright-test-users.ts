/**
 * One-off seed script for Playwright E2E test fixtures.
 * Creates (or resets) the 4 test auth users defined in .env.test, a
 * "Playwright Test Org", and org memberships so tests/fixtures/auth.ts can
 * log each of them straight into the dashboard (no onboarding/change-password
 * detours, no approval gate).
 *
 * Usage: npx tsx scripts/seed-playwright-test-users.ts
 */
import * as dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config({ path: path.resolve(process.cwd(), ".env.test") });

import { FieldValue } from "firebase-admin/firestore";
import { ROLE_DEFAULTS } from "../types/crm";
// Imported dynamically (after dotenv has populated process.env) because static
// `import` is hoisted above top-level statements, and firebase-admin.ts reads
// env vars at module-eval time.

type Role = "admin" | "manager" | "team";

const ORG_NAME = process.env.TEST_ORG_NAME || "Playwright Test Org";
const ORG_SLUG = "playwright-test-org";

const USERS: { key: string; email: string; password: string; role: Role; displayName: string }[] = [
  { key: "admin", email: process.env.TEST_ADMIN_EMAIL!, password: process.env.TEST_ADMIN_PASSWORD!, role: "admin", displayName: "Test Admin" },
  { key: "manager", email: process.env.TEST_MANAGER_EMAIL!, password: process.env.TEST_MANAGER_PASSWORD!, role: "manager", displayName: "Test Manager" },
  { key: "team", email: process.env.TEST_TEAM_EMAIL!, password: process.env.TEST_TEAM_PASSWORD!, role: "team", displayName: "Test Team" },
  { key: "scanner", email: process.env.TEST_SCANNER_EMAIL!, password: process.env.TEST_SCANNER_PASSWORD!, role: "team", displayName: "Test Scanner" },
];

async function main() {
  // lib/firebase-admin.ts eagerly initializes the app and calls
  // db.settings({ ignoreUndefinedProperties: true }) as a side effect of
  // import — reuse that instance instead of calling settings() again.
  const { getAdminDb, getAdminAuth } = await import("../lib/firebase-admin");
  const auth = getAdminAuth();
  const db = getAdminDb();

  for (const u of USERS) {
    if (!u.email || !u.password) {
      throw new Error(`Missing email/password for ${u.key} — check .env.test`);
    }
  }

  // 1. Org: reuse if it already exists (idempotent re-runs), else create.
  const orgQuery = await db.collection("organizations").where("slug", "==", ORG_SLUG).limit(1).get();
  let orgId: string;
  if (!orgQuery.empty) {
    orgId = orgQuery.docs[0].id;
    console.log(`✔ Reusing existing org ${ORG_NAME} (${orgId})`);
  } else {
    const orgRef = await db.collection("organizations").add({
      name: ORG_NAME,
      slug: ORG_SLUG,
      ownerId: "seed-script",
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    orgId = orgRef.id;
    console.log(`✔ Created org ${ORG_NAME} (${orgId})`);
  }

  for (const u of USERS) {
    // 2. Auth user: create or update password/claims if it already exists.
    let uid: string;
    try {
      const existing = await auth.getUserByEmail(u.email);
      uid = existing.uid;
      await auth.updateUser(uid, { password: u.password, displayName: u.displayName, emailVerified: true, disabled: false });
      console.log(`✔ Updated existing auth user ${u.email} (${uid})`);
    } catch {
      const created = await auth.createUser({ email: u.email, password: u.password, displayName: u.displayName, emailVerified: true });
      uid = created.uid;
      console.log(`✔ Created auth user ${u.email} (${uid})`);
    }
    await auth.setCustomUserClaims(uid, { role: u.role });

    // 3. Firestore user profile: fully onboarded, approved, no forced
    //    password-change — so the login fixture lands straight on /org.
    await db.collection("users").doc(uid).set(
      {
        uid,
        email: u.email,
        displayName: u.displayName,
        firstName: u.displayName.split(" ")[0],
        lastName: u.displayName.split(" ").slice(1).join(" "),
        phone: "",
        position: "",
        role: u.role,
        isActive: true,
        isApproved: true,
        isFirstLogin: false,
        isOnboarded: true,
        status: "active",
        createdBy: "seed-script",
        updatedAt: FieldValue.serverTimestamp(),
        lastLoginAt: FieldValue.serverTimestamp(),
        provider: "password",
        documents: [],
        permissions: ROLE_DEFAULTS[u.role],
        settings: { theme: "system", notifications: true, defaultCurrency: "USD" },
      },
      { merge: true }
    );

    // 4. Org membership.
    await db.collection("organization_members").doc(`${orgId}_${uid}`).set(
      {
        organizationId: orgId,
        userId: uid,
        role: u.role,
        permissions: ROLE_DEFAULTS[u.role],
        status: "active",
        displayName: u.displayName,
        email: u.email,
        updatedAt: FieldValue.serverTimestamp(),
        joinedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
    console.log(`✔ Ensured org membership for ${u.email} as ${u.role}`);
  }

  await seedSampleRecords(db, orgId);

  console.log("\nDone. Test org ID:", orgId);
}

// Baseline records so list/detail/pagination/filter test cases have real
// data to exercise instead of every spec having to create its own fixtures.
// Idempotent: tagged with seedTag so re-runs don't duplicate.
async function seedSampleRecords(db: FirebaseFirestore.Firestore, orgId: string) {
  const SEED_TAG = "playwright-seed";
  const adminUser = USERS.find((u) => u.key === "admin")!;
  const { getAdminAuth } = await import("../lib/firebase-admin");
  const ownerId = (await getAdminAuth().getUserByEmail(adminUser.email)).uid;

  const existing = await db.collection("leads").where("organizationId", "==", orgId).where("seedTag", "==", SEED_TAG).limit(1).get();
  if (!existing.empty) {
    console.log("✔ Sample records already seeded, skipping");
    return;
  }

  const now = FieldValue.serverTimestamp();
  const base = { organizationId: orgId, ownerId, seedTag: SEED_TAG, createdAt: now, updatedAt: now };

  // 12 leads (>10, for pagination) with varied status/source
  const statuses = ["New", "Contacted", "Follow Up", "Qualified", "Lost"];
  const sources = ["Website", "Referral", "Ads", "Cold Call", "Other"];
  for (let i = 1; i <= 12; i++) {
    await db.collection("leads").add({
      ...base,
      firstName: "Seed",
      lastName: `Lead${i}`,
      email: `seed.lead${i}@playwright.test`,
      companyName: "Seed Co",
      status: statuses[i % statuses.length],
      source: sources[i % sources.length],
      value: i % 3 === 0 ? 0 : i * 1000,
      tags: [],
    });
  }

  const companyRef = await db.collection("companies").add({
    ...base,
    name: "Seed Co",
    domain: "seedco.test",
    industry: "Technology",
    size: "11-50",
    annualRevenue: 500000,
  });

  const contactRef = await db.collection("contacts").add({
    ...base,
    firstName: "Seed",
    lastName: "Contact",
    email: "seed.contact@playwright.test",
    companyName: "Seed Co",
    companyId: companyRef.id,
  });

  await db.collection("deals").add({
    ...base,
    title: "Seed Won Deal",
    value: 5000,
    stage: "Won",
    probability: 100,
    companyName: "Seed Co",
    contactIds: [contactRef.id],
  });
  await db.collection("deals").add({
    ...base,
    title: "Seed Pipeline Deal",
    value: 3000,
    stage: "Pipeline",
    probability: 50,
    companyName: "Seed Co",
    contactIds: [],
  });

  const projectRef = await db.collection("projects").add({
    ...base,
    name: "Seed Project",
    description: "Seeded project for E2E tests",
    scope: "E2E test fixture",
    status: "Active",
    priority: "Medium",
    budget: 10000,
    lifecycle: "active",
    companyName: "Seed Co",
    phases: [{ id: "phase-1", name: "Phase 1", progress: 50, order: 0 }],
    tags: [],
    teamMembers: [ownerId],
    progress: 50,
  });

  await db.collection("tasks").add({
    ...base,
    title: "Seed Done Task",
    status: "Done",
    priority: "Medium",
    type: "To Do",
    projectId: projectRef.id,
    assigneeId: ownerId,
    completedAt: now,
    // getTasks() always filters `where("isArchived", "==", false)` for the
    // default (non-archived) view — Firestore equality queries never match
    // a document where the field is simply absent, so omitting this made
    // every seeded task invisible on the tasks board no matter what else
    // matched. (Found via tests/e2e/tasks/tasks.spec.ts 11.6/11.12/11.13/
    // 11.15 all timing out looking for "Seed Todo Task".)
    isArchived: false,
  });
  await db.collection("tasks").add({
    ...base,
    title: "Seed Todo Task",
    status: "To Do",
    priority: "High",
    type: "Call",
    assigneeId: ownerId,
    isArchived: false,
  });

  await db.collection("invoices").add({
    ...base,
    invoiceNumber: "INV-SEED-0001",
    status: "Draft",
    template: "standard",
    companyName: "Seed Co",
    contactName: "Seed Contact",
    clientEmail: "seed.client@playwright.test",
    issueDate: now,
    dueDate: now,
    paymentTerms: "Net 30",
    currency: "USD",
    lineItems: [{ id: "item-1", description: "Seed item", quantity: 1, price: 1000, taxRate: 0, total: 1000 }],
    subtotal: 1000,
    taxAmount: 0,
    taxRate: 0,
    discount: 0,
    total: 1000,
  });

  console.log("✔ Seeded sample leads/company/contact/deals/project/tasks/invoice");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Seed script failed:", err);
    process.exit(1);
  });
