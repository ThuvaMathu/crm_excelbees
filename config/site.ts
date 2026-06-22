export const siteConfig = {
    name: "ExcelBees",
    tagline: "Your Data. Your Server. Your Domain.",
    description: "A personalized AI-powered CRM deployed entirely within your infrastructure. Zero data leakage. Complete sovereignty.",

    contact: {
        email: "enterprise@excelbees.com",
        phone: "+1 (800) 123-4567",
        supportEmail: "support@excelbees.com",
    },

    legal: {
        copyright: `© ${new Date().getFullYear()} ExcelBees Inc. All rights reserved.`,
        companyType: "Corporation",
    },
} as const;

export type SiteConfig = typeof siteConfig;
