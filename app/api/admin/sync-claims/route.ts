import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

/**
 * POST /api/admin/sync-claims
 *
 * One-time migration utility: reads every user's role from Firestore and
 * writes it as a Firebase Custom Claim so AuthProvider can verify roles
 * server-side without being vulnerable to Firestore document tampering.
 *
 * Security: caller must supply the ADMIN_SYNC_SECRET env variable.
 */
export async function POST(request: NextRequest) {
    try {
        // Simple secret-key guard — only run from a trusted admin context.
        const body = await request.json();
        const { secret } = body as { secret?: string };

        if (!secret || secret !== process.env.ADMIN_SYNC_SECRET) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const usersSnapshot = await adminDb.collection("users").get();

        const results: { uid: string; role: string; status: string }[] = [];

        for (const docSnap of usersSnapshot.docs) {
            const data = docSnap.data();
            const uid = docSnap.id;
            const role = data.role as string | undefined;

            if (!role) {
                results.push({ uid, role: "missing", status: "skipped" });
                continue;
            }

            try {
                await adminAuth.setCustomUserClaims(uid, { role });
                results.push({ uid, role, status: "synced" });
                console.log(`✅ Custom claim set: ${uid} -> ${role}`);
            } catch (claimError: any) {
                results.push({ uid, role, status: `error: ${claimError.message}` });
                console.error(`❌ Failed for UID ${uid}:`, claimError.message);
            }
        }

        const synced = results.filter((r) => r.status === "synced").length;
        const failed = results.filter((r) => r.status.startsWith("error")).length;

        return NextResponse.json({
            success: true,
            message: `Sync complete. ${synced} synced, ${failed} failed.`,
            results,
        });
    } catch (error: any) {
        console.error("Sync-claims error:", error);
        return NextResponse.json(
            { error: "Internal server error", details: error.message },
            { status: 500 }
        );
    }
}
