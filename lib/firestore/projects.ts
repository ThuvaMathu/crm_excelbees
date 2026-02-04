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
import type { Project, ProjectInput, ProjectFilters, ProjectStatus } from "@/types/crm";
import { sanitizeData } from "./utils";

const COLLECTION_NAME = "projects";

// Create a new project
export async function createProject(data: ProjectInput, userId: string): Promise<{
  success: boolean;
  id: string | null;
  error: string | null;
}> {
  try {
    console.log("📝 Creating project:", data.name);
    
    const projectData = {
      ...data,
      ownerId: userId,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    const sanitizedData = sanitizeData(projectData);
    const docRef = await addDoc(collection(db, COLLECTION_NAME), sanitizedData);
    console.log("✅ Project created with ID:", docRef.id);
    
    // Invalidate cache
    await redis.del("projects:list:all");
    if (userId) {
        await redis.del(`dashboard:stats:${userId}`);
    }
    
    return {
      success: true,
      id: docRef.id,
      error: null,
    };
  } catch (error: any) {
    console.error("❌ Failed to create project:", error.message);
    return {
      success: false,
      id: null,
      error: error.message,
    };
  }
}

// Archive a project
export async function archiveProject(id: string): Promise<{ success: boolean; error: string | null }> {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, { archived: true, updatedAt: Timestamp.now() });
    
    // Invalidate cache
    await redis.del("projects:list:all");
    
    return { success: true, error: null };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Unarchive a project
export async function unarchiveProject(id: string): Promise<{ success: boolean; error: string | null }> {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, { archived: false, updatedAt: Timestamp.now() });
    
    // Invalidate cache
    await redis.del("projects:list:all");
    
    return { success: true, error: null };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Get all projects with optional filters
export async function getProjects(filters?: ProjectFilters): Promise<{
  projects: Project[];
  error: string | null;
}> {
  try {
    console.log("📋 Fetching projects with filters:", filters);
    const constraints: QueryConstraint[] = [];

    // Apply filters
    if (filters?.status) {
      constraints.push(where("status", "==", filters.status));
    }
    if (filters?.priority) {
      constraints.push(where("priority", "==", filters.priority));
    }
    if (filters?.ownerId) {
      constraints.push(where("ownerId", "==", filters.ownerId));
    }
    if (filters?.companyId) {
      constraints.push(where("companyId", "==", filters.companyId));
    }
    if (filters?.dealId) {
      constraints.push(where("dealId", "==", filters.dealId));
    }
    
    // Default to active only unless specified
    if (filters?.archived !== undefined) {
      constraints.push(where("archived", "==", filters.archived));
    } else {
      // By default, exclude archived projects
      constraints.push(where("archived", "==", false));
    }

    // Only add ordering if we have filters (to avoid index requirements)
    if (constraints.length > 0) {
      constraints.push(orderBy("createdAt", "desc"));
    }

    const q = constraints.length > 0
      ? query(collection(db, COLLECTION_NAME), ...constraints)
      : collection(db, COLLECTION_NAME);
      
    // Try Cache for unfiltered requests
    const isUnfiltered = !filters || Object.keys(filters).length === 0 || (Object.keys(filters).length === 1 && filters.search === "");
    const cacheKey = "projects:list:all";

    if (isUnfiltered) {
        const cached = await redis.get<Project[]>(cacheKey);
        if (cached) {
            console.log("⚡ HIT: Projects list from Redis");
            // Rehydrate Timestamps
            const hydrated = cached.map((p: any) => ({
                ...p,
                createdAt: p.createdAt ? new Timestamp(p.createdAt.seconds || 0, p.createdAt.nanoseconds || 0) : null,
                updatedAt: p.updatedAt ? new Timestamp(p.updatedAt.seconds || 0, p.updatedAt.nanoseconds || 0) : null,
                startDate: p.startDate ? new Timestamp(p.startDate.seconds || 0, p.startDate.nanoseconds || 0) : null,
                endDate: p.endDate ? new Timestamp(p.endDate.seconds || 0, p.endDate.nanoseconds || 0) : null,
            }));
            return { projects: hydrated, error: null };
        }
    }
      
    const querySnapshot = await getDocs(q);
    console.log("📊 Projects fetched:", querySnapshot.size);

    const projects: Project[] = [];
    querySnapshot.forEach((doc) => {
      projects.push({ id: doc.id, ...doc.data() } as Project);
    });

    if (projects.length > 0 && isUnfiltered) {
        await redis.set(cacheKey, projects, { ex: 300 });
    }

    // Sort by createdAt on client side
    projects.sort((a, b) => {
      const aTime = a.createdAt?.toMillis?.() || 0;
      const bTime = b.createdAt?.toMillis?.() || 0;
      return bTime - aTime;
    });

    // Apply client-side search filter if provided
    let filteredProjects = projects;
    if (filters?.search) {
      const searchLower = filters.search.toLowerCase();
      filteredProjects = projects.filter(
        (project) =>
          project.name.toLowerCase().includes(searchLower) ||
          project.description?.toLowerCase().includes(searchLower) ||
          project.companyName?.toLowerCase().includes(searchLower)
      );
    }

    // Apply date range filters
    if (filters?.startDateFrom) {
      filteredProjects = filteredProjects.filter(
        (project) => project.startDate.toDate() >= filters.startDateFrom!
      );
    }
    if (filters?.startDateTo) {
      filteredProjects = filteredProjects.filter(
        (project) => project.startDate.toDate() <= filters.startDateTo!
      );
    }

    console.log("✅ Returning", filteredProjects.length, "projects");
    return {
      projects: filteredProjects,
      error: null,
    };
  } catch (error: any) {
    console.error("❌ Failed to fetch projects:", error.message);
    return {
      projects: [],
      error: error.message,
    };
  }
}

// Get a single project by ID
export async function getProject(id: string): Promise<{
  project: Project | null;
  error: string | null;
}> {
  try {
    console.log("🔍 Fetching project:", id);
    const docRef = doc(db, COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      console.log("✅ Project found:", id);
      return {
        project: { id: docSnap.id, ...docSnap.data() } as Project,
        error: null,
      };
    } else {
      console.warn("⚠️ Project not found:", id);
      return {
        project: null,
        error: "Project not found",
      };
    }
  } catch (error: any) {
    console.error("❌ Failed to fetch project:", error.message);
    return {
      project: null,
      error: error.message,
    };
  }
}

// Update a project
export async function updateProject(id: string, data: Partial<ProjectInput>): Promise<{
  success: boolean;
  error: string | null;
}> {
  try {
    console.log("📝 Updating project:", id);
    const docRef = doc(db, COLLECTION_NAME, id);
    
    const updateData = {
      ...data,
      updatedAt: Timestamp.now(),
    };

    const sanitizedData = sanitizeData(updateData);
    await updateDoc(docRef, sanitizedData as any);

    console.log("✅ Project updated successfully");

    // Invalidate cache
    await redis.del("projects:list:all");

    return {
      success: true,
      error: null,
    };
  } catch (error: any) {
    console.error("❌ Failed to update project:", error.message);
    return {
      success: false,
      error: error.message,
    };
  }
}

// Update project status
export async function updateProjectStatus(id: string, status: ProjectStatus): Promise<{
  success: boolean;
  error: string | null;
}> {
  try {
    console.log("📝 Updating project status:", id, "to", status);
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, {
      status,
      updatedAt: Timestamp.now(),
    });

    console.log("✅ Project status updated");

    // Invalidate cache
    await redis.del("projects:list:all");

    return {
      success: true,
      error: null,
    };
  } catch (error: any) {
    console.error("❌ Failed to update project status:", error.message);
    return {
      success: false,
      error: error.message,
    };
  }
}

// Delete a project
export async function deleteProject(id: string): Promise<{
  success: boolean;
  error: string | null;
}> {
  try {
    console.log("🗑️ Deleting project:", id);
    const docRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(docRef);

    console.log("✅ Project deleted successfully");

    // Invalidate cache
    await redis.del("projects:list:all");

    return {
      success: true,
      error: null,
    };
  } catch (error: any) {
    console.error("❌ Failed to delete project:", error.message);
    return {
      success: false,
      error: error.message,
    };
  }
}

// Get projects by company
export async function getProjectsByCompany(companyId: string): Promise<{
  projects: Project[];
  error: string | null;
}> {
  try {
    console.log("📋 Fetching projects for company:", companyId);
    const q = query(
      collection(db, COLLECTION_NAME),
      where("companyId", "==", companyId),
      orderBy("createdAt", "desc")
    );

    const querySnapshot = await getDocs(q);
    const projects: Project[] = [];

    querySnapshot.forEach((doc) => {
      projects.push({ id: doc.id, ...doc.data() } as Project);
    });

    console.log("✅ Found", projects.length, "projects");
    return {
      projects,
      error: null,
    };
  } catch (error: any) {
    console.error("❌ Failed to fetch projects:", error.message);
    return {
      projects: [],
      error: error.message,
    };
  }
}
