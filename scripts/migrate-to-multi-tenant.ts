/**
 * Multi-Tenant Data Migration Script
 *
 * Migrates existing single-tenant Firestore data to the multi-tenant
 * organization model.
 *
 * What it does:
 *  1. Creates a "Default Organization" document in /organizations
 *  2. Reads all users from /users and creates /organization_members entries
 *  3. Batch-patches all CRM documents (leads, contacts, companies, deals,
 *     projects, tasks, invoices, activities, emails, emailTemplates,
 *     notifications, audit_logs) with `organizationId`
 *
 * Usage:
 *   DRY RUN (default):    npx ts-node scripts/migrate-to-multi-tenant.ts
 *   EXECUTE (live write): npx ts-node scripts/migrate-to-multi-tenant.ts --execute
 *
 * Prerequisites:
 *   - GOOGLE_APPLICATION_CREDENTIALS env var pointing to a service account key
 *   - OR firebase-admin initialized with ADC
 */

import * as admin from "firebase-admin";

const EXECUTE = process.argv.includes("--execute");
const DRY_RUN = !EXECUTE;

// ─── Collections to patch with organizationId ───────────────────────────────
const CRM_COLLECTIONS = [
  "leads",
  "contacts",
  "companies",
  "deals",
  "projects",
  "tasks",
  "invoices",
  "activities",
  "emails",
  "emailTemplates",
  "notifications",
  "audit_logs",
  "notes",
  "quotes",
];

// ─── Firestore batch size limit ──────────────────────────────────────────────
const BATCH_LIMIT = 450; // Firestore max is 500; keep under for safety

async function run() {
  // Initialize Firebase Admin
  if (!admin.apps.length) {
    admin.initializeApp();
  }

  const db = admin.firestore();

  console.log(`\n🚀 Multi-Tenant Migration — ${DRY_RUN ? "DRY RUN" : "LIVE EXECUTE"}\n`);

  // ─── Step 1: Create the Default Organization ──────────────────────────────
  const DEFAULT_ORG_SLUG = "default";
  const DEFAULT_ORG_NAME = "Default Organization";

  let defaultOrgId: string;

  // Check if default org already exists
  const existingOrgSnap = await db
    .collection("organizations")
    .where("slug", "==", DEFAULT_ORG_SLUG)
    .limit(1)
    .get();

  if (!existingOrgSnap.empty) {
    defaultOrgId = existingOrgSnap.docs[0].id;
    console.log(`✅ Default org already exists: ${defaultOrgId}`);
  } else {
    defaultOrgId = db.collection("organizations").doc().id;
    console.log(`📝 Will create default org with ID: ${defaultOrgId}`);

    if (EXECUTE) {
      await db.collection("organizations").doc(defaultOrgId).set({
        name: DEFAULT_ORG_NAME,
        slug: DEFAULT_ORG_SLUG,
        ownerId: "system_migration",
        createdAt: admin.firestore.Timestamp.now(),
        updatedAt: admin.firestore.Timestamp.now(),
      });
      console.log(`✅ Default org created: ${defaultOrgId}`);
    }
  }

  // ─── Step 2: Migrate users → organization_members ─────────────────────────
  const usersSnap = await db.collection("users").get();
  console.log(`\n👥 Found ${usersSnap.size} users to migrate`);

  let memberBatch = db.batch();
  let memberBatchCount = 0;
  let memberTotal = 0;

  for (const userDoc of usersSnap.docs) {
    const userData = userDoc.data();
    const userId = userDoc.id;
    const memberId = `${defaultOrgId}_${userId}`;

    const memberRef = db.collection("organization_members").doc(memberId);
    const existingMember = await memberRef.get();

    if (existingMember.exists) {
      console.log(`  ⏭️  Member already exists: ${userId}`);
      continue;
    }

    const memberData = {
      organizationId: defaultOrgId,
      userId,
      displayName: userData.displayName || userData.email || userId,
      email: userData.email || "",
      photoURL: userData.photoURL || "",
      role: userData.role || "team",
      status: "active",
      joinedAt: admin.firestore.Timestamp.now(),
      updatedAt: admin.firestore.Timestamp.now(),
    };

    console.log(`  📝 [Member] ${userId} → role: ${memberData.role}`);

    if (EXECUTE) {
      memberBatch.set(memberRef, memberData);
      memberBatchCount++;
      memberTotal++;

      if (memberBatchCount >= BATCH_LIMIT) {
        await memberBatch.commit();
        console.log(`  ✅ Committed batch of ${memberBatchCount} members`);
        memberBatch = db.batch();
        memberBatchCount = 0;
      }
    }
  }

  if (EXECUTE && memberBatchCount > 0) {
    await memberBatch.commit();
    console.log(`  ✅ Committed final batch of ${memberBatchCount} members`);
  }

  console.log(`\n✅ Members: ${EXECUTE ? memberTotal : usersSnap.size} ${DRY_RUN ? "(dry run)" : "migrated"}`);

  // ─── Step 3: Patch CRM collections with organizationId ────────────────────
  console.log(`\n📦 Patching CRM collections with organizationId: ${defaultOrgId}`);

  for (const collectionName of CRM_COLLECTIONS) {
    const snap = await db.collection(collectionName).get();

    if (snap.empty) {
      console.log(`  ⏭️  ${collectionName}: empty, skipping`);
      continue;
    }

    // Count docs that already have organizationId
    const alreadyMigrated = snap.docs.filter((d) => d.data().organizationId).length;
    const toMigrate = snap.size - alreadyMigrated;

    console.log(`  📁 ${collectionName}: ${snap.size} total, ${alreadyMigrated} already migrated, ${toMigrate} to patch`);

    if (toMigrate === 0) continue;

    let batch = db.batch();
    let count = 0;
    let total = 0;

    for (const docSnap of snap.docs) {
      if (docSnap.data().organizationId) continue; // Already has orgId

      const ref = db.collection(collectionName).doc(docSnap.id);

      if (EXECUTE) {
        batch.update(ref, {
          organizationId: defaultOrgId,
        });
        count++;
        total++;

        if (count >= BATCH_LIMIT) {
          await batch.commit();
          console.log(`    ✅ Committed batch of ${count} ${collectionName} docs`);
          batch = db.batch();
          count = 0;
        }
      }
    }

    if (EXECUTE && count > 0) {
      await batch.commit();
      console.log(`    ✅ Committed final batch of ${count} ${collectionName} docs`);
    }

    console.log(`  ✅ ${collectionName}: ${EXECUTE ? total : toMigrate} ${DRY_RUN ? "would be patched" : "patched"}`);
  }

  // ─── Summary ──────────────────────────────────────────────────────────────
  console.log(`\n${"─".repeat(60)}`);
  console.log(`Migration ${DRY_RUN ? "DRY RUN complete" : "COMPLETE"} ✅`);
  if (DRY_RUN) {
    console.log(`\nTo apply changes, run with --execute flag:`);
    console.log(`  npx ts-node scripts/migrate-to-multi-tenant.ts --execute\n`);
  }
}

run().catch((err) => {
  console.error("❌ Migration failed:", err);
  process.exit(1);
});
