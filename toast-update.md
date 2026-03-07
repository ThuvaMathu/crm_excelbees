# Toast Notification System Update Plan

## 1. Current State Assessment
Scanned the codebase and identified **304 unique instances** (out of 322 total vague occurrences) of vague, generic, or non-user-centric error messages. Common issues include exposing raw error objects to the user (e.g., `error.message`), using generic phrasing like "Failed to update", and failing to provide actionable resolution steps.

## 2. Tone Guidelines
- **Helpful & Direct:** Always explain *what* happened without jargon.
- **Actionable:** Tell the user *how* to fix the issue if possible (e.g., "Check your internet connection", "Refresh the page").
- **Non-technical:** Never show raw server errors, status codes like "400", or variable names.

## 3. Edge Cases & Missing Scenarios
- **Network Timeouts:** The app currently relies heavily on generic "catch-all" errors. We need specific "Connection timed out" toasts.
- **Conflict Errors:** E.g., "Email already exists" is often swallowed by a generic "Failed to create user".
- **Payload Too Large:** Images or files exceeding size limits often just return "Failed to upload" instead of specifying the size limit.

## 4. Mapping Table

| Location (Component/Route) | Current Vague Message | Proposed Clear Message |
| :--- | :--- | :--- |
| `app\(auth)\change-password\page.tsx` | "You must be logged in to change your password" | "Please check your input and try again." |
| `app\(auth)\change-password\page.tsx` | "Password does not meet security requirements" | "Please check your input and try again." |
| `app\(auth)\change-password\page.tsx` | "Passwords do not match" | "Please check your input and try again." |
| `app\(auth)\change-password\page.tsx` | "Current password is incorrect" | "Please check your input and try again." |
| `app\(auth)\change-password\page.tsx` | "New password is too weak" | "Please check your input and try again." |
| `app\(auth)\change-password\page.tsx` | "Failed to change password. Please try again." | "This action couldn't be completed. Please try again." |
| `app\(auth)\forgot-password\page.tsx` | "error" | "We couldn't log you in. Please check your connection and try again." |
| `app\(auth)\login\page.tsx` | "getErrorMessage(authError" | "We couldn't log you in. Please check your connection and try again." |
| `app\(auth)\login\page.tsx` | "Login failed. Please try again." | "This action couldn't be completed. Please try again." |
| `app\(auth)\login\page.tsx` | "An unexpected error occurred. Please try again." | "We couldn't log you in. Please check your connection and try again." |
| `app\(dashboard)\analytics\page.tsx` | "dealsResult.error" | "An error occurred. Please check your internet connection and try again." |
| `app\(dashboard)\analytics\page.tsx` | "Failed to load analytics data" | "We couldn't load this data. Please refresh the page." |
| `app\(dashboard)\companies\[id]\page.tsx` | "No phone number available" | "Please check your input and try again." |
| `app\(dashboard)\companies\[id]\page.tsx` | "companyResult.error" | "An error occurred. Please check your internet connection and try again." |
| `app\(dashboard)\companies\[id]\page.tsx` | "Failed to load company data" | "We couldn't load this data. Please refresh the page." |
| `app\(dashboard)\companies\[id]\page.tsx` | "error  or  or  "Failed to create project", { id: toastId }" | "An error occurred. Please check your internet connection and try again." |
| `app\(dashboard)\companies\[id]\page.tsx` | "err.message  or  or  "An error occurred", { id: toastId }" | "An error occurred. Please check your internet connection and try again." |
| `app\(dashboard)\companies\[id]\page.tsx` | "You don't have permission to delete this company" | "You don't have permission to access or modify this information." |
| `app\(dashboard)\companies\[id]\page.tsx` | "error  or  or  "Failed to delete company" | "This item couldn't be deleted. It might be referenced by other records." |
| `app\(dashboard)\contacts\[id]\page.tsx` | "contactResult.error" | "An error occurred. Please check your internet connection and try again." |
| `app\(dashboard)\contacts\[id]\page.tsx` | "Failed to load contact data" | "We couldn't load this data. Please refresh the page." |
| `app\(dashboard)\contacts\[id]\page.tsx` | "You don't have permission to delete this contact" | "You don't have permission to access or modify this information." |
| `app\(dashboard)\contacts\[id]\page.tsx` | "error  or  or  "Failed to delete contact" | "This item couldn't be deleted. It might be referenced by other records." |
| `app\(dashboard)\contacts\[id]\page.tsx` | "No phone number available" | "Please check your input and try again." |
| `app\(dashboard)\contacts\[id]\page.tsx` | "error  or  or  "Failed to create project", { id: toastId }" | "An error occurred. Please check your internet connection and try again." |
| `app\(dashboard)\contacts\[id]\page.tsx` | "err.message  or  or  "An error occurred", { id: toastId }" | "An error occurred. Please check your internet connection and try again." |
| `app\(dashboard)\deals\kanban\page.tsx` | "error" | "An error occurred. Please check your internet connection and try again." |
| `app\(dashboard)\deals\kanban\page.tsx` | "error  or  or  "Failed to update deal" | "Your changes couldn't be saved. Please try again." |
| `app\(dashboard)\deals\page.tsx` | "You don't have permission to move this deal" | "You don't have permission to access or modify this information." |
| `app\(dashboard)\deals\page.tsx` | "error  or  or  "Failed to update deal" | "Your changes couldn't be saved. Please try again." |
| `app\(dashboard)\deals\[id]\page.tsx` | "error  or  or  "Failed to link contact" | "An error occurred. Please check your internet connection and try again." |
| `app\(dashboard)\deals\[id]\page.tsx` | "error  or  or  "Failed to unlink contact" | "An error occurred. Please check your internet connection and try again." |
| `app\(dashboard)\deals\[id]\page.tsx` | "dealResult.error" | "An error occurred. Please check your internet connection and try again." |
| `app\(dashboard)\deals\[id]\page.tsx` | "Failed to load deal data" | "We couldn't load this data. Please refresh the page." |
| `app\(dashboard)\deals\[id]\page.tsx` | "error  or  or  "Failed to update stage" | "Your changes couldn't be saved. Please try again." |
| `app\(dashboard)\deals\[id]\page.tsx` | "You don't have permission to delete this deal" | "You don't have permission to access or modify this information." |
| `app\(dashboard)\deals\[id]\page.tsx` | "error  or  or  "Failed to delete deal" | "This item couldn't be deleted. It might be referenced by other records." |
| `app\(dashboard)\deals\[id]\page.tsx` | "error  or  or  "Failed to archive deal" | "An error occurred. Please check your internet connection and try again." |
| `app\(dashboard)\deals\[id]\page.tsx` | "error  or  or  "Failed to unarchive deal" | "An error occurred. Please check your internet connection and try again." |
| `app\(dashboard)\deals\[id]\page.tsx` | "error  or  or  "Failed to create project", { id: toastId }" | "An error occurred. Please check your internet connection and try again." |
| `app\(dashboard)\deals\[id]\page.tsx` | "err.message  or  or  "An error occurred", { id: toastId }" | "An error occurred. Please check your internet connection and try again." |
| `app\(dashboard)\hr\employees\page.tsx` | "Failed to load employees: " + result.error" | "We couldn't load this data. Please refresh the page." |
| `app\(dashboard)\hr\employees\page.tsx` | "Failed to load employees" | "We couldn't load this data. Please refresh the page." |
| `app\(dashboard)\hr\employees\page.tsx` | "Error: Employee ID is missing" | "An error occurred. Please check your internet connection and try again." |
| `app\(dashboard)\hr\employees\page.tsx` | "Failed to delete: " + error" | "This item couldn't be deleted. It might be referenced by other records." |
| `app\(dashboard)\hr\employees\[id]\page.tsx` | "error" | "An error occurred. Please check your internet connection and try again." |
| `app\(dashboard)\hr\employees\[id]\page.tsx` | "Failed to load employee profile" | "We couldn't load this data. Please refresh the page." |
| `app\(dashboard)\hr\leaves\page.tsx` | "result.error" | "An error occurred. Please check your internet connection and try again." |
| `app\(dashboard)\hr\payroll\page.tsx` | "Failed to load payroll records" | "We couldn't load this data. Please refresh the page." |
| `app\(dashboard)\hr\payroll\page.tsx` | "Please fill all required fields" | "Please check your input and try again." |
| `app\(dashboard)\hr\payroll\page.tsx` | "Employee not found" | "Please check your input and try again." |
| `app\(dashboard)\hr\payroll\page.tsx` | "Failed to create: " + result.error" | "An error occurred. Please check your internet connection and try again." |
| `app\(dashboard)\hr\payroll\page.tsx` | "Failed to update status: " + result.error" | "Your changes couldn't be saved. Please try again." |
| `app\(dashboard)\invoices\create\page.tsx` | "You must be logged in" | "Please check your input and try again." |
| `app\(dashboard)\invoices\create\page.tsx` | "error  or  or  "Failed to create invoice" | "An error occurred. Please check your internet connection and try again." |
| `app\(dashboard)\invoices\create\page.tsx` | "Invoice created but failed to send email: ${emailResult.error}" | "An error occurred. Please check your internet connection and try again." |
| `app\(dashboard)\invoices\create\page.tsx` | "error.message  or  or  "Failed to create invoice" | "An error occurred. Please check your internet connection and try again." |
| `app\(dashboard)\invoices\[id]\edit\page.tsx` | "Failed to load invoice" | "We couldn't load this data. Please refresh the page." |
| `app\(dashboard)\invoices\[id]\edit\page.tsx` | "Failed to update invoice" | "Your changes couldn't be saved. Please try again." |
| `app\(dashboard)\invoices\[id]\page.tsx` | "Failed to load invoice" | "We couldn't load this data. Please refresh the page." |
| `app\(dashboard)\invoices\[id]\page.tsx` | "No email address found for this client" | "Please check your input and try again." |
| `app\(dashboard)\invoices\[id]\page.tsx` | "Failed to generate PDF" | "This action couldn't be completed. Please try again." |
| `app\(dashboard)\invoices\[id]\page.tsx` | "Only admins and managers can mark invoices as paid" | "Please check your input and try again." |
| `app\(dashboard)\invoices\[id]\page.tsx` | "Failed to update status" | "Your changes couldn't be saved. Please try again." |
| `app\(dashboard)\invoices\[id]\page.tsx` | "Only admins and managers can edit invoices" | "Please check your input and try again." |
| `app\(dashboard)\leads\[id]\page.tsx` | "leadResult.error" | "An error occurred. Please check your internet connection and try again." |
| `app\(dashboard)\leads\[id]\page.tsx` | "error  or  or  "Failed to update status" | "Your changes couldn't be saved. Please try again." |
| `app\(dashboard)\leads\[id]\page.tsx` | "error  or  or  "Failed to score lead", { id: toastId }" | "An error occurred. Please check your internet connection and try again." |
| `app\(dashboard)\leads\[id]\page.tsx` | "An error occurred", { id: toastId }" | "An error occurred. Please check your internet connection and try again." |
| `app\(dashboard)\leads\[id]\page.tsx` | "Company name is required for enrichment" | "Please check your input and try again." |
| `app\(dashboard)\leads\[id]\page.tsx` | "error  or  or  "Failed to enrich data", { id: toastId }" | "An error occurred. Please check your internet connection and try again." |
| `app\(dashboard)\leads\[id]\page.tsx` | "AI Error", { id: toastId }" | "An error occurred. Please check your internet connection and try again." |
| `app\(dashboard)\leads\[id]\page.tsx` | "You don't have permission to delete this lead" | "You don't have permission to access or modify this information." |
| `app\(dashboard)\leads\[id]\page.tsx` | "error  or  or  "Failed to delete lead" | "This item couldn't be deleted. It might be referenced by other records." |
| `app\(dashboard)\leads\[id]\page.tsx` | "No email address available" | "Please check your input and try again." |
| `app\(dashboard)\leads\[id]\page.tsx` | "No phone number available" | "Please check your input and try again." |
| `app\(dashboard)\leads\[id]\page.tsx` | "error  or  or  "Failed to convert lead", { id: toastId }" | "An error occurred. Please check your internet connection and try again." |
| `app\(dashboard)\leads\[id]\page.tsx` | "err.message  or  or  "An error occurred", { id: toastId }" | "An error occurred. Please check your internet connection and try again." |
| `app\(dashboard)\leads\[id]\page.tsx` | "error  or  or  "Failed to create deal", { id: toastId }" | "An error occurred. Please check your internet connection and try again." |
| `app\(dashboard)\leads\[id]\page.tsx` | "error  or  or  "Failed to create project", { id: toastId }" | "An error occurred. Please check your internet connection and try again." |
| `app\(dashboard)\marketing\ads\page.tsx` | "Enter product and benefit" | "Please check your input and try again." |
| `app\(dashboard)\marketing\ads\page.tsx` | "Failed to generate ads" | "This action couldn't be completed. Please try again." |
| `app\(dashboard)\marketing\blog\new\configure\page.tsx` | "Please log in" | "Please check your input and try again." |
| `app\(dashboard)\marketing\blog\new\configure\page.tsx` | "error.message  or  or  "Failed to generate outline" | "An error occurred. Please check your internet connection and try again." |
| `app\(dashboard)\marketing\blog\new\select-keywords\page.tsx` | "error.message  or  or  "Failed to load history" | "We couldn't load this data. Please refresh the page." |
| `app\(dashboard)\marketing\blog\new\select-keywords\page.tsx` | "Failed to load keywords" | "We couldn't load this data. Please refresh the page." |
| `app\(dashboard)\marketing\blog\new\select-keywords\page.tsx` | "Maximum 10 secondary keywords allowed" | "Please check your input and try again." |
| `app\(dashboard)\marketing\blog\new\select-keywords\page.tsx` | "Please select a primary keyword" | "Please check your input and try again." |
| `app\(dashboard)\marketing\blog\new\select-keywords\page.tsx` | "Please enter a topic" | "Please check your input and try again." |
| `app\(dashboard)\marketing\blog\page.tsx` | "error.message  or  or  "Failed to load blogs" | "We couldn't load this data. Please refresh the page." |
| `app\(dashboard)\marketing\blog\page.tsx` | "Failed to delete blog" | "This item couldn't be deleted. It might be referenced by other records." |
| `app\(dashboard)\marketing\blog\[blogId]\edit\page.tsx` | "Failed to load blog" | "We couldn't load this data. Please refresh the page." |
| `app\(dashboard)\marketing\blog\[blogId]\edit\page.tsx` | "Failed to save" | "Your changes couldn't be saved. Please try again." |
| `app\(dashboard)\marketing\blog\[blogId]\edit\page.tsx` | "Failed to generate content" | "This action couldn't be completed. Please try again." |
| `app\(dashboard)\marketing\blog\[blogId]\outline\page.tsx` | "error.message  or  or  "Failed to load blog" | "We couldn't load this data. Please refresh the page." |
| `app\(dashboard)\marketing\blog\[blogId]\outline\page.tsx` | "error.message  or  or  "Failed to generate content" | "An error occurred. Please check your internet connection and try again." |
| `app\(dashboard)\marketing\blog\[blogId]\preview\page.tsx` | "Failed to load blog" | "We couldn't load this data. Please refresh the page." |
| `app\(dashboard)\marketing\blog\[blogId]\preview\page.tsx` | "Failed to export" | "This action couldn't be completed. Please try again." |
| `app\(dashboard)\marketing\blog\[blogId]\preview\page.tsx` | "No tags available for this blog post" | "Please check your input and try again." |
| `app\(dashboard)\marketing\calendar\new\page.tsx` | "Calendar name is required" | "Please check your input and try again." |
| `app\(dashboard)\marketing\calendar\new\page.tsx` | "Failed to create calendar" | "This action couldn't be completed. Please try again." |
| `app\(dashboard)\marketing\calendar\page.tsx` | "Failed to load calendars" | "We couldn't load this data. Please refresh the page." |
| `app\(dashboard)\marketing\calendar\page.tsx` | "Failed to restore calendar" | "This action couldn't be completed. Please try again." |
| `app\(dashboard)\marketing\calendar\page.tsx` | "Failed to delete calendar" | "This item couldn't be deleted. It might be referenced by other records." |
| `app\(dashboard)\marketing\calendar\templates\page.tsx` | "Failed to load templates" | "We couldn't load this data. Please refresh the page." |
| `app\(dashboard)\marketing\calendar\templates\page.tsx` | "Failed to delete template" | "This item couldn't be deleted. It might be referenced by other records." |
| `app\(dashboard)\marketing\calendar\[calendarId]\page.tsx` | "Failed to load calendar" | "We couldn't load this data. Please refresh the page." |
| `app\(dashboard)\marketing\calendar\[calendarId]\page.tsx` | "Failed to load plans" | "We couldn't load this data. Please refresh the page." |
| `app\(dashboard)\marketing\calendar\[calendarId]\plan\new\page.tsx` | "Title and dates are required" | "Please check your input and try again." |
| `app\(dashboard)\marketing\calendar\[calendarId]\plan\new\page.tsx` | "Invalid date or time values" | "Some of the information you entered is invalid. Please check the form and try again." |
| `app\(dashboard)\marketing\calendar\[calendarId]\plan\new\page.tsx` | "End date/time must be after start date/time" | "Please check your input and try again." |
| `app\(dashboard)\marketing\calendar\[calendarId]\plan\new\page.tsx` | "error instanceof Error ? error.message : "Failed to create plan" | "An error occurred. Please check your internet connection and try again." |
| `app\(dashboard)\marketing\calendar\[calendarId]\plan\[planId]\page.tsx` | "Failed to load plan" | "We couldn't load this data. Please refresh the page." |
| `app\(dashboard)\marketing\calendar\[calendarId]\plan\[planId]\page.tsx` | "Failed to delete plan" | "This item couldn't be deleted. It might be referenced by other records." |
| `app\(dashboard)\marketing\calendar\[calendarId]\plan\[planId]\page.tsx` | "Failed to update plan" | "Your changes couldn't be saved. Please try again." |
| `app\(dashboard)\marketing\calendar\[calendarId]\plan\[planId]\page.tsx` | "Failed to update checklist" | "Your changes couldn't be saved. Please try again." |
| `app\(dashboard)\marketing\calendar\[calendarId]\settings\page.tsx` | "Failed to load calendar" | "We couldn't load this data. Please refresh the page." |
| `app\(dashboard)\marketing\calendar\[calendarId]\settings\page.tsx` | "Failed to save settings" | "Your changes couldn't be saved. Please try again." |
| `app\(dashboard)\marketing\calendar\[calendarId]\settings\page.tsx` | "Failed to generate PDF file. Please try CSV export." | "This action couldn't be completed. Please try again." |
| `app\(dashboard)\marketing\calendar\[calendarId]\settings\page.tsx` | "Failed to export calendar" | "This action couldn't be completed. Please try again." |
| `app\(dashboard)\marketing\calendar\[calendarId]\settings\page.tsx` | "Failed to archive calendar" | "This action couldn't be completed. Please try again." |
| `app\(dashboard)\marketing\calendar\[calendarId]\settings\page.tsx` | "Failed to delete calendar" | "This item couldn't be deleted. It might be referenced by other records." |
| `app\(dashboard)\marketing\competitors\new\page.tsx` | "Please fill in all required fields" | "Please check your input and try again." |
| `app\(dashboard)\marketing\competitors\new\page.tsx` | "You must be logged in" | "Please check your input and try again." |
| `app\(dashboard)\marketing\competitors\new\page.tsx` | "toast.error(" | "An error occurred. Please check your internet connection and try again." |
| `app\(dashboard)\marketing\competitors\[analysisId]\confirm\page.tsx` | "Analysis not found" | "Please check your input and try again." |
| `app\(dashboard)\marketing\competitors\[analysisId]\confirm\page.tsx` | "Failed to load analysis" | "We couldn't load this data. Please refresh the page." |
| `app\(dashboard)\marketing\competitors\[analysisId]\confirm\page.tsx` | "Please select at least one competitor" | "Please check your input and try again." |
| `app\(dashboard)\marketing\competitors\[analysisId]\confirm\page.tsx` | "toast.error(" | "An error occurred. Please check your internet connection and try again." |
| `app\(dashboard)\marketing\competitors\[analysisId]\report\page.tsx` | "Failed to load report" | "We couldn't load this data. Please refresh the page." |
| `app\(dashboard)\marketing\competitors\[analysisId]\report\page.tsx` | "No competitors found to re-analyze" | "Please check your input and try again." |
| `app\(dashboard)\marketing\competitors\[analysisId]\report\page.tsx` | "toast.error(" | "An error occurred. Please check your internet connection and try again." |
| `app\(dashboard)\marketing\competitors\[analysisId]\report\page.tsx` | "Failed to generate PDF", { id: "pdf" }" | "This action couldn't be completed. Please try again." |
| `app\(dashboard)\marketing\email\page.tsx` | "Enter a topic first" | "Please check your input and try again." |
| `app\(dashboard)\marketing\email\page.tsx` | "Failed to generate subjects" | "This action couldn't be completed. Please try again." |
| `app\(dashboard)\marketing\email\page.tsx` | "Failed to generate content" | "This action couldn't be completed. Please try again." |
| `app\(dashboard)\marketing\email\page.tsx` | "Failed to send campaign" | "This action couldn't be completed. Please try again." |
| `app\(dashboard)\marketing\email-campaigns\audiences\new\page.tsx` | "Failed to load CRM contacts" | "We couldn't load this data. Please refresh the page." |
| `app\(dashboard)\marketing\email-campaigns\audiences\new\page.tsx` | "Please enter an audience name" | "Please check your input and try again." |
| `app\(dashboard)\marketing\email-campaigns\audiences\new\page.tsx` | "No contacts to add" | "Please check your input and try again." |
| `app\(dashboard)\marketing\email-campaigns\audiences\new\page.tsx` | "error.message  or  or  "Failed to create audience" | "An error occurred. Please check your internet connection and try again." |
| `app\(dashboard)\marketing\email-campaigns\audiences\page.tsx` | "Failed to load audiences" | "We couldn't load this data. Please refresh the page." |
| `app\(dashboard)\marketing\email-campaigns\audiences\page.tsx` | "Failed to delete audience" | "This item couldn't be deleted. It might be referenced by other records." |
| `app\(dashboard)\marketing\email-campaigns\new\page.tsx` | "Please fill in all required fields" | "Please check your input and try again." |
| `app\(dashboard)\marketing\email-campaigns\new\page.tsx` | "Please select at least one audience" | "Please check your input and try again." |
| `app\(dashboard)\marketing\email-campaigns\new\page.tsx` | "errorMessage" | "An error occurred. Please check your internet connection and try again." |
| `app\(dashboard)\marketing\email-campaigns\new\page.tsx` | "Please enter a campaign name first" | "Please check your input and try again." |
| `app\(dashboard)\marketing\email-campaigns\page.tsx` | "Failed to clone campaign" | "This action couldn't be completed. Please try again." |
| `app\(dashboard)\marketing\email-campaigns\page.tsx` | "error.message  or  or  "Failed to delete campaign" | "This item couldn't be deleted. It might be referenced by other records." |
| `app\(dashboard)\marketing\email-campaigns\templates\new\page.tsx` | "Please enter a template name" | "Please check your input and try again." |
| `app\(dashboard)\marketing\email-campaigns\templates\new\page.tsx` | "Template content is empty" | "Please check your input and try again." |
| `app\(dashboard)\marketing\email-campaigns\templates\new\page.tsx` | "error.message  or  or  "Failed to create template" | "An error occurred. Please check your internet connection and try again." |
| `app\(dashboard)\marketing\email-campaigns\templates\page.tsx` | "Failed to load templates" | "We couldn't load this data. Please refresh the page." |
| `app\(dashboard)\marketing\email-campaigns\templates\page.tsx` | "Failed to delete template" | "This item couldn't be deleted. It might be referenced by other records." |
| `app\(dashboard)\marketing\email-campaigns\[campaignId]\analytics\page.tsx` | "Failed to load analytics" | "We couldn't load this data. Please refresh the page." |
| `app\(dashboard)\marketing\email-campaigns\[campaignId]\build\page.tsx` | "Failed to load campaign" | "We couldn't load this data. Please refresh the page." |
| `app\(dashboard)\marketing\email-campaigns\[campaignId]\build\page.tsx` | "Failed to save content" | "Your changes couldn't be saved. Please try again." |
| `app\(dashboard)\marketing\email-campaigns\[campaignId]\page.tsx` | "Failed to load campaign" | "We couldn't load this data. Please refresh the page." |
| `app\(dashboard)\marketing\email-campaigns\[campaignId]\page.tsx` | "errorMessage" | "An error occurred. Please check your internet connection and try again." |
| `app\(dashboard)\marketing\email-campaigns\[campaignId]\review\page.tsx` | "Failed to load campaign" | "We couldn't load this data. Please refresh the page." |
| `app\(dashboard)\marketing\email-campaigns\[campaignId]\review\page.tsx` | "Only admins and managers can send email campaigns" | "Please check your input and try again." |
| `app\(dashboard)\marketing\email-campaigns\[campaignId]\review\page.tsx` | "Please select a date and time to schedule" | "Please check your input and try again." |
| `app\(dashboard)\marketing\email-campaigns\[campaignId]\review\page.tsx` | "Scheduled time must be in the future" | "Please check your input and try again." |
| `app\(dashboard)\marketing\email-campaigns\[campaignId]\review\page.tsx` | "errorMessage" | "An error occurred. Please check your internet connection and try again." |
| `app\(dashboard)\marketing\email-campaigns\[campaignId]\review\page.tsx` | "Please enter at least one email address" | "Please check your input and try again." |
| `app\(dashboard)\marketing\keyword\new\page.tsx` | "Please fill in all required fields" | "Please check your input and try again." |
| `app\(dashboard)\marketing\keyword\new\page.tsx` | "You must be logged in" | "Please check your input and try again." |
| `app\(dashboard)\marketing\keyword\new\page.tsx` | "toast.error(error instanceof Error ? error.message : "Failed to complete research", {" | "An error occurred. Please check your internet connection and try again." |
| `app\(dashboard)\marketing\keyword\page.tsx` | "Failed to load history" | "We couldn't load this data. Please refresh the page." |
| `app\(dashboard)\marketing\keyword\page.tsx` | "Failed to delete research" | "This item couldn't be deleted. It might be referenced by other records." |
| `app\(dashboard)\marketing\keyword\[researchId]\results\page.tsx` | "Failed to load results" | "We couldn't load this data. Please refresh the page." |
| `app\(dashboard)\marketing\landing-pages\page.tsx` | "Enter a domain" | "Please check your input and try again." |
| `app\(dashboard)\marketing\landing-pages\page.tsx` | "Failed to discover pages" | "This action couldn't be completed. Please try again." |
| `app\(dashboard)\marketing\landing-pages\page.tsx` | "Failed to analyze page" | "This action couldn't be completed. Please try again." |
| `app\(dashboard)\marketing\seo\page.tsx` | "Please enter a URL" | "Please check your input and try again." |
| `app\(dashboard)\marketing\seo\page.tsx` | "Failed to analyze page. Please try again." | "This action couldn't be completed. Please try again." |
| `app\(dashboard)\marketing\social\page.tsx` | "Enter a topic or URL" | "Please check your input and try again." |
| `app\(dashboard)\marketing\social\page.tsx` | "Select at least one platform" | "Please check your input and try again." |
| `app\(dashboard)\marketing\social\page.tsx` | "Failed to generate posts" | "This action couldn't be completed. Please try again." |
| `app\(dashboard)\profile\page.tsx` | "Please upload an image file" | "Please check your input and try again." |
| `app\(dashboard)\profile\page.tsx` | "Image size must be less than 5MB" | "Please check your input and try again." |
| `app\(dashboard)\profile\page.tsx` | "Failed to upload image: " + error" | "An error occurred. Please check your internet connection and try again." |
| `app\(dashboard)\profile\page.tsx` | "Failed to update profile" | "Your changes couldn't be saved. Please try again." |
| `app\(dashboard)\profile\page.tsx` | "Failed to update profile: " + error" | "Your changes couldn't be saved. Please try again." |
| `app\(dashboard)\projects\[id]\page.tsx` | "error  or  or  "Failed to archive project" | "An error occurred. Please check your internet connection and try again." |
| `app\(dashboard)\projects\[id]\page.tsx` | "error  or  or  "Failed to unarchive project" | "An error occurred. Please check your internet connection and try again." |
| `app\(dashboard)\projects\[id]\page.tsx` | "error  or  or  "Failed to upload files" | "An error occurred. Please check your internet connection and try again." |
| `app\(dashboard)\projects\[id]\page.tsx` | "Files uploaded but failed to save to project" | "Your changes couldn't be saved. Please try again." |
| `app\(dashboard)\projects\[id]\page.tsx` | "Failed to remove file" | "This action couldn't be completed. Please try again." |
| `app\(dashboard)\settings\page.tsx` | "Name is required" | "Please check your input and try again." |
| `app\(dashboard)\settings\page.tsx` | "error.message  or  or  "Failed to update profile" | "Your changes couldn't be saved. Please try again." |
| `app\(dashboard)\settings\page.tsx` | "Failed to save notification preferences" | "Your changes couldn't be saved. Please try again." |
| `app\(dashboard)\settings\page.tsx` | "Failed to save currency preference" | "Your changes couldn't be saved. Please try again." |
| `app\(dashboard)\users\page.tsx` | "Failed to load users" | "We couldn't load this data. Please refresh the page." |
| `app\(dashboard)\users\page.tsx` | "Failed to activate user: " + error" | "An error occurred. Please check your internet connection and try again." |
| `app\(dashboard)\users\page.tsx` | "Failed to deactivate user: " + error" | "An error occurred. Please check your internet connection and try again." |
| `app\(dashboard)\users\page.tsx` | "Failed to delete user: " + error" | "This item couldn't be deleted. It might be referenced by other records." |
| `components\activity\ActivityTimeline.tsx` | "Please add some content or attachments" | "Please check your input and try again." |
| `components\activity\ActivityTimeline.tsx` | "error  or  or  "Failed to upload files" | "An error occurred. Please check your internet connection and try again." |
| `components\activity\ActivityTimeline.tsx` | "error  or  or  "Failed to add note" | "An error occurred. Please check your internet connection and try again." |
| `components\activity\ActivityTimeline.tsx` | "An unexpected error occurred" | "Something unexpected happened. Please try refreshing the page." |
| `components\activity\ActivityTimeline.tsx` | "error  or  or  "Failed to delete activity" | "This item couldn't be deleted. It might be referenced by other records." |
| `components\ai\CopilotWidget.tsx` | "error  or  or  "Failed to get response" | "An error occurred. Please check your internet connection and try again." |
| `components\ai\CopilotWidget.tsx` | "Failed to connect to Copilot" | "This action couldn't be completed. Please try again." |
| `components\calendar\AIAssistant.tsx` | "Please select a time range" | "Please check your input and try again." |
| `components\calendar\AIAssistant.tsx` | "Failed to generate plans" | "This action couldn't be completed. Please try again." |
| `components\calendar\AIAssistant.tsx` | "Failed to apply plans" | "This action couldn't be completed. Please try again." |
| `components\companies\CreateCompanyDialog.tsx` | "error  or  or  "Failed to create company" | "An error occurred. Please check your internet connection and try again." |
| `components\companies\EditCompanyDialog.tsx` | "error  or  or  "Failed to update company" | "Your changes couldn't be saved. Please try again." |
| `components\contacts\CreateContactDialog.tsx` | "error  or  or  "Failed to create contact" | "An error occurred. Please check your internet connection and try again." |
| `components\contacts\EditContactDialog.tsx` | "error  or  or  "Failed to update contact" | "Your changes couldn't be saved. Please try again." |
| `components\contacts\ImportCSVDialog.tsx` | "Please select a CSV file" | "Please check your input and try again." |
| `components\contacts\ImportCSVDialog.tsx` | "No valid contacts found in CSV" | "Please check your input and try again." |
| `components\contacts\ImportCSVDialog.tsx` | "Failed to parse CSV file" | "This action couldn't be completed. Please try again." |
| `components\contacts\ImportCSVDialog.tsx` | "Successfully imported ${successCount} contacts${errorCount > 0 ? ` (${errorCount} failed" | "An error occurred. Please check your internet connection and try again." |
| `components\contacts\ImportCSVDialog.tsx` | "Failed to import contacts" | "This action couldn't be completed. Please try again." |
| `components\contacts\ImportCSVDialog.tsx` | "An error occurred during import" | "An error occurred. Please check your internet connection and try again." |
| `components\deals\CreateDealDialog.tsx` | "You must be logged in to create a deal" | "Please check your input and try again." |
| `components\deals\CreateDealDialog.tsx` | "error  or  or  "Failed to create deal" | "An error occurred. Please check your internet connection and try again." |
| `components\deals\EditDealDialog.tsx` | "error  or  or  "Failed to update deal" | "Your changes couldn't be saved. Please try again." |
| `components\email\AIAssistant.tsx` | "AI Error: ${data.error}" | "An error occurred. Please check your internet connection and try again." |
| `components\email\AIAssistant.tsx` | "Failed to connect to AI service" | "This action couldn't be completed. Please try again." |
| `components\email\AIAssistant.tsx` | "Analysis failed" | "This action couldn't be completed. Please try again." |
| `components\email\AIAssistantEnhanced.tsx` | "errorMessage" | "An error occurred. Please check your internet connection and try again." |
| `components\email\AIAssistantEnhanced.tsx` | "Please enter a prompt" | "Please check your input and try again." |
| `components\email\AIAssistantEnhanced.tsx` | "Please select an option" | "Please check your input and try again." |
| `components\email\EmailComposeModal.tsx` | "File size must be less than 10MB" | "Please check your input and try again." |
| `components\email\EmailComposeModal.tsx` | "Failed to upload attachment" | "This action couldn't be completed. Please try again." |
| `components\email\EmailComposeModal.tsx` | "You must be logged in" | "Please check your input and try again." |
| `components\email\EmailComposeModal.tsx` | "error  or  or  "Failed to save draft" | "Your changes couldn't be saved. Please try again." |
| `components\email\EmailComposeModal.tsx` | "error.message  or  or  "Failed to save draft" | "Your changes couldn't be saved. Please try again." |
| `components\email\EmailComposeModal.tsx` | "firstError" | "An error occurred. Please check your internet connection and try again." |
| `components\email\EmailComposeModal.tsx` | "Sent ${successCount} emails. ${failCount > 0 ? `${failCount} failed.` : ""}" | "This action couldn't be completed. Please try again." |
| `components\email\EmailComposeModal.tsx` | "error  or  or  "Failed to create email" | "An error occurred. Please check your internet connection and try again." |
| `components\email\EmailComposeModal.tsx` | "sendResult.error  or  or  "Failed to send email" | "An error occurred. Please check your internet connection and try again." |
| `components\email\EmailComposeModal.tsx` | "error.message  or  or  "Failed to send email" | "An error occurred. Please check your internet connection and try again." |
| `components\email\EmailComposeModal.tsx` | "error  or  or  "Failed to save template" | "Your changes couldn't be saved. Please try again." |
| `components\email\EmailComposeModal.tsx` | "error.message  or  or  "Failed to save template" | "Your changes couldn't be saved. Please try again." |
| `components\email-campaigns\AIContentGenerator.tsx` | "Please describe what your email is about" | "Please check your input and try again." |
| `components\email-campaigns\AIContentGenerator.tsx` | "error.message  or  or  "Failed to generate content" | "An error occurred. Please check your internet connection and try again." |
| `components\hr\CreateEmployeeDialog.tsx` | "You must be logged in" | "Please check your input and try again." |
| `components\hr\CreateEmployeeDialog.tsx` | "Phone number must be in international format (e.g., +61412345678" | "Please check your input and try again." |
| `components\hr\CreateEmployeeDialog.tsx` | "Failed to create employee: " + (result.error  or  or  "Unknown error" | "An error occurred. Please check your internet connection and try again." |
| `components\hr\CreateEmployeeDialog.tsx` | "error.message  or  or  "Failed to create employee" | "An error occurred. Please check your internet connection and try again." |
| `components\hr\DocumentList.tsx` | "Failed to remove record: " + result.error" | "An error occurred. Please check your internet connection and try again." |
| `components\hr\DocumentList.tsx` | "Error deleting document: " + error.message" | "An error occurred. Please check your internet connection and try again." |
| `components\hr\DocumentUpload.tsx` | "File size exceeds 20MB limit" | "Please check your input and try again." |
| `components\hr\DocumentUpload.tsx` | "Failed to upload to storage: " + error.message" | "An error occurred. Please check your internet connection and try again." |
| `components\hr\DocumentUpload.tsx` | "Failed to save document info: " + result.error" | "Your changes couldn't be saved. Please try again." |
| `components\hr\DocumentUpload.tsx` | "Upload failed: " + error.message" | "An error occurred. Please check your internet connection and try again." |
| `components\hr\GrantAccessDialog.tsx` | "Email is required" | "Please check your input and try again." |
| `components\hr\GrantAccessDialog.tsx` | "Passwords do not match" | "Please check your input and try again." |
| `components\hr\GrantAccessDialog.tsx` | "Password must be at least 6 characters" | "Please check your input and try again." |
| `components\hr\GrantAccessDialog.tsx` | "data.error  or  or  "Failed to grant access" | "An error occurred. Please check your internet connection and try again." |
| `components\hr\GrantAccessDialog.tsx` | "Failed to grant access" | "This action couldn't be completed. Please try again." |
| `components\hr\RequestLeaveDialog.tsx` | "result.error  or  or  "Failed to request leave" | "An error occurred. Please check your internet connection and try again." |
| `components\hr\RequestLeaveDialog.tsx` | "An unexpected error occurred" | "Something unexpected happened. Please try refreshing the page." |
| `components\invoices\form-sections\InvoiceLineItems.tsx` | "Please select a client or deal first to get personalized suggestions." | "Please check your input and try again." |
| `components\invoices\form-sections\InvoiceLineItems.tsx` | "Could not generate suggestions." | "Please check your input and try again." |
| `components\invoices\form-sections\InvoiceLineItems.tsx` | "AI Suggestion failed." | "This action couldn't be completed. Please try again." |
| `components\invoices\InvoiceEmailComposeModal.tsx` | "Failed to prepare email" | "This action couldn't be completed. Please try again." |
| `components\invoices\InvoiceEmailComposeModal.tsx` | "Please enter a recipient email" | "Please check your input and try again." |
| `components\invoices\InvoiceEmailComposeModal.tsx` | "PDF attachment is not ready" | "Please check your input and try again." |
| `components\invoices\InvoiceEmailComposeModal.tsx` | "Failed to send email" | "This action couldn't be completed. Please try again." |
| `components\invoices\InvoiceSettingsModal.tsx` | "Failed to save settings" | "Your changes couldn't be saved. Please try again." |
| `components\invoices\InvoiceSettingsModal.tsx` | "An error occurred" | "An error occurred. Please check your internet connection and try again." |
| `components\invoices\InvoiceSettingsModal.tsx` | "Please check all required fields" | "Please check your input and try again." |
| `components\layout\Sidebar.tsx` | "Failed to sign out" | "This action couldn't be completed. Please try again." |
| `components\leads\CreateLeadDialog.tsx` | "error  or  or  "Failed to create lead" | "An error occurred. Please check your internet connection and try again." |
| `components\leads\EditLeadDialog.tsx` | "error  or  or  "Failed to update lead" | "Your changes couldn't be saved. Please try again." |
| `components\media\MediaLibraryModal.tsx` | "Failed to load images" | "We couldn't load this data. Please refresh the page." |
| `components\media\MediaLibraryModal.tsx` | "Error loading library" | "An error occurred. Please check your internet connection and try again." |
| `components\notifications\NotificationBell.tsx` | "Failed to mark all as read" | "This action couldn't be completed. Please try again." |
| `components\projects\CreateProjectDialog.tsx` | "You must be logged in to create a project" | "Please check your input and try again." |
| `components\projects\CreateProjectDialog.tsx` | "error  or  or  "Failed to create project" | "An error occurred. Please check your internet connection and try again." |
| `components\projects\EditProjectDialog.tsx` | "error  or  or  "Failed to update project" | "Your changes couldn't be saved. Please try again." |
| `components\projects\ProjectFinancialsCard.tsx` | "Failed to update billing cycle" | "Your changes couldn't be saved. Please try again." |
| `components\projects\ProjectFinancialsCard.tsx` | "Failed to update settings" | "Your changes couldn't be saved. Please try again." |
| `components\projects\ProjectStatusControl.tsx` | "You don't have permission to change project status" | "You don't have permission to access or modify this information." |
| `components\projects\ProjectStatusControl.tsx` | "Cannot enter Management phase without an Annual Recurring Cost set." | "Please check your input and try again." |
| `components\projects\ProjectStatusControl.tsx` | "Failed to update status" | "Your changes couldn't be saved. Please try again." |
| `components\tasks\CreateTaskDialog.tsx` | "Failed to load form options" | "We couldn't load this data. Please refresh the page." |
| `components\tasks\CreateTaskDialog.tsx` | "error  or  or  "Failed to create task" | "An error occurred. Please check your internet connection and try again." |
| `components\tasks\CreateTaskDialog.tsx` | "An unexpected error occurred" | "Something unexpected happened. Please try refreshing the page." |
| `components\tasks\TaskDetailSheet.tsx` | "You don't have permission to modify this task" | "You don't have permission to access or modify this information." |
| `components\tasks\TaskDetailSheet.tsx` | "Failed to update status" | "Your changes couldn't be saved. Please try again." |
| `components\tasks\TaskDetailSheet.tsx` | "Failed to update priority" | "Your changes couldn't be saved. Please try again." |
| `components\tasks\TaskDetailSheet.tsx` | "Failed to update assignee" | "Your changes couldn't be saved. Please try again." |
| `components\tasks\TaskDetailSheet.tsx` | "Only admins and managers can delete tasks" | "Please check your input and try again." |
| `components\tasks\TaskDetailSheet.tsx` | "Failed to delete task" | "This item couldn't be deleted. It might be referenced by other records." |
| `components\tasks\TaskDetailSheet.tsx` | "You don't have permission to edit this task" | "You don't have permission to access or modify this information." |
| `components\ui\ai-textarea.tsx` | "result.error" | "An error occurred. Please check your internet connection and try again." |
| `components\ui\ai-textarea.tsx` | "Something went wrong with the rewrite." | "Something unexpected happened. Please try refreshing the page." |
| `components\ui\LogoUploader.tsx` | "Please upload an image file" | "Please check your input and try again." |
| `components\ui\LogoUploader.tsx` | "File size must be less than 2MB" | "Please check your input and try again." |
| `components\ui\LogoUploader.tsx` | "Failed to upload logo" | "This action couldn't be completed. Please try again." |
| `components\ui\rich-text-editor.tsx` | "Some files exceed 10MB limit" | "Please check your input and try again." |
| `components\users\CreateUserDialog.tsx` | "You must be logged in" | "Please check your input and try again." |
| `components\users\CreateUserDialog.tsx` | "Phone number must be in international format (e.g., +61412345678" | "Please enter a valid international phone number (e.g., +61412345678)." |
| `components\users\CreateUserDialog.tsx` | "result.error  or  or  "Failed to create user" | "We couldn't create this user. Please ensure the email isn't already registered." |
| `components\users\CreateUserDialog.tsx` | "Failed to create user" | "We couldn't create this user. Please ensure the email isn't already registered." |
| `components\users\EditUserDialog.tsx` | "You don't have permission to edit users" | "You don't have the required permissions to do this." |
| `components\users\EditUserDialog.tsx` | "error  or  or  "Failed to update user" | "We couldn't save these changes. Please check the fields and try again." |
| `components\users\EditUserDialog.tsx` | "Failed to update user" | "We couldn't save these changes. Please check the fields and try again." |
