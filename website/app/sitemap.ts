import type { MetadataRoute } from "next"

import { siteUrl } from "@/lib/content"

// The site's pages, for search engines. It's a single page for now.
export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: siteUrl, changeFrequency: "weekly", priority: 1 }]
}
