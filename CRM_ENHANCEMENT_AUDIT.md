
# CRM Enhancement Audit

| Module | Feature | Location | Deficit | Implementation Strategy |
| :--- | :--- | :--- | :--- | :--- |
| Leads | Conversion | app/(dashboard)/leads/[id]/page.tsx | Missing 'Lead to Deal' and 'Lead to Project' conversion paths. Only 'Lead to Contact' exists. | Implement `convertLeadToDeal` and `convertLeadToProject` functions in `leads.ts` and add UI actions. Pre-fill data from Lead. |
| Deals | Conversion | app/(dashboard)/deals/[id]/page.tsx | Missing 'Deal to Project' functionality. Cannot create a project from a won deal. | Add 'Create Project' button in Deal details. Create `createProjectFromDeal` function to pre-fill budget, client, and description. |
| Companies | Relationships | app/(dashboard)/companies/[id]/page.tsx | Missing 'Create Project' quick action. Can only create Deals. | Add 'Create Project' button. Pre-fill Company Name and contact info. |
| Contacts | Relationships | app/(dashboard)/contacts/[id]/page.tsx | Missing 'Create Project' and 'Create Deal' quick actions. | Add 'Create Project' and 'Create Deal' buttons. Pre-fill Contact info. |
| Marketing | AI UX | app/(dashboard)/marketing/email/page.tsx | 'Generate Subjects' logic uses a Toast action for selection, which is poor UX. Users might miss it or find it hard to compare. | Replace Toast with a proper 'Select Subject' Dialog or inline list selection. allow users to preview and click to apply directly to the input field. |
| Projects | Data Integrity | lib/firestore/projects.ts | `createProject` lacks sanitization for `undefined` values. Will crash Firestore `addDoc` if optional fields are undefined. | Add `sanitizeData` helper to valid input before calling `addDoc`. |
| Tasks | Data Integrity | lib/firestore/tasks.ts | `createTask` and `updateTask` lack sanitization for `undefined` values. | Add `sanitizeData` helper. |
| Projects | Archiving | lib/firestore/projects.ts | Missing 'Archive' functionality. Only 'Delete' exists. | Add `archiveProject` function (status = 'Archived') and filter in `getProjects`. Add 'Archive' button in UI. |
| Deals | Archiving | lib/firestore/deals.ts | Missing 'Archive' functionality. | Add `archiveDeal` function and UI action. |
