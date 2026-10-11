import type { MetadataRoute } from "next";

import { SITE_URL } from "@/lib/site";

/**
 * robots.txt (spec §36).
 *
 * Crawlers are kept off the signed-in surfaces, the auth pages and the API. The
 * demo dataset behind /admin and /portal is not content anyone should index.
 *
 * NOTE: `SITE_URL` falls back to http://localhost:3000 when
 * NEXT_PUBLIC_SITE_URL is unset — set it before deploying so the sitemap URL in
 * this file and in app/sitemap.ts point at the real origin.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/portal", "/admin", "/login", "/signup", "/api/"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
