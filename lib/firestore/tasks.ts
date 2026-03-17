import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
  QueryConstraint,
} from "firebase/firestore";
import { db } from "../firebase";
import { redis } from "../redis";
import type { Task, TaskInput, TaskFilters, TaskStatus } from "@/types/crm";
import { createNotification } from "./notifications";
import { sanitizeData } from "./utils";
import { validateTaskPermission } from "@/lib/auth/permission-utils";

const COLLECTION_NAME = "tasks";

// Archive a task (only allowed for tasks with status "Done")
export async function archiveTask(id: string, currentUserId: string): Promise<{
  success: boolean;
  error: string | null;
}> {
  try {
    console.log("📦 Archiving task:", id);

    // Check if user has permission to update this task (archiving is an update)
    const { allowed, reason } = await validateTaskPermission(id, "update", currentUserId);
    if (!allowed) {
      console.warn(`❌ Permission denied for user ${currentUserId} to archive task ${id}: ${reason}`);
      return {
        success: false,
        error: reason || "You don't have permission to archive this task",
      };
    }

    // First verify the task exists and is in "Done" status
    const docRef = doc(db, COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return {
        success: false,
        error: "Task not found",
      };
    }

    const task = docSnap.data() as Task;

    // Logic guard: Only tasks with status "Done" can be archived
    if (task.status !== "Done") {
      return {
        success: false,
        error: "Only completed tasks (Done) can be archived",
      };
    }

    const updateData = {
      isArchived: true,
      archivedAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    await updateDoc(docRef, sanitizeData(updateData));
    console.log("✅ Task archived successfully");

    // Invalidate cache
    await redis.del("tasks:list:all");
    if (task.ownerId) {
      await redis.del(`dashboard:stats:${task.ownerId}`);
    }

    return {
      success: true,
      error: null,
    };
  } catch (error: any) {
    console.error("❌ Failed to archive task:", error.message);
    return {
      success: false,
      error: error.message,
    };
  }
}

// Unarchive a task
export async function unarchiveTask(id: string, currentUserId: string): Promise<{
  success: boolean;
  error: string | null;
}> {
  try {
    console.log("📦 Unarchiving task:", id);
    
    // Check if user has permission to update this task (unarchiving is an update)
    const { allowed, reason } = await validateTaskPermission(id, "update", currentUserId);
    if (!allowed) {
      console.warn(`❌ Permission denied for user ${currentUserId} to unarchive task ${id}: ${reason}`);
      return {
        success: false,
        error: reason || "You don't have permission to unarchive this task",
      };
    }

    const docRef = doc(db, COLLECTION_NAME, id);

    const updateData = {
      isArchived: false,
      updatedAt: Timestamp.now(),
    };

    await updateDoc(docRef, sanitizeData(updateData));
    console.log("✅ Task unarchived successfully");

    // Invalidate cache
    await redis.del("tasks:list:all");

    return {
      success: true,
      error: null,
    };
  } catch (error: any) {
    console.error("❌ Failed to unarchive task:", error.message);
    return {
      success: false,
      error: error.message,
    };
  }
}

// Create a new task
export async function createTask(data: TaskInput, userId: string): Promise<{
  success: boolean;
  id: string | null;
  error: string | null;
}> {
  try {
    console.log("📝 Creating task:", data.title);

    // Check if user has permission to create tasks
    const { allowed, reason } = await validateTaskPermission(null, "create", userId);
    if (!allowed) {
      console.warn(`❌ Permission denied for user ${userId} to create task: ${reason}`);
      return {
        success: false,
        id: null,
        error: reason || "You don't have permission to create tasks",
      };
    }

    const taskData = {
      ...data,
      ownerId: userId,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    const sanitizedData = sanitizeData(taskData);
    const docRef = await addDoc(collection(db, COLLECTION_NAME), sanitizedData);
    console.log("✅ Task created with ID:", docRef.id);

    // Notify assignee if different from creator
    if (data.assigneeId && data.assigneeId !== userId) {
      await createNotification(
        data.assigneeId,
        "task_assigned",
        "New Task Assigned",
        `You have been assigned the task: "${data.title}"`,
        "task",
        docRef.id
      );
    }

    // Invalidate cache
    await redis.del("tasks:list:all");
    if (userId) {
      await redis.del(`dashboard:stats:${userId}`);
    }

    return {
      success: true,
      id: docRef.id,
      error: null,
    };
  } catch (error: any) {
    console.error("❌ Failed to create task:", error.message);
    return {
      success: false,
      id: null,
      error: error.message,
    };
  }
}

// Get all tasks with optional filters
export async function getTasks(filters?: TaskFilters): Promise<{
  tasks: Task[];
  error: string | null;
}> {
  try {
    console.log("📋 Fetching tasks with filters:", filters);
    const constraints: QueryConstraint[] = [];

    // Default to non-archived tasks unless explicitly requested
    const includeArchived = filters?.isArchived === true;
    const showOnlyArchived = filters?.isArchived === true;

    // Only filter by isArchived if not explicitly showing archived
    if (showOnlyArchived) {
      constraints.push(where("isArchived", "==", true));
    } else if (!includeArchived) {
      constraints.push(where("isArchived", "==", false));
    }

    // Apply filters
    if (filters?.status) {
      constraints.push(where("status", "==", filters.status));
    }
    if (filters?.priority) {
      constraints.push(where("priority", "==", filters.priority));
    }
    if (filters?.type) {
      constraints.push(where("type", "==", filters.type));
    }
    if (filters?.assigneeId) {
      constraints.push(where("assigneeId", "==", filters.assigneeId));
    }
    if (filters?.projectId) {
      constraints.push(where("projectId", "==", filters.projectId));
    }
    if (filters?.ownerId) {
      constraints.push(where("ownerId", "==", filters.ownerId));
    }

    // Only add ordering if we have filters (to avoid index requirements)
    if (constraints.length > 0) {
      constraints.push(orderBy("createdAt", "desc"));
    }

    const q = constraints.length > 0
      ? query(collection(db, COLLECTION_NAME), ...constraints)
      : collection(db, COLLECTION_NAME);

    // Try Cache for unfiltered requests (only for non-archived tasks)
    const isUnfiltered = !filters || Object.keys(filters).length === 0 || (Object.keys(filters).length === 1 && (filters.search === "" || filters.assigneeId));
    const cacheKey = "tasks:list:all";

    if (isUnfiltered && !showOnlyArchived) {
      const cached = await redis.get<Task[]>(cacheKey);
      if (cached) {
        console.log("⚡ HIT: Tasks list from Redis");
        // Rehydrate Timestamps
        const hydrated = cached.map((t: any) => ({
          ...t,
          createdAt: t.createdAt ? new Timestamp(t.createdAt.seconds || 0, t.createdAt.nanoseconds || 0) : null,
          updatedAt: t.updatedAt ? new Timestamp(t.updatedAt.seconds || 0, t.updatedAt.nanoseconds || 0) : null,
          dueDate: t.dueDate ? new Timestamp(t.dueDate.seconds || 0, t.dueDate.nanoseconds || 0) : null,
          startDate: t.startDate ? new Timestamp(t.startDate.seconds || 0, t.startDate.nanoseconds || 0) : null,
          completedAt: t.completedAt ? new Timestamp(t.completedAt.seconds || 0, t.completedAt.nanoseconds || 0) : null,
        }));
        return { tasks: hydrated, error: null };
      }
    }

    const querySnapshot = await getDocs(q);
    console.log("📊 Tasks fetched:", querySnapshot.size);

    const tasks: Task[] = [];
    querySnapshot.forEach((doc) => {
      tasks.push({ id: doc.id, ...doc.data() } as Task);
    });

    if (tasks.length > 0 && isUnfiltered && !showOnlyArchived) {
      await redis.set(cacheKey, tasks, { ex: 300 });
    }

    // Sort by createdAt on client side
    tasks.sort((a, b) => {
      const aTime = a.createdAt?.toMillis?.() || 0;
      const bTime = b.createdAt?.toMillis?.() || 0;
      return bTime - aTime;
    });

    // Apply client-side search filter if provided
    let filteredTasks = tasks;
    if (filters?.search) {
      const searchLower = filters.search.toLowerCase();
      filteredTasks = tasks.filter(
        (task) =>
          task.title?.toLowerCase().includes(searchLower) ||
          task.description?.toLowerCase().includes(searchLower) ||
          task.projectName?.toLowerCase().includes(searchLower) ||
          task.assigneeName?.toLowerCase().includes(searchLower)
      );
    }

    // Apply date range filters
    if (filters?.dueDateFrom) {
      filteredTasks = filteredTasks.filter(
        (task) => task.dueDate && task.dueDate.toDate() >= filters.dueDateFrom!
      );
    }
    if (filters?.dueDateTo) {
      filteredTasks = filteredTasks.filter(
        (task) => task.dueDate && task.dueDate.toDate() <= filters.dueDateTo!
      );
    }

    // Apply user role filter (client-side for simplicity)
    if (filters?.userRole && filters.userId) {
      const userId = filters.userId;
      filteredTasks = filteredTasks.filter((task) => {
        switch (filters.userRole) {
          case "assigned":
            return task.assigneeId === userId;
          case "created":
            return task.ownerId === userId;
          case "associated":
            return task.assigneeId === userId ||
                   task.ownerId === userId ||
                   (task.associates && task.associates.includes(userId));
          case "all":
          default:
            return true;
        }
      });
    }

    // Apply multiple priorities filter
    if (filters?.priorities && filters.priorities.length > 0) {
      filteredTasks = filteredTasks.filter((task) =>
        filters.priorities!.includes(task.priority)
      );
    }

    // Apply multiple statuses filter
    if (filters?.statuses && filters.statuses.length > 0) {
      filteredTasks = filteredTasks.filter((task) =>
        filters.statuses!.includes(task.status)
      );
    }

    console.log("✅ Returning", filteredTasks.length, "tasks");
    return {
      tasks: filteredTasks,
      error: null,
    };
  } catch (error: any) {
    console.error("❌ Failed to fetch tasks:", error.message);
    return {
      tasks: [],
      error: error.message,
    };
  }
}

// Get a single task by ID
export async function getTask(id: string): Promise<{
  task: Task | null;
  error: string | null;
}> {
  try {
    console.log("🔍 Fetching task:", id);
    const docRef = doc(db, COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      console.log("✅ Task found:", id);
      return {
        task: { id: docSnap.id, ...docSnap.data() } as Task,
        error: null,
      };
    } else {
      console.warn("⚠️ Task not found:", id);
      return {
        task: null,
        error: "Task not found",
      };
    }
  } catch (error: any) {
    console.error("❌ Failed to fetch task:", error.message);
    return {
      task: null,
      error: error.message,
    };
  }
}

// Update a task
export async function updateTask(id: string, data: Partial<TaskInput>, currentUserId: string): Promise<{
  success: boolean;
  error: string | null;
}> {
  try {
    console.log("📝 Updating task:", id);
    
    // Check if user has permission to update this task
    const { allowed, reason } = await validateTaskPermission(id, "update", currentUserId);
    if (!allowed) {
      console.warn(`❌ Permission denied for user ${currentUserId} to update task ${id}: ${reason}`);
      return {
        success: false,
        error: reason || "You don't have permission to update this task",
      };
    }

    const docRef = doc(db, COLLECTION_NAME, id);

    // Fetch current task to compare changes
    const currentTaskSnap = await getDoc(docRef);
    if (!currentTaskSnap.exists()) throw new Error("Task not found");
    const currentTask = currentTaskSnap.data() as Task;

    const updateData: any = {
      ...data,
      updatedAt: Timestamp.now(),
    };

    // If marking as done, set completedAt
    if (data.status === "Done") {
      updateData.completedAt = Timestamp.now();
    }

    const sanitizedData = sanitizeData(updateData);
    await updateDoc(docRef, sanitizedData);

    // Notify assignee if changed AND not self-assigning
    if (data.assigneeId && data.assigneeId !== currentTask.assigneeId && data.assigneeId !== currentUserId) {
      await createNotification(
        data.assigneeId,
        "task_assigned",
        "Task Assigned",
        `You have been assigned the task: "${currentTask.title}"`,
        "task",
        id
      );
    }

    console.log("✅ Task updated successfully");

    // Invalidate cache
    await redis.del("tasks:list:all");
    if (currentTask.ownerId) {
      await redis.del(`dashboard:stats:${currentTask.ownerId}`);
    }

    return {
      success: true,
      error: null,
    };
  } catch (error: any) {
    console.error("❌ Failed to update task:", error.message);
    return {
      success: false,
      error: error.message,
    };
  }
}

// Update task status
export async function updateTaskStatus(id: string, status: TaskStatus): Promise<{
  success: boolean;
  error: string | null;
}> {
  try {
    console.log("📝 Updating task status:", id, "to", status);
    const docRef = doc(db, COLLECTION_NAME, id);

    const updateData: any = {
      status,
      updatedAt: Timestamp.now(),
    };

    // If marking as done, set completedAt
    if (status === "Done") {
      updateData.completedAt = Timestamp.now();
    }

    await updateDoc(docRef, updateData);

    console.log("✅ Task status updated");

    // Invalidate cache
    await redis.del("tasks:list:all");

    return {
      success: true,
      error: null,
    };
  } catch (error: any) {
    console.error("❌ Failed to update task status:", error.message);
    return {
      success: false,
      error: error.message,
    };
  }
}

// Delete a task
export async function deleteTask(id: string, currentUserId: string): Promise<{
  success: boolean;
  error: string | null;
}> {
  try {
    console.log("🗑️ Deleting task:", id);
    
    // Check if user has permission to delete this task
    const { allowed, reason } = await validateTaskPermission(id, "delete", currentUserId);
    if (!allowed) {
      console.warn(`❌ Permission denied for user ${currentUserId} to delete task ${id}: ${reason}`);
      return {
        success: false,
        error: reason || "You don't have permission to delete this task",
      };
    }

    const docRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(docRef);

    console.log("✅ Task deleted successfully");

    // Invalidate cache
    await redis.del("tasks:list:all");

    return {
      success: true,
      error: null,
    };
  } catch (error: any) {
    console.error("❌ Failed to delete task:", error.message);
    return {
      success: false,
      error: error.message,
    };
  }
}

// Get tasks by project
export async function getTasksByProject(projectId: string): Promise<{
  tasks: Task[];
  error: string | null;
}> {
  try {
    console.log("📋 Fetching tasks for project:", projectId);
    const q = query(
      collection(db, COLLECTION_NAME),
      where("projectId", "==", projectId),
      orderBy("createdAt", "desc")
    );

    const querySnapshot = await getDocs(q);
    const tasks: Task[] = [];

    querySnapshot.forEach((doc) => {
      tasks.push({ id: doc.id, ...doc.data() } as Task);
    });

    console.log("✅ Found", tasks.length, "tasks");
    return {
      tasks,
      error: null,
    };
  } catch (error: any) {
    console.error("❌ Failed to fetch tasks:", error.message);
    return {
      tasks: [],
      error: error.message,
    };
  }
}

// Get tasks by assignee
export async function getTasksByAssignee(userId: string): Promise<{
  tasks: Task[];
  error: string | null;
}> {
  try {
    console.log("📋 Fetching tasks for user:", userId);
    const q = query(
      collection(db, COLLECTION_NAME),
      where("assigneeId", "==", userId),
      orderBy("createdAt", "desc")
    );

    const querySnapshot = await getDocs(q);
    const tasks: Task[] = [];

    querySnapshot.forEach((doc) => {
      tasks.push({ id: doc.id, ...doc.data() } as Task);
    });

    console.log("✅ Found", tasks.length, "tasks");
    return {
      tasks,
      error: null,
    };
  } catch (error: any) {
    console.error("❌ Failed to fetch tasks:", error.message);
    return {
      tasks: [],
      error: error.message,
    };
  }
}
