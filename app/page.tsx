import portfolioJson from "@/data/portfolio.json";
import PortfolioApp from "@/components/PortfolioApp";
import { normalizePortfolio } from "@/lib/portfolio";

export default function HomePage() {
  const data = normalizePortfolio(portfolioJson);
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: data.profile.name,
    jobTitle: data.profile.headline,
    description: data.profile.bio,
    address: {
      "@type": "PostalAddress",
      addressLocality: data.profile.location
    },
    sameAs: Object.values(data.socials).map((item) => item.url).filter(Boolean),
    alumniOf: data.education.map((item) => ({
      "@type": "EducationalOrganization",
      name: item.institution
    }))
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }}
      />
      <PortfolioApp data={data} />
    </>
  );
}
