import type { MetadataRoute } from "next"

import { siteUrl } from "@/lib/content"

// Search engines may crawl everything, and here's where the sitemap is.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${siteUrl}/sitemap.xml`,
  }
}
