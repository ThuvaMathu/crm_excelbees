
// Verification script for app/robots.ts logic
const mockRobots = (appEnvironment, appUrl) => {
  const baseUrl = appUrl || 'https://excelbees.com';

  if (appEnvironment === 'dev') {
    return {
      rules: {
        userAgent: '*',
        disallow: '/',
      },
      sitemap: `${baseUrl}/sitemap.xml`,
    };
  }

  // prd and maintenance both stay indexable
  return {
    rules: {
      userAgent: '*',
      allow: '/',
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
};

console.log("--- Test: dev ---");
console.log(JSON.stringify(mockRobots('dev', 'https://dev.crm.excelbees.com'), null, 2));

console.log("\n--- Test: prd ---");
console.log(JSON.stringify(mockRobots('prd', 'https://crm.excelbees.com'), null, 2));

console.log("\n--- Test: maintenance ---");
console.log(JSON.stringify(mockRobots('maintenance', 'https://crm.excelbees.com'), null, 2));

console.log("\n--- Test: Default appUrl ---");
console.log(JSON.stringify(mockRobots('prd', undefined), null, 2));
