import { headers } from "next/headers";
import portfolioJson from "@/data/portfolio.json";
import { canonicalSiteUrl, normalizePortfolio } from "@/lib/portfolio";

const configuredValue = process.env.NEXT_PUBLIC_SITE_URL?.trim() || normalizePortfolio(portfolioJson).meta.siteUrl;
const configured = canonicalSiteUrl(configuredValue);

/** Uses an explicitly configured production origin, then the trusted request host for preview deployments. */
export async function getSiteOrigin() {
  if (configured) return configured;
  try {
    const requestHeaders = await headers();
    const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
    const protocol = requestHeaders.get("x-forwarded-proto") ?? (host?.startsWith("localhost") ? "http" : "https");
    return host ? new URL(`${protocol}://${host}`).origin : "";
  } catch {
    return "";
  }
}
