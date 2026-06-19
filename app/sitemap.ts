import type { MetadataRoute } from "next";
import { site } from "@/lib/site";
import {
  listWorkflows,
  listPlugins,
  listCreators,
  listCategories,
} from "@/lib/marketplace/data";

// Static Phase-1 + marketplace landing routes.
const staticRoutes = [
  "",
  "/download",
  "/workflows",
  "/plugins",
  "/about",
  "/privacy",
  "/changelog",
  "/contact",
  // Marketplace (public, non-gated)
  "/marketplace",
  "/marketplace/workflows",
  "/marketplace/plugins",
  "/marketplace/creators",
  "/marketplace/policies",
  "/marketplace/creator-guidelines",
  "/marketplace/plugin-safety",
];

// The marketplace data layer only returns public + approved content, so the
// dynamic entries below are inherently limited to approved public listings.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base: MetadataRoute.Sitemap = staticRoutes.map((route) => ({
    url: `${site.url}${route}`,
    changeFrequency: "weekly",
    priority: route === "" ? 1 : 0.7,
  }));

  try {
    const [workflows, plugins, creators, categories] = await Promise.all([
      listWorkflows(),
      listPlugins(),
      listCreators(),
      listCategories(),
    ]);

    for (const w of workflows) {
      base.push({
        url: `${site.url}/marketplace/workflows/${w.slug}`,
        changeFrequency: "weekly",
        priority: 0.6,
      });
    }
    for (const p of plugins) {
      base.push({
        url: `${site.url}/marketplace/plugins/${p.slug}`,
        changeFrequency: "weekly",
        priority: 0.6,
      });
    }
    for (const c of creators) {
      base.push({
        url: `${site.url}/u/${c.handle}`,
        changeFrequency: "weekly",
        priority: 0.5,
      });
    }
    for (const cat of categories) {
      base.push({
        url: `${site.url}/marketplace/categories/${cat.slug}`,
        changeFrequency: "weekly",
        priority: 0.5,
      });
    }
  } catch {
    // If the data layer is unavailable, fall back to static routes only.
  }

  return base;
}
