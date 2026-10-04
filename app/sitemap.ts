import type { MetadataRoute } from "next";
import { getSiteOrigin } from "@/lib/site-origin";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = await getSiteOrigin();
  if (!siteUrl) return [];
  return [{ url: siteUrl, lastModified: new Date(), changeFrequency: "monthly", priority: 1 }];
}
