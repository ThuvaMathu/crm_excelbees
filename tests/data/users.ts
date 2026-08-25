const ROLE_VALUES = ["admin", "manager", "team"] as const;
type UserRole = (typeof ROLE_VALUES)[number];

export interface TestUser {
  email: string;
  password: string;
  role: UserRole;
  displayName: string;
}

export const USERS = {
  admin: {
    email: process.env.TEST_ADMIN_EMAIL || "test.admin@excelbees.com",
    password: process.env.TEST_ADMIN_PASSWORD || "Test@Admin2026!",
    role: "admin" as UserRole,
    displayName: "Test Admin",
  },
  manager: {
    email: process.env.TEST_MANAGER_EMAIL || "test.manager@excelbees.com",
    password: process.env.TEST_MANAGER_PASSWORD || "Test@Manager2026!",
    role: "manager" as UserRole,
    displayName: "Test Manager",
  },
  team: {
    email: process.env.TEST_TEAM_EMAIL || "test.team@excelbees.com",
    password: process.env.TEST_TEAM_PASSWORD || "Test@Team2026!",
    role: "team" as UserRole,
    displayName: "Test Team",
  },
  scanner: {
    email: process.env.TEST_SCANNER_EMAIL || "test.scanner@excelbees.com",
    password: process.env.TEST_SCANNER_PASSWORD || "Test@Scanner2026!",
    role: "team" as UserRole,
    displayName: "Test Scanner",
  },
} as const satisfies Record<string, TestUser>;

export const TEST_ORG_NAME =
  process.env.TEST_ORG_NAME || "Playwright Test Org";