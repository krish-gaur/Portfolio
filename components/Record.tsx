"use client";

import { useMemo, useState } from "react";
import type { PortfolioData } from "@/types/portfolio";

export default function Record({ achievements, hackathons, stats }: { achievements: PortfolioData["achievements"]; hackathons: PortfolioData["hackathons"]; stats: PortfolioData["stats"] }) {
  const categories = useMemo(() => ["ALL SIGNALS", ...new Set(achievements.map((item) => item.category.toUpperCase()))], [achievements]);
  const [filter, setFilter] = useState("ALL SIGNALS");
  const [expanded, setExpanded] = useState<string | null>(null);
  const visible = achievements.filter((item) => filter === "ALL SIGNALS" || item.category.toUpperCase() === filter);

  return (
    <div className="record-system">
      <div className="record-stats">
        <div className="record-stat record-stat--primary"><span className="eyebrow">TOP FIVE FINISHES</span><strong>{stats.hackathonTopFive}</strong><span>hackathons</span><i className="record-stat__arc" /></div>
        <div className="record-stat"><span className="eyebrow">WIN RATE / COUNT</span><strong>{stats.hackathonWins}</strong><span>hackathon wins</span><i className="record-stat__ticks" /></div>
        <div className="record-stat record-stat--text"><span className="eyebrow">NAMED RESULT</span><strong>{stats.namedHackathonResult}</strong><span>Code Manthan · internal</span><i className="record-stat__wire" /></div>
      </div>

      <div className="battle-record">
        <div className="battle-record__heading"><div><span className="eyebrow">BATTLE RECORD / VERIFIED INPUTS</span><h3>Competition log<span>_</span></h3></div><span className="battle-record__count">{String(hackathons.length).padStart(2, "0")} NAMED ENTRY</span></div>
        {hackathons.map((item) => (
          <article className="battle-entry" key={item.id}>
            <div className="battle-entry__rank"><span>RANK</span><strong>{item.rank}</strong></div>
            <div className="battle-entry__main"><h4>{item.name}</h4><p>{item.result}</p><div className="battle-entry__meta">
              {item.project ? <span>PROJECT / {item.project}</span> : <span>PROJECT / NOT LISTED</span>}
              {item.domain ? <span>DOMAIN / {item.domain}</span> : <span>DOMAIN / NOT LISTED</span>}
            </div></div>
            <span className="battle-entry__medal" aria-hidden="true">◈</span>
          </article>
        ))}
        <p className="battle-record__note">Only named event details appear here. Aggregate results above are recorded separately.</p>
      </div>

      <div className="achievement-wall">
        <div className="achievement-wall__head"><div><span className="eyebrow">THE SIGNALS THAT STUCK</span><h3>Milestones <span>—</span> not a trophy shelf.</h3></div>
          <div className="achievement-filter" role="group" aria-label="Filter achievements">
            {categories.map((category) => <button key={category} className={filter === category ? "is-active" : ""} type="button" onClick={() => setFilter(category)}>{category}</button>)}
          </div>
        </div>
        <div className="achievement-grid">
          {visible.map((item, index) => {
            const isExpanded = expanded === item.id;
            return <button className={`achievement-node${isExpanded ? " is-expanded" : ""}`} type="button" key={item.id} onClick={() => setExpanded(isExpanded ? null : item.id)} aria-expanded={isExpanded}>
              <span className="achievement-node__orbit" aria-hidden="true"><i /></span>
              <span className="achievement-node__meta">{item.category} / {String(item.order).padStart(2, "0")}</span>
              <strong>{item.metric}</strong>
              <span className="achievement-node__title">{item.title}</span>
              <span className="achievement-node__detail">{isExpanded ? item.detail : "TAP / CLICK TO INSPECT"}</span>
              <span className="achievement-node__index">0{index + 1}</span>
            </button>;
          })}
        </div>
      </div>
    </div>
  );
}
