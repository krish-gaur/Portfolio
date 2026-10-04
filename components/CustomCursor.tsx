"use client";

import { useEffect, useRef } from "react";

export default function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const finePointer = window.matchMedia("(pointer: fine) and (hover: hover)");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!finePointer.matches || reducedMotion.matches) return;

    document.body.classList.add("cursor-enabled");
    let x = -100;
    let y = -100;
    let targetX = x;
    let targetY = y;
    let frame: number | null = null;
    let initialized = false;
    let magneticTarget: HTMLElement | null = null;

    const clearMagnetic = () => {
      magneticTarget?.classList.remove("magnetic-active");
      magneticTarget?.style.removeProperty("--mag-x");
      magneticTarget?.style.removeProperty("--mag-y");
      magneticTarget = null;
    };

    const paint = () => {
      x += (targetX - x) * 0.35;
      y += (targetY - y) * 0.35;
      if (ringRef.current) ringRef.current.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      if (Math.abs(targetX - x) + Math.abs(targetY - y) > 0.4) frame = requestAnimationFrame(paint);
      else frame = null;
    };

    const move = (event: PointerEvent) => {
      targetX = event.clientX;
      targetY = event.clientY;
      if (dotRef.current) dotRef.current.style.transform = `translate3d(${targetX}px, ${targetY}px, 0)`;
      if (!initialized) { x = targetX; y = targetY; initialized = true; }
      if (frame === null) frame = requestAnimationFrame(paint);

      const target = event.target as HTMLElement | null;
      const magnet = target?.closest<HTMLElement>("[data-magnetic]") ?? null;
      if (magneticTarget !== magnet) clearMagnetic();
      magneticTarget = magnet;
      if (magnet) {
        const bounds = magnet.getBoundingClientRect();
        const dx = event.clientX - (bounds.left + bounds.width / 2);
        const dy = event.clientY - (bounds.top + bounds.height / 2);
        magnet.style.setProperty("--mag-x", `${(dx * 0.08).toFixed(1)}px`);
        magnet.style.setProperty("--mag-y", `${(dy * 0.12).toFixed(1)}px`);
        magnet.classList.add("magnetic-active");
      }
    };
    const hover = (event: PointerEvent) => {
      const target = event.target as HTMLElement | null;
      const interactive = target?.closest("a, button, [role='button'], input, textarea, [data-cursor]");
      document.body.classList.toggle("cursor-hover", Boolean(interactive));
      document.body.classList.toggle("cursor-text", Boolean(target?.closest("input, textarea")));
    };
    const leave = () => { document.body.classList.add("cursor-hidden"); clearMagnetic(); };
    const enter = () => document.body.classList.remove("cursor-hidden");

    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerover", hover, { passive: true });
    document.documentElement.addEventListener("pointerleave", leave);
    document.documentElement.addEventListener("pointerenter", enter);

    return () => {
      if (frame !== null) cancelAnimationFrame(frame);
      clearMagnetic();
      document.body.classList.remove("cursor-enabled", "cursor-hover", "cursor-text", "cursor-hidden");
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerover", hover);
      document.documentElement.removeEventListener("pointerleave", leave);
      document.documentElement.removeEventListener("pointerenter", enter);
    };
  }, []);

  return (
    <>
      <div ref={ringRef} className="custom-cursor custom-cursor--ring" aria-hidden="true" />
      <div ref={dotRef} className="custom-cursor custom-cursor--dot" aria-hidden="true" />
    </>
  );
}
