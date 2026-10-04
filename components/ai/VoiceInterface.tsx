"use client";

import type { AssistantState } from "@/components/Hologram";

type VoiceInterfaceProps = {
  state: AssistantState;
  supported: boolean;
  onToggle: () => void;
};

export default function VoiceInterface({ state, supported, onToggle }: VoiceInterfaceProps) {
  const listening = state === "listening";
  return (
    <button
      className={`chat-input__mic${listening ? " is-listening" : ""}`}
      type="button"
      onClick={onToggle}
      aria-label={listening ? "Stop recording" : "Start voice input"}
      aria-pressed={listening}
      title={!supported ? "Voice input is not supported here" : listening ? "Stop listening" : "Start voice input"}
    >
      <svg viewBox="0 0 24 24" width="17" height="17" fill="none" aria-hidden="true"><rect x="8" y="3" width="8" height="12" rx="4" stroke="currentColor" strokeWidth="1.5"/><path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3m-4 0h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
      <span className="chat-input__mic-label">{listening ? "STOP" : "TALK"}</span>
    </button>
  );
}
