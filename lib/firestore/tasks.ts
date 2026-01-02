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
import type { Task, TaskInput, TaskFilters, TaskStatus } from "@/types/crm";
import { createNotification } from "./notifications";

const COLLECTION_NAME = "tasks";

// Create a new task
export async function createTask(data: TaskInput, userId: string): Promise<{
  success: boolean;
  id: string | null;
  error: string | null;
}> {
  try {
    console.log("📝 Creating task:", data.title);
    
    const taskData = {
      ...data,
      ownerId: userId,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    const docRef = await addDoc(collection(db, COLLECTION_NAME), taskData);
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
      
    const querySnapshot = await getDocs(q);
    console.log("📊 Tasks fetched:", querySnapshot.size);

    const tasks: Task[] = [];
    querySnapshot.forEach((doc) => {
      tasks.push({ id: doc.id, ...doc.data() } as Task);
    });

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
          task.title.toLowerCase().includes(searchLower) ||
          task.description?.toLowerCase().includes(searchLower) ||
          task.projectName?.toLowerCase().includes(searchLower)
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
export async function updateTask(id: string, data: Partial<TaskInput>): Promise<{
  success: boolean;
  error: string | null;
}> {
  try {
    console.log("📝 Updating task:", id);
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

    await updateDoc(docRef, updateData);

    // Notify assignee if changed
    if (data.assigneeId && data.assigneeId !== currentTask.assigneeId) {
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
export async function deleteTask(id: string): Promise<{
  success: boolean;
  error: string | null;
}> {
  try {
    console.log("🗑️ Deleting task:", id);
    const docRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(docRef);

    console.log("✅ Task deleted successfully");
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
