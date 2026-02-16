"use server";

import { revalidatePath } from "next/cache";
import {
  clockIn as clockInService,
  clockOut as clockOutService,
  createLeaveRequest,
  updateLeaveStatus,
  createEmployeeProfile,
  getEmployeeProfile,
  updateEmployeeProfile,
} from "@/lib/firestore/hr";
import { auth } from "@/lib/auth/server-auth";
import { adminDb } from "@/lib/firebase-admin";
import type { EmployeeProfileInput, UserRole } from "@/types/crm";

async function getUserRole(uid: string): Promise<UserRole | undefined> {
  const userDoc = await adminDb.collection("users").doc(uid).get();
  return userDoc.data()?.role as UserRole;
}

// ============================================================
// CLOCK IN/CLOCK OUT ACTIONS
// ============================================================

export async function clockIn() {
  try {
    // Get the session from the request
    const session = await auth();
    if (!session?.user?.uid) {
      return { success: false, error: "Unauthorized" };
    }

    const user = session.user;
    const result = await clockInService(
      user.uid,
      user.displayName || user.email || ""
    );

    if (result.success) {
      revalidatePath("/hr/attendance");
      revalidatePath("/dashboard");
    }

    return result;
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function clockOut() {
  try {
    const session = await auth();
    if (!session?.user?.uid) {
      return { success: false, error: "Unauthorized" };
    }

    const result = await clockOutService(session.user.uid);

    if (result.success) {
      revalidatePath("/hr/attendance");
      revalidatePath("/dashboard");
    }

    return result;
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ============================================================
// LEAVE REQUEST ACTIONS
// ============================================================

export async function submitLeaveRequest(data: {
  type: string;
  startDate: string;
  endDate: string;
  reason?: string;
}) {
  try {
    const session = await auth();
    if (!session?.user?.uid) {
      return { success: false, error: "Unauthorized" };
    }

    const result = await createLeaveRequest({
      userId: session.user.uid,
      userName: session.user.displayName || session.user.email || "",
      type: data.type as any,
      startDate: data.startDate,
      endDate: data.endDate,
      daysCount: Math.ceil(
        (new Date(data.endDate).getTime() - new Date(data.startDate).getTime()) /
          (1000 * 60 * 60 * 24)
      ) + 1,
      reason: data.reason,
    });

    if (result.success) {
      revalidatePath("/hr/leaves");
    }

    return result;
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function approveLeaveRequest(data: {
  leaveId: string;
  userId: string;
}) {
  try {
    const session = await auth();
    if (!session?.user?.uid) {
      return { success: false, error: "Unauthorized" };
    }

    // Verify the user is a manager or admin
    const role = await getUserRole(session.user.uid);
    if (role !== "admin" && role !== "manager") {
      return { success: false, error: "Unauthorized: Admins or Managers only" };
    }

    const result = await updateLeaveStatus(
      data.leaveId,
      "Approved",
      session.user.uid,
      session.user.displayName || session.user.email || ""
    );

    if (result.success) {
      revalidatePath("/hr/leaves");
      revalidatePath("/dashboard");
    }

    return result;
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function rejectLeaveRequest(data: {
  leaveId: string;
  reason: string;
}) {
  try {
    const session = await auth();
    if (!session?.user?.uid) {
      return { success: false, error: "Unauthorized" };
    }

    const result = await updateLeaveStatus(
      data.leaveId,
      "Rejected",
      session.user.uid,
      session.user.displayName || session.user.email || "",
      data.reason
    );

    if (result.success) {
      revalidatePath("/hr/leaves");
      revalidatePath("/dashboard");
    }

    return result;
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ============================================================
// EMPLOYEE PROFILE ACTIONS
// ============================================================

export async function createEmployee(data: EmployeeProfileInput & { uid: string }) {
  try {
    const session = await auth();
    if (!session?.user?.uid) {
      return { success: false, error: "Unauthorized" };
    }

    // Verify the user is an admin
    const role = await getUserRole(session.user.uid);
    if (role !== "admin") {
      return { success: false, error: "Unauthorized: Admins only" };
    }

    const result = await createEmployeeProfile(data);

    if (result.success) {
      revalidatePath("/hr/employees");
    }

    return result;
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateEmployee(data: {
  uid: string;
  updates: Partial<Omit<EmployeeProfileInput, "uid">>;
}) {
  try {
    const session = await auth();
    if (!session?.user?.uid) {
      return { success: false, error: "Unauthorized" };
    }

    const role = await getUserRole(session.user.uid);
    
    // Users can only update their own profile unless admin
    if (session.user.uid !== data.uid && role !== "admin") {
      return { success: false, error: "Unauthorized" };
    }

    const result = await updateEmployeeProfile(data.uid, data.updates);

    if (result.success) {
      revalidatePath("/hr/employees");
      revalidatePath("/profile");
    }

    return result;
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ============================================================
// ATTENDANCE QUERIES (for dashboard widgets)
// ============================================================

export async function getTodayClockStatus() {
  try {
    const session = await auth();
    if (!session?.user?.uid) {
      return { isClockedIn: false, error: "Unauthorized" };
    }

    const { getTodayAttendance } = await import("@/lib/firestore/hr");
    const result = await getTodayAttendance(session.user.uid);

    if (result.error) {
      return { isClockedIn: false, error: result.error };
    }

    const record = result.record;
    const isClockedIn = record?.clockIn && !record?.clockOut;

    return {
      isClockedIn,
      clockInTime: record?.clockIn?.toDate?.() || null,
      totalHours: record?.totalHours || 0,
      error: null,
    };
  } catch (error: any) {
    return { isClockedIn: false, error: error.message };
  }
}
