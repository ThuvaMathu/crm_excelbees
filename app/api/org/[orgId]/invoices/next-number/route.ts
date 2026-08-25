import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

/**
 * Reserve the next sequential invoice number for an org. This runs
 * server-side (Admin SDK) instead of a client-side Firestore transaction
 * because the org doc's write rule is admin-only (isOrgAdmin(orgId) in
 * firestore.rules), but any active team member with invoice-create
 * permission needs to be able to advance the counter when they create an
 * invoice — a plain client transaction from a non-admin member would be
 * rejected by the rules.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    const { orgId } = await params;

    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const idToken = authHeader.split("Bearer ")[1];
    const decoded = await adminAuth.verifyIdToken(idToken);

    console.log(`🧾 [InvoiceNumber] Reserving next invoice number for org ${orgId}, requested by ${decoded.uid}`);

    const memberDoc = await adminDb.collection("organization_members").doc(`${orgId}_${decoded.uid}`).get();
    const member = memberDoc.data();
    if (!memberDoc.exists || member?.status !== "active") {
      console.warn(`🧾 [InvoiceNumber] Rejected — ${decoded.uid} is not an active member of org ${orgId}`);
      return NextResponse.json({ error: "You are not an active member of this organization" }, { status: 403 });
    }

    const orgRef = adminDb.collection("organizations").doc(orgId);
    const invoiceNumber = await adminDb.runTransaction(async (transaction) => {
      const orgSnap = await transaction.get(orgRef);
      if (!orgSnap.exists) {
        throw new Error("Organization not found");
      }

      const settings = orgSnap.data()?.invoiceSettings || {};
      const prefix: string = settings.invoicePrefix || "INV-";
      const nextNumber: number = settings.nextInvoiceNumber || 1;
      const formattedNumber = String(nextNumber).padStart(4, "0");
      const generatedInvoiceNumber = `${prefix}${formattedNumber}`;

      transaction.update(orgRef, {
        "invoiceSettings.nextInvoiceNumber": nextNumber + 1,
      });

      return generatedInvoiceNumber;
    });

    console.log(`✅ [InvoiceNumber] Reserved ${invoiceNumber} for org ${orgId}`);
    return NextResponse.json({ success: true, invoiceNumber });
  } catch (error: any) {
    console.error("❌ [InvoiceNumber] Failed to reserve invoice number:", error.message);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
