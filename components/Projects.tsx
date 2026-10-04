"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { KeyboardEvent, MouseEvent, PointerEvent } from "react";
import type { PortfolioData } from "@/types/portfolio";

type Project = PortfolioData["projects"][number];
type ProjectsProps = {
  data: Project[];
  selectedProjectId?: string | null;
  onSelectedProjectIdChange?: (projectId: string | null) => void;
};

export default function Projects({ data, selectedProjectId = null, onSelectedProjectIdChange }: ProjectsProps) {
  const [selected, setSelected] = useState<Project | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!selectedProjectId) {
      setSelected(null);
      return;
    }
    const project = data.find((item) => item.id === selectedProjectId);
    if (project) setSelected(project);
  }, [data, selectedProjectId]);

  const closeProject = useCallback(() => {
    const projectId = selected?.id;
    setSelected(null);
    onSelectedProjectIdChange?.(null);
    requestAnimationFrame(() => {
      const last = previousFocusRef.current;
      if (last?.isConnected) last.focus();
      else if (projectId) document.querySelector<HTMLElement>(`[data-project-trigger="${projectId}"]`)?.focus();
    });
  }, [onSelectedProjectIdChange, selected?.id]);

  const openProject = (project: Project, trigger?: HTMLElement) => {
    previousFocusRef.current = trigger ?? (document.activeElement instanceof HTMLElement ? document.activeElement : null);
    setSelected(project);
    onSelectedProjectIdChange?.(project.id);
  };

  useEffect(() => {
    if (!selected) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") closeProject();
      if (event.key === "Tab") {
        const focusable = Array.from(document.querySelectorAll<HTMLElement>(".project-detail button:not([disabled]), .project-detail a[href]"));
        const first = focusable[0];
        const last = focusable.at(-1);
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [selected, closeProject]);

  return (
    <>
      <div className="projects-grid">
        {data.map((project, index) => <ProjectCard key={project.id} project={project} index={index} onOpen={(trigger) => openProject(project, trigger)} />)}
      </div>
      {selected && (
        <div className="project-overlay" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget) closeProject();
        }}>
          <article className={`project-detail accent-${selected.accent}`} role="dialog" aria-modal="true" aria-labelledby="project-detail-title" tabIndex={-1}>
            <div className="project-detail__chrome">
              <span><i className="status-dot" /> CASE STUDY / {selected.id.toUpperCase()}</span>
              <button ref={closeRef} type="button" className="icon-button" onClick={closeProject} aria-label="Close project details">×</button>
            </div>
            <div className="project-detail__hero">
              <div>
                <p className="eyebrow">{selected.category}</p>
                <h3 id="project-detail-title">{selected.name}<span className="project-detail__period">/</span></h3>
                <p className="project-detail__descriptor">{selected.descriptor}</p>
              </div>
              <div className="project-detail__visual-wrap">
                <ProjectVisual kind={selected.artwork} large />
                <span className="project-detail__visual-note">VISUAL STUDY / NOT A PRODUCT SCREENSHOT</span>
              </div>
            </div>
            <div className="project-detail__body">
              <div className="project-detail__overview">
                <p className="eyebrow">SYSTEM OVERVIEW</p>
                <p className="project-detail__description">{selected.long_description || selected.description}</p>
                {selected.metadata.length > 0 && <div className="detail-pair"><span>PROJECT SIGNALS</span><div className="detail-tags">{selected.metadata.map((item) => <span key={item}>{item}</span>)}</div></div>}
                {selected.problem && <div className="detail-pair"><span>THE PROBLEM</span><p>{selected.problem}</p></div>}
                {selected.solution && <div className="detail-pair"><span>THE APPROACH</span><p>{selected.solution}</p></div>}
                {selected.impact && <div className="detail-pair"><span>INTENDED IMPACT</span><p>{selected.impact}</p></div>}
                {selected.challenges.length > 0 && <div className="detail-pair"><span>CHALLENGES</span><ul className="feature-list">{selected.challenges.map((item) => <li key={item}>{item}</li>)}</ul></div>}
                {selected.screenshots.length > 0 && <div className="detail-pair"><span>SCREENSHOTS</span><div className="project-screenshots">{selected.screenshots.map((shot) => <figure key={shot.url}><img src={shot.url} alt={shot.alt} loading="lazy" />{shot.caption && <figcaption>{shot.caption}</figcaption>}</figure>)}</div></div>}
              </div>
              <div className="project-detail__side">
                {selected.status && <div className="detail-pair"><span>STATUS</span><p>{selected.status}</p></div>}
                {selected.founder && <div className="detail-pair"><span>FOUNDER</span><p>{selected.founder}</p></div>}
                {selected.technologies.length > 0 && <div className="detail-pair"><span>TECHNOLOGIES</span><div className="detail-tags">{selected.technologies.map((tech) => <span key={tech}>{tech}</span>)}</div></div>}
                {selected.features.length > 0 && <div className="detail-pair"><span>FEATURES</span><ul className="feature-list">{selected.features.map((item) => <li key={item}>{item}</li>)}</ul></div>}
                {selected.architecture.length > 0 && <div className="detail-pair"><span>ARCHITECTURE / WORKFLOW</span><ul className="feature-list">{selected.architecture.map((item) => <li key={item}>{item}</li>)}</ul></div>}
                {selected.ai_components.length > 0 && <div className="detail-pair"><span>AI COMPONENTS</span><ul className="feature-list">{selected.ai_components.map((item) => <li key={item}>{item}</li>)}</ul></div>}
                {selected.achievements.length > 0 && <div className="detail-pair"><span>PROJECT ACHIEVEMENTS</span><ul className="feature-list">{selected.achievements.map((item) => <li key={item}>{item}</li>)}</ul></div>}
                {(selected.github.url || selected.deployment.url) && <div className="project-detail__links">
                  {selected.deployment.url && <a className="button button--light" href={selected.deployment.url} target="_blank" rel="noreferrer">{selected.deployment.detailLabel || "OPEN LIVE PROJECT"} <span>→</span></a>}
                  {selected.github.url && <a className="button button--line" href={selected.github.url} target="_blank" rel="noreferrer">{selected.github.detailLabel || "VIEW SOURCE"} <span>→</span></a>}
                </div>}
              </div>
            </div>
          </article>
        </div>
      )}
    </>
  );
}

function ProjectCard({ project, index, onOpen }: { project: Project; index: number; onOpen: (trigger: HTMLElement) => void }) {
  const handlePointerMove = (event: PointerEvent<HTMLElement>) => {
    if (event.pointerType === "touch") return;
    const rect = event.currentTarget.getBoundingClientRect();
    event.currentTarget.style.setProperty("--px", `${event.clientX - rect.left}px`);
    event.currentTarget.style.setProperty("--py", `${event.clientY - rect.top}px`);
  };
  const open = (event: MouseEvent<HTMLElement> | KeyboardEvent<HTMLElement>) => onOpen(event.currentTarget as HTMLElement);

  return (
    <article
      className={`project-card project-card--${index + 1} accent-${project.accent}`}
      role="button"
      tabIndex={0}
      data-project-trigger={project.id}
      onClick={(event) => open(event)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") { event.preventDefault(); open(event); }
      }}
      onPointerMove={handlePointerMove}
      aria-label={`Explore ${project.name}: ${project.category}`}
      data-cursor="project"
    >
      <span className="project-card__glow" aria-hidden="true" />
      <div className="project-card__topline"><span>{String(index + 1).padStart(2, "0")} / {project.category}</span>{project.status && <span className="project-card__status"><i className="status-dot" /> {project.status}</span>}</div>
      <ProjectVisual kind={project.artwork} />
      <div className="project-card__copy">
        <div className="project-card__titleline"><h3>{project.name}</h3><span className="project-card__arrow" aria-hidden="true">↗</span></div>
        <p className="project-card__descriptor">{project.descriptor}</p>
        <div className="project-card__bottom"><p>{project.description}</p><span className="project-card__open">OPEN CASE <b>↗</b></span></div>
      </div>
      {project.metadata.length > 0 && <div className="project-card__signals" aria-hidden="true">{project.metadata.slice(0, 3).map((tag) => <span key={tag}>{tag}</span>)}</div>}
    </article>
  );
}

function ProjectVisual({ kind, large = false }: { kind: string; large?: boolean }) {
  return (
    <div className={`project-visual project-visual--${kind}${large ? " project-visual--large" : ""}`} aria-hidden="true">
      <div className="project-visual__grid" />
      {kind === "forensics" && <>
        <div className="visual-radar"><i /><i /><i /><span className="visual-radar__pulse" /></div>
        <div className="visual-terminal"><b>FIELD STUDY / EVIDENCE</b><i>collection</i><i>query surface</i><i>investigation flow</i><em>SCHEMATIC / NOT LIVE DATA</em></div>
        <div className="visual-evidence">E<span>—</span>01</div>
      </>}
      {kind === "knowledge" && <>
        <div className="knowledge-document knowledge-document--back"><b>DOC / 02</b><i /><i /><i /><i /></div>
        <div className="knowledge-document knowledge-document--front"><b>PRIVATE DOCS</b><i /><i /><i /><span>PDF / SOP / REPORT</span></div>
        <div className="knowledge-retrieval"><span>QUERY</span><i /><i /><i /><b>TOP-K / 03</b></div>
        <div className="knowledge-answer"><b>ANSWER</b><i /><i /><span>CITATION / 01</span></div>
        <div className="knowledge-flow-line" />
      </>}
      {kind === "oracle" && <>
        <div className="oracle-orbit oracle-orbit--a"><i /></div><div className="oracle-orbit oracle-orbit--b"><i /></div>
        <div className="oracle-core"><span>J/O</span><i /></div>
        <div className="oracle-agent oracle-agent--one">ATTACKER</div><div className="oracle-agent oracle-agent--two">VERIFIER</div><div className="oracle-agent oracle-agent--three">DEFENDER</div>
      </>}
      {kind === "aiglo" && <>
        <div className="aiglo-flow"><span>LEAD</span><i>→</i><span>REPLY</span><i>→</i><span>FOLLOW-UP</span></div>
        <div className="aiglo-glow" /><div className="aiglo-card"><b>WORKFLOW STUDY</b><span className="aiglo-line aiglo-line--wide" /><span className="aiglo-line" /><span className="aiglo-line aiglo-line--short" /><small>CONCEPT DIAGRAM</small></div>
      </>}
      {kind === "community" && <>
        <div className="community-constellation"><i /><i /><i /><i /><i /><i /><span className="community-constellation__core">A</span></div>
        <div className="community-label community-label--one">LEARN</div><div className="community-label community-label--two">BUILD</div><div className="community-label community-label--three">SHARE</div>
      </>}
      {kind === "chain" && <>
        <div className="chain-cube chain-cube--one"><i /><i /><i /></div><div className="chain-cube chain-cube--two"><i /><i /><i /></div><div className="chain-cube chain-cube--three"><i /><i /><i /></div>
        <div className="chain-track" /><div className="chain-track chain-track--two" /><span className="chain-node">CHAIN / STUDY</span>
      </>}
    </div>
  );
}
