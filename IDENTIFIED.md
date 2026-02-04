# Identified Issues Log

| Section | Page Path | File Location | Element | Issue/Missing Functionality | Action Plan | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| Leads | /leads/[id] | app/(dashboard)/leads/[id]/page.tsx | Edit Button | Missing onClick handler; button does nothing. | Add `onClick` handler to open Edit Modal or navigate to edit page. | DONE |
| Leads | /leads/[id] | app/(dashboard)/leads/[id]/page.tsx | Related Items | Static text "No related items yet"; functionality missing. | Implement fetching and display of related Tasks/Notes. | DONE |
| Leads | /leads | app/(dashboard)/leads/page.tsx | Pagination | No pagination controls; loads all leads at once. | Implement pagination controls and limit query results. | DONE |
| Contacts | /contacts | app/(dashboard)/contacts/page.tsx | Import CSV Button | Empty onClick handler; button does nothing. | Build CSV import modal and backend parsing logic. | DONE |
| Contacts | /contacts/[id] | app/(dashboard)/contacts/[id]/page.tsx | Related Items | Static text "No related items yet"; functionality missing. | Implement fetching of related Deals/Tasks. | DONE |
| Contacts | /contacts | app/(dashboard)/contacts/page.tsx | Pagination | No pagination controls; loads all contacts at once. | Implement pagination controls and limit query results. | DONE |
| Companies | /companies/[id] | app/(dashboard)/companies/[id]/page.tsx | Related Items | Static text "No related items yet"; functionality missing. | Implement fetching of related Contacts/Deals. | DONE |
| Companies | /companies | app/(dashboard)/companies/page.tsx | Pagination | No pagination controls; loads all companies at once. | Implement pagination controls and limit query results. | DONE |
| Deals | /deals/[id] | app/(dashboard)/deals/[id]/page.tsx | Edit Button | Missing onClick handler; button does nothing. | Add `onClick` handler to open Edit Modal. | DONE |
| Deals | /deals | app/(dashboard)/deals/page.tsx | Search/Filter | No search or filtering capabilities for the Kanban board. | Add search bar and filter dropdowns (by stage/probability). | DONE |
| Deals | /deals/[id] | app/(dashboard)/deals/[id]/page.tsx | Link Contact | No interface to link/unlink contacts to the deal. | Add "Add Contact" button and selection modal. | DONE |
| Projects | /projects/[id] | app/(dashboard)/projects/[id]/page.tsx | Edit Project Button | Missing onClick handler; button does nothing. | Add `onClick` handler to open Edit Modal. | DONE |
| Projects | /projects/[id] | app/(dashboard)/projects/[id]/page.tsx | Team Tab | Static text "Functionality coming soon"; functionality missing. | Implement team member selection and display. | DONE |
| Projects | /projects/[id] | app/(dashboard)/projects/[id]/page.tsx | Files Tab | Static text "Functionality coming soon"; functionality missing. | Integrate file upload/storage (e.g., Firebase Storage). | DONE |
| Projects | /projects/[id] | app/(dashboard)/projects/[id]/page.tsx | Budget Overview | "Spent" value marked as "Coming Soon"; calculation missing. | Implement expense tracking and budget calculation. | DONE |
| Tasks | TaskDetailSheet | components/tasks/TaskDetailSheet.tsx | Deal Field | Static placeholder text "Placeholder (Deal Name)"; data missing. | Fetch and display linked Deal; allow selection in Edit. | DONE |
| Tasks | TaskDetailSheet | components/tasks/TaskDetailSheet.tsx | Edit Functionality | No option to edit task title or description; only Status/Priority can be changed. | Enable editing of Title/Description fields in the Sheet. | DONE |
| Invoices | /invoices/[id] | app/(dashboard)/invoices/[id]/page.tsx | Edit Invoice Action | No "Edit" button available on the invoice detail page. | Add "Edit" button linking to an edit form. | DONE |
| Reports | /reports | app/(dashboard)/reports/page.tsx | Recent Insights | Hardcoded/Static insight cards; not fully dynamic. | Connect to Analytics API to generate real insights. | DONE |
| Reports | /reports | app/(dashboard)/reports/page.tsx | Leads Tab | Placeholder text "Detailed lead scoring matrix would go here."; functionality missing. | Implement Lead Scoring visualization/matrix. | DONE |
| Settings | /settings | app/(dashboard)/settings/page.tsx | Edit Profile Button | Missing onClick handler; button does nothing. | Add navigation to Profile settings form. | DONE |
| Settings | /settings | app/(dashboard)/settings/page.tsx | Configure Notifications | Missing onClick handler; button does nothing. | Add navigation to Notification preferences form. | DONE |
| Settings | /settings | app/(dashboard)/settings/page.tsx | Change Currency | Missing onClick handler; button does nothing. | Add currency selection logic/modal. | DONE |
| Marketing | /marketing/email-campaigns/new | app/(dashboard)/marketing/email-campaigns/new/page.tsx | Subject AI Generator | Button has `title="Generate with AI"` but no `onClick` handler. | Implement AI text generation call for subject line. | DONE |
| Marketing | /marketing/seo | app/(dashboard)/marketing/seo/page.tsx | API Call | Hardcoded `workspaceId: "demo-workspace"` in `handleAnalyze`. | Inject actual dynamic `workspaceId` from context/auth. | DONE |
| Marketing | /marketing/keyword | app/(dashboard)/marketing/keyword/page.tsx | Delete Research | `handleDelete` updates local state but does not call API to delete from DB. | Add `fetch` call with DELETE method to remove record. | DONE |
