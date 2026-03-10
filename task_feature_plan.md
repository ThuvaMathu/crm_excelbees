# Task Feature Enhancements Plan

## 1. Current State Assessment
- **Component**: The main Task List lives in `app/(dashboard)/tasks/page.tsx`, displaying tasks grouped by status (To Do, In Progress, Review, Done).
- **Data Fetching**: Handled by `getTasks()` in `lib/firestore/tasks.ts` supporting basic filtering, but currently the grid only filters in-memory for the 4 explicit statuses.
- **State**: Filters are not deeply implemented in the UI yet; local state (`useState`) handles the view mode (list vs. calendar).
- **Schema**: The `Task` schema (`lib/validations/task.ts`) has `status` and `priority` enums, `dueDate`, `assigneeId`, and `ownerId`. There is no `associates` array.
- **Modals**: Existing modals are `CreateTaskDialog` (for creating) and `TaskDetailSheet` (for viewing/editing a single task). There is no "List Modal" existing.

**Gaps Identified:**
1. No explicit UI or query support for dynamic Date Ranges or multiple user filters simultaneously.
2. The schema lacks an `associates: string[]` field to support the "Associated with Me" query.
3. No existing list-based Modal exists to show purely "Archived" tasks.

---

## 2. Technical Specification

### Feature 1: Advanced Filtering Logic
*Goal: Simple, performant filtering using local state to avoid Next.js router overhead for a small team.*

*   **Filter State (Local State)**: Implement a complex state object in `page.tsx`:
    ```typescript
    const [filters, setFilters] = useState<{
      userRole: "all" | "assigned" | "created" | "associated";
      dateRange: { from: Date | null; to: Date | null };
      priorities: string[];
      statuses: string[];
    }>({...});
    ```
*   **Schema Update**: Update `lib/validations/task.ts` and Firestore rules to include `associates: z.array(z.string()).default([])`.
*   **Query Layer (`lib/firestore/tasks.ts`)**:
    *   Update `TaskFilters` interface to accept these new parameters natively.
    *   Ensure the `isUnfiltered` Redis cache bypass logic still works specifically for empty filters, but applies specific query constraints (`where("assigneeId", "==", userId)`) when requested.
*   **UI Implementation**: Add a collapsible filter bar beneath the `PageHeader` using standard Tailwind/Shadcn UI (`DropdownMenu` + `Popover` with `Calendar` for dates).

### Feature 2: Archiving Workflow
*Goal: Remove cluttered "Done" tasks from the main view without deleting data.*

*   **Schema & Constraints**:
    *   Add an `isArchived: z.boolean().default(false)` to `Task` schema.
    *   Enforce UI constraint: The "Archive" button only appears inside `TaskDetailSheet` if `task.status === "Done"`.
*   **Query Updating**:
    *   Modify the main `getTasks()` call in `page.tsx` to automatically inject `isArchived: false` so archived tasks never appear in the main grid.
*   **Archive Modal UI**:
    *   Because the existing Modals are single-item focused, we will create a **new** `ArchivedTasksDialog` (a Dialog component containing a simple `Table` or `ScrollArea` of list items).
    *   Place a "View Archived" ghost button beside the "New Task" button in `PageHeader`.
    *   When clicked, it fetches tasks where `isArchived === true` and opens the dialog. Users can click any task in this dialog to open the standard `TaskDetailSheet`.

---

## 3. Implementation Roadmap

1. **Update Schema & Types**
   - In `lib/validations/task.ts`, add `associates: z.array(z.string()).default([])` and `isArchived: z.boolean().default(false)`.
   - Update `types/crm.ts` (if `TaskFilters` exists there) to mirror the new filter parameters.
2. **Backend Query Adjustments**
   - Modify `lib/firestore/tasks.ts`:
     - Default `getTasks` to filter `isArchived: false` unless explicitly requested.
     - Add backend query constraints for Date Ranges (server-side inequalities if indexed, or client-side filtering if avoiding complex composite indexing) and the `associates` array using `array-contains`.
3. **Filter Navigation UI**
   - Inside `app/(dashboard)/tasks/page.tsx`, create the filter bar below the `<PageHeader />`.
   - Implement the local state hook and apply it to the `groupedTasks` rendering logic.
4. **Archive Action Logic**
   - In `lib/firestore/tasks.ts`, create `archiveTask(id: string)` which updates `{ isArchived: true, updatedAt: Timestamp.now() }`.
   - In `TaskDetailSheet.tsx`, add the "Archive Task" button. Disable/hide it if `task.status !== "Done"`.
5. **Archived Tasks Dialog**
   - Create `components/tasks/ArchivedTasksDialog.tsx`.
   - Implement a simple list view. When a task is clicked, handle opening the `TaskDetailSheet` by passing the selected task back up to `page.tsx`'s state.
6. **Integration & Final Polish**
   - Add the "View Archived" button to `page.tsx` beside "New Task".
   - Test data fetching, caching behavior, and ensure Tailwind styling aligns with current CRM aesthetics.
