/**
 * Centralized Site Configuration
 * Single source of truth for all site-wide data
 */

export const siteConfig = {
	// ============================================
	// BRAND IDENTITY
	// ============================================
	name: "ExcelBees",
	tagline: "Your Data. Your Server. Your Domain.",
	description:
		"A personalized AI-powered CRM deployed entirely within your infrastructure. Zero data leakage. Complete sovereignty.",

	// ============================================
	// CONTACT INFORMATION
	// ============================================
	contact: {
		email: "enterprise@excelbees.com",
		phone: "+1 (800) 123-4567",
		supportEmail: "support@excelbees.com",
		// Physical address for SEO/Structured Data
		address: {
			street: "",
			city: "",
			state: "",
			postalCode: "",
			country: "",
		},
	},

	// ============================================
	// SOCIAL MEDIA LINKS
	// ============================================
	social: {
		twitter: "https://twitter.com/excelbees",
		linkedin: "https://linkedin.com/company/excelbees",
		facebook: "",
		// GitHub explicitly excluded per requirements
	},

	// ============================================
	// NAVIGATION LINKS
	// ============================================
	nav: {
		main: [
			{ name: "Features", href: "#features" },
			{ name: "Contact", href: "#enterprise-contact", action: "scroll" as const },
		],
		footer: {
			product: [
				{ name: "Features", href: "#features" },
				{ name: "Integrations", href: "#" },
				{ name: "Security", href: "#enterprise-contact" },
			],
			company: [
				{ name: "About Us", href: "#" },
				//{ name: "Careers", href: "#" },
				{ name: "Blog", href: "#" },
				{ name: "Contact", href: "#enterprise-contact", action: "scroll" as const },
			],
			legal: [
				{ name: "Privacy Policy", href: "/legal#privacy-policy" },
				{ name: "Terms of Service", href: "/legal#terms-of-service" },
			],
		},
	},

	// ============================================
	// SEO & METADATA
	// ============================================
	seo: {
		keywords: [
			"self-hosted CRM",
			"private CRM",
			"AI CRM",
			"data sovereignty",
			"on-premise CRM",
			"enterprise CRM",
			"custom CRM deployment",
			"private cloud CRM",
		].join(", "),
		ogImage: "/og-image.jpg",
		twitterCard: "summary_large_image",
	},

	// ============================================
	// LEGAL
	// ============================================
	legal: {
		copyright: `© ${new Date().getFullYear()} ExcelBees Inc. All rights reserved.`,
		companyType: "Corporation",
	},
} as const;

// Type exports for use in components
export type SiteConfig = typeof siteConfig;
