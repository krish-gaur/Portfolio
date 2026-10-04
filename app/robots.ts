import type { MetadataRoute } from "next";
import { getSiteOrigin } from "@/lib/site-origin";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const siteUrl = await getSiteOrigin();
  return {
    rules: { userAgent: "*", allow: "/" },
    ...(siteUrl ? { sitemap: `${siteUrl}/sitemap.xml` } : {})
  };
}
