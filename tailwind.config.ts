import type { Config } from "tailwindcss";

const config: Config = {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{js,ts,jsx,tsx,mdx}",
		"./components/**/*.{js,ts,jsx,tsx,mdx}",
		"./app/**/*.{js,ts,jsx,tsx,mdx}",
	],
	theme: {
		extend: {
			colors: {
				// Excel Bees Brand Colors - AMBER (not Gold)
				primary: {
					DEFAULT: "#F59E0B", // Amber-500 - True Amber/Yellow
					50: "#FFFBEB",
					100: "#FEF3C7",
					200: "#FDE68A",
					300: "#FCD34D",
					400: "#FBBF24",
					500: "#F59E0B",
					600: "#D97706",
					700: "#B45309",
					800: "#92400E",
					900: "#78350F",
					foreground: "#FFFFFF",
				},
				secondary: {
					DEFAULT: "#0A1628", // Enterprise Midnight Blue
					50: "#F0F4F8",
					100: "#E1E9F2",
					200: "#C2D3E6",
					300: "#A3BED9",
					400: "#84A9CC",
					500: "#6594BF",
					600: "#4C7199",
					700: "#334E73",
					800: "#1A2738", // Rich slate gray
					900: "#0A1628", // Deepest midnight
					foreground: "#FFFFFF",
				},
				accent: {
					DEFAULT: "#D97706", // Amber-600 - Darker amber for accents
					foreground: "#FFFFFF",
				},
				enterprise: {
					amber: "#F59E0B", // Primary amber color
					midnight: "#0A1628",
					slate: "#1A2738",
					border: "#2D3F52",
					highlight: "#FEF3C7",
					surface: "#111C2E",
				},
				success: "#10B981",
				warning: "#F59E0B",
				danger: "#EF4444",
				background: "hsl(var(--background))",
				foreground: "hsl(var(--foreground))",
				card: {
					DEFAULT: "hsl(var(--card))",
					foreground: "hsl(var(--card-foreground))",
				},
				popover: {
					DEFAULT: "hsl(var(--popover))",
					foreground: "hsl(var(--popover-foreground))",
				},
				muted: {
					DEFAULT: "hsl(var(--muted))",
					foreground: "hsl(var(--muted-foreground))",
				},
				destructive: {
					DEFAULT: "hsl(var(--destructive))",
					foreground: "hsl(var(--destructive-foreground))",
				},
				border: "hsl(var(--border))",
				input: "hsl(var(--input))",
				ring: "hsl(var(--ring))",
				chart: {
					"1": "hsl(var(--chart-1))",
					"2": "hsl(var(--chart-2))",
					"3": "hsl(var(--chart-3))",
					"4": "hsl(var(--chart-4))",
					"5": "hsl(var(--chart-5))",
				},
			},
			borderRadius: {
				lg: "var(--radius)",
				md: "calc(var(--radius) - 2px)",
				sm: "calc(var(--radius) - 4px)",
			},
		},
	},
	plugins: [require("tailwindcss-animate")],
};

export default config;
