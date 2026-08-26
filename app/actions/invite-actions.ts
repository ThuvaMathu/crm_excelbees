"use server";

import crypto from "crypto";
import { adminDb, adminAuth } from "@/lib/firebase-admin";
import { logger } from "@/lib/logger";
import { ROLE_DEFAULTS } from "@/types/crm";
import type { UserRole } from "@/types/crm";

const INVITES = "org_invites";
const TTL_DAYS = 7;

// ── Helpers ──────────────────────────────────────────────────────────────────

function generateToken(): string {
    return crypto.randomBytes(24).toString("hex"); // 48-char hex, cryptographically secure
}

async function resolveOrgName(orgId: string): Promise<string> {
    const snap = await adminDb.collection("organizations").doc(orgId).get();
    return snap.exists ? (snap.data()?.name ?? "Unknown Organization") : "Unknown Organization";
}

async function verifyCallerIsOrgAdmin(callerToken: string, orgId: string) {
    const decoded = await adminAuth.verifyIdToken(callerToken, true);
    const memberId  = `${orgId}_${decoded.uid}`;
    const memberDoc = await adminDb.collection("organization_members").doc(memberId).get();
    if (!memberDoc.exists || memberDoc.data()?.status !== "active") {
        throw new Error("You are not an active member of this organization");
    }
    const memberRole = memberDoc.data()?.role;
    if (memberRole !== "admin" && memberRole !== "manager") {
        throw new Error("Admin or manager access required");
    }
    return decoded.uid;
}

// ── Create invite link ────────────────────────────────────────────────────────

export async function createInviteAction(data: {
    callerToken: string;
    organizationId: string;
    role: "team" | "manager";
}): Promise<{ success: boolean; token?: string; expiresAt?: string; error?: string }> {
    try {
        const callerUid = await verifyCallerIsOrgAdmin(data.callerToken, data.organizationId);
        const orgName   = await resolveOrgName(data.organizationId);
        const token     = generateToken();
        const expiresAt = new Date(Date.now() + TTL_DAYS * 24 * 60 * 60 * 1000);

        await adminDb.collection(INVITES).doc(token).set({
            id:               token,
            organizationId:   data.organizationId,
            organizationName: orgName,
            createdBy:        callerUid,
            role:             data.role,
            status:           "active",
            createdAt:        new Date(),
            expiresAt,
        });

        return { success: true, token, expiresAt: expiresAt.toISOString() };
    } catch (e) {
        logger.error("createInviteAction failed", {
            module: "invites",
            action: "create",
            error: e,
        });
        return { success: false, error: e instanceof Error ? e.message : "Failed to generate invite link" };
    }
}

// ── Verify invite (public — called from the invite acceptance page) ───────────

export async function verifyInviteAction(token: string): Promise<{
    valid: boolean;
    organizationId?: string;
    organizationName?: string;
    role?: string;
    expiresAt?: string;
    error?: string;
}> {
    try {
        const snap = await adminDb.collection(INVITES).doc(token).get();
        if (!snap.exists) return { valid: false, error: "Invite link not found." };

        const d = snap.data()!;

        if (d.status === "used")     return { valid: false, error: "This invite link has already been used." };
        if (d.status === "expired")  return { valid: false, error: "This invite link has expired." };

        const expiresAt: Date = d.expiresAt instanceof Date ? d.expiresAt : d.expiresAt.toDate();
        if (expiresAt < new Date()) {
            await adminDb.collection(INVITES).doc(token).update({ status: "expired" });
            return { valid: false, error: "This invite link has expired." };
        }

        return {
            valid:            true,
            organizationId:   d.organizationId,
            organizationName: d.organizationName,
            role:             d.role,
            expiresAt:        expiresAt.toISOString(),
        };
    } catch (e) {
        logger.error("verifyInviteAction failed", {
            module: "invites",
            action: "verify",
            error: e,
        });
        return { valid: false, error: "Failed to verify invite link." };
    }
}

// ── Accept invite (called after the user is authenticated) ───────────────────

export async function acceptInviteAction(data: {
    token:     string;
    userToken: string; // Firebase ID token of the accepting user
}): Promise<{ success: boolean; orgId?: string; error?: string }> {
    try {
        const decoded = await adminAuth.verifyIdToken(data.userToken, true);
        const userId  = decoded.uid;

        const inviteRef  = adminDb.collection(INVITES).doc(data.token);
        const inviteSnap = await inviteRef.get();
        if (!inviteSnap.exists) return { success: false, error: "Invite not found." };

        const inv = inviteSnap.data()!;
        if (inv.status !== "active") {
            return {
                success: false,
                error:   inv.status === "used" ? "Invite already used." : "Invite has expired.",
            };
        }

        const expiresAt: Date = inv.expiresAt instanceof Date ? inv.expiresAt : inv.expiresAt.toDate();
        if (expiresAt < new Date()) {
            await inviteRef.update({ status: "expired" });
            return { success: false, error: "Invite has expired." };
        }

        const orgId = inv.organizationId;
        const role  = inv.role as UserRole;

        // Check for duplicate membership
        const memberId       = `${orgId}_${userId}`;
        const existingMember = await adminDb.collection("organization_members").doc(memberId).get();
        if (existingMember.exists && existingMember.data()?.status === "active") {
            return { success: false, error: "You are already a member of this organization.", orgId };
        }

        // Fetch user profile for member metadata
        const userSnap = await adminDb.collection("users").doc(userId).get();
        const u        = userSnap.data() ?? {};

        // Write org member record
        await adminDb.collection("organization_members").doc(memberId).set({
            organizationId: orgId,
            userId,
            role,
            permissions: ROLE_DEFAULTS[role],
            status:      "active",
            joinedAt:    new Date(),
            updatedAt:   new Date(),
            ...(u.displayName && { displayName: u.displayName }),
            ...(u.email       && { email:       u.email }),
            ...(u.photoURL    && { photoURL:    u.photoURL }),
        });

        // Mark invite as used
        await inviteRef.update({ status: "used", usedAt: new Date(), usedBy: userId });

        return { success: true, orgId };
    } catch (e) {
        logger.error("acceptInviteAction failed", {
            module: "invites",
            action: "accept",
            error: e,
        });
        return { success: false, error: e instanceof Error ? e.message : "Failed to accept invite." };
    }
}

// ── Revoke invite (admin) ─────────────────────────────────────────────────────

export async function revokeInviteAction(data: {
    callerToken:    string;
    organizationId: string;
    token:          string;
}): Promise<{ success: boolean; error?: string }> {
    try {
        await verifyCallerIsOrgAdmin(data.callerToken, data.organizationId);
        await adminDb.collection(INVITES).doc(data.token).update({ status: "expired" });
        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}
