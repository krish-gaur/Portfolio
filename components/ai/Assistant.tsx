"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import Hologram, { type AssistantState } from "@/components/Hologram";
import VoiceInterface from "@/components/ai/VoiceInterface";
import type { AssistantAction, PortfolioData } from "@/types/portfolio";

type Message = { role: "user" | "assistant"; content: string; actions?: AssistantAction[] };
type AssistantProps = {
  data: PortfolioData;
  isOpen: boolean;
  initialPrompt: string;
  onClose: () => void;
  onOpenProject: (projectId: string) => void;
  onConsumeInitialPrompt: () => void;
};

type RecognitionResult = { isFinal: boolean; 0: { transcript: string } };
type RecognitionEvent = { results: ArrayLike<RecognitionResult>; resultIndex: number };
type RecognitionErrorEvent = { error: string };
type RecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: RecognitionEvent) => void) | null;
  onerror: ((event: RecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};
type RecognitionConstructor = new () => RecognitionLike;
type SpeechWindow = Window & { SpeechRecognition?: RecognitionConstructor; webkitSpeechRecognition?: RecognitionConstructor };

const stateCopy: Record<AssistantState, string> = {
  idle: "READY / YOUR TURN",
  listening: "MIC ON / LISTENING",
  thinking: "RETRIEVING RELEVANT CONTEXT",
  speaking: "SPEAKING / RESPONSE LIVE",
  error: "SIGNAL INTERRUPTED"
};

export default function AIAssistant({ data, isOpen, initialPrompt, onClose, onOpenProject, onConsumeInitialPrompt }: AssistantProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [state, setState] = useState<AssistantState>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [providerMode, setProviderMode] = useState("LOCAL / GROUNDED DATA");
  const [audioLevel, setAudioLevel] = useState(0);
  const [isVoiceSupported, setIsVoiceSupported] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const recognitionRef = useRef<RecognitionLike | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const playbackContextRef = useRef<AudioContext | null>(null);
  const analysisFrameRef = useRef<number | null>(null);
  const playbackFrameRef = useRef<number | null>(null);
  const latestInputRef = useRef("");
  const handledPromptRef = useRef("");
  const sendRef = useRef<(question: string, speak?: boolean) => Promise<void>>(async () => {});

  const stopAudioMeter = useCallback(() => {
    if (analysisFrameRef.current !== null) cancelAnimationFrame(analysisFrameRef.current);
    analysisFrameRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    void audioContextRef.current?.close().catch(() => undefined);
    audioContextRef.current = null;
    setAudioLevel(0);
  }, []);

  const stopPlaybackMeter = useCallback(() => {
    if (playbackFrameRef.current !== null) cancelAnimationFrame(playbackFrameRef.current);
    playbackFrameRef.current = null;
    void playbackContextRef.current?.close().catch(() => undefined);
    playbackContextRef.current = null;
    setAudioLevel(0);
  }, []);

  const startPlaybackMeter = useCallback((audio: HTMLAudioElement) => {
    const AudioContextClass = window.AudioContext;
    if (!AudioContextClass) return;
    try {
      const context = new AudioContextClass();
      const analyser = context.createAnalyser();
      analyser.fftSize = 256;
      const source = context.createMediaElementSource(audio);
      source.connect(analyser);
      analyser.connect(context.destination);
      playbackContextRef.current = context;
      const samples = new Uint8Array(analyser.fftSize);
      let lastUpdate = 0;
      const sample = (time: number) => {
        if (playbackContextRef.current !== context) return;
        analyser.getByteTimeDomainData(samples);
        let energy = 0;
        for (const value of samples) {
          const normalized = (value - 128) / 128;
          energy += normalized * normalized;
        }
        if (time - lastUpdate > 55) {
          setAudioLevel(Math.min(1, Math.sqrt(energy / samples.length) * 8));
          lastUpdate = time;
        }
        playbackFrameRef.current = requestAnimationFrame(sample);
      };
      playbackFrameRef.current = requestAnimationFrame(sample);
      void context.resume().catch(() => undefined);
    } catch {
      stopPlaybackMeter();
    }
  }, [stopPlaybackMeter]);

  const stopSpeaking = useCallback(() => {
    if (typeof window === "undefined") return;
    window.speechSynthesis?.cancel();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current = null;
    }
    stopPlaybackMeter();
  }, [stopPlaybackMeter]);

  const sendMessage = useCallback(async (rawQuestion: string, shouldSpeak = false) => {
    const question = rawQuestion.trim();
    if (!question) return;
    setErrorMessage("");
    setDraft("");
    setMessages((current) => [...current, { role: "user", content: question }]);
    setState("thinking");
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          history: messages.map(({ role, content }) => ({ role, content }))
        })
      });
      const payload = (await response.json()) as { answer?: string; provider?: string; actions?: AssistantAction[]; error?: string };
      if (!response.ok || !payload.answer) throw new Error(payload.error || "The assistant is temporarily unavailable.");
      setProviderMode(payload.provider === "openai" ? "OPENAI / GROUNDED + GENERAL" : "LOCAL / GROUNDED DATA");
      setMessages((current) => [...current, { role: "assistant", content: payload.answer as string, actions: payload.actions ?? [] }]);
      if (shouldSpeak) void speakAnswer(payload.answer as string);
      else setState("idle");
    } catch {
      setErrorMessage("The response channel paused. Try again, or use one of the prompts below.");
      setState("error");
    }
  }, [messages]);

  sendRef.current = sendMessage;

  const speakAnswer = useCallback(async (text: string) => {
    setState("speaking");
    let objectUrl: string | null = null;
    try {
      const response = await fetch("/api/voice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text })
      });
      if (response.ok) {
        objectUrl = URL.createObjectURL(await response.blob());
        const audio = new Audio(objectUrl);
        audioRef.current = audio;
        audio.onended = () => {
          if (objectUrl) URL.revokeObjectURL(objectUrl);
          stopPlaybackMeter();
          audioRef.current = null;
          setState("idle");
        };
        audio.onerror = () => {
          if (objectUrl) URL.revokeObjectURL(objectUrl);
          stopPlaybackMeter();
          audioRef.current = null;
          setState("idle");
        };
        startPlaybackMeter(audio);
        await audio.play();
        return;
      }
    } catch {
      stopPlaybackMeter();
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
        audioRef.current = null;
      }
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      // Browser speech synthesis below is the offline / no-key path.
    }

    if ("speechSynthesis" in window && "SpeechSynthesisUtterance" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "en-IN";
      utterance.rate = 1.02;
      utterance.pitch = 1.02;
      utterance.onend = () => { setAudioLevel(0); setState("idle"); };
      utterance.onerror = () => { setAudioLevel(0); setState("idle"); };
      window.speechSynthesis.speak(utterance);
    } else {
      setAudioLevel(0);
      setState("idle");
      setErrorMessage("This browser can display replies but does not support speech playback.");
    }
  }, [startPlaybackMeter, stopPlaybackMeter]);

  const closeVoice = useCallback(() => {
    try { recognitionRef.current?.abort(); } catch { /* already stopped */ }
    recognitionRef.current = null;
    stopAudioMeter();
    stopSpeaking();
    latestInputRef.current = "";
  }, [stopAudioMeter, stopSpeaking]);

  const startVoice = async () => {
    setErrorMessage("");
    stopSpeaking();
    const speechWindow = window as SpeechWindow;
    const Recognition = speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition;
    if (!Recognition || !navigator.mediaDevices?.getUserMedia) {
      setIsVoiceSupported(false);
      setState("error");
      setErrorMessage("Voice input is not available in this browser. Type a question instead.");
      return;
    }

    try {
      setState("listening");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
      streamRef.current = stream;
      const AudioContextClass = window.AudioContext;
      if (AudioContextClass) {
        const context = new AudioContextClass();
        audioContextRef.current = context;
        const analyser = context.createAnalyser();
        analyser.fftSize = 256;
        context.createMediaStreamSource(stream).connect(analyser);
        const samples = new Uint8Array(analyser.fftSize);
        let lastUpdate = 0;
        const sample = (time: number) => {
          analyser.getByteTimeDomainData(samples);
          let energy = 0;
          for (const value of samples) {
            const normalized = (value - 128) / 128;
            energy += normalized * normalized;
          }
          const level = Math.min(1, Math.sqrt(energy / samples.length) * 8);
          if (time - lastUpdate > 64) {
            setAudioLevel(level);
            lastUpdate = time;
          }
          analysisFrameRef.current = requestAnimationFrame(sample);
        };
        analysisFrameRef.current = requestAnimationFrame(sample);
      }

      const recognition = new Recognition();
      recognitionRef.current = recognition;
      recognition.lang = "en-IN";
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;
      latestInputRef.current = "";
      recognition.onresult = (event) => {
        const transcript = Array.from({ length: event.results.length }, (_, index) => event.results[index]?.[0]?.transcript ?? "").join(" ").trim();
        latestInputRef.current = transcript;
        if (transcript) setDraft(transcript);
      };
      recognition.onerror = (event) => {
        stopAudioMeter();
        setState("error");
        const reason = event.error === "not-allowed" || event.error === "service-not-allowed"
          ? "Microphone access was denied. Allow access in browser settings, or type your question."
          : "Voice input stopped before a question came through. Try again or type instead.";
        setErrorMessage(reason);
      };
      recognition.onend = () => {
        const transcript = latestInputRef.current;
        recognitionRef.current = null;
        stopAudioMeter();
        if (transcript) {
          setDraft("");
          void sendRef.current(transcript, true);
        } else {
          setState((current) => current === "error" ? current : "idle");
        }
      };
      recognition.start();
    } catch {
      stopAudioMeter();
      setState("error");
      setErrorMessage("Microphone access is unavailable. Check browser permissions or type your question.");
    }
  };

  const handleVoiceButton = () => {
    if (state === "listening") {
      try { recognitionRef.current?.stop(); } catch { /* already stopped */ }
      stopAudioMeter();
      setState("idle");
      return;
    }
    void startVoice();
  };

  useEffect(() => {
    if (!isOpen) {
      closeVoice();
      return;
    }
    setMessages((current) => current.length ? current : [{ role: "assistant", content: data.ai.welcome_message }]);
    setTimeout(() => inputRef.current?.focus(), 60);

    const keyHandler = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "Tab" && dialogRef.current) {
        const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>("button:not([disabled]), textarea:not([disabled]), a[href]"));
        const first = focusable[0];
        const last = focusable.at(-1);
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
    };
    window.addEventListener("keydown", keyHandler);
    return () => {
      window.removeEventListener("keydown", keyHandler);
      closeVoice();
    };
  }, [isOpen, data.ai.welcome_message, onClose, closeVoice]);

  useEffect(() => {
    if (!initialPrompt) {
      handledPromptRef.current = "";
      return;
    }
    if (isOpen && handledPromptRef.current !== initialPrompt) {
      handledPromptRef.current = initialPrompt;
      onConsumeInitialPrompt();
      void sendRef.current(initialPrompt);
    }
  }, [initialPrompt, isOpen, onConsumeInitialPrompt]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, state]);

  useEffect(() => {
    setIsVoiceSupported(Boolean((window as SpeechWindow).SpeechRecognition || (window as SpeechWindow).webkitSpeechRecognition));
    return () => { closeVoice(); };
  }, [closeVoice]);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    void sendMessage(draft);
  };

  if (!isOpen) return null;

  return (
    <div className="ai-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="ai-window" role="dialog" aria-modal="true" aria-labelledby="ai-title" ref={dialogRef} tabIndex={-1}>
        <div className="ai-window__header">
          <div className="ai-window__identity"><span className="ai-window__symbol" aria-hidden="true">✳</span><div><span className="eyebrow">PERSONAL INTERFACE</span><h2 id="ai-title">{data.ai.name}<span> / LIVE</span></h2></div></div>
          <div className="ai-window__status"><i className={`ai-window__status-dot ai-window__status-dot--${state}`} />{stateCopy[state]}<button type="button" className="icon-button" onClick={onClose} aria-label="Close AI interface">×</button></div>
        </div>
        <div className="ai-window__body">
          <aside className="ai-window__side">
            <Hologram state={state} audioLevel={audioLevel} compact name={data.ai.name} portrait={data.profile.avatar.portrait} portraitAlt={data.profile.avatar.alt} />
            <div className="ai-window__side-copy"><span className="eyebrow">VOICE / TEXT / SESSION MEMORY</span><p>Personal facts are grounded in the portfolio. The conversation can go further.</p></div>
            <div className="ai-window__provider"><i className="status-dot" /> {providerMode}</div>
          </aside>
          <div className="ai-window__chat">
            <div className="chat-log" ref={scrollRef} aria-live="polite" aria-label="Conversation">
              <div className="chat-log__timestamp">CONVERSATION / ACTIVE SESSION</div>
              {messages.map((message, index) => <div className={`chat-message chat-message--${message.role}`} key={`${index}-${message.role}`}>
                {message.role === "assistant" && <span className="chat-message__icon" aria-hidden="true">✳</span>}
                <div className="chat-message__body"><span className="chat-message__role">{message.role === "assistant" ? data.ai.name : "YOU"}</span><p>{message.content}</p>
                  {message.role === "assistant" && Boolean(message.actions?.length) && <div className="chat-message__actions" aria-label="Related actions">{message.actions?.map((action, actionIndex) => action.type === "link" ? (
                    <a key={`${action.url}-${actionIndex}`} href={action.url} target="_blank" rel="noreferrer">{action.label}<span>↗</span></a>
                  ) : action.type === "resume" ? (
                    <a key={`resume-${actionIndex}`} href={data.profile.resume.url} target="_blank" rel="noreferrer">{action.label}<span>↗</span></a>
                  ) : (
                    <button key={`${action.projectId}-${actionIndex}`} type="button" onClick={() => { onClose(); onOpenProject(action.projectId); }}>{action.label}<span>↗</span></button>
                  ))}</div>}
                </div>
              </div>)}
              {state === "thinking" && <div className="chat-thinking" role="status"><span className="chat-thinking__dots"><i /><i /><i /></span>Retrieving relevant context</div>}
              <div className="chat-log__end" />
            </div>
            {errorMessage && <p className="ai-window__error" role="alert"><span>!</span>{errorMessage}</p>}
            <div className="chat-suggestions" aria-label="Suggested questions">
              {data.ai.suggested_questions.slice(0, 4).map((question) => <button type="button" key={question} onClick={() => void sendMessage(question)}>{question}<span>↗</span></button>)}
            </div>
            <form className="chat-input" onSubmit={submit}>
              <label className="sr-only" htmlFor="assistant-question">Ask a question</label>
              <textarea ref={inputRef} id="assistant-question" rows={1} value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void sendMessage(draft); }
              }} placeholder={`Ask ${data.profile.name} anything...`} maxLength={1400} />
              <VoiceInterface state={state} supported={isVoiceSupported} onToggle={handleVoiceButton} />
              <button className="chat-input__send" type="submit" aria-label="Send question" disabled={!draft.trim() || state === "thinking"}>↗</button>
            </form>
            <div className="ai-window__footnote"><span>ENTER TO SEND · SHIFT + ENTER FOR A NEW LINE</span><span>{data.ai.name.toUpperCase()} / {state === "listening" ? "TRANSCRIBING" : providerMode}</span></div>
          </div>
        </div>
      </section>
    </div>
  );
}

