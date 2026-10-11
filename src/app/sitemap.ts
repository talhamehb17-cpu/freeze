import type { MetadataRoute } from "next";

import { SITE_URL } from "@/lib/site";

/**
 * Sitemap (spec §36).
 *
 * Public marketing routes only. The signed-in surfaces (/portal, /admin) and the
 * auth pages (/login, /signup) are deliberately excluded — they are `noindex`
 * and carry no content a crawler should reach.
 */

const PUBLIC_ROUTES: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] }[] = [
  { path: "/", priority: 1, changeFrequency: "weekly" },
  { path: "/solutions", priority: 0.9, changeFrequency: "monthly" },
  { path: "/products", priority: 0.9, changeFrequency: "monthly" },
  { path: "/facility", priority: 0.85, changeFrequency: "monthly" },
  { path: "/logistics", priority: 0.85, changeFrequency: "monthly" },
  { path: "/request-storage", priority: 0.95, changeFrequency: "monthly" },
  { path: "/about", priority: 0.7, changeFrequency: "yearly" },
  { path: "/contact", priority: 0.7, changeFrequency: "yearly" },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return PUBLIC_ROUTES.map((route) => ({
    url: `${SITE_URL}${route.path}`,
    lastModified,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
