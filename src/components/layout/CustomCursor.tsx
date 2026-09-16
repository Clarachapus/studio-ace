"use client";

import { useEffect, useRef } from "react";

/** A bordeaux dot follows the mouse. Mouse and trackpad only: touch screens keep their normal behaviour. */
export function CustomCursor() {
  const dot = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = dot.current;
    if (!el || !window.matchMedia("(pointer: fine)").matches) return;
    const root = document.documentElement;
    root.classList.add("has-custom-cursor");

    const move = (e: PointerEvent) => {
      el.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0) translate(-50%, -50%)`;
      el.dataset.visible = "true";
      const target = e.target instanceof Element ? e.target : null;
      el.dataset.hover = target?.closest("a, button, [role='button'], input, select, textarea, label") ? "true" : "false";
    };
    const hide = () => {
      el.dataset.visible = "false";
    };

    window.addEventListener("pointermove", move, { passive: true });
    document.documentElement.addEventListener("pointerleave", hide);
    window.addEventListener("blur", hide);
    return () => {
      window.removeEventListener("pointermove", move);
      document.documentElement.removeEventListener("pointerleave", hide);
      window.removeEventListener("blur", hide);
      root.classList.remove("has-custom-cursor");
    };
  }, []);

  return <div ref={dot} aria-hidden="true" className="ace-cursor" data-visible="false" />;
}
