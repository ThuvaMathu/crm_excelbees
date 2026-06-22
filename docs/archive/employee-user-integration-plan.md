# Employee-User Integration Plan

## Goal
Decouple HR Employee records from CRM User accounts to allow independent creation and flexible linking. HR records should be the master source of truth.

## Data Model

### 1. Employees Collection (`employees`)
Currently keyed by `uid` (User UID).
**Change**: Key by auto-generated ID (Firestore ID) to allow creation without a User account.

**New Fields**:
- `id`: string (Firestore Document ID)
- `userId`: string | null (Link to `users` collection, nullable if no access)
- `hasCRMAccess`: boolean (Computed or explicit flag)

### 2. Users Collection (`users`)
Keyed by Auth `uid`.

**New Fields**:
- `employeeId`: string | null (Link to `employees` collection)

## Logic Flow

### Scenario A: User Creation (Add Team Member)
When an Admin adds a new User in the CRM:
1.  **UI**: Add a "Link to Existing Employee" dropdown to the "Add User" form.
    -   Dropdown lists employees where `userId` is null.
2.  **Action**:
    -   If an employee is selected:
        -   Create Auth User -> Get `uid`.
        -   Update User doc -> Set `employeeId` = Employee ID.
        -   Update Employee doc -> Set `userId` = User UID.
    -   If no employee selected:
        -   Create generic User (as per current flow). OR force creation of a new Employee record (as per HR requirement)? *Decision: Optional linking for now, but recommended.*

### Scenario B: HR Profile (Grant CRM Access)
When an HR Manager views an Employee Profile:
1.  **UI**: Check if `userId` is null.
2.  **Action**: Show a "Grant CRM Access" button.
    -   **Click**: Opens a dialog to set Email (pre-filled), Role, and Password.
    -   **Submit**:
        -   Create Auth User -> Get `uid`.
        -   Update Employee doc -> Set `userId` = User UID.
        -   Create User doc -> Set `employeeId` = Employee ID.
        -   Update `hasCRMAccess` = true.

## Missing UI Elements

### 1. Add User Dialog (`components/users/CreateUserDialog.tsx`)
-   [ ] Add `Select` dropdown for "Link Employee".
-   [ ] Fetch available employees (without `userId`) on mount.

### 2. Employee Detail View (`app/(dashboard)/hr/employees/[id]/page.tsx`)
-   [ ] Add "Grant CRM Access" button in the header (visible only if `!employee.userId`).
-   [ ] Create `GrantAccessDialog` component (similar to `CreateUserDialog` but pre-filled).

## Files to Modify

### Data & Types
-   `types/crm.ts`: Update `EmployeeProfile` and `UserProfile` interfaces.
-   `lib/firestore/hr.ts`:
    -   Update `createEmployeeProfile` to support auto-ID.
    -   Add `linkEmployeeToUser(employeeId, userId)`.
    -   Update `getEmployeeProfile` to fetch by auto-ID.
    -   Add `getEmployeeByUserId(userId)` helper.

### Components
-   `components/users/CreateUserDialog.tsx`: Add linking logic.
-   `app/(dashboard)/hr/employees/[id]/page.tsx`: Add "Grant Access" UI.
-   `components/hr/GrantAccessDialog.tsx` (New): Dialog for granting access.

### Pages
-   `app/(dashboard)/hr/employees/page.tsx`: Ensure list displays both linked and unlinked employees correctly.
