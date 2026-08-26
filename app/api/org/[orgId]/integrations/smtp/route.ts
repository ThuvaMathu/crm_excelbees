import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { encrypt, decrypt } from "@/lib/crypto";
import { clearTransporterCache } from "@/lib/email/email-service";
import { logger } from "@/lib/logger";

// Verifies the caller is an active admin of orgId. The client-side
// RBACGuard on the settings page is cosmetic only — without this check,
// any authenticated user (from any org) could GET or POST another org's
// SMTP credentials just by knowing its orgId.
async function requireOrgAdmin(request: NextRequest, orgId: string): Promise<{ uid: string } | NextResponse> {
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const idToken = authHeader.split("Bearer ")[1];
  const decoded = await adminAuth.verifyIdToken(idToken);

  const memberDoc = await adminDb.collection("organization_members").doc(`${orgId}_${decoded.uid}`).get();
  const member = memberDoc.data();
  if (!memberDoc.exists || member?.status !== "active" || member?.role !== "admin") {
    return NextResponse.json({ error: "Only an org admin can manage SMTP settings" }, { status: 403 });
  }

  return { uid: decoded.uid };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    const { orgId } = await params;
    const authResult = await requireOrgAdmin(request, orgId);
    if (authResult instanceof NextResponse) return authResult;

    const orgDoc = await adminDb.collection("organizations").doc(orgId).get();

    if (!orgDoc.exists) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    const data = orgDoc.data();
    const smtpConfig = data?.smtpConfig ? { ...data.smtpConfig } : null;

    // Reveal the real password only on an explicit ?reveal=true request
    // (the eye-icon click) — the default response always masks it so the
    // plaintext credential is never sent on a routine page load.
    const reveal = request.nextUrl.searchParams.get("reveal") === "true";
    if (smtpConfig && smtpConfig.pass) {
      smtpConfig.pass = reveal ? decrypt(smtpConfig.pass) : "********";
    }

    return NextResponse.json({ success: true, smtpConfig });
  } catch (error: any) {
    logger.error("Failed to read SMTP config", { module: "email", action: "get-smtp", error });
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    const { orgId } = await params;
    const authResult = await requireOrgAdmin(request, orgId);
    if (authResult instanceof NextResponse) return authResult;

    const body = await request.json();

    const { provider, host, port, secure, user, pass } = body;

    if (!provider || !host || !port || secure === undefined || !user) {
      return NextResponse.json({ error: "Missing required fields: host, port, and email address are required." }, { status: 400 });
    }

    const orgDocRef = adminDb.collection("organizations").doc(orgId);
    const orgDoc = await orgDocRef.get();

    if (!orgDoc.exists) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    const updateData: any = {
      "smtpConfig.provider": provider,
      "smtpConfig.host": host,
      "smtpConfig.port": Number(port),
      "smtpConfig.secure": secure,
      "smtpConfig.user": user,
    };

    if (pass && pass !== "********") {
      updateData["smtpConfig.pass"] = encrypt(pass);
    }

    await orgDocRef.update(updateData);

    // Without this, email-service.ts's in-memory transporter cache keeps
    // using whatever credentials were cached from the FIRST send this org
    // ever made, for the rest of the server process's lifetime — this save
    // would silently have no effect until a server restart.
    clearTransporterCache(orgId);

    return NextResponse.json({ success: true, message: "SMTP configuration saved" });
  } catch (error: any) {
    logger.error("Failed to save SMTP config", { module: "email", action: "save-smtp", error });
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
