
// Verification script for robots.ts logic
const mockRobots = (isProduction, appUrl) => {
  const isProductionValue = isProduction === 'true';
  const baseUrl = appUrl || 'https://excelbees.com';

  if (!isProductionValue) {
    return {
      rules: {
        userAgent: '*',
        disallow: '/',
      },
      sitemap: `${baseUrl}/sitemap.xml`,
    };
  }

  return {
    rules: {
      userAgent: '*',
      allow: '/',
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
};

console.log("--- Test: Non-Production ---");
console.log(JSON.stringify(mockRobots('false', 'https://dev.crm.excelbees.com'), null, 2));

console.log("\n--- Test: Production ---");
console.log(JSON.stringify(mockRobots('true', 'https://crm.excelbees.com'), null, 2));

console.log("\n--- Test: Default appUrl ---");
console.log(JSON.stringify(mockRobots('true', undefined), null, 2));
