import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  Timestamp,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";
import { auth } from "../firebase";
import type { Organization, OrganizationMember, UserRole, UserPermissions, InvoiceOrgSettings } from "@/types/crm";
import { ROLE_DEFAULTS } from "@/types/crm";
import { logger } from "@/lib/logger/client";

const ORG_COLLECTION = "organizations";
const MEMBERS_COLLECTION = "organization_members";

// Helper: compose a deterministic member doc ID
function memberDocId(organizationId: string, userId: string) {
  return `${organizationId}_${userId}`;
}

// ============================================================
// ORGANIZATION CRUD
// ============================================================

export async function createOrganization(
  data: { name: string; slug: string },
  ownerId: string
): Promise<{ success: boolean; org: Organization | null; error: string | null }> {
  try {
    // Check slug uniqueness
    const slugQuery = query(
      collection(db, ORG_COLLECTION),
      where("slug", "==", data.slug)
    );
    const existing = await getDocs(slugQuery);
    if (!existing.empty) {
      return { success: false, org: null, error: "An organization with that slug already exists." };
    }

    const now = Timestamp.now();
    const orgData: Omit<Organization, "id"> = {
      name: data.name,
      slug: data.slug,
      ownerId,
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await addDoc(collection(db, ORG_COLLECTION), orgData);
    const org: Organization = { id: docRef.id, ...orgData };

    // Auto-add creator as admin member
    const currentUser = auth.currentUser;
    const memberResult = await addOrganizationMember(docRef.id, ownerId, "admin", {
      displayName: currentUser?.displayName || undefined,
      email: currentUser?.email || undefined,
      photoURL: currentUser?.photoURL || undefined,
    });

    if (!memberResult.success) {
      // Org was created but membership failed — clean up the orphaned org doc
      await deleteDoc(doc(db, ORG_COLLECTION, docRef.id)).catch(() => {});
      return { success: false, org: null, error: `Failed to set up membership: ${memberResult.error}` };
    }

    return { success: true, org, error: null };
  } catch (error: any) {
    logger.error("Failed to create organization", { module: "organizations", action: "create", error });
    return { success: false, org: null, error: error.message };
  }
}

export async function getOrganization(
  orgId: string
): Promise<{ org: Organization | null; error: string | null }> {
  try {
    const docSnap = await getDoc(doc(db, ORG_COLLECTION, orgId));
    if (!docSnap.exists()) {
      return { org: null, error: "Organization not found" };
    }
    return { org: { id: docSnap.id, ...docSnap.data() } as Organization, error: null };
  } catch (error: any) {
    return { org: null, error: error.message };
  }
}

export async function getOrganizationBySlug(
  slug: string
): Promise<{ org: Organization | null; error: string | null }> {
  try {
    const q = query(collection(db, ORG_COLLECTION), where("slug", "==", slug));
    const snap = await getDocs(q);
    if (snap.empty) {
      return { org: null, error: "Organization not found" };
    }
    const docSnap = snap.docs[0];
    return { org: { id: docSnap.id, ...docSnap.data() } as Organization, error: null };
  } catch (error: any) {
    return { org: null, error: error.message };
  }
}

export async function updateOrganization(
  orgId: string,
  data: Partial<Pick<Organization, "name" | "logoUrl" | "website" | "industry" | "size">>
): Promise<{ success: boolean; error: string | null }> {
  try {
    await updateDoc(doc(db, ORG_COLLECTION, orgId), {
      ...data,
      updatedAt: serverTimestamp(),
    });
    return { success: true, error: null };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Admin-only (enforced by firestore.rules: organizations update requires
// isOrgAdmin(orgId), same rule updateOrganization() above relies on).
// Dot-path partial update so we never clobber sibling invoiceSettings
// fields — same reasoning as the SMTP route's "smtpConfig.xxx" updates.
export async function updateInvoiceSettings(
  orgId: string,
  settings: Partial<InvoiceOrgSettings>
): Promise<{ success: boolean; error: string | null }> {
  try {
    logger.info("Updating org invoice settings", { module: "invoices", action: "update-settings", metadata: { orgId, fields: Object.keys(settings) } });
    const updateData: Record<string, unknown> = { updatedAt: serverTimestamp() };
    Object.entries(settings).forEach(([key, value]) => {
      if (value !== undefined) updateData[`invoiceSettings.${key}`] = value;
    });
    await updateDoc(doc(db, ORG_COLLECTION, orgId), updateData);
    return { success: true, error: null };
  } catch (error: any) {
    logger.error("Failed to update org invoice settings", { module: "invoices", action: "update-settings", metadata: { orgId }, error });
    return { success: false, error: error.message };
  }
}

// ============================================================
// MEMBER MANAGEMENT
// ============================================================

export async function addOrganizationMember(
  organizationId: string,
  userId: string,
  role: UserRole,
  userMeta?: { displayName?: string; email?: string; photoURL?: string }
): Promise<{ success: boolean; error: string | null }> {
  try {
    const memberId = memberDocId(organizationId, userId);
    // Build member doc omitting any undefined optional fields — Firestore rejects undefined values.
    const memberData = {
      organizationId,
      userId,
      role,
      permissions: ROLE_DEFAULTS[role],
      status: "active" as const,
      joinedAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      ...(userMeta?.displayName != null && { displayName: userMeta.displayName }),
      ...(userMeta?.email != null && { email: userMeta.email }),
      ...(userMeta?.photoURL != null && { photoURL: userMeta.photoURL }),
    };
    await setDoc(doc(db, MEMBERS_COLLECTION, memberId), memberData);
    return { success: true, error: null };
  } catch (error: any) {
    logger.error("Failed to add org member", { module: "organizations", action: "add-member", error });
    return { success: false, error: error.message };
  }
}

export async function getOrganizationMember(
  organizationId: string,
  userId: string
): Promise<{ member: OrganizationMember | null; error: string | null }> {
  try {
    const memberId = memberDocId(organizationId, userId);
    const docSnap = await getDoc(doc(db, MEMBERS_COLLECTION, memberId));
    if (!docSnap.exists()) {
      return { member: null, error: "Member not found" };
    }
    return {
      member: { id: docSnap.id, ...docSnap.data() } as OrganizationMember,
      error: null,
    };
  } catch (error: any) {
    return { member: null, error: error.message };
  }
}

export async function getOrganizationMembers(
  organizationId: string
): Promise<{ members: OrganizationMember[]; error: string | null }> {
  try {
    const q = query(
      collection(db, MEMBERS_COLLECTION),
      where("organizationId", "==", organizationId),
      where("status", "==", "active")
    );
    const snap = await getDocs(q);
    const members = snap.docs.map(
      (d) => ({ id: d.id, ...d.data() } as OrganizationMember)
    );
    return { members, error: null };
  } catch (error: any) {
    return { members: [], error: error.message };
  }
}

// Get all organizations a user belongs to
export async function getUserOrganizations(
  userId: string
): Promise<{ orgs: Organization[]; error: string | null }> {
  try {
    const q = query(
      collection(db, MEMBERS_COLLECTION),
      where("userId", "==", userId),
      where("status", "==", "active")
    );
    const membersSnap = await getDocs(q);

    if (membersSnap.empty) {
      return { orgs: [], error: null };
    }

    // Fetch each org document in parallel
    const orgFetches = membersSnap.docs.map((m) =>
      getDoc(doc(db, ORG_COLLECTION, m.data().organizationId))
    );
    const orgSnaps = await Promise.all(orgFetches);

    const orgs = orgSnaps
      .filter((s) => s.exists())
      .map((s) => ({ id: s.id, ...s.data() } as Organization));

    return { orgs, error: null };
  } catch (error: any) {
    return { orgs: [], error: error.message };
  }
}

export async function updateMemberRole(
  organizationId: string,
  userId: string,
  role: UserRole
): Promise<{ success: boolean; error: string | null }> {
  try {
    const memberId = memberDocId(organizationId, userId);
    await updateDoc(doc(db, MEMBERS_COLLECTION, memberId), {
      role,
      permissions: ROLE_DEFAULTS[role],
      updatedAt: serverTimestamp(),
    });
    return { success: true, error: null };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateMemberPermissions(
  organizationId: string,
  userId: string,
  permissions: UserPermissions
): Promise<{ success: boolean; error: string | null }> {
  try {
    const memberId = memberDocId(organizationId, userId);
    await updateDoc(doc(db, MEMBERS_COLLECTION, memberId), {
      permissions,
      updatedAt: serverTimestamp(),
    });
    return { success: true, error: null };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Count active admin members of an org (used to prevent leaving/removing the last admin).
async function countActiveAdmins(organizationId: string): Promise<number> {
  const q = query(
    collection(db, MEMBERS_COLLECTION),
    where("organizationId", "==", organizationId),
    where("status", "==", "active"),
    where("role", "==", "admin")
  );
  const snap = await getDocs(q);
  return snap.size;
}

// A member leaves an organization voluntarily. Blocks the last active admin
// from leaving to avoid an orphaned organization with no admin.
export async function leaveOrganization(
  organizationId: string,
  userId: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const memberId = memberDocId(organizationId, userId);
    const memberSnap = await getDoc(doc(db, MEMBERS_COLLECTION, memberId));
    if (!memberSnap.exists()) {
      return { success: false, error: "You are not a member of this organization" };
    }
    const member = memberSnap.data() as OrganizationMember;
    if (member.role === "admin") {
      const adminCount = await countActiveAdmins(organizationId);
      if (adminCount <= 1) {
        return { success: false, error: "You are the only admin — promote another member to admin before leaving, or delete the organization instead." };
      }
    }
    await updateDoc(doc(db, MEMBERS_COLLECTION, memberId), {
      status: "suspended",
      updatedAt: serverTimestamp(),
    });
    return { success: true, error: null };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Permanently deletes an organization and its membership records. Only an
// active admin of the org may do this. CRM entity data (leads, deals, etc.)
// is intentionally left in place — full cascade deletion of a tenant's data
// is out of scope here and should be handled by a dedicated admin/background
// job if ever needed.
export async function deleteOrganization(
  organizationId: string,
  callerId: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const callerMemberSnap = await getDoc(doc(db, MEMBERS_COLLECTION, memberDocId(organizationId, callerId)));
    if (!callerMemberSnap.exists() || callerMemberSnap.data().status !== "active") {
      return { success: false, error: "You are not an active member of this organization" };
    }
    if (callerMemberSnap.data().role !== "admin") {
      return { success: false, error: "Only an admin can delete the organization" };
    }

    // Delete the org doc BEFORE the membership docs: the security rule for
    // deleting /organizations/{orgId} re-checks isOrgAdmin(orgId) live,
    // which itself depends on the caller's own organization_members doc
    // still existing. Deleting memberships first (the original order here)
    // meant that by the time the org delete ran, the caller was no longer
    // considered a member — Firestore denied the org delete, leaving an
    // orphaned org doc with zero members that nobody could ever access or
    // clean up again through the app.
    await deleteDoc(doc(db, ORG_COLLECTION, organizationId));

    const membersSnap = await getDocs(
      query(collection(db, MEMBERS_COLLECTION), where("organizationId", "==", organizationId))
    );
    await Promise.all(membersSnap.docs.map((m) => deleteDoc(m.ref)));

    return { success: true, error: null };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function removeOrganizationMember(
  organizationId: string,
  userId: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const memberId = memberDocId(organizationId, userId);
    await updateDoc(doc(db, MEMBERS_COLLECTION, memberId), {
      status: "suspended",
      updatedAt: serverTimestamp(),
    });
    return { success: true, error: null };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Utility: generate a URL-safe slug from a name
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 50);
}

// Utility: generate a unique org slug in the format {username}-{4-6 digits}
// Retries with a new random suffix on collision (max 10 attempts).
export async function generateUniqueOrgSlug(username: string): Promise<string> {
  const base = username
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 30) || "org";

  for (let attempt = 0; attempt < 10; attempt++) {
    const digits = Math.floor(Math.random() * 900_000 + 100_000); // 6-digit range
    const slug = `${base}-${digits}`;

    const q = query(collection(db, ORG_COLLECTION), where("slug", "==", slug));
    const snap = await getDocs(q);
    if (snap.empty) return slug;
  }

  // Fallback: append timestamp-based suffix to guarantee uniqueness
  return `${base}-${Date.now().toString().slice(-7)}`;
}
