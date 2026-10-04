"use client";

import { useEffect, useRef, useState } from "react";
import type { PortfolioData } from "@/types/portfolio";

export default function Contact({ data, onAsk }: { data: PortfolioData; onAsk: (prompt?: string) => void }) {
  const [activeRoute, setActiveRoute] = useState<PortfolioData["contact"]["routes"][number] | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const email = data.socials.email?.url?.trim() ?? "";
  const github = data.socials.github?.url?.trim() ?? "";
  const initials = data.profile.name.trim().split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();

  useEffect(() => {
    if (!activeRoute) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setActiveRoute(null);
      if (event.key === "Tab") {
        const focusable = Array.from(document.querySelectorAll<HTMLElement>(".contact-dialog button:not([disabled]), .contact-dialog a[href]"));
        const first = focusable[0];
        const last = focusable.at(-1);
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => { document.body.style.overflow = previousOverflow; window.removeEventListener("keydown", onKeyDown); };
  }, [activeRoute]);

  const selectRoute = (route: PortfolioData["contact"]["routes"][number]) => {
    if (email.startsWith("mailto:")) {
      const subject = encodeURIComponent(`${route.label} — ${data.profile.name}`);
      window.location.href = `${email}?subject=${subject}`;
      return;
    }
    setActiveRoute(route);
  };

  return (
    <>
      <div className="contact-shell">
        <div className="contact-shell__orb" aria-hidden="true"><span>{initials}</span><i /><i /><i /></div>
        <div className="contact-shell__content">
          <span className="eyebrow">CHANNEL OPEN / {data.profile.location.toUpperCase()}</span>
          <h2>{data.contact.headline}</h2>
          <p>{data.contact.subhead}</p>
          <div className="contact-routes">
            {data.contact.routes.map((route, index) => <button key={route.id} type="button" className="contact-route" data-magnetic onClick={() => selectRoute(route)}>
              <span className="contact-route__index">0{index + 1}</span><span className="contact-route__icon" aria-hidden="true">{route.icon}</span><strong>{route.label}</strong><span className="contact-route__arrow" aria-hidden="true">↗</span>
            </button>)}
          </div>
        </div>
        <div className="contact-shell__footer"><span><i className="status-dot" /> {data.profile.availability}</span><span>NO FORM. JUST A DIRECTION.</span></div>
      </div>
      {activeRoute && <div className="contact-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setActiveRoute(null); }}>
        <article className="contact-dialog" role="dialog" aria-modal="true" aria-labelledby="contact-dialog-title">
          <button ref={closeRef} type="button" className="icon-button contact-dialog__close" onClick={() => setActiveRoute(null)} aria-label="Close contact options">×</button>
          <span className="eyebrow">ROUTE / {activeRoute.id.toUpperCase()}</span>
          <h3 id="contact-dialog-title">{activeRoute.label}</h3>
          <p>{activeRoute.intent}</p>
          {email.startsWith("mailto:") ? <a className="button button--light" href={`${email}?subject=${encodeURIComponent(`${activeRoute.label} — ${data.profile.name}`)}`}>Start an email <span>↗</span></a> : <>
            <p className="contact-dialog__note">An email address has not been added to the public portfolio. Use the listed public channel, or ask the portfolio interface about this topic.</p>
            <div className="contact-dialog__actions">
              {github && <a className="button button--line" href={github} target="_blank" rel="noreferrer">Open GitHub <span>↗</span></a>}
              <button className="button button--light" type="button" onClick={() => { const prompt = activeRoute.intent; setActiveRoute(null); onAsk(prompt); }}>Ask the interface <span>↗</span></button>
            </div>
          </>}
        </article>
      </div>}
    </>
  );
}
