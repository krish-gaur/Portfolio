"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import type { PortfolioData } from "@/types/portfolio";
import Navigation from "@/components/Navigation";
import SignalField from "@/components/SignalField";
import AIAssistant from "@/components/ai/Assistant";
import Projects from "@/components/Projects";
import Experience from "@/components/Experience";
import Record from "@/components/Record";
import TechUniverse from "@/components/TechUniverse";
import About from "@/components/About";
import Contact from "@/components/Contact";
import CustomCursor from "@/components/CustomCursor";

export default function PortfolioApp({ data }: { data: PortfolioData }) {
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [assistantSeed, setAssistantSeed] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [booting, setBooting] = useState(true);
  const [secretOpen, setSecretOpen] = useState(false);
  const [heroQuestion, setHeroQuestion] = useState("");
  const profileInitials = data.profile.name.trim().split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
  const profileFirstName = data.profile.name.trim().split(/\s+/)[0]?.toLocaleLowerCase() ?? "";
  const scrollProgressRef = useRef<HTMLDivElement>(null);
  const sequenceRef = useRef(0);
  const typedRef = useRef("");
  const konami = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"];

  const launchAssistant = useCallback((prompt?: string) => {
    setAssistantSeed(prompt?.trim() ?? "");
    setAssistantOpen(true);
  }, []);
  const clearAssistantSeed = useCallback(() => setAssistantSeed(""), []);
  const closeAssistant = useCallback(() => setAssistantOpen(false), []);
  const openProjectFromAssistant = useCallback((projectId: string) => {
    setSelectedProjectId(projectId);
    setAssistantOpen(false);
    document.getElementById("work")?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
  }, []);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setBooting(false);
      return;
    }
    const timer = window.setTimeout(() => setBooting(false), 850);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const elements = Array.from(document.querySelectorAll<HTMLElement>(".reveal"));
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) {
      elements.forEach((element) => element.classList.add("is-visible"));
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let ticking = false;
    const update = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        if (scrollProgressRef.current) scrollProgressRef.current.style.transform = `scaleX(${max > 0 ? window.scrollY / max : 0})`;
        ticking = false;
      });
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update, { passive: true });
    return () => { window.removeEventListener("scroll", update); window.removeEventListener("resize", update); };
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing = Boolean(target?.closest("input, textarea, [contenteditable='true']"));
      if (event.key === "Escape") setSecretOpen(false);
      if (typing) return;
      sequenceRef.current = event.key === konami[sequenceRef.current] ? sequenceRef.current + 1 : event.key === konami[0] ? 1 : 0;
      if (sequenceRef.current === konami.length) {
        sequenceRef.current = 0;
        setSecretOpen(true);
      }
      if (event.key.length === 1 || event.key === " ") {
        typedRef.current = `${typedRef.current}${event.key}`.slice(-16).toLowerCase();
        if (typedRef.current.includes(`sudo ${profileFirstName}`)) {
          typedRef.current = "";
          setSecretOpen(true);
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [profileFirstName]);

  const submitHeroQuestion = (event: FormEvent) => {
    event.preventDefault();
    if (!heroQuestion.trim()) return;
    launchAssistant(heroQuestion);
    setHeroQuestion("");
  };

  const socialLinks = Object.entries(data.socials).filter(([, item]) => item.url.trim());

  return (
    <div className="portfolio-shell">
      <div className="scroll-progress" ref={scrollProgressRef} aria-hidden="true" />
      <div className="ambient-noise" aria-hidden="true" />
      <Navigation data={data} onAsk={() => launchAssistant()} />

      <main id="main-content">
        <section className="hero-section" id="home" aria-labelledby="hero-title">
          <div className="hero-section__backdrop" aria-hidden="true"><div className="hero-section__radial" /><div className="hero-section__grid" /><div className="hero-section__crosshair hero-section__crosshair--a" /><div className="hero-section__crosshair hero-section__crosshair--b" /></div>
          <div className="hero-layout">
            <div className="hero-copy">
              <div className="hero-copy__kicker"><span className="status-dot" /> PERSONAL SYSTEM / ONLINE <span className="hero-copy__serial">{data.profile.location.toUpperCase()}</span></div>
              <h1 id="hero-title">{data.profile.heroTitle.map((line, index) => <span key={index}>{line}{index === 0 && <i aria-hidden="true">/</i>}</span>)}</h1>
              <p className="hero-copy__summary">{data.profile.heroDescription}</p>
              <div className="hero-role">{data.profile.headline.split("|").map((role) => <span key={role}>{role.trim()}</span>)}</div>
              <div className="hero-actions">
                <a href="#work" className="button button--light" data-magnetic>Explore selected work <span>↓</span></a>
                <button className="button button--text" type="button" data-magnetic onClick={() => launchAssistant()}><span className="button__target">✳</span> Enter the interface <span>↗</span></button>
              </div>
              <div className="hero-copy__location"><span>01 — 05</span><span>{data.profile.secondaryHeadline}</span></div>
            </div>
            <div className="hero-console">
              <div className="hero-console__frame" aria-hidden="true"><span className="frame-corner frame-corner--tl" /><span className="frame-corner frame-corner--tr" /><span className="frame-corner frame-corner--bl" /><span className="frame-corner frame-corner--br" /><span className="frame-label frame-label--left">FIG 01 / INTERFACE</span><span className="frame-label frame-label--right">SOURCE / PORTFOLIO.JSON</span></div>
              <SignalField />
              <button className="hero-console__identity" type="button" onClick={() => launchAssistant()}><span className="eyebrow">KRISH OS / INTERFACE</span><strong>Ask the system.</strong><span className="hero-console__hint">OPEN THE AI FRONT DOOR ↗</span></button>
            </div>
          </div>
          <div className="hero-identity-rail" aria-hidden="true"><span>{data.profile.name.toUpperCase()}</span><i /><span>AI / SECURITY / BUILD</span></div>
          <div className="hero-bottom">
            <form className="hero-prompt" onSubmit={submitHeroQuestion}>
              <span className="hero-prompt__symbol" aria-hidden="true">⌘</span>
              <label className="sr-only" htmlFor="hero-question">Ask {data.profile.name} a question</label>
              <input id="hero-question" value={heroQuestion} onChange={(event) => setHeroQuestion(event.target.value)} placeholder={`Ask ${data.profile.name} anything...`} maxLength={1400} />
              <span className="hero-prompt__hint">PRESS ENTER <kbd>↵</kbd></span>
              <button type="submit" aria-label="Ask the AI assistant" disabled={!heroQuestion.trim()}>↗</button>
            </form>
            <div className="hero-scroll-cue"><span>SCROLL TO EXPLORE</span><i /></div>
          </div>
        </section>

        <div className="signal-strip" aria-label="Areas of focus">
          <span className="signal-strip__label">CURRENT SIGNAL /</span>
          <div className="signal-strip__items">{data.profile.focus.map((item, index) => <span key={item}>{item}<i aria-hidden="true">✳</i>{index === data.profile.focus.length - 1 && <span className="signal-strip__end">IN PROGRESS</span>}</span>)}</div>
        </div>

        <section id="work" className="page-section work-section" aria-labelledby="work-title">
          <div className="section-shell">
            <SectionHeading number="01" label="PRODUCT FILES / SELECTED SYSTEMS" title={<>Built to be <em>used.</em></>} description="A few problems I've chosen to make less abstract. Open a file to inspect the product thinking behind it." id="work-title" />
            <Projects data={data.projects} selectedProjectId={selectedProjectId} onSelectedProjectIdChange={setSelectedProjectId} />
            <div className="section-footnote"><span>PROJECT INDEX / {String(data.projects.length).padStart(2, "0")} SYSTEMS</span><span>FUTURE BUILDS LIVE IN PORTFOLIO.JSON <i>↗</i></span></div>
          </div>
        </section>

        <section id="experience" className="page-section experience-section" aria-labelledby="experience-title">
          <div className="section-shell">
            <SectionHeading number="02" label="FIELD NOTES / EXPERIENCE" title={<>Learning in <em>the field.</em></>} description="A short log of roles, responsibilities, and the systems behind the work." id="experience-title" />
            <Experience experience={data.experience} education={data.education} />
          </div>
        </section>

        <section id="record" className="page-section record-section" aria-labelledby="record-title">
          <div className="section-shell">
            <SectionHeading number="03" label="COMPETITIVE INTELLIGENCE / RECORD" title={<>Proof, not <em>posture.</em></>} description="A track record in rooms where ideas have to become working demos. Only named results are shown as named entries." id="record-title" />
            <Record achievements={data.achievements} hackathons={data.hackathons} stats={data.stats} />
          </div>
        </section>

        <section id="lab" className="page-section lab-section" aria-labelledby="lab-title">
          <div className="section-shell">
            <SectionHeading number="04" label="TECHNICAL UNIVERSE / LIVE MAP" title={<>The tools are a <em>means.</em></>} description="A changing map of the systems, tools, and problem spaces in my orbit. No fake proficiency meters." id="lab-title" />
            <TechUniverse categories={data.skills.categories} initials={profileInitials} />
          </div>
        </section>

        <section id="identity" className="page-section identity-section" aria-labelledby="identity-title">
          <div className="section-shell">
            <SectionHeading number="05" label={data.about.eyebrow.toUpperCase()} title={<>An identity still <em>compiling.</em></>} description={data.about.title} id="identity-title" />
            <About data={data} />
          </div>
        </section>

        <section id="contact" className="page-section contact-section" aria-labelledby="contact-title">
          <div className="section-shell section-shell--wide">
            <div className="contact-section__intro"><span className="eyebrow">NEXT / OPEN CHANNEL</span><span>Something worth building?</span></div>
            <h2 className="sr-only" id="contact-title">Contact</h2>
            <Contact data={data} onAsk={launchAssistant} />
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <a className="site-footer__brand" href="#home"><span className="wordmark__glyph" aria-hidden="true"><i /><i /><i /></span><span>{data.profile.name}<small>END OF TRANSMISSION / {new Date().getFullYear()}</small></span></a>
        <span className="site-footer__status"><i className="status-dot" /> {data.profile.availability}</span>
        <div className="site-footer__socials">{socialLinks.map(([id, item]) => <a href={item.url} key={id} target={item.url.startsWith("http") ? "_blank" : undefined} rel={item.url.startsWith("http") ? "noreferrer" : undefined} aria-label={item.label}>{socialGlyph(id)}<span>{item.label}</span></a>)}</div>
        <a className="site-footer__top" href="#home">BACK TO TOP ↑</a>
      </footer>

      <button className="ask-float" type="button" data-magnetic onClick={() => launchAssistant()} aria-label={`Ask ${data.profile.name}'s portfolio assistant`}><span>✳</span> ASK {data.profile.name.toUpperCase()} <i>↗</i></button>
      <AIAssistant data={data} isOpen={assistantOpen} initialPrompt={assistantSeed} onClose={closeAssistant} onOpenProject={openProjectFromAssistant} onConsumeInitialPrompt={clearAssistantSeed} />
      <CustomCursor />

      {booting && <div className="boot-screen" role="status" aria-live="polite"><div className="boot-screen__content"><div className="boot-screen__brand"><span className="wordmark__glyph" aria-hidden="true"><i /><i /><i /></span><span>{data.ai.name.toUpperCase()}</span></div><span className="eyebrow">INITIALIZING PERSONAL SYSTEM</span><div className="boot-screen__bar"><i /></div><div className="boot-screen__logs"><span>AI INTERFACE <b>ONLINE</b></span><span>PROJECT FILES <b>ONLINE</b></span><span>FIELD LOG <b>ONLINE</b></span><span>PROFILE DATA <b>READY</b></span></div><button type="button" onClick={() => setBooting(false)}>SKIP BOOT <span>↗</span></button></div></div>}
      {secretOpen && <div className="secret-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSecretOpen(false); }}><section className="secret-screen" role="dialog" aria-modal="true" aria-labelledby="secret-title"><button className="icon-button" type="button" onClick={() => setSecretOpen(false)} aria-label="Close developer mode">×</button><span className="eyebrow">ROOT ACCESS / GRANTED</span><div className="secret-screen__glyph">⌘</div><h2 id="secret-title">You found the developer.</h2><p>Good instincts. Now go break something useful.</p><div className="secret-screen__terminal"><span>› sudo {profileFirstName}</span><strong>ACCESS GRANTED / OPERATOR IDENTIFIED</strong><span>› status</span><strong>BUILDING / ALWAYS</strong><i>█</i></div></section></div>}
    </div>
  );
}

function SectionHeading({ number, label, title, description, id }: { number: string; label: string; title: ReactNode; description: string; id: string }) {
  return <div className="section-heading reveal">
    <div className="section-heading__number">{number}<i /></div>
    <div className="section-heading__content"><span className="eyebrow">{label}</span><h2 id={id}>{title}</h2></div>
    <p>{description}</p>
  </div>;
}

function socialGlyph(id: string) {
  if (id === "github") return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.7c-2.78.61-3.37-1.18-3.37-1.18-.45-1.16-1.11-1.47-1.11-1.47-.91-.63.07-.62.07-.62 1 .07 1.52 1.02 1.52 1.02.89 1.52 2.34 1.08 2.91.83.09-.65.35-1.08.63-1.33-2.22-.25-4.55-1.11-4.55-4.94 0-1.09.39-1.98 1.02-2.68-.1-.25-.44-1.27.1-2.65 0 0 .83-.27 2.75 1.02a9.6 9.6 0 0 1 5 0c1.91-1.29 2.74-1.02 2.74-1.02.55 1.38.21 2.4.11 2.65.63.7 1.01 1.59 1.01 2.68 0 3.84-2.33 4.68-4.56 4.93.36.31.68.92.68 1.86v2.76c0 .26.18.57.69.48A10 10 0 0 0 12 2Z" /></svg>;
  if (id === "email") return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.5 6.5h17v11h-17zM4 7l8 6 8-6" /></svg>;
  if (id === "linkedin") return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 9v10M5 5.5v.1M10 19v-6a4 4 0 0 1 8 0v6M10 9v10" /></svg>;
  if (id === "x") return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 4 14 16M19 4 5 20M5 4h4l10 16h-4z" /></svg>;
  return <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8" /><path d="M4 12h16M12 4a12 12 0 0 1 0 16M12 4a12 12 0 0 0 0 16" /></svg>;
}
