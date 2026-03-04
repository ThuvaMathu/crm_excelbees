import { MetadataRoute } from 'next';
import { siteConfig } from '@/config/site';

export default function robots(): MetadataRoute.Robots {
  const isProduction = process.env.IS_PRODUCTION === 'true';
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://excelbees.com';

  // Specific check for dev URL to ensure it's always blocked
  // Using a dynamic check if possible, or just environmental logic
  
  if (!isProduction) {
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
}
