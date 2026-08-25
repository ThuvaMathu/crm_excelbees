import {
  collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc,
  query, where, orderBy, Timestamp, QueryConstraint,
} from "firebase/firestore";
import { db } from "../firebase";
import { redis } from "../redis";
import { projectSchema } from "../validations/project";
import { hasPermission, canEditRecord } from "../auth/permission-utils";
import type { Project, ProjectInput, ProjectFilters, ProjectStatus } from "@/types/crm";
import { sanitizeData } from "./utils";

const COLLECTION_NAME = "projects";

function orgCacheKey(orgId: string, suffix: string) { return `projects:${orgId}:${suffix}`; }
function cacheKey(orgId: string | undefined, suffix: string) {
  return orgId ? orgCacheKey(orgId, suffix) : "projects:list:all";
}

function rehydrateTs(val: any) {
  if (!val) return null;
  if (typeof val?.toDate === 'function') return val;
  if (typeof val === 'object' && 'seconds' in val) return new Timestamp(val.seconds, val.nanoseconds);
  if (val instanceof Date) return Timestamp.fromDate(val);
  if (typeof val === 'string') { try { return Timestamp.fromDate(new Date(val)); } catch { return null; } }
  return null;
}

export async function createProject(data: ProjectInput, userId: string, organizationId: string): Promise<{
  success: boolean; id: string | null; error: string | null; data?: any;
}> {
  try {
    if (!organizationId) {
      return { success: false, id: null, error: "organizationId is required to create a project" };
    }
    const permCheck = await hasPermission(userId, organizationId, "projects", "create");
    if (!permCheck.allowed) {
      return { success: false, id: null, error: permCheck.reason || "You do not have permission to create projects" };
    }
    const parsed = projectSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, id: null, error: parsed.error.issues.map((i) => i.message).join(", ") };
    }

    const projectData: any = {
      ...parsed.data,
      organizationId,
      ownerId: userId,
      archived: false,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };
    const sanitized = sanitizeData(projectData);
    const docRef = await addDoc(collection(db, COLLECTION_NAME), sanitized);
    await redis.del(orgCacheKey(organizationId, "list:all"));
    if (userId) await redis.del(`dashboard:stats:${organizationId}:${userId}`);
    return { success: true, id: docRef.id, error: null, data: { id: docRef.id, ...projectData } };
  } catch (error: any) {
    return { success: false, id: null, error: error.message };
  }
}

export async function archiveProject(id: string, currentUserId: string): Promise<{ success: boolean; error: string | null }> {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return { success: false, error: "Project not found" };
    const existing = docSnap.data();
    const permCheck = await canEditRecord(currentUserId, existing.organizationId, "projects", existing.ownerId);
    if (!permCheck.allowed) {
      return { success: false, error: permCheck.reason || "You do not have permission to archive this project" };
    }
    await updateDoc(docRef, { archived: true, updatedAt: Timestamp.now() });
    if (existing.organizationId) await redis.del(orgCacheKey(existing.organizationId, "list:all"));
    return { success: true, error: null };
  } catch (error: any) { return { success: false, error: error.message }; }
}

export async function unarchiveProject(id: string, currentUserId: string): Promise<{ success: boolean; error: string | null }> {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return { success: false, error: "Project not found" };
    const existing = docSnap.data();
    const permCheck = await canEditRecord(currentUserId, existing.organizationId, "projects", existing.ownerId);
    if (!permCheck.allowed) {
      return { success: false, error: permCheck.reason || "You do not have permission to unarchive this project" };
    }
    await updateDoc(docRef, { archived: false, updatedAt: Timestamp.now() });
    if (existing.organizationId) await redis.del(orgCacheKey(existing.organizationId, "list:all"));
    return { success: true, error: null };
  } catch (error: any) { return { success: false, error: error.message }; }
}

export async function getProjects(organizationId?: string | ProjectFilters, filters?: ProjectFilters): Promise<{
  projects: Project[]; error: string | null;
}> {
  if (typeof organizationId === "object") { filters = organizationId as any; organizationId = undefined; }
  try {
    const key = cacheKey(organizationId, "list:all");
    let projects: Project[] = [];

    const cached = await redis.get<Project[]>(key);
    if (cached) {
      projects = cached.map((p: any) => ({
        ...p,
        createdAt: rehydrateTs(p.createdAt), updatedAt: rehydrateTs(p.updatedAt),
        startDate: rehydrateTs(p.startDate), endDate: rehydrateTs(p.endDate),
      }));
    }

    if (projects.length === 0) {
      const constraints: QueryConstraint[] = [];
      if (organizationId) constraints.push(where("organizationId", "==", organizationId));
      if (filters?.ownerId) constraints.push(where("ownerId", "==", filters.ownerId));
      constraints.push(orderBy("createdAt", "desc"));
      const q = query(collection(db, COLLECTION_NAME), ...constraints);
      const querySnapshot = await getDocs(q);
      querySnapshot.forEach((doc) => { projects.push({ id: doc.id, ...doc.data() } as Project); });
      if (projects.length > 0) await redis.set(key, projects, { ex: 300 });
    }

    projects.sort((a, b) => { const aT = a.createdAt?.toMillis?.() || 0; const bT = b.createdAt?.toMillis?.() || 0; return bT - aT; });

    let filtered = projects;
    if (filters?.archived !== undefined) filtered = filtered.filter((p) => (p.archived ?? false) === filters.archived);
    else filtered = filtered.filter((p) => !p.archived);
    if (filters?.status) filtered = filtered.filter((p) => p.status === filters.status);
    if (filters?.priority) filtered = filtered.filter((p) => p.priority === filters.priority);
    if (filters?.companyId) filtered = filtered.filter((p) => p.companyId === filters.companyId);
    if (filters?.dealId) filtered = filtered.filter((p) => p.dealId === filters.dealId);
    if (filters?.search) {
      const s = filters.search.toLowerCase();
      filtered = filtered.filter((p) => p.name?.toLowerCase().includes(s) || p.description?.toLowerCase().includes(s) || p.companyName?.toLowerCase().includes(s));
    }
    if (filters?.startDateFrom) filtered = filtered.filter((p) => p.startDate?.toDate?.() && p.startDate.toDate() >= filters.startDateFrom!);
    if (filters?.startDateTo) filtered = filtered.filter((p) => p.startDate?.toDate?.() && p.startDate.toDate() <= filters.startDateTo!);

    return { projects: filtered, error: null };
  } catch (error: any) { return { projects: [], error: error.message }; }
}

export async function getProject(id: string): Promise<{ project: Project | null; error: string | null }> {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) return { project: { id: docSnap.id, ...docSnap.data() } as Project, error: null };
    return { project: null, error: "Project not found" };
  } catch (error: any) { return { project: null, error: error.message }; }
}

export async function updateProject(id: string, data: Partial<ProjectInput>, currentUserId: string): Promise<{ success: boolean; error: string | null }> {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return { success: false, error: "Project not found" };
    const existing = docSnap.data();
    const permCheck = await canEditRecord(currentUserId, existing.organizationId, "projects", existing.ownerId);
    if (!permCheck.allowed) {
      return { success: false, error: permCheck.reason || "You do not have permission to edit this project" };
    }
    const updateData = { ...data, updatedAt: Timestamp.now() };
    await updateDoc(docRef, sanitizeData(updateData) as any);
    if (existing.organizationId) await redis.del(orgCacheKey(existing.organizationId, "list:all"));
    return { success: true, error: null };
  } catch (error: any) { return { success: false, error: error.message }; }
}

export async function updateProjectStatus(id: string, status: ProjectStatus, currentUserId: string): Promise<{ success: boolean; error: string | null }> {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return { success: false, error: "Project not found" };
    const existing = docSnap.data();
    const permCheck = await canEditRecord(currentUserId, existing.organizationId, "projects", existing.ownerId);
    if (!permCheck.allowed) {
      return { success: false, error: permCheck.reason || "You do not have permission to edit this project" };
    }
    await updateDoc(docRef, { status, updatedAt: Timestamp.now() });
    if (existing.organizationId) await redis.del(orgCacheKey(existing.organizationId, "list:all"));
    return { success: true, error: null };
  } catch (error: any) { return { success: false, error: error.message }; }
}

export async function updateProjectLifecycle(id: string, lifecycle: "active" | "maintenance", currentUserId: string): Promise<{ success: boolean; error: string | null }> {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return { success: false, error: "Project not found" };
    const existing = docSnap.data();
    const permCheck = await canEditRecord(currentUserId, existing.organizationId, "projects", existing.ownerId);
    if (!permCheck.allowed) {
      return { success: false, error: permCheck.reason || "You do not have permission to edit this project" };
    }
    await updateDoc(docRef, { lifecycle, updatedAt: Timestamp.now() });
    if (existing.organizationId) await redis.del(orgCacheKey(existing.organizationId, "list:all"));
    return { success: true, error: null };
  } catch (error: any) { return { success: false, error: error.message }; }
}

export async function deleteProject(id: string, currentUserId: string): Promise<{ success: boolean; error: string | null }> {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return { success: false, error: "Project not found" };
    const existing = docSnap.data();
    const permCheck = await hasPermission(currentUserId, existing.organizationId, "projects", "delete");
    if (!permCheck.allowed) {
      return { success: false, error: permCheck.reason || "You do not have permission to delete this project" };
    }
    const orgId = existing.organizationId;
    await deleteDoc(docRef);
    if (orgId) await redis.del(orgCacheKey(orgId, "list:all"));
    return { success: true, error: null };
  } catch (error: any) { return { success: false, error: error.message }; }
}

export async function getProjectsByCompany(organizationId: string | undefined, companyId: string): Promise<{
  projects: Project[]; error: string | null;
}> {
  try {
    const constraints: QueryConstraint[] = [where("companyId", "==", companyId)];
    if (organizationId) constraints.push(where("organizationId", "==", organizationId));
    constraints.push(orderBy("createdAt", "desc"));
    const q = query(collection(db, COLLECTION_NAME), ...constraints);
    const querySnapshot = await getDocs(q);
    const projects: Project[] = [];
    querySnapshot.forEach((doc) => { projects.push({ id: doc.id, ...doc.data() } as Project); });
    return { projects, error: null };
  } catch (error: any) { return { projects: [], error: error.message }; }
}
