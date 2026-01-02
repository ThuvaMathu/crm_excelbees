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
import type { Project, ProjectInput, ProjectFilters, ProjectStatus } from "@/types/crm";

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

    const docRef = await addDoc(collection(db, COLLECTION_NAME), projectData);
    console.log("✅ Project created with ID:", docRef.id);
    
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

    // Only add ordering if we have filters (to avoid index requirements)
    if (constraints.length > 0) {
      constraints.push(orderBy("createdAt", "desc"));
    }

    const q = constraints.length > 0
      ? query(collection(db, COLLECTION_NAME), ...constraints)
      : collection(db, COLLECTION_NAME);
      
    const querySnapshot = await getDocs(q);
    console.log("📊 Projects fetched:", querySnapshot.size);

    const projects: Project[] = [];
    querySnapshot.forEach((doc) => {
      projects.push({ id: doc.id, ...doc.data() } as Project);
    });

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
    await updateDoc(docRef, {
      ...data,
      updatedAt: Timestamp.now(),
    } as any);

    console.log("✅ Project updated successfully");
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
