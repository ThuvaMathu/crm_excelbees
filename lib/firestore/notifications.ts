import {
  collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc,
  query, where, orderBy, Timestamp, limit,
} from "firebase/firestore";
import { db } from "../firebase";
import type { Notification, NotificationType } from "@/types/crm";

const COLLECTION_NAME = "notifications";

export async function createNotification(
  userId: string, type: NotificationType, title: string, message: string,
  entityType: "lead" | "contact" | "deal" | "company" | "project" | "task" | "invoice",
  entityId: string, organizationId?: string
): Promise<{ success: boolean; id: string | null; error: string | null }> {
  try {
    const notificationData: Record<string, any> = { userId, type, title, message, entityType, entityId, read: false, createdAt: Timestamp.now() };
    if (organizationId) notificationData.organizationId = organizationId;
    Object.keys(notificationData).forEach((key) => { if (notificationData[key] === undefined) delete notificationData[key]; });
    const docRef = await addDoc(collection(db, COLLECTION_NAME), notificationData);
    return { success: true, id: docRef.id, error: null };
  } catch (error: any) { return { success: false, id: null, error: error.message }; }
}

export async function getNotifications(userId: string, organizationId?: string, unreadOnly: boolean = false): Promise<{ notifications: Notification[]; error: string | null }> {
  try {
    let notifications: Notification[] = [];
    try {
      const constraints: any[] = [where("userId", "==", userId)];
      if (organizationId) constraints.push(where("organizationId", "==", organizationId));
      constraints.push(orderBy("createdAt", "desc"), limit(50));
      if (unreadOnly) constraints.splice(1, 0, where("read", "==", false));
      const q = query(collection(db, COLLECTION_NAME), ...constraints);
      const querySnapshot = await getDocs(q);
      querySnapshot.forEach((doc) => { notifications.push({ id: doc.id, ...doc.data() } as Notification); });
    } catch (indexError: any) {
      const constraints: any[] = [where("userId", "==", userId)];
      if (organizationId) constraints.push(where("organizationId", "==", organizationId));
      if (unreadOnly) constraints.push(where("read", "==", false));
      const q = query(collection(db, COLLECTION_NAME), ...constraints);
      const querySnapshot = await getDocs(q);
      querySnapshot.forEach((doc) => { notifications.push({ id: doc.id, ...doc.data() } as Notification); });
      notifications.sort((a, b) => { const aT = a.createdAt?.toMillis?.() || 0; const bT = b.createdAt?.toMillis?.() || 0; return bT - aT; });
      notifications = notifications.slice(0, 50);
    }
    return { notifications, error: null };
  } catch (error: any) { return { notifications: [], error: error.message }; }
}

export async function getUnreadCount(userId: string, organizationId?: string): Promise<{ count: number; error: string | null }> {
  try {
    const constraints: any[] = [where("userId", "==", userId), where("read", "==", false)];
    if (organizationId) constraints.push(where("organizationId", "==", organizationId));
    const q = query(collection(db, COLLECTION_NAME), ...constraints);
    const querySnapshot = await getDocs(q);
    return { count: querySnapshot.size, error: null };
  } catch (error: any) {
    try {
      const fallback: any[] = [where("userId", "==", userId)];
      if (organizationId) fallback.push(where("organizationId", "==", organizationId));
      const snap = await getDocs(query(collection(db, COLLECTION_NAME), ...fallback));
      let count = 0;
      snap.forEach((doc) => { if (doc.data().read === false) count++; });
      return { count, error: null };
    } catch (fallbackError: any) { return { count: 0, error: fallbackError.message }; }
  }
}

export async function markAsRead(notificationId: string): Promise<{ success: boolean; error: string | null }> {
  try {
    await updateDoc(doc(db, COLLECTION_NAME, notificationId), { read: true });
    return { success: true, error: null };
  } catch (error: any) { return { success: false, error: error.message }; }
}

export async function markAllAsRead(userId: string, organizationId?: string): Promise<{ success: boolean; error: string | null }> {
  try {
    const constraints: any[] = [where("userId", "==", userId), where("read", "==", false)];
    if (organizationId) constraints.push(where("organizationId", "==", organizationId));
    const q = query(collection(db, COLLECTION_NAME), ...constraints);
    const querySnapshot = await getDocs(q);
    const promises = querySnapshot.docs.map((d) => updateDoc(doc(db, COLLECTION_NAME, d.id), { read: true }));
    await Promise.all(promises);
    return { success: true, error: null };
  } catch (error: any) { return { success: false, error: error.message }; }
}

export async function deleteNotification(notificationId: string): Promise<{ success: boolean; error: string | null }> {
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, notificationId));
    return { success: true, error: null };
  } catch (error: any) { return { success: false, error: error.message }; }
}
