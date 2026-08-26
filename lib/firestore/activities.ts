import {
  collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc,
  query, where, orderBy, Timestamp, limit,
} from "firebase/firestore";
import { db } from "../firebase";
import type { Activity as ActivityType_Import, ActivityType as ActivityTypeEnum } from "@/types/crm";

const COLLECTION_NAME = "activities";

export type Activity = ActivityType_Import;
export type ActivityType = ActivityTypeEnum;
export type ActivityInput = Omit<Activity, "id" | "createdAt">;

export async function createActivity(data: ActivityInput): Promise<{ success: boolean; id: string | null; error: string | null }> {
  try {
    const activityData: Record<string, any> = { ...data, createdAt: Timestamp.now() };
    Object.keys(activityData).forEach((key) => { if (activityData[key] === undefined) delete activityData[key]; });
    const docRef = await addDoc(collection(db, COLLECTION_NAME), activityData);
    return { success: true, id: docRef.id, error: null };
  } catch (error: any) { return { success: false, id: null, error: error.message }; }
}

export async function getActivities(entityCollection: string, entityId: string, activityLimit: number = 50): Promise<{ activities: Activity[]; error: string | null }> {
  try {
    const q = query(collection(db, COLLECTION_NAME), where("relatedTo.collection", "==", entityCollection), where("relatedTo.id", "==", entityId), orderBy("createdAt", "desc"), limit(activityLimit));
    const querySnapshot = await getDocs(q);
    const activities: Activity[] = [];
    querySnapshot.forEach((doc) => { activities.push({ id: doc.id, ...doc.data() } as Activity); });
    return { activities, error: null };
  } catch (error: any) { return { activities: [], error: error.message }; }
}

export async function getOrganizationActivities(organizationId: string, activityLimit: number = 50): Promise<{ activities: Activity[]; error: string | null }> {
  try {
    const q = query(collection(db, COLLECTION_NAME), where("organizationId", "==", organizationId), orderBy("createdAt", "desc"), limit(activityLimit));
    const querySnapshot = await getDocs(q);
    const activities: Activity[] = [];
    querySnapshot.forEach((doc) => { activities.push({ id: doc.id, ...doc.data() } as Activity); });
    return { activities, error: null };
  } catch (error: any) { return { activities: [], error: error.message }; }
}

export async function updateActivity(activityId: string, data: Partial<ActivityInput>): Promise<{ success: boolean; error: string | null }> {
  try {
    const docRef = doc(db, COLLECTION_NAME, activityId);
    await updateDoc(docRef, data);
    return { success: true, error: null };
  } catch (error: any) { return { success: false, error: error.message }; }
}

export async function deleteActivity(activityId: string): Promise<{ success: boolean; error: string | null }> {
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, activityId));
    return { success: true, error: null };
  } catch (error: any) { return { success: false, error: error.message }; }
}

export async function logStatusChange(entityCollection: string, entityId: string, field: string, oldValue: any, newValue: any, userId: string, userName?: string, organizationId?: string): Promise<{ success: boolean; id: string | null; error: string | null }> {
  return createActivity({ type: "status_change", content: `${field} changed from "${oldValue}" to "${newValue}"`, performedBy: userId, performedByName: userName, organizationId, relatedTo: { collection: entityCollection, id: entityId }, metadata: { field, oldValue, newValue } });
}
