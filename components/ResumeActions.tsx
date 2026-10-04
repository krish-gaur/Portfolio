import type { PortfolioData } from "@/types/portfolio";

export default function ResumeActions({ data }: { data: PortfolioData }) {
  const resumeUrl = data.profile.resume.url.trim();
  if (!resumeUrl) {
    return <div className="resume-actions resume-actions--missing"><span>RESUME PDF / NOT PROVIDED</span></div>;
  }

  return (
    <div className="resume-actions">
      <a className="button button--light" data-magnetic href={resumeUrl} target="_blank" rel="noreferrer">VIEW RESUME <span>↗</span></a>
      <a className="button button--line" data-magnetic href={resumeUrl} download={data.profile.resume.fileName || undefined}>DOWNLOAD RESUME <span>↓</span></a>
    </div>
  );
}
