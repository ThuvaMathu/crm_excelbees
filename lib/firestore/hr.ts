import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  Timestamp,
  collection,
  getDocs,
  query,
  where,
  orderBy,
  and,
  or,
} from "firebase/firestore";
import { db } from "../firebase";
import type {
  EmployeeProfile,
  EmployeeProfileInput,
  AttendanceRecord,
  LeaveRequest,
  LeaveRequestInput,
  PayrollRecord,
  AttendanceStatus,
  LeaveStatus,
} from "@/types/crm";

// ============================================================
// HELPERS
// ============================================================

/**
 * Returns the current date in YYYY-MM-DD format based on the local system time.
 * This ensures "Today" is accurate to the user's timezone (assuming server/user align).
 */
export function getLocalISODate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// ============================================================
// EMPLOYEES COLLECTION
// ============================================================

// Create or update employee profile (now uses auto-generated ID)
export async function createEmployeeProfile(
  data: EmployeeProfileInput
): Promise<{ success: boolean; employeeId: string | null; error: string | null }> {
  try {
    const employeeRef = doc(collection(db, "employees"));
    const employeeId = employeeRef.id;

    const employeeData = {
      ...data,
      id: employeeId,
      userId: data.userId || null,
      hasCRMAccess: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(employeeRef, employeeData);

    return { success: true, employeeId, error: null };
  } catch (error: any) {
    return { success: false, employeeId: null, error: error.message };
  }
}

// Get single employee profile by document ID
export async function getEmployeeProfile(
  employeeId: string
): Promise<{ employee: EmployeeProfile | null; error: string | null }> {
  try {
    const employeeRef = doc(db, "employees", employeeId);
    const employeeSnap = await getDoc(employeeRef);

    if (employeeSnap.exists()) {
      return {
        employee: { id: employeeSnap.id, ...employeeSnap.data() } as EmployeeProfile,
        error: null,
      };
    } else {
      return { employee: null, error: "Employee profile not found" };
    }
  } catch (error: any) {
    return { employee: null, error: error.message };
  }
}

// Get employee by userId (for CRM user lookups)
export async function getEmployeeByUserId(
  userId: string
): Promise<{ employee: EmployeeProfile | null; error: string | null }> {
  try {
    const employeesRef = collection(db, "employees");
    const q = query(employeesRef, where("userId", "==", userId));
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      const doc = snapshot.docs[0];
      return {
        employee: { id: doc.id, ...doc.data() } as EmployeeProfile,
        error: null,
      };
    } else {
      return { employee: null, error: "Employee not found for this user" };
    }
  } catch (error: any) {
    return { employee: null, error: error.message };
  }
}

// Get all employees
export async function getAllEmployees(): Promise<{
  employees: EmployeeProfile[] | null;
  error: string | null;
}> {
  try {
    const employeesRef = collection(db, "employees");
    const snapshot = await getDocs(employeesRef);
    const employees = snapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() } as EmployeeProfile)
    );
    return { employees, error: null };
  } catch (error: any) {
    return { employees: null, error: error.message };
  }
}

// Get employees without CRM access (for linking)
export async function getEmployeesWithoutAccess(): Promise<{
  employees: EmployeeProfile[] | null;
  error: string | null;
}> {
  try {
    const employeesRef = collection(db, "employees");
    // Query for employees where userId is null or undefined
    const q = query(employeesRef, where("userId", "==", null));
    const snapshot = await getDocs(q);
    const employees = snapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() } as EmployeeProfile)
    );
    return { employees, error: null };
  } catch (error: any) {
    return { employees: null, error: error.message };
  }
}

// Link employee to CRM user
export async function linkEmployeeToUser(
  employeeId: string,
  userId: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const employeeRef = doc(db, "employees", employeeId);
    await updateDoc(employeeRef, {
      userId,
      hasCRMAccess: true,
      updatedAt: serverTimestamp(),
    });
    return { success: true, error: null };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Unlink employee from CRM user (revoke access)
export async function unlinkEmployeeFromUser(
  employeeId: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const employeeRef = doc(db, "employees", employeeId);
    await updateDoc(employeeRef, {
      userId: null,
      hasCRMAccess: false,
      updatedAt: serverTimestamp(),
    });
    return { success: true, error: null };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Get employees by department
export async function getEmployeesByDepartment(
  department: string
): Promise<{ employees: EmployeeProfile[] | null; error: string | null }> {
  try {
    const employeesRef = collection(db, "employees");
    const q = query(employeesRef, where("department", "==", department));
    const snapshot = await getDocs(q);
    const employees = snapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() } as EmployeeProfile)
    );
    return { employees, error: null };
  } catch (error: any) {
    return { employees: null, error: error.message };
  }
}

// Get employees that report to a specific manager
export async function getTeamEmployees(
  managerId: string
): Promise<{ employees: EmployeeProfile[] | null; error: string | null }> {
  try {
    const employeesRef = collection(db, "employees");
    const q = query(employeesRef, where("reportsTo", "==", managerId));
    const snapshot = await getDocs(q);
    const employees = snapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() } as EmployeeProfile)
    );
    return { employees, error: null };
  } catch (error: any) {
    return { employees: null, error: error.message };
  }
}

// Update employee profile
export async function updateEmployeeProfile(
  employeeId: string,
  data: Partial<Omit<EmployeeProfile, "id" | "createdAt" | "updatedAt">>
): Promise<{ success: boolean; error: string | null }> {
  try {
    const employeeRef = doc(db, "employees", employeeId);
    await updateDoc(employeeRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
    return { success: true, error: null };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Delete employee profile
export async function deleteEmployeeProfile(
  employeeId: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const employeeRef = doc(db, "employees", employeeId);
    await deleteDoc(employeeRef);
    return { success: true, error: null };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Add document to employee profile
export async function addEmployeeDocument(
  employeeId: string,
  document: { name: string; url: string; type: string; size: number }
): Promise<{ success: boolean; error: string | null }> {
  try {
    const employeeRef = doc(db, "employees", employeeId);
    const employeeSnap = await getDoc(employeeRef);
    
    if (!employeeSnap.exists()) {
      return { success: false, error: "Employee not found" };
    }

    const currentDocs = employeeSnap.data().documents || [];
    const newDoc = {
      id: crypto.randomUUID(),
      ...document,
      uploadedAt: Timestamp.now(), // Use Firestore Timestamp
    };

    await updateDoc(employeeRef, {
      documents: [...currentDocs, newDoc],
      updatedAt: serverTimestamp(),
    });

    return { success: true, error: null };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Remove document from employee profile
export async function removeEmployeeDocument(
  employeeId: string,
  documentId: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const employeeRef = doc(db, "employees", employeeId);
    const employeeSnap = await getDoc(employeeRef);
    
    if (!employeeSnap.exists()) {
      return { success: false, error: "Employee not found" };
    }

    const currentDocs = employeeSnap.data().documents || [];
    const updatedDocs = currentDocs.filter((doc: any) => doc.id !== documentId);

    await updateDoc(employeeRef, {
      documents: updatedDocs,
      updatedAt: serverTimestamp(),
    });

    return { success: true, error: null };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ============================================================
// ATTENDANCE COLLECTION
// ============================================================

// Clock in
export async function clockIn(
  userId: string,
  userName: string,
  notes?: string
): Promise<{ success: boolean; error: string | null; record?: AttendanceRecord }> {
  try {
    const today = getLocalISODate(); // Fixed: Use local date

    // Check if already clocked in today
    const attendanceRef = collection(db, "attendance");
    const q = query(
      attendanceRef,
      where("userId", "==", userId),
      where("date", "==", today)
    );
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      const existing = snapshot.docs[0];
      const data = existing.data();
      if (data.clockOut === null || data.clockOut === undefined) {
        return { success: false, error: "Already clocked in. Please clock out first." };
      }
    }

    // Create new attendance record
    const newRecordRef = doc(collection(db, "attendance"));
    const recordData = {
      userId,
      userName,
      date: today,
      clockIn: serverTimestamp(),
      clockOut: null,
      breakStart: null,
      breakEnd: null,
      totalHours: 0,
      status: (new Date().getHours() >= 9 && new Date().getMinutes() > 0) ? "Late" : "Present" as AttendanceStatus,
      notes: notes || "",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(newRecordRef, recordData);

    return {
      success: true,
      error: null,
      record: { id: newRecordRef.id, ...recordData } as unknown as AttendanceRecord,
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Clock out
export async function clockOut(
  userId: string,
  notes?: string
): Promise<{ success: boolean; error: string | null; totalHours?: number }> {
  try {
    const today = getLocalISODate();

    const attendanceRef = collection(db, "attendance");
    const q = query(
      attendanceRef,
      where("userId", "==", userId),
      where("date", "==", today)
    );
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return { success: false, error: "No clock-in record found for today." };
    }

    const docRef = snapshot.docs[0].ref;
    const data = snapshot.docs[0].data();

    if (data.clockOut) {
      return { success: false, error: "Already clocked out today." };
    }

    // Calculate total hours
    const clockInTime = data.clockIn?.toDate() || new Date();
    const clockOutTime = new Date();
    const diffMs = clockOutTime.getTime() - clockInTime.getTime();
    const totalHours = parseFloat((diffMs / (1000 * 60 * 60)).toFixed(2));

    await updateDoc(docRef, {
      clockOut: serverTimestamp(),
      totalHours,
      notes: notes ? (data.notes ? `${data.notes}\n${notes}` : notes) : data.notes,
      updatedAt: serverTimestamp(),
    });

    return { success: true, error: null, totalHours };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Get today's attendance status for a user
export async function getTodayAttendance(
  userId: string
): Promise<{ record: AttendanceRecord | null; error: string | null }> {
  try {
    const today = getLocalISODate();

    const attendanceRef = collection(db, "attendance");
    const q = query(
      attendanceRef,
      where("userId", "==", userId),
      where("date", "==", today)
    );
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return { record: null, error: null };
    }

    const data = snapshot.docs[0].data();
    return {
      record: { id: snapshot.docs[0].id, ...data } as AttendanceRecord,
      error: null,
    };
  } catch (error: any) {
    return { record: null, error: error.message };
  }
}

// Get attendance history for a user
export async function getAttendanceHistory(
  userId: string,
  startDate?: string,
  endDate?: string,
  limit: number = 30
): Promise<{ records: AttendanceRecord[] | null; error: string | null }> {
  try {
    const attendanceRef = collection(db, "attendance");
    let q = query(
      attendanceRef,
      where("userId", "==", userId),
      orderBy("date", "desc")
    );

    // Add date filters if provided
    if (startDate) {
      q = query(q, where("date", ">=", startDate));
    }
    if (endDate) {
      q = query(q, where("date", "<=", endDate));
    }

    const snapshot = await getDocs(q);
    const records = snapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() } as AttendanceRecord))
      .slice(0, limit);

    return { records, error: null };
  } catch (error: any) {
    return { records: null, error: error.message };
  }
}

// Get team attendance for a date range (for managers)
export async function getTeamAttendance(
  userIds: string[],
  startDate: string,
  endDate: string
): Promise<{ records: AttendanceRecord[] | null; error: string | null }> {
  try {
    const attendanceRef = collection(db, "attendance");
    const q = query(
      attendanceRef,
      and(
        where("userId", "in", userIds.slice(10)), // Firestore limitation: max 10 items in 'in'
        where("date", ">=", startDate),
        where("date", "<=", endDate)
      ),
      orderBy("date", "desc")
    );

    const snapshot = await getDocs(q);
    const records = snapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() } as AttendanceRecord)
    );

    return { records, error: null };
  } catch (error: any) {
    return { records: null, error: error.message };
  }
}

// ============================================================
// LEAVES COLLECTION
// ============================================================

// Create leave request
export async function createLeaveRequest(
  data: LeaveRequestInput
): Promise<{ success: boolean; error: string | null; leaveId?: string }> {
  try {
    const newLeaveRef = doc(collection(db, "leaves"));
    const leaveData = {
      ...data,
      status: "Pending" as LeaveStatus,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(newLeaveRef, leaveData);

    return { success: true, error: null, leaveId: newLeaveRef.id };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Get leave requests for a user
export async function getUserLeaveRequests(
  userId: string
): Promise<{ leaves: LeaveRequest[] | null; error: string | null }> {
  try {
    const leavesRef = collection(db, "leaves");
    const q = query(
      leavesRef,
      where("userId", "==", userId),
      orderBy("createdAt", "desc")
    );
    const snapshot = await getDocs(q);
    const leaves = snapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() } as LeaveRequest)
    );
    return { leaves, error: null };
  } catch (error: any) {
    return { leaves: null, error: error.message };
  }
}

// Get pending leave requests (for managers/admin)
export async function getPendingLeaveRequests(): Promise<{
  leaves: LeaveRequest[] | null;
  error: string | null;
}> {
  try {
    const leavesRef = collection(db, "leaves");
    const q = query(
      leavesRef,
      where("status", "==", "Pending"),
      orderBy("createdAt", "desc")
    );
    const snapshot = await getDocs(q);
    const leaves = snapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() } as LeaveRequest)
    );
    return { leaves, error: null };
  } catch (error: any) {
    return { leaves: null, error: error.message };
  }
}

// Get leave requests for a team (for managers)
export async function getTeamLeaveRequests(
  userIds: string[]
): Promise<{ leaves: LeaveRequest[] | null; error: string | null }> {
  try {
    const leavesRef = collection(db, "leaves");
    const q = query(
      leavesRef,
      where("userId", "in", userIds.slice(10)),
      orderBy("createdAt", "desc")
    );
    const snapshot = await getDocs(q);
    const leaves = snapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() } as LeaveRequest)
    );
    return { leaves, error: null };
  } catch (error: any) {
    return { leaves: null, error: error.message };
  }
}

// Approve/Reject leave request
export async function updateLeaveStatus(
  leaveId: string,
  status: LeaveStatus,
  managerId: string,
  managerName: string,
  rejectionReason?: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const leaveRef = doc(db, "leaves", leaveId);

    const updateData: any = {
      status,
      managerId,
      managerName,
      updatedAt: serverTimestamp(),
    };

    if (status === "Approved") {
      updateData.approvedAt = serverTimestamp();
    }

    if (rejectionReason) {
      updateData.rejectionReason = rejectionReason;
    }

    await updateDoc(leaveRef, updateData);

    return { success: true, error: null };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Cancel leave request (by employee)
export async function cancelLeaveRequest(
  leaveId: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const leaveRef = doc(db, "leaves", leaveId);
    await updateDoc(leaveRef, {
      status: "Cancelled" as LeaveStatus,
      updatedAt: serverTimestamp(),
    });
    return { success: true, error: null };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ============================================================
// PAYROLL COLLECTION
// ============================================================

// Create payroll record
export async function createPayrollRecord(
  data: Omit<PayrollRecord, "id" | "createdAt" | "updatedAt">
): Promise<{ success: boolean; error: string | null; payrollId?: string }> {
  try {
    const newPayrollRef = doc(collection(db, "payroll"));
    const payrollData = {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(newPayrollRef, payrollData);

    return { success: true, error: null, payrollId: newPayrollRef.id };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Get payroll records for a user
export async function getUserPayrollRecords(
  userId: string
): Promise<{ payrolls: PayrollRecord[] | null; error: string | null }> {
  try {
    const payrollRef = collection(db, "payroll");
    const q = query(
      payrollRef,
      where("userId", "==", userId),
      orderBy("periodStart", "desc")
    );
    const snapshot = await getDocs(q);
    const payrolls = snapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() } as PayrollRecord)
    );
    return { payrolls, error: null };
  } catch (error: any) {
    return { payrolls: null, error: error.message };
  }
}

// Get all payroll records (admin only)
export async function getAllPayrollRecords(
  periodStart?: string,
  periodEnd?: string
): Promise<{ payrolls: PayrollRecord[] | null; error: string | null }> {
  try {
    const payrollRef = collection(db, "payroll");
    let q = query(payrollRef, orderBy("periodStart", "desc"));

    if (periodStart && periodEnd) {
      q = query(
        payrollRef,
        where("periodStart", ">=", periodStart),
        where("periodEnd", "<=", periodEnd),
        orderBy("periodStart", "desc")
      );
    }

    const snapshot = await getDocs(q);
    const payrolls = snapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() } as PayrollRecord)
    );
    return { payrolls, error: null };
  } catch (error: any) {
    return { payrolls: null, error: error.message };
  }
}

// Update payroll status
export async function updatePayrollStatus(
  payrollId: string,
  status: PayrollRecord["status"]
): Promise<{ success: boolean; error: string | null }> {
  try {
    const payrollRef = doc(db, "payroll", payrollId);
    await updateDoc(payrollRef, {
      status,
      updatedAt: serverTimestamp(),
    });
    return { success: true, error: null };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Calculate days between two dates (for leave)
export function calculateDaysBetween(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  return diffDays;
}
