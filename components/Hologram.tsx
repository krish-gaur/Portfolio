"use client";

import { useId, useRef } from "react";
import type { CSSProperties, KeyboardEvent, PointerEvent } from "react";

export type AssistantState = "idle" | "listening" | "thinking" | "speaking" | "error";

type HologramProps = {
  state: AssistantState;
  audioLevel?: number;
  compact?: boolean;
  onActivate?: () => void;
  onSecret?: () => void;
  name?: string;
  portrait?: string;
  portraitAlt?: string;
};

export default function Hologram({ state, audioLevel = 0, compact = false, onActivate, onSecret, name = "AI interface", portrait = "", portraitAlt = "Holographic portrait" }: HologramProps) {
  const uid = useId().replace(/:/g, "");
  const clickCount = useRef(0);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleClick = () => {
    if (!onActivate) return;
    clickCount.current += 1;
    if (resetTimer.current) clearTimeout(resetTimer.current);
    resetTimer.current = setTimeout(() => { clickCount.current = 0; }, 1800);
    if (clickCount.current >= 5) {
      clickCount.current = 0;
      onSecret?.();
      return;
    }
    onActivate();
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "touch") return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width - 0.5;
    const y = (event.clientY - bounds.top) / bounds.height - 0.5;
    event.currentTarget.style.setProperty("--look-x", `${(x * 8).toFixed(1)}px`);
    event.currentTarget.style.setProperty("--look-y", `${(y * 6).toFixed(1)}px`);
  };

  const handlePointerLeave = (event: PointerEvent<HTMLDivElement>) => {
    event.currentTarget.style.setProperty("--look-x", "0px");
    event.currentTarget.style.setProperty("--look-y", "0px");
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!onActivate || (event.key !== "Enter" && event.key !== " ")) return;
    event.preventDefault();
    handleClick();
  };

  const style = { "--audio-level": Math.max(0, Math.min(1, audioLevel)) } as CSSProperties;
  const currentLabel = state === "idle" ? "INTERFACE READY" : state === "listening" ? "AUDIO INPUT" : state === "thinking" ? "PROCESSING" : state === "speaking" ? "RESPONSE STREAM" : "SIGNAL INTERRUPTED";

  return (
    <div
      className={`holo-stage${compact ? " holo-stage--compact" : ""}${portrait.trim() ? " holo-stage--portrait" : ""} holo-state-${state}${onActivate ? " holo-stage--interactive" : ""}`}
      style={style}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role={onActivate ? "button" : undefined}
      tabIndex={onActivate ? 0 : undefined}
      aria-label={onActivate ? `Open ${name}` : undefined}
    >
      <div className="holo-stage__halo" aria-hidden="true" />
      <div className="holo-stage__orbit holo-stage__orbit--one" aria-hidden="true"><i /><i /><i /></div>
      <div className="holo-stage__orbit holo-stage__orbit--two" aria-hidden="true"><i /><i /></div>
      <div className="holo-stage__readout holo-stage__readout--top" aria-hidden="true"><span>SYSTEM / INTERFACE</span><span className="readout-dot" /></div>
      <div className="holo-stage__readout holo-stage__readout--side" aria-hidden="true"><span>NEURAL SIGNAL</span><b>{state.toUpperCase()}</b></div>
      {portrait.trim() ? (
        <div className="holo-photo" role="img" aria-label={portraitAlt} style={{ backgroundImage: `url("${portrait.replace(/["\\]/g, "")}")` }}>
          <span className="holo-photo__scan" aria-hidden="true" />
          <span className="holo-photo__glint" aria-hidden="true" />
        </div>
      ) : (
        <svg className="holo-portrait holo-portrait--signal" viewBox="0 0 420 500" role="img" aria-label="Abstract signal visualization. No portrait reference has been supplied.">
          <defs>
            <linearGradient id={`signal-line-${uid}`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#e4ffff" stopOpacity=".88" />
              <stop offset="55%" stopColor="#7cecf2" stopOpacity=".68" />
              <stop offset="100%" stopColor="#60b8c1" stopOpacity=".42" />
            </linearGradient>
            <radialGradient id={`signal-core-${uid}`} cx="50%" cy="48%" r="58%">
              <stop offset="0%" stopColor="#b9fbfc" stopOpacity=".16" />
              <stop offset="70%" stopColor="#73dfe8" stopOpacity=".035" />
              <stop offset="100%" stopColor="#091319" stopOpacity="0" />
            </radialGradient>
            <pattern id={`signal-grid-${uid}`} width="15" height="15" patternUnits="userSpaceOnUse">
              <path d="M15 0H0V15" fill="none" stroke="#a9f5f5" strokeOpacity=".13" strokeWidth=".55" />
            </pattern>
            <clipPath id={`signal-clip-${uid}`}><circle cx="210" cy="244" r="130" /></clipPath>
          </defs>
          <circle cx="210" cy="244" r="155" fill={`url(#signal-core-${uid})`} />
          <g className="holo-portrait__head" style={{ transform: "translate(var(--look-x, 0px), var(--look-y, 0px))" }}>
            <circle cx="210" cy="244" r="118" fill="none" stroke={`url(#signal-line-${uid})`} strokeOpacity=".4" strokeWidth=".8" />
            <ellipse cx="210" cy="244" rx="91" ry="132" fill="none" stroke={`url(#signal-line-${uid})`} strokeOpacity=".45" strokeWidth="1.15" transform="rotate(34 210 244)" />
            <ellipse cx="210" cy="244" rx="91" ry="132" fill="none" stroke={`url(#signal-line-${uid})`} strokeOpacity=".38" strokeWidth="1.15" transform="rotate(-34 210 244)" />
            <g clipPath={`url(#signal-clip-${uid})`} opacity=".68">
              <rect x="78" y="112" width="264" height="264" fill={`url(#signal-grid-${uid})`} />
              <path d="M90 174H330M80 204H340M75 234H345M75 264H345M82 294H338M95 324H325" fill="none" stroke="#a9f6f6" strokeOpacity=".27" strokeWidth=".65" />
              <path d="M111 128V359M141 118V370M171 112V376M201 110V378M231 111V376M261 117V370M291 127V359" fill="none" stroke="#a9f6f6" strokeOpacity=".2" strokeWidth=".65" />
            </g>
            <path className="holo-signal-wave" d="M102 248H144L158 232L175 269L195 207L214 282L233 226L252 253L270 241H318" fill="none" stroke={`url(#signal-line-${uid})`} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M144 191Q210 140 276 191M144 297Q210 348 276 297" fill="none" stroke="#caffff" strokeOpacity=".58" strokeWidth=".85" />
            <circle cx="210" cy="244" r="18" fill={`url(#signal-core-${uid})`} stroke="#dcffff" strokeOpacity=".65" strokeWidth=".9" />
            <circle className="holo-signal-core" cx="210" cy="244" r="4.5" fill="#dcffff" />
            <circle cx="144" cy="191" r="2.4" fill="#dfffff" /><circle cx="276" cy="191" r="2.4" fill="#dfffff" />
            <circle cx="144" cy="297" r="2.4" fill="#dfffff" /><circle cx="276" cy="297" r="2.4" fill="#dfffff" />
          </g>
          <g className="holo-portrait__glitch" aria-hidden="true">
            <path d="M91 164H152M270 164H329M83 318H125M296 318H337" stroke="#e1ffff" strokeWidth="1.5" opacity=".55" />
          </g>
        </svg>
      )}
      <div className={`holo-wave holo-wave--${state}`} aria-hidden="true">
        {Array.from({ length: 17 }, (_, index) => <i key={index} style={{ "--wave-index": index } as CSSProperties} />)}
      </div>
      <div className="holo-stage__floor" aria-hidden="true" />
      <div className="holo-stage__caption" aria-hidden="true"><span className="readout-dot" /> {portrait.trim() ? currentLabel : state === "idle" ? "SIGNAL CORE / NO PORTRAIT REFERENCE" : currentLabel}</div>
      <div className="holo-stage__scanlines" aria-hidden="true" />
    </div>
  );
}
