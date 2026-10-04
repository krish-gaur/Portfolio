"use client";

import { useMemo, useState } from "react";
import type { CSSProperties } from "react";
import type { PortfolioData } from "@/types/portfolio";

export default function TechUniverse({ categories, initials }: { categories: PortfolioData["skills"]["categories"]; initials: string }) {
  const [activeId, setActiveId] = useState(categories[0]?.id ?? "");
  const [hovered, setHovered] = useState<string | null>(null);
  const active = useMemo(() => categories.find((category) => category.id === activeId) ?? categories[0], [activeId, categories]);
  const activeItem = active?.items.find((item) => item === hovered);
  const activateCategory = (index: number) => {
    const next = categories[index];
    if (!next) return;
    setActiveId(next.id);
    setHovered(null);
    requestAnimationFrame(() => document.getElementById(`tab-${next.id}`)?.focus());
  };

  if (!active) return null;

  return (
    <div className="universe">
      <div className="universe__rail" role="tablist" aria-label="Technology categories">
        {categories.map((category, index) => (
          <button
            key={category.id}
            role="tab"
            aria-selected={active.id === category.id}
            aria-controls="universe-canvas"
            id={`tab-${category.id}`}
            tabIndex={active.id === category.id ? 0 : -1}
            className={`universe__category${active.id === category.id ? " is-active" : ""}`}
            type="button"
            onClick={() => { setActiveId(category.id); setHovered(null); }}
            onKeyDown={(event) => {
              if (!["ArrowRight", "ArrowLeft", "Home", "End"].includes(event.key)) return;
              event.preventDefault();
              const next = event.key === "Home" ? 0 : event.key === "End" ? categories.length - 1 : (index + (event.key === "ArrowRight" ? 1 : -1) + categories.length) % categories.length;
              activateCategory(next);
            }}
          >
            <span className="universe__category-number">0{index + 1}</span>
            <span>{category.label}</span>
            <span className="universe__category-arrow" aria-hidden="true">↗</span>
          </button>
        ))}
        <p className="universe__rail-note">Select a field to reconfigure the map.</p>
      </div>
      <div className="universe__map" id="universe-canvas" role="tabpanel" aria-labelledby={`tab-${active.id}`}>
        <div className="universe__map-header"><span>{active.eyebrow}</span><span>FIELD MAP / {String(active.items.length).padStart(2, "0")} NODES</span></div>
        <div className={`universe__orbit universe__orbit--a universe__orbit--${active.id}`} aria-hidden="true" />
        <div className="universe__orbit universe__orbit--b" aria-hidden="true" />
        <div className="universe__orbit universe__orbit--c" aria-hidden="true" />
        <div className="universe__core"><span>{initials}</span><i className="universe__core-ring" /></div>
        <svg className="universe__connections" viewBox="0 0 600 500" preserveAspectRatio="none" aria-hidden="true">
          {active.items.map((_, index) => {
            const angle = (Math.PI * 2 * index) / active.items.length - Math.PI / 2;
            const x = 300 + Math.cos(angle) * 150;
            const y = 250 + Math.sin(angle) * 152;
            return <line key={index} x1="300" y1="250" x2={x} y2={y} style={{ animationDelay: `${index * 80}ms` }} />;
          })}
        </svg>
        {active.items.map((item, index) => {
          const angle = (Math.PI * 2 * index) / active.items.length - Math.PI / 2;
          const radiusX = active.items.length > 7 ? 37 : 33;
          const radiusY = active.items.length > 7 ? 34 : 31;
          const style = {
            left: `${50 + Math.cos(angle) * radiusX}%`,
            top: `${50 + Math.sin(angle) * radiusY}%`,
            "--node-delay": `${index * 70}ms`
          } as CSSProperties;
          const isSelected = hovered === item;
          return (
            <button
              className={`universe__node${isSelected ? " is-selected" : ""}`}
              type="button"
              style={style}
              key={item}
              onMouseEnter={() => setHovered(item)}
              onMouseLeave={() => setHovered(null)}
              onFocus={() => setHovered(item)}
              onBlur={() => setHovered(null)}
              onClick={() => setHovered(isSelected ? null : item)}
              aria-label={`${item}, technology node`}
            >
              <i aria-hidden="true" />{item}
            </button>
          );
        })}
        <div className="universe__map-footer">
          <span><i className="status-dot" /> {activeItem ? `SIGNAL LOCKED / ${activeItem.toUpperCase()}` : "POINTER TO INSPECT"}</span>
          <span>NO SCORES. JUST SYSTEMS.</span>
        </div>
      </div>
    </div>
  );
}
