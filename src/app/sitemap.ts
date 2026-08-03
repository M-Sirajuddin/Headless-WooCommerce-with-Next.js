import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/seo";
import {
  getStoreCategoriesCached,
  getStoreProductsCached,
} from "@/lib/mock";

export const revalidate = 3600; // refresh the sitemap hourly

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: siteConfig.url, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${siteConfig.url}/products`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${siteConfig.url}/about-us`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
  ];

  let categoryRoutes: MetadataRoute.Sitemap = [];
  let productRoutes: MetadataRoute.Sitemap = [];

  try {
    const categories = await getStoreCategoriesCached(100);
    categoryRoutes = categories.map((c) => ({
      url: `${siteConfig.url}/category/${c.slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));
  } catch {
    /* API unavailable — ship static + product routes only */
  }

  try {
    const { items } = await getStoreProductsCached({ perPage: 100 });
    productRoutes = items.map((p) => ({
      url: `${siteConfig.url}/product/${p.slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    }));
  } catch {
    /* API unavailable — skip product routes */
  }

  return [...staticRoutes, ...categoryRoutes, ...productRoutes];
}
