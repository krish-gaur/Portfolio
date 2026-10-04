"use client";

import { useState } from "react";
import type { PortfolioData } from "@/types/portfolio";
import ResumeActions from "@/components/ResumeActions";

export default function About({ data }: { data: PortfolioData }) {
  const [active, setActive] = useState(0);
  const stage = data.about.stages[active] ?? data.about.stages[0];
  const initials = data.profile.name.trim().split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
  const activate = (index: number) => {
    setActive(index);
    requestAnimationFrame(() => document.getElementById(`story-tab-${index}`)?.focus());
  };

  return (
    <div className="identity-layout">
      <div className="identity-story">
        <div className="identity-story__nav" role="tablist" aria-label="Identity timeline">
          {data.about.stages.map((item, index) => (
            <button key={item.index} role="tab" id={`story-tab-${index}`} aria-selected={active === index} aria-controls="story-panel" tabIndex={active === index ? 0 : -1} type="button" onClick={() => setActive(index)} onKeyDown={(event) => {
              if (!["ArrowRight", "ArrowLeft", "Home", "End"].includes(event.key)) return;
              event.preventDefault();
              const next = event.key === "Home" ? 0 : event.key === "End" ? data.about.stages.length - 1 : (active + (event.key === "ArrowRight" ? 1 : -1) + data.about.stages.length) % data.about.stages.length;
              activate(next);
            }} className={active === index ? "is-active" : ""}>
              <span>{item.index}</span>{item.label}<i aria-hidden="true" />
            </button>
          ))}
        </div>
        <div className="identity-story__panel" id="story-panel" role="tabpanel" aria-labelledby={`story-tab-${active}`} tabIndex={0} key={stage.index}>
          <div className="identity-story__serial">IDENTITY / {stage.index}<span>— {stage.label.toUpperCase()}</span></div>
          <h3>{stage.title}</h3>
          <p>{stage.body}</p>
          <span className="identity-story__signal"><i className="status-dot" /> {stage.signal}</span>
        </div>
        <div className="identity-story__progress" aria-hidden="true"><span style={{ width: `${((active + 1) / data.about.stages.length) * 100}%` }} /></div>
      </div>
      <div className="identity-card">
        <div className="identity-card__top"><span className="eyebrow">IDENTITY CARD / 001</span><span className="identity-card__pulse"><i /> ACTIVE</span></div>
        <div className="identity-card__mono" aria-hidden="true">
          <span className="identity-card__orbit identity-card__orbit--1" /><span className="identity-card__orbit identity-card__orbit--2" />
          <div className="identity-card__monogram">{initials}<span>+</span></div>
          <i className="identity-card__mono-dot identity-card__mono-dot--a" /><i className="identity-card__mono-dot identity-card__mono-dot--b" /><i className="identity-card__mono-dot identity-card__mono-dot--c" />
        </div>
        <h3>{data.profile.name}</h3>
        <p>{data.profile.headline}</p>
        <div className="identity-card__metadata"><span>{data.profile.location}</span><span>{data.profile.community}</span></div>
        <ResumeActions data={data} />
      </div>
    </div>
  );
}
