/**
 * Data Migration Script for Authentication System Update
 * 
 * This script migrates existing users to the new authentication system by adding:
 * - isFirstLogin: boolean (default false for existing users)
 * - isActive: boolean (default true for existing users)
 * - createdBy: string (default "system_migration" for existing users)
 * - passwordChangedAt: Timestamp (optional)
 * - updatedAt: Timestamp
 * - provider: string (default "password")
 * 
 * IMPORTANT: Run this script ONCE before deploying the new authentication system
 * 
 * Usage:
 * 1. Ensure Firebase Admin SDK is configured
 * 2. Run: npx ts-node scripts/migrate-users.ts
 * 3. Review the output and confirm all users were migrated
 */

import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

// Initialize Firebase Admin SDK
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
}

const db = getFirestore();

interface MigrationStats {
  total: number;
  migrated: number;
  skipped: number;
  errors: number;
}

/**
 * Migrate existing users to new authentication system
 */
async function migrateUsers(): Promise<MigrationStats> {
  const stats: MigrationStats = {
    total: 0,
    migrated: 0,
    skipped: 0,
    errors: 0,
  };

  try {
    console.log("🚀 Starting user migration...\n");

    // Get all users
    const usersSnapshot = await db.collection("users").get();
    stats.total = usersSnapshot.size;

    console.log(`📊 Found ${stats.total} users to process\n`);

    // Process each user
    for (const doc of usersSnapshot.docs) {
      const userId = doc.id;
      const userData = doc.data();

      console.log(`Processing user: ${userId} (${userData.email})`);

      try {
        const updates: any = {};
        let needsUpdate = false;

        // Add isActive if missing
        if (userData.isActive === undefined) {
          updates.isActive = true;
          needsUpdate = true;
          console.log("  ✓ Adding isActive: true");
        }

        // Add isFirstLogin if missing (false for existing users)
        if (userData.isFirstLogin === undefined) {
          updates.isFirstLogin = false;
          needsUpdate = true;
          console.log("  ✓ Adding isFirstLogin: false");
        }

        // Add createdBy if missing
        if (!userData.createdBy) {
          updates.createdBy = "system_migration";
          needsUpdate = true;
          console.log("  ✓ Adding createdBy: system_migration");
        }

        // Add provider if missing
        if (!userData.provider) {
          updates.provider = "password";
          needsUpdate = true;
          console.log("  ✓ Adding provider: password");
        }

        // Add updatedAt
        if (!userData.updatedAt) {
          updates.updatedAt = FieldValue.serverTimestamp();
          needsUpdate = true;
          console.log("  ✓ Adding updatedAt timestamp");
        }

        // Ensure isApproved is boolean (not undefined)
        if (userData.isApproved === undefined || userData.isApproved === null) {
          // For existing users, default to true if they have a role
          updates.isApproved = userData.role ? true : false;
          needsUpdate = true;
          console.log(`  ✓ Setting isApproved: ${updates.isApproved}`);
        }

        // Apply updates if needed
        if (needsUpdate) {
          await doc.ref.update(updates);
          stats.migrated++;
          console.log(`  ✅ User migrated successfully\n`);
        } else {
          stats.skipped++;
          console.log(`  ⏭️  User already has all fields, skipped\n`);
        }
      } catch (error: any) {
        stats.errors++;
        console.error(`  ❌ Error migrating user ${userId}:`, error.message);
        console.log();
      }
    }

    // Print summary
    console.log("\n" + "=".repeat(60));
    console.log("📊 MIGRATION SUMMARY");
    console.log("=".repeat(60));
    console.log(`Total users:     ${stats.total}`);
    console.log(`Migrated:        ${stats.migrated} ✅`);
    console.log(`Skipped:         ${stats.skipped} ⏭️`);
    console.log(`Errors:          ${stats.errors} ❌`);
    console.log("=".repeat(60) + "\n");

    if (stats.errors === 0) {
      console.log("✅ Migration completed successfully!");
    } else {
      console.log("⚠️  Migration completed with errors. Please review the logs above.");
    }

    return stats;
  } catch (error: any) {
    console.error("❌ Fatal error during migration:", error);
    throw error;
  }
}

/**
 * Verify migration results
 */
async function verifyMigration(): Promise<void> {
  console.log("\n🔍 Verifying migration...\n");

  const usersSnapshot = await db.collection("users").get();
  let allValid = true;

  for (const doc of usersSnapshot.docs) {
    const userData = doc.data();
    const missing: string[] = [];

    if (userData.isActive === undefined) missing.push("isActive");
    if (userData.isFirstLogin === undefined) missing.push("isFirstLogin");
    if (!userData.createdBy) missing.push("createdBy");
    if (!userData.provider) missing.push("provider");

    if (missing.length > 0) {
      console.log(`❌ User ${doc.id} missing fields: ${missing.join(", ")}`);
      allValid = false;
    }
  }

  if (allValid) {
    console.log("✅ All users have required fields!\n");
  } else {
    console.log("\n⚠️  Some users are missing required fields. Please run migration again.\n");
  }
}

// Run migration
if (require.main === module) {
  migrateUsers()
    .then(() => verifyMigration())
    .then(() => {
      console.log("🎉 Migration process complete!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Migration failed:", error);
      process.exit(1);
    });
}

export { migrateUsers, verifyMigration };
