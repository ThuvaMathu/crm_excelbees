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
  limit,
} from "firebase/firestore";
import { db } from "../firebase";
import type { Activity as ActivityType_Import, ActivityType as ActivityTypeEnum } from "@/types/crm";

const COLLECTION_NAME = "activities";

// Re-export types for convenience
export type Activity = ActivityType_Import;
export type ActivityType = ActivityTypeEnum;
export type ActivityInput = Omit<Activity, "id" | "createdAt">;

// Create a new activity
export async function createActivity(data: ActivityInput): Promise<{
  success: boolean;
  id: string | null;
  error: string | null;
}> {
  try {
    console.log("📝 Creating activity:", data.type);
    
    const activityData = {
      ...data,
      createdAt: Timestamp.now(),
    };

    const docRef = await addDoc(collection(db, COLLECTION_NAME), activityData);
    console.log("✅ Activity created with ID:", docRef.id);
    
    return {
      success: true,
      id: docRef.id,
      error: null,
    };
  } catch (error: any) {
    console.error("❌ Failed to create activity:", error.message);
    return {
      success: false,
      id: null,
      error: error.message,
    };
  }
}

// Get activities for an entity
export async function getActivities(
  entityCollection: string,
  entityId: string,
  activityLimit: number = 50
): Promise<{
  activities: Activity[];
  error: string | null;
}> {
  try {
    console.log("📋 Fetching activities for:", entityCollection, entityId);
    
    const q = query(
      collection(db, COLLECTION_NAME),
      where("relatedTo.collection", "==", entityCollection),
      where("relatedTo.id", "==", entityId),
      orderBy("createdAt", "desc"),
      limit(activityLimit)
    );

    const querySnapshot = await getDocs(q);

    const activities: Activity[] = [];
    querySnapshot.forEach((doc) => {
      activities.push({ id: doc.id, ...doc.data() } as Activity);
    });

    console.log("✅ Found", activities.length, "activities");
    return {
      activities,
      error: null,
    };
  } catch (error: any) {
    console.error("❌ Failed to fetch activities:", error.message);
    return {
      activities: [],
      error: error.message,
    };
  }
}

// Update an activity
export async function updateActivity(
  activityId: string,
  data: Partial<ActivityInput>
): Promise<{
  success: boolean;
  error: string | null;
}> {
  try {
    console.log("✏️ Updating activity:", activityId);
    const docRef = doc(db, COLLECTION_NAME, activityId);
    await updateDoc(docRef, data);

    console.log("✅ Activity updated");
    return {
      success: true,
      error: null,
    };
  } catch (error: any) {
    console.error("❌ Failed to update activity:", error.message);
    return {
      success: false,
      error: error.message,
    };
  }
}

// Delete an activity
export async function deleteActivity(activityId: string): Promise<{
  success: boolean;
  error: string | null;
}> {
  try {
    console.log("🗑️ Deleting activity:", activityId);
    const docRef = doc(db, COLLECTION_NAME, activityId);
    await deleteDoc(docRef);

    console.log("✅ Activity deleted");
    return {
      success: true,
      error: null,
    };
  } catch (error: any) {
    console.error("❌ Failed to delete activity:", error.message);
    return {
      success: false,
      error: error.message,
    };
  }
}

// Log a status change activity
export async function logStatusChange(
  entityCollection: string,
  entityId: string,
  field: string,
  oldValue: any,
  newValue: any,
  userId: string,
  userName?: string
): Promise<{
  success: boolean;
  id: string | null;
  error: string | null;
}> {
  return createActivity({
    type: "status_change",
    content: `${field} changed from "${oldValue}" to "${newValue}"`,
    performedBy: userId,
    performedByName: userName,
    relatedTo: {
      collection: entityCollection,
      id: entityId,
    },
    metadata: {
      field,
      oldValue,
      newValue,
    },
  });
}
