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
import type { Notification, NotificationType } from "@/types/crm";

const COLLECTION_NAME = "notifications";

// Create a new notification
export async function createNotification(
  userId: string,
  type: NotificationType,
  title: string,
  message: string,
  entityType: "lead" | "contact" | "deal" | "company" | "project" | "task" | "invoice",
  entityId: string
): Promise<{
  success: boolean;
  id: string | null;
  error: string | null;
}> {
  try {
    console.log("🔔 Creating notification for user:", userId);
    
    const notificationData = {
      userId,
      type,
      title,
      message,
      entityType,
      entityId,
      read: false,
      createdAt: Timestamp.now(),
    };

    const docRef = await addDoc(collection(db, COLLECTION_NAME), notificationData);
    console.log("✅ Notification created with ID:", docRef.id);
    
    return {
      success: true,
      id: docRef.id,
      error: null,
    };
  } catch (error: any) {
    console.error("❌ Failed to create notification:", error.message);
    return {
      success: false,
      id: null,
      error: error.message,
    };
  }
}

// Get notifications for a user
export async function getNotifications(userId: string, unreadOnly: boolean = false): Promise<{
  notifications: Notification[];
  error: string | null;
}> {
  try {
    console.log("📋 Fetching notifications for user:", userId);
    
    const constraints = [
      where("userId", "==", userId),
      orderBy("createdAt", "desc"),
      limit(50),
    ];

    if (unreadOnly) {
      constraints.splice(1, 0, where("read", "==", false));
    }

    const q = query(collection(db, COLLECTION_NAME), ...constraints);
    const querySnapshot = await getDocs(q);

    const notifications: Notification[] = [];
    querySnapshot.forEach((doc) => {
      notifications.push({ id: doc.id, ...doc.data() } as Notification);
    });

    console.log("✅ Found", notifications.length, "notifications");
    return {
      notifications,
      error: null,
    };
  } catch (error: any) {
    console.error("❌ Failed to fetch notifications:", error.message);
    return {
      notifications: [],
      error: error.message,
    };
  }
}

// Get unread count
export async function getUnreadCount(userId: string): Promise<{
  count: number;
  error: string | null;
}> {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where("userId", "==", userId),
      where("read", "==", false)
    );

    const querySnapshot = await getDocs(q);
    
    return {
      count: querySnapshot.size,
      error: null,
    };
  } catch (error: any) {
    console.error("❌ Failed to get unread count:", error.message);
    return {
      count: 0,
      error: error.message,
    };
  }
}

// Mark notification as read
export async function markAsRead(notificationId: string): Promise<{
  success: boolean;
  error: string | null;
}> {
  try {
    console.log("✓ Marking notification as read:", notificationId);
    const docRef = doc(db, COLLECTION_NAME, notificationId);
    await updateDoc(docRef, {
      read: true,
    });

    console.log("✅ Notification marked as read");
    return {
      success: true,
      error: null,
    };
  } catch (error: any) {
    console.error("❌ Failed to mark as read:", error.message);
    return {
      success: false,
      error: error.message,
    };
  }
}

// Mark all notifications as read for a user
export async function markAllAsRead(userId: string): Promise<{
  success: boolean;
  error: string | null;
}> {
  try {
    console.log("✓ Marking all notifications as read for user:", userId);
    
    const q = query(
      collection(db, COLLECTION_NAME),
      where("userId", "==", userId),
      where("read", "==", false)
    );

    const querySnapshot = await getDocs(q);
    
    const updatePromises = querySnapshot.docs.map((document) =>
      updateDoc(doc(db, COLLECTION_NAME, document.id), { read: true })
    );

    await Promise.all(updatePromises);

    console.log("✅ All notifications marked as read");
    return {
      success: true,
      error: null,
    };
  } catch (error: any) {
    console.error("❌ Failed to mark all as read:", error.message);
    return {
      success: false,
      error: error.message,
    };
  }
}

// Delete a notification
export async function deleteNotification(notificationId: string): Promise<{
  success: boolean;
  error: string | null;
}> {
  try {
    console.log("🗑️ Deleting notification:", notificationId);
    const docRef = doc(db, COLLECTION_NAME, notificationId);
    await deleteDoc(docRef);

    console.log("✅ Notification deleted");
    return {
      success: true,
      error: null,
    };
  } catch (error: any) {
    console.error("❌ Failed to delete notification:", error.message);
    return {
      success: false,
      error: error.message,
    };
  }
}
