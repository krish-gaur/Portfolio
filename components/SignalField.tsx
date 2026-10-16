"use client";

import {
  forceCenter,
  forceCollide,
  forceLink,
  forceManyBody,
  forceSimulation,
} from "d3";
import { useEffect, useRef } from "react";

type SignalNode = {
  id: string;
  group: "core" | "field" | "signal";
  label?: string;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
};
type SignalLink = {
  source: string | SignalNode;
  target: string | SignalNode;
  strength?: number;
};

const nodes: SignalNode[] = [
  { id: "kr", group: "core", label: "KR" },
  { id: "ai", group: "field", label: "AI" },
  { id: "security", group: "field", label: "SECURITY" },
  { id: "research", group: "field", label: "RESEARCH" },
  { id: "systems", group: "field", label: "SYSTEMS" },
  { id: "llm", group: "signal" },
  { id: "rag", group: "signal" },
  { id: "red-team", group: "signal" },
  { id: "forensics", group: "signal" },
  { id: "agents", group: "signal" },
  { id: "build", group: "signal" },
  { id: "open-source", group: "signal" },
];
const links: SignalLink[] = [
  { source: "kr", target: "ai", strength: 95 },
  { source: "kr", target: "security", strength: 95 },
  { source: "kr", target: "research", strength: 95 },
  { source: "kr", target: "systems", strength: 95 },
  { source: "ai", target: "llm" },
  { source: "ai", target: "rag" },
  { source: "ai", target: "agents" },
  { source: "security", target: "red-team" },
  { source: "security", target: "forensics" },
  { source: "research", target: "open-source" },
  { source: "systems", target: "build" },
];

/** D3 owns graph relationships and layout; the canvas is only the renderer. */
export default function SignalField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointer = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;

    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    let width = 0;
    let height = 0;
    let simulation: ReturnType<typeof forceSimulation<SignalNode>> | undefined;
    let settleTimer = 0;

    const draw = (model: SignalNode[]) => {
      context.clearRect(0, 0, width, height);
      const byId = new Map(model.map((node) => [node.id, node]));
      context.lineWidth = 1;

      links.forEach((link, index) => {
        const source =
          typeof link.source === "string" ? byId.get(link.source) : link.source;
        const target =
          typeof link.target === "string" ? byId.get(link.target) : link.target;
        if (
          !source ||
          !target ||
          source.x === undefined ||
          source.y === undefined ||
          target.x === undefined ||
          target.y === undefined
        )
          return;
        const gradient = context.createLinearGradient(
          source.x,
          source.y,
          target.x,
          target.y,
        );
        gradient.addColorStop(0, "rgba(224,115,71,.42)");
        gradient.addColorStop(1, "rgba(239,232,219,.10)");
        context.strokeStyle = gradient;
        context.beginPath();
        context.moveTo(source.x, source.y);
        const midX = (source.x + target.x) / 2;
        const midY = (source.y + target.y) / 2;
        const dx = target.x - source.x;
        const dy = target.y - source.y;
        const bend = index % 2 === 0 ? 0.1 : -0.1;
        context.quadraticCurveTo(
          midX - dy * bend,
          midY + dx * bend,
          target.x,
          target.y,
        );
        context.stroke();
      });

      model.forEach((node) => {
        if (node.x === undefined || node.y === undefined) return;
        const radius =
          node.group === "core" ? 7 : node.group === "field" ? 4.4 : 2.3;
        context.beginPath();
        context.arc(node.x, node.y, radius, 0, Math.PI * 2);
        context.fillStyle =
          node.group === "core"
            ? "#e07347"
            : node.group === "field"
              ? "#e9c46a"
              : "#efe8db";
        context.globalAlpha = node.group === "signal" ? 0.7 : 1;
        context.fill();
        context.globalAlpha = 1;
        if (node.label && node.group === "field" && width > 390) {
          context.fillStyle = "rgba(239,232,219,.7)";
          context.font = "8px SFMono-Regular, Consolas, monospace";
          context.fillText(node.label, node.x + 9, node.y - 7);
        }
      });

      const core = byId.get("kr");
      if (core?.x !== undefined && core.y !== undefined) {
        context.strokeStyle = "rgba(239,232,219,.62)";
        context.lineWidth = 1.2;
        context.beginPath();
        context.arc(core.x, core.y, 19, 0, Math.PI * 2);
        context.stroke();
        context.fillStyle = "#21120d";
        context.font = "7px SFMono-Regular, Consolas, monospace";
        context.fillText("KR", core.x - 5, core.y + 2.5);
      }
    };

    const build = () => {
      const box = canvas.getBoundingClientRect();
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      width = box.width;
      height = box.height;
      canvas.width = Math.max(1, Math.round(width * ratio));
      canvas.height = Math.max(1, Math.round(height * ratio));
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      simulation?.stop();

      const model: SignalNode[] = nodes.map((node, index): SignalNode => ({
        ...node,
        x: width * (0.52 + Math.cos(index * 2.3) * 0.24),
        y: height * (0.49 + Math.sin(index * 2.3) * 0.24),
      }));
      if (media.matches) {
        draw(model);
        return;
      }

      simulation = forceSimulation<SignalNode>(model)
        .force(
          "link",
          forceLink<SignalNode, SignalLink>(links.map((link) => ({ ...link })))
            .id((node) => node.id)
            .distance((link) => link.strength ?? 58)
            .strength(0.55),
        )
        .force("charge", forceManyBody().strength(-105))
        .force(
          "collide",
          forceCollide<SignalNode>()
            .radius((node) =>
              node.group === "core" ? 30 : node.group === "field" ? 24 : 13,
            )
            .strength(0.82),
        )
        .force("center", forceCenter(width * 0.52, height * 0.49))
        .alpha(0.86)
        .alphaMin(0.03)
        .on("tick", () => draw(model));
    };

    const nudge = () => {
      if (!simulation || !pointer.current || media.matches) return;
      const point = pointer.current;
      simulation.nodes().forEach((node) => {
        if (
          node.group === "core" ||
          node.x === undefined ||
          node.y === undefined
        )
          return;
        const dx = node.x - point.x;
        const dy = node.y - point.y;
        const distance = Math.max(42, Math.hypot(dx, dy));
        node.vx = (node.vx ?? 0) + (dx / distance) * 0.19;
        node.vy = (node.vy ?? 0) + (dy / distance) * 0.19;
      });
      simulation.alphaTarget(0.08).restart();
      window.clearTimeout(settleTimer);
      settleTimer = window.setTimeout(() => simulation?.alphaTarget(0), 140);
    };

    const onPointerMove = (event: PointerEvent) => {
      const box = canvas.getBoundingClientRect();
      pointer.current = {
        x: event.clientX - box.left,
        y: event.clientY - box.top,
      };
      nudge();
    };
    const onMotionChange = () => build();
    build();
    const observer = new ResizeObserver(build);
    observer.observe(canvas);
    canvas.addEventListener("pointermove", onPointerMove);
    media.addEventListener("change", onMotionChange);

    return () => {
      simulation?.stop();
      observer.disconnect();
      canvas.removeEventListener("pointermove", onPointerMove);
      media.removeEventListener("change", onMotionChange);
      window.clearTimeout(settleTimer);
    };
  }, []);

  return (
    <div className="signal-field" aria-hidden="true">
      <canvas ref={canvasRef} />
      <span className="signal-field__label signal-field__label--top">
        AI / SECURITY / RESEARCH
      </span>
      <span className="signal-field__label signal-field__label--bottom">
        RELATIONSHIP FIELD / 01
      </span>
    </div>
  );
}
