import type { MetadataRoute } from "next";
import { isDev } from "@/lib/env";
import { getAppUrl } from "@/lib/environment";

export default function robots(): MetadataRoute.Robots {
  const sitemap = `${getAppUrl()}/sitemap.xml`;

  if (isDev) {
    return {
      rules: { userAgent: "*", disallow: "/" },
      sitemap,
    };
  }

  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap,
  };
}
