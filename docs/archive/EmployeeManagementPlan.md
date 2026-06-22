# Employee Management Module - Strategic Plan

> **Date:** 2026-02-12
> **Status:** ✅ **COMPLETED** — Fully Implemented
> **Goal:** Build a robust but basic Employee Management system (Directory, Attendance, Leave, Payroll) integrated with existing CRM RBAC.

---

## 1. Database Schema (Firestore)

We will introduce 4 new collections. The `employees` collection will extend the base `users` data with HR-specific information.

### 1.1 `employees` Collection
**Document ID:** `uid` (Same as `users` collection for 1:1 mapping)

```typescript
interface EmployeeProfile {
  uid: string;                 // Links to users/{uid}
  email: string;               // Copied from users
  firstName: string;           // Copied from users
  lastName: string;            // Copied from users
  photoURL?: string;           // Copied from users
  
  // HR Details
  department: string;          // e.g., "Sales", "Engineering", "HR"
  jobTitle: string;            // e.g., "Senior Developer"
  startDate: Timestamp;        // Date of joining
  employmentType: "Full-Time" | "Part-Time" | "Contract" | "Intern";
  reportsTo?: string;          // UID of the manager
  
  // Personal Info (Access Restricted)
  phone?: string;
  address?: string;
  emergencyContact?: {
    name: string;
    relationship: string;
    phone: string;
  };
  
  // System Metadata
  onboardingStatus: "Pending" | "In Progress" | "Completed";
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### 1.2 `attendance` Collection
**Document ID:** Auto-generated

```typescript
interface AttendanceRecord {
  id: string;
  userId: string;              // Employee UID
  userName: string;            // Snapshot for display
  date: string;                // YYYY-MM-DD (Query index)
  
  clockIn: Timestamp;
  clockOut?: Timestamp;
  breakStart?: Timestamp;      // Optional (Keep simple: 1 break?)
  breakEnd?: Timestamp;
  
  totalHours: number;          // Calculated on clock out (hours)
  status: "Present" | "Absent" | "Half-Day" | "Late";
  notes?: string;              // "Forgot to clock out", etc.
  
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### 1.3 `leaves` Collection
**Document ID:** Auto-generated

```typescript
type LeaveType = "Sick" | "Vacation" | "Personal" | "Unpaid";
type LeaveStatus = "Pending" | "Approved" | "Rejected" | "Cancelled";

interface LeaveRequest {
  id: string;
  userId: string;
  userName: string;
  department?: string;         // Snapshot for filtering
  
  type: LeaveType;
  startDate: string;           // YYYY-MM-DD
  endDate: string;             // YYYY-MM-DD
  daysCount: number;           // 1, 2, 0.5, etc.
  reason?: string;
  
  status: LeaveStatus;
  managerId?: string;          // Who approved/rejected (from reportsTo or Admin)
  managerName?: string;
  approvedAt?: Timestamp;
  rejectionReason?: string;
  
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

> **Note:** A simple "Leave Balance" map can be stored on the `EmployeeProfile`:
> `leaveBalance: { vacation: 10, sick: 5, used: { vacation: 2, sick: 1 } }`

### 1.4 `payroll` Collection
**Document ID:** Auto-generated (or `userId_Year_Month`)

```typescript
interface PayrollRecord {
  id: string;
  userId: string;
  userName: string;
  
  periodStart: string;         // YYYY-MM-DD
  periodEnd: string;           // YYYY-MM-DD
  payoutDate: string;          // YYYY-MM-DD
  
  baseSalary: number;          // Monthly/Bi-weekly gross
  currency: string;            // "USD"
  
  // Simple structure - No complex tax engine yet
  additions?: { description: string; amount: number }[]; // Bonuses
  deductions?: { description: string; amount: number }[]; // Tax/Insurance
  
  netSalary: number;           // Base + Additions - Deductions
  status: "Draft" | "Processing" | "Paid";
  
  payslipUrl?: string;         // Link to generated PDF in Storage
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

---

## 2. UI Architecture

We will add a new top-level section `/hr` or `/employees` to the Dashboard.

### 2.1 Navigation Structure
*   **Employees** (`/dashboard/employees`)
    *   **Directory** (Default View) - Grid/List of all employees.
    *   **My Profile** - View own details, simple edit.
    *   **Org Chart** (Phase 2) - Visual hierarchy.
*   **Attendance** (`/dashboard/attendance`)
    *   **My Attendance** - Clock In/Out button, Weekly timesheet.
    *   **Team Attendance** (Managers/Admin) - View team's daily status.
*   **Leaves** (`/dashboard/leaves`)
    *   **My Leaves** - Balance card, Request button, History list.
    *   **Approvals** (Managers/Admin) - List of pending requests.
*   **Payroll** (`/dashboard/payroll`) - Admin Only
    *   **Run Payroll** - Generate records for a period.
    *   **Payslips** - List sent payslips.

### 2.2 Key Components
1.  `EmployeeCard` - Display photo, name, role, status.
2.  `ClockInButton` - Prominent widget in Header or Dashboard Home.
3.  `LeaveBalanceCard` - Visual progress bar of used vs. available days.
4.  `LeaveRequestDialog` - Simple form with DatePicker range.
5.  `PayrollTable` - Admin view to edit/process salaries.

---

## 3. Access Control Matrix

We will integrate with the existing `UserPermissions` system defined in `types/crm.ts`.

### 3.1 New Permission Module: `hr`

We'll add a new key `hr` to the `UserPermissions` interface.

```typescript
// Proposed addition to UserPermissions
hr: {
  employees: ModulePermission;   // Directory access
  attendance: ModulePermission;  // Time tracking
  leaves: ModulePermission;      // Leave management
  payroll: ModulePermission;     // Salary info
}
```

### 3.2 Role-Based Access Table

| Feature | Admin | Manager | Employee (Team) |
| :--- | :---: | :---: | :---: |
| **Directory** | View All, Create, Edit, Delete | View All (Read-Only) | View All (Read-Only) |
| **Employee Profile** | Edit Any | View Team, Edit Own | Edit Own (Limited) |
| **Compensation** | View/Edit All | View Own | View Own |
| **Attendance** | View All, Edit Any | View Team, Edit Tags | Clock In/Out Only |
| **Leave Requests** | Approve/Reject Any | Approve/Reject Team | Request Own |
| **Payroll** | Process, View All | View Own Payslip | View Own Payslip |

### 3.3 Manager Logic (`reportsTo`)
*   **Team View:** Managers queries where `reportsTo == manager.uid`.
*   **Approval:** A manager can only approve leaves for users where `reportsTo == manager.uid`.
*   **Admin Override:** Admins can see/approve everything regardless of hierarchy.

---

## 4. Implementation Roadmap

### Phase 1: Database & Types Setup
1.  **Update `types/crm.ts`**:
    *   Add `EmployeeProfile`, `AttendanceRecord`, `LeaveRequest`, `PayrollRecord` interfaces.
    *   Add `hr` module to `UserPermissions`.
    *   Update `ROLE_DEFAULTS` for `admin`, `manager`, `team`.
2.  **Firestore Rules**:
    *   Create rules for `employees` (read: auth, write: admin/own).
    *   Create rules for `leaves` (create: own, update: manager/admin).
    *   Create rules for `payroll` (read: own, write: admin).

### Phase 2: Employee Directory & Profile
1.  **Backend**: Create `createEmployee` function (triggers when User is created or manual Admin entry).
2.  **UI**: Build `/dashboard/employees` page.
    *   List view with search/filter by Department.
    *   `EmployeeDetail` sheet/page with tabs (Overview, Personal, Job).
3.  **Sync**: Ensure `users` collection updates sync to `employees` (e.g. photoURL change).

### Phase 3: Attendance System
1.  **Backend**: `clockIn()` and `clockOut()` server actions / API routes.
    *   Handle logic: prevent double clock-in, auto-calculate hours.
2.  **UI**: Add `TimeTracker` widget to Dashboard Sidebar or Header.
    *   Build `/dashboard/attendance` page with `WeeklyTimesheet` component.

### Phase 4: Leave Management
1.  **Backend**: `requestLeave()` and `approveLeave()` actions.
    *   Validate balance before request.
    *   Update balance on approval.
2.  **UI**: Build `/dashboard/leaves`.
    *   "Request Leave" button → Dialog.
    *   "Pending Approvals" section for Managers.

### Phase 5: Basic Payroll (Admin Only)
1.  **Backend**: `generatePayroll(period)` function.
    *   Simple math: `baseSalary / 2` (if bi-weekly). No tax calc.
2.  **UI**: Build `/dashboard/payroll`.
    *   Table to view/edit calculated amounts.
    *   "Publish" button to make payslips visible to employees.

### Phase 6: Integration & Polish
1.  **Sidebar:** Add "HR" section with collapsible links.
2.  **Dashboard:** Add "Who's Out Today" widget.
3.  **Notifications:** Email manager on Leave Request; Email employee on Approval.

---

---

## ✅ IMPLEMENTATION COMPLETE (2026-02-12)

### What Was Implemented

#### 1. Database Schema & Types
- ✅ Added HR module to `UserPermissions` in `types/crm.ts`
- ✅ Created `EmployeeProfile`, `AttendanceRecord`, `LeaveRequest`, `PayrollRecord` types
- ✅ Updated `ROLE_DEFAULTS` for admin, manager, team roles with HR permissions

#### 2. Firestore Services (`lib/firestore/hr.ts`)
- ✅ `createEmployeeProfile`, `getEmployeeProfile`, `getAllEmployees`, `getTeamEmployees`
- ✅ `clockIn`, `clockOut`, `getTodayAttendance`, `getAttendanceHistory`
- ✅ `createLeaveRequest`, `getUserLeaveRequests`, `getPendingLeaveRequests`, `updateLeaveStatus`
- ✅ `createPayrollRecord`, `getUserPayrollRecords`, `getAllPayrollRecords`, `updatePayrollStatus`

#### 3. HR Pages
- ✅ `/hr/employees` - Employee Directory with filters, search, department view
- ✅ `/hr/attendance` - Clock In/Out widget, attendance history, team view for managers
- ✅ `/hr/leaves` - Leave balance cards, request dialog, approval interface for managers
- ✅ `/hr/payroll` - Payslip view, payroll management (admin only), status updates
- ✅ `/hr` - Index page redirecting to employees

#### 4. Navigation
- ✅ Added HR section to Sidebar with collapsible menu
- ✅ Links to Employees, Attendance, Leaves, Payroll pages

#### 5. Components (`components/hr/`)
- ✅ `ClockInWidget` - Quick clock in/out widget
- ✅ `EmployeeCard` - Employee profile card component
- ✅ `LeaveBalanceCard` - Visual leave balance display
- ✅ `WhoIsOutWidget` - Shows who's on leave today

#### 6. Server Actions (`lib/actions/hr-actions.ts`)
- ✅ `clockIn`, `clockOut` server actions
- ✅ `submitLeaveRequest`, `approveLeaveRequest`, `rejectLeaveRequest` server actions
- ✅ `createEmployee`, `updateEmployee` server actions
- ✅ Path revalidation for UI updates

#### 7. RBAC Integration
- ✅ Added `canHr` and `canHrEditAll` to `usePermission` hook
- ✅ Managers can only view/edit their direct reports
- ✅ Admins have full access to all HR features
- ✅ Team members have read-only access and can create own requests

### Notes for Future Enhancements
1. **Email Notifications**: Add email triggers for leave requests/approvals
2. **Firestore Indexes**: Set up composite indexes for `attendance` (userId + date) and `leaves` queries
3. **PDF Generation**: Implement payslip PDF generation for payroll module
4. **Calendar Integration**: Sync leave dates with external calendars
5. **Break Tracking**: Add break start/end functionality to attendance
