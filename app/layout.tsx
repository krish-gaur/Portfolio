import type { Metadata, Viewport } from "next";
import portfolioJson from "@/data/portfolio.json";
import { normalizePortfolio } from "@/lib/portfolio";
import { getSiteOrigin } from "@/lib/site-origin";
import "./globals.css";

const portfolio = normalizePortfolio(portfolioJson);
export async function generateMetadata(): Promise<Metadata> {
  const siteUrl = await getSiteOrigin();
  return {
    title: portfolio.meta.title,
    description: portfolio.meta.description,
    applicationName: portfolio.ai.name,
    ...(siteUrl ? { metadataBase: new URL(siteUrl) } : {}),
    ...(siteUrl ? { alternates: { canonical: siteUrl } } : {}),
    openGraph: {
      title: portfolio.meta.title,
      description: portfolio.meta.description,
      type: "website",
      siteName: portfolio.ai.name,
      ...(siteUrl ? { url: siteUrl } : {})
    },
    twitter: {
      card: "summary_large_image",
      title: portfolio.meta.title,
      description: portfolio.meta.description
    },
    robots: { index: true, follow: true }
  };
}

export const viewport: Viewport = {
  themeColor: "#07090d",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
