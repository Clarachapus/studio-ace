"use client";

import { useEffect, useRef } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { usePathname } from "next/navigation";
import { setLenis } from "@/lib/lenis";

/**
 * One Lenis instance for the whole site, wired to GSAP's ticker so ScrollTrigger
 * and Lenis share the same clock.
 *
 * The <html> element is 100 % of the screen height, so its size never changes when a
 * page gets longer: Lenis must be told to re-measure. Otherwise, after the one-screen
 * home, it keeps a scroll limit of zero and the mouse wheel does nothing.
 */
export function SmoothScroll() {
  const lenisRef = useRef<Lenis | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    gsap.registerPlugin(ScrollTrigger);

    const lenis = new Lenis({ lerp: 0.1 });
    lenisRef.current = lenis;
    setLenis(lenis);
    lenis.on("scroll", ScrollTrigger.update);
    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    // Any change in the real content height (images loading, page change) re-measures the scroll limit.
    const observer = new ResizeObserver(() => lenis.resize());
    observer.observe(document.body);

    return () => {
      observer.disconnect();
      gsap.ticker.remove(tick);
      lenis.destroy();
      lenisRef.current = null;
      setLenis(null);
    };
  }, []);

  useEffect(() => {
    const lenis = lenisRef.current;
    const remeasure = () => {
      lenis?.resize();
      ScrollTrigger.refresh();
    };
    if (!window.location.hash) lenis?.scrollTo(0, { immediate: true, force: true });
    remeasure();
    const frame = requestAnimationFrame(remeasure);
    const late = window.setTimeout(remeasure, 600);
    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(late);
    };
  }, [pathname]);

  return null;
}
