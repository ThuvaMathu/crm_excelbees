export const URLS = {
  BASE: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",

  // Public
  HOME: "/",
  LOGIN: "/login",
  SIGNUP: "/signup",
  FORGOT_PASSWORD: "/forgot-password",
  ONBOARDING: "/onboarding",

  // Org Hub
  ORG: "/org",
  ORG_PROFILE: "/org/profile",
  ORG_SETTINGS: "/org/settings",

  // Org Workspace (requires orgId)
  orgDashboard: (orgId: string) => `/org/${orgId}/dashboard`,
  orgLeads: (orgId: string) => `/org/${orgId}/leads`,
  orgContacts: (orgId: string) => `/org/${orgId}/contacts`,
  orgCompanies: (orgId: string) => `/org/${orgId}/companies`,
  orgDeals: (orgId: string) => `/org/${orgId}/deals`,
  orgProjects: (orgId: string) => `/org/${orgId}/projects`,
  orgTasks: (orgId: string) => `/org/${orgId}/tasks`,
  orgInvoices: (orgId: string) => `/org/${orgId}/invoices`,
  orgQuotes: (orgId: string) => `/org/${orgId}/quotes`,
  orgEmails: (orgId: string) => `/org/${orgId}/emails`,
  orgNotes: (orgId: string) => `/org/${orgId}/notes`,
  orgReports: (orgId: string) => `/org/${orgId}/reports`,
  orgAnalytics: (orgId: string) => `/org/${orgId}/analytics`,
  orgUsers: (orgId: string) => `/org/${orgId}/users`,
  orgProfile: (orgId: string) => `/org/${orgId}/profile`,
  orgSettings: (orgId: string) => `/org/${orgId}/settings`,
  orgIntegrations: (orgId: string) => `/org/${orgId}/integrations`,

  orgLeadDetail: (orgId: string, leadId: string) =>
    `/org/${orgId}/leads/${leadId}`,
  orgContactDetail: (orgId: string, contactId: string) =>
    `/org/${orgId}/contacts/${contactId}`,
  orgCompanyDetail: (orgId: string, companyId: string) =>
    `/org/${orgId}/companies/${companyId}`,
  orgDealDetail: (orgId: string, dealId: string) =>
    `/org/${orgId}/deals/${dealId}`,
  orgProjectDetail: (orgId: string, projectId: string) =>
    `/org/${orgId}/projects/${projectId}`,
} as const;

export type UrlKey = keyof typeof URLS;