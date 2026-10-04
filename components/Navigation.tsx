"use client";

import { useEffect, useState } from "react";
import type { PortfolioData } from "@/types/portfolio";

type NavigationProps = {
  data: PortfolioData;
  onAsk: () => void;
};

const items = [
  { id: "work", label: "WORK" },
  { id: "experience", label: "FIELD NOTES" },
  { id: "record", label: "RECORD" },
  { id: "lab", label: "TECH MAP" },
  { id: "identity", label: "IDENTITY" }
];

export default function Navigation({ data, onAsk }: NavigationProps) {
  const [active, setActive] = useState("home");

  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    const sections = ["home", ...items.map((item) => item.id), "contact"]
      .map((id) => document.getElementById(id))
      .filter((element): element is HTMLElement => Boolean(element));

    sections.forEach((section) => {
      const observer = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting) setActive(section.id);
      }, { rootMargin: "-34% 0px -56% 0px", threshold: 0 });
      observer.observe(section);
      observers.push(observer);
    });

    return () => observers.forEach((observer) => observer.disconnect());
  }, []);

  return (
    <header className="topbar">
      <a className="wordmark" href="#home" aria-label={`${data.profile.name} — back to top`}>
        <span className="wordmark__glyph" aria-hidden="true"><i /><i /><i /></span>
        <span className="wordmark__text">{data.profile.name}<small>PERSONAL SYSTEM / 01</small></span>
      </a>
      <nav className="topnav" aria-label="Main navigation">
        {items.map((item) => (
          <a key={item.id} href={`#${item.id}`} className={active === item.id ? "is-active" : ""}>
            {item.label}
          </a>
        ))}
      </nav>
      <div className="topbar__right">
        <span className="topbar__signal"><i /> SYSTEM ONLINE</span>
        <button className="ask-trigger" type="button" data-magnetic onClick={onAsk}>
          <span className="ask-trigger__spark" aria-hidden="true">✳</span>
          ASK {data.profile.name.trim().split(/\s+/)[0]?.toUpperCase()}
          <span className="ask-trigger__key" aria-hidden="true">↵</span>
        </button>
      </div>
    </header>
  );
}
