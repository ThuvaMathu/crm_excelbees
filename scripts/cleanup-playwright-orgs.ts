/**
 * Removes duplicate "Playwright Test Org" organizations (and their orphaned
 * memberships) that were accidentally created by early buggy runs of the
 * org-picker "duplicate slug" test before it correctly blocked creation.
 * Keeps only the canonical org (slug === "playwright-test-org").
 *
 * Usage: npx tsx scripts/cleanup-playwright-orgs.ts
 */
import * as dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config({ path: path.resolve(process.cwd(), ".env.test") });

async function main() {
  const { getAdminDb } = await import("../lib/firebase-admin");
  const db = getAdminDb();

  const orgsSnap = await db.collection("organizations").where("name", "==", "Playwright Test Org").get();
  console.log(`Found ${orgsSnap.size} orgs named "Playwright Test Org"`);

  for (const doc of orgsSnap.docs) {
    const data = doc.data();
    if (data.slug === "playwright-test-org") {
      console.log(`✔ Keeping canonical org ${doc.id} (slug: ${data.slug})`);
      continue;
    }
    console.log(`✗ Deleting duplicate org ${doc.id} (slug: ${data.slug})`);
    const membersSnap = await db.collection("organization_members").where("organizationId", "==", doc.id).get();
    for (const m of membersSnap.docs) {
      await m.ref.delete();
    }
    await doc.ref.delete();
  }

  console.log("Done.");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Cleanup script failed:", err);
    process.exit(1);
  });
