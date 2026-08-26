import {
  collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc,
  query, where, orderBy, Timestamp, QueryConstraint,
} from "firebase/firestore";
import { db } from "../firebase";
import { redis } from "../redis";
import { taskSchema } from "../validations/task";
import { hasPermission, canEditRecord } from "../auth/permission-utils";
import type { Task, TaskInput, TaskFilters, TaskStatus } from "@/types/crm";
import { createNotification } from "./notifications";
import { sanitizeData } from "./utils";

const COLLECTION_NAME = "tasks";

function orgCacheKey(orgId: string, suffix: string) { return `tasks:${orgId}:${suffix}`; }
function cacheKey(orgId: string | undefined, suffix: string) {
  return orgId ? orgCacheKey(orgId, suffix) : "tasks:list:all";
}

// Assignees may always edit their assigned task (status, etc.) regardless of
// the edit/editAll flags — assignment itself is the authorization signal,
// matching the tasks Firestore rules.
async function canEditTask(userId: string, organizationId: string, task: { ownerId?: string; assigneeId?: string }) {
  if (task.assigneeId && task.assigneeId === userId) return { allowed: true };
  return canEditRecord(userId, organizationId, "tasks", task.ownerId);
}

function rehydrateTs(val: any) {
  if (!val) return null;
  if (typeof val?.toDate === 'function') return val;
  if (typeof val === 'object' && 'seconds' in val) return new Timestamp(val.seconds, val.nanoseconds);
  return null;
}

export async function archiveTask(id: string, currentUserId: string): Promise<{ success: boolean; error: string | null }> {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return { success: false, error: "Task not found" };
    const task = docSnap.data() as Task;
    const permCheck = await canEditTask(currentUserId, task.organizationId, task);
    if (!permCheck.allowed) {
      return { success: false, error: permCheck.reason || "You do not have permission to archive this task" };
    }
    if (task.status !== "Done") return { success: false, error: "Only completed tasks (Done) can be archived" };
    await updateDoc(docRef, sanitizeData({ isArchived: true, archivedAt: Timestamp.now(), updatedAt: Timestamp.now() }));
    if (task.organizationId) { await redis.del(orgCacheKey(task.organizationId, "list:all")); if (task.ownerId) await redis.del(`dashboard:stats:${task.organizationId}:${task.ownerId}`); }
    return { success: true, error: null };
  } catch (error: any) { return { success: false, error: error.message }; }
}

export async function unarchiveTask(id: string, currentUserId: string): Promise<{ success: boolean; error: string | null }> {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return { success: false, error: "Task not found" };
    const task = docSnap.data() as Task;
    const permCheck = await canEditTask(currentUserId, task.organizationId, task);
    if (!permCheck.allowed) {
      return { success: false, error: permCheck.reason || "You do not have permission to unarchive this task" };
    }
    if (!task.isArchived) return { success: false, error: "Task is not archived" };
    await updateDoc(docRef, sanitizeData({ isArchived: false, updatedAt: Timestamp.now() }));
    if (task.organizationId) await redis.del(orgCacheKey(task.organizationId, "list:all"));
    return { success: true, error: null };
  } catch (error: any) { return { success: false, error: error.message }; }
}

export async function createTask(data: TaskInput, userId: string, organizationId: string): Promise<{
  success: boolean; id: string | null; error: string | null;
}> {
  try {
    if (!organizationId) {
      return { success: false, id: null, error: "organizationId is required to create a task" };
    }
    const permCheck = await hasPermission(userId, organizationId, "tasks", "create");
    if (!permCheck.allowed) {
      return { success: false, id: null, error: permCheck.reason || "You do not have permission to create tasks" };
    }
    const parsed = taskSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, id: null, error: parsed.error.issues.map((i) => i.message).join(", ") };
    }

    const taskData: any = {
      ...parsed.data,
      organizationId,
      ownerId: userId,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };
    const sanitized = sanitizeData(taskData);
    const docRef = await addDoc(collection(db, COLLECTION_NAME), sanitized);

    if (data.assigneeId && data.assigneeId !== userId) {
      await createNotification(data.assigneeId, "task_assigned", "New Task Assigned",
        `You have been assigned the task: "${data.title}"`, "task", docRef.id, organizationId);
    }

    await redis.del(orgCacheKey(organizationId, "list:all"));
    if (userId) await redis.del(`dashboard:stats:${organizationId}:${userId}`);
    return { success: true, id: docRef.id, error: null };
  } catch (error: any) { return { success: false, id: null, error: error.message }; }
}

export async function getTasks(organizationId?: string | TaskFilters, filters?: TaskFilters): Promise<{
  tasks: Task[]; error: string | null;
}> {
  if (typeof organizationId === "object") { filters = organizationId as any; organizationId = undefined; }
  try {
    const constraints: QueryConstraint[] = [];
    if (organizationId) constraints.push(where("organizationId", "==", organizationId));

    const showOnlyArchived = filters?.isArchived === true;
    if (showOnlyArchived) constraints.push(where("isArchived", "==", true));
    else constraints.push(where("isArchived", "==", false));

    if (filters?.status) constraints.push(where("status", "==", filters.status));
    if (filters?.priority) constraints.push(where("priority", "==", filters.priority));
    if (filters?.type) constraints.push(where("type", "==", filters.type));
    if (filters?.assigneeId) constraints.push(where("assigneeId", "==", filters.assigneeId));
    if (filters?.projectId) constraints.push(where("projectId", "==", filters.projectId));
    if (filters?.ownerId) constraints.push(where("ownerId", "==", filters.ownerId));
    if (constraints.length > 1) constraints.push(orderBy("createdAt", "desc"));

    const q = query(collection(db, COLLECTION_NAME), ...constraints);

    const isUnfiltered = !filters || Object.keys(filters).length === 0 || (Object.keys(filters).length === 1 && (filters.search === "" || filters.assigneeId));
    const key = cacheKey(organizationId, "list:all");

    if (isUnfiltered && !showOnlyArchived) {
      const cached = await redis.get<Task[]>(key);
      if (cached) {
        const hydrated = cached.map((t: any) => ({
          ...t, createdAt: rehydrateTs(t.createdAt), updatedAt: rehydrateTs(t.updatedAt),
          dueDate: rehydrateTs(t.dueDate), startDate: rehydrateTs(t.startDate), completedAt: rehydrateTs(t.completedAt),
        }));
        return { tasks: hydrated, error: null };
      }
    }

    const querySnapshot = await getDocs(q);
    const tasks: Task[] = [];
    querySnapshot.forEach((doc) => { tasks.push({ id: doc.id, ...doc.data() } as Task); });
    if (tasks.length > 0 && isUnfiltered && !showOnlyArchived) await redis.set(key, tasks, { ex: 300 });

    tasks.sort((a, b) => { const aT = a.createdAt?.toMillis?.() || 0; const bT = b.createdAt?.toMillis?.() || 0; return bT - aT; });

    let filtered = tasks;
    if (filters?.search) {
      const s = filters.search.toLowerCase();
      filtered = filtered.filter((t) => t.title?.toLowerCase().includes(s) || t.description?.toLowerCase().includes(s) || t.projectName?.toLowerCase().includes(s) || t.assigneeName?.toLowerCase().includes(s));
    }
    if (filters?.dueDateFrom) filtered = filtered.filter((t) => t.dueDate && t.dueDate.toDate() >= filters.dueDateFrom!);
    if (filters?.dueDateTo) filtered = filtered.filter((t) => t.dueDate && t.dueDate.toDate() <= filters.dueDateTo!);
    if (filters?.userRole && filters.userId) {
      const uid = filters.userId;
      filtered = filtered.filter((task) => {
        switch (filters.userRole) {
          case "assigned": return task.assigneeId === uid;
          case "created": return task.ownerId === uid;
          case "associated": return task.assigneeId === uid || task.ownerId === uid || (task.associates && task.associates.includes(uid));
          default: return true;
        }
      });
    }
    if (filters?.priorities && filters.priorities.length > 0) filtered = filtered.filter((t) => filters.priorities!.includes(t.priority));
    if (filters?.statuses && filters.statuses.length > 0) filtered = filtered.filter((t) => filters.statuses!.includes(t.status));

    return { tasks: filtered, error: null };
  } catch (error: any) { return { tasks: [], error: error.message }; }
}

export async function getTask(id: string): Promise<{ task: Task | null; error: string | null }> {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) return { task: { id: docSnap.id, ...docSnap.data() } as Task, error: null };
    return { task: null, error: "Task not found" };
  } catch (error: any) { return { task: null, error: error.message }; }
}

export async function updateTask(id: string, data: Partial<TaskInput>, currentUserId: string): Promise<{ success: boolean; error: string | null }> {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    const currentSnap = await getDoc(docRef);
    if (!currentSnap.exists()) throw new Error("Task not found");
    const current = currentSnap.data() as Task;

    const permCheck = await canEditTask(currentUserId, current.organizationId, current);
    if (!permCheck.allowed) {
      return { success: false, error: permCheck.reason || "You do not have permission to edit this task" };
    }

    const updateData: any = { ...data, updatedAt: Timestamp.now() };
    if (data.status === "Done") updateData.completedAt = Timestamp.now();
    await updateDoc(docRef, sanitizeData(updateData));

    if (data.assigneeId && data.assigneeId !== current.assigneeId && data.assigneeId !== current.ownerId) {
      await createNotification(data.assigneeId, "task_assigned", "Task Assigned",
        `You have been assigned the task: "${current.title}"`, "task", id, current.organizationId);
    }

    if (current.organizationId) { await redis.del(orgCacheKey(current.organizationId, "list:all")); if (current.ownerId) await redis.del(`dashboard:stats:${current.organizationId}:${current.ownerId}`); }
    return { success: true, error: null };
  } catch (error: any) { return { success: false, error: error.message }; }
}

export async function updateTaskStatus(id: string, status: TaskStatus, currentUserId: string): Promise<{ success: boolean; error: string | null }> {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return { success: false, error: "Task not found" };
    const task = docSnap.data() as Task;
    const permCheck = await canEditTask(currentUserId, task.organizationId, task);
    if (!permCheck.allowed) {
      return { success: false, error: permCheck.reason || "You do not have permission to update this task" };
    }
    const updateData: any = { status, updatedAt: Timestamp.now() };
    if (status === "Done") updateData.completedAt = Timestamp.now();
    await updateDoc(docRef, updateData);
    if (task.organizationId) await redis.del(orgCacheKey(task.organizationId, "list:all"));
    return { success: true, error: null };
  } catch (error: any) { return { success: false, error: error.message }; }
}

export async function deleteTask(id: string, currentUserId: string): Promise<{ success: boolean; error: string | null }> {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return { success: false, error: "Task not found" };
    const existing = docSnap.data();
    const permCheck = await hasPermission(currentUserId, existing.organizationId, "tasks", "delete");
    if (!permCheck.allowed) {
      return { success: false, error: permCheck.reason || "You do not have permission to delete this task" };
    }
    const orgId = existing.organizationId;
    await deleteDoc(docRef);
    if (orgId) await redis.del(orgCacheKey(orgId, "list:all"));
    return { success: true, error: null };
  } catch (error: any) { return { success: false, error: error.message }; }
}

export async function getTasksByProject(organizationId: string | undefined, projectId: string): Promise<{
  tasks: Task[]; error: string | null;
}> {
  try {
    const constraints: QueryConstraint[] = [where("projectId", "==", projectId)];
    if (organizationId) constraints.push(where("organizationId", "==", organizationId));
    constraints.push(orderBy("createdAt", "desc"));
    const q = query(collection(db, COLLECTION_NAME), ...constraints);
    const querySnapshot = await getDocs(q);
    const tasks: Task[] = [];
    querySnapshot.forEach((doc) => { tasks.push({ id: doc.id, ...doc.data() } as Task); });
    return { tasks, error: null };
  } catch (error: any) { return { tasks: [], error: error.message }; }
}

export async function getTasksByAssignee(organizationId: string | undefined, userId: string): Promise<{
  tasks: Task[]; error: string | null;
}> {
  try {
    const constraints: QueryConstraint[] = [where("assigneeId", "==", userId)];
    if (organizationId) constraints.push(where("organizationId", "==", organizationId));
    constraints.push(orderBy("createdAt", "desc"));
    const q = query(collection(db, COLLECTION_NAME), ...constraints);
    const querySnapshot = await getDocs(q);
    const tasks: Task[] = [];
    querySnapshot.forEach((doc) => { tasks.push({ id: doc.id, ...doc.data() } as Task); });
    return { tasks, error: null };
  } catch (error: any) { return { tasks: [], error: error.message }; }
}
