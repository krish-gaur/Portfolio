import type { PortfolioData } from "@/types/portfolio";

export default function Experience({ experience, education }: { experience: PortfolioData["experience"]; education: PortfolioData["education"] }) {
  return (
    <div className="experience-layout">
      <div className="experience-layout__intro">
        <div className="sticky-note">
          <span className="eyebrow">FIELD LOG / 001—004</span>
          <p>Different rooms.<br /><em>Same instinct:</em><br />understand the system.</p>
          <span className="sticky-note__mark">WORK / LEARN / REPEAT</span>
        </div>
        <div className="education-stamp">
          <span className="education-stamp__icon" aria-hidden="true">⌁</span>
          <div>
            <span className="eyebrow">CURRENTLY STUDYING</span>
            {education.map((item) => <div key={item.institution} className="education-stamp__copy">
              <strong>{item.degree}</strong>
              <span>{item.institution} · {item.affiliation}</span>
              <small>EXPECTED {item.expectedGraduation} / {item.location}</small>
            </div>)}
          </div>
        </div>
      </div>
      <div className="experience-track">
        {experience.map((item, index) => (
          <article className="experience-entry reveal" key={item.id}>
            <div className="experience-entry__index"><span>0{index + 1}</span><i /></div>
            <div className="experience-entry__content">
              <div className="experience-entry__head">
                <div><h3>{item.company}</h3><div className="experience-entry__roles">{item.roles.map((role) => <span key={role}>{role}</span>)}</div></div>
                {item.dateRange && <span className="experience-entry__date">{item.dateRange}</span>}
              </div>
              <p>{item.summary}</p>
              {item.work.length > 0 && <ul className="work-tags">{item.work.map((task) => <li key={task}>{task}</li>)}</ul>}
            </div>
          </article>
        ))}
        <div className="experience-track__end"><span /> END OF LOG — MORE TO COME</div>
      </div>
    </div>
  );
}
