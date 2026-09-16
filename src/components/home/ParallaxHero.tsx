"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { Hero } from "@/lib/content/schemas";

/**
 * Four-layer parallax hero. Layer 1 is a looping background video (or an image
 * when no video is set), layers 2 and 4 are images, layer 3 is the title.
 * Lenis is provided globally by <SmoothScroll />.
 */
type Props = {
  hero: Hero;
  tagline: string;
  scrollLabel: string;
  /** "scroll": layers move while the page scrolls. "stage": a single screen, layers follow the pointer. */
  mode?: "scroll" | "stage";
  /** Extra content placed over the hero. */
  children?: ReactNode;
  /** Labels of the sound button shown over a Vimeo video. */
  soundLabels?: { on: string; off: string };
};

export function ParallaxHero({ hero, tagline, scrollLabel, mode = "scroll", children, soundLabels }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // React does not write the `muted` attribute into the HTML: set it before playing (required for autoplay on iPhone).
    root.querySelectorAll("video").forEach((video) => {
      video.muted = true;
      if (reduce) video.pause();
      else void video.play().catch(() => {});
    });
    if (reduce) return;

    const trigger = root.querySelector<HTMLElement>("[data-parallax-layers]");
    if (!trigger) return;

    // The home is a still screen: no pointer motion on the video.
    if (mode === "stage") return;

    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: { trigger, start: "0% 0%", end: "100% 0%", scrub: 0 },
      });
      const layers = [
        { layer: "1", yPercent: 70 },
        { layer: "2", yPercent: 55 },
        { layer: "3", yPercent: 40 },
        { layer: "4", yPercent: 10 },
      ];
      layers.forEach((l, idx) => {
        tl.to(
          trigger.querySelectorAll(`[data-parallax-layer="${l.layer}"]`),
          { yPercent: l.yPercent, ease: "none" },
          idx === 0 ? undefined : "<",
        );
      });
    }, root);

    return () => ctx.revert();
  }, [mode]);

  return (
    <div className={`parallax ${mode === "stage" ? "parallax--stage" : ""}`} ref={ref}>
      <section className="parallax__header">
        <div className="parallax__visuals">
          <div className="parallax__black-line-overflow" />
          <div data-parallax-layers className="parallax__layers">
            {hero.vimeoId ? (
              <LayerVimeo id={hero.vimeoId} ratio={hero.vimeoRatio} poster={hero.vimeoPoster} />
            ) : hero.video ? (
              <LayerVideo day={hero.video} night={hero.videoNight} poster={hero.layer1} posterNight={hero.layer1Night} />
            ) : (
              <LayerImage day={hero.layer1} night={hero.layer1Night} layer="1" priority />
            )}
            {!hero.vimeoId && <LayerImage day={hero.layer2} night={hero.layer2Night} layer="2" />}
            <div data-parallax-layer="3" className="parallax__layer-title">
              <h1 className="parallax__title">{hero.title}</h1>
              {tagline && <p className="parallax__tagline">{tagline}</p>}
            </div>
            {!hero.vimeoId && <LayerImage day={hero.layer4} night={hero.layer4Night} layer="4" />}
          </div>
          <div className="parallax__fade" />
        </div>
        {children}
        {mode === "stage" && <div className="hero-logo" role="img" aria-label="studio a.c.e" />}
        {hero.vimeoId && soundLabels && <HeroSound labels={soundLabels} />}
      </section>
      {mode === "scroll" && (
        <section className="parallax__content">
          <span className="text-[0.7rem] uppercase tracking-[0.32em] opacity-60">{scrollLabel} ↓</span>
        </section>
      )}
    </div>
  );
}

/**
 * One parallax image layer. The day image is always rendered; when a night
 * image exists, both share the same parallax motion and CSS crossfades them
 * according to the site theme (see .hero-day / .hero-night in globals.css).
 */
function LayerImage({ day, night, layer, priority }: { day: string; night: string | null; layer: string; priority?: boolean }) {
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={day}
        loading="eager"
        fetchPriority={priority ? "high" : undefined}
        data-parallax-layer={layer}
        alt=""
        className={`parallax__layer-img ${night ? "hero-day" : ""}`}
      />
      {night && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={night} loading="eager" data-parallax-layer={layer} alt="" className="parallax__layer-img hero-night" />
      )}
    </>
  );
}

/** Background video layer (day, and night when provided), crossfaded with the theme like the images. */
function LayerVideo({ day, night, poster, posterNight }: { day: string; night: string | null; poster: string; posterNight: string | null }) {
  return (
    <>
      <video
        src={day}
        poster={poster}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        aria-hidden="true"
        data-parallax-layer="1"
        className={`parallax__layer-img ${night ? "hero-day" : ""}`}
      />
      {night && (
        <video
          src={night}
          poster={posterNight ?? undefined}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          aria-hidden="true"
          data-parallax-layer="1"
          className="parallax__layer-img hero-night"
        />
      )}
    </>
  );
}

/**
 * Full-screen Vimeo video in background mode (no controls, muted, looping, no tracking).
 * Sized by its ratio to cover the screen, fades in over its poster once loaded, and gets a
 * warm tint by day and the logo blue by night (see .hero-vimeo in globals.css).
 */
function LayerVimeo({ id, ratio, poster }: { id: string; ratio: number; poster: string | null }) {
  const [ready, setReady] = useState(false);
  const src = `https://player.vimeo.com/video/${id}?background=1&autoplay=1&loop=1&muted=1&autopause=0&playsinline=1&dnt=1`;
  // The iframe can finish loading before React listens for onLoad: reveal the video after 2 s anyway.
  useEffect(() => {
    const timer = window.setTimeout(() => setReady(true), 2000);
    return () => window.clearTimeout(timer);
  }, []);
  return (
    <div data-parallax-layer="1" className={`hero-vimeo ${ready ? "hero-vimeo--ready" : ""}`} style={{ "--ratio": ratio } as CSSProperties}>
      {poster && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={poster} alt="" aria-hidden="true" className="hero-vimeo__poster" />
      )}
      <iframe
        src={src}
        title="studio a.c.e"
        aria-hidden="true"
        tabIndex={-1}
        allow="autoplay; fullscreen; picture-in-picture"
        referrerPolicy="strict-origin-when-cross-origin"
        className="hero-vimeo__frame"
        onLoad={() => window.setTimeout(() => setReady(true), 700)}
      />
    </div>
  );
}

const VIMEO_ORIGIN = "https://player.vimeo.com";

/**
 * Sound for the hero video. Browsers never allow a video to start with sound on its own:
 * it starts muted, then the visitor's first click, tap or key press turns the sound on,
 * and this button switches it on and off at any time.
 */
function HeroSound({ labels }: { labels: { on: string; off: string } }) {
  const [soundOn, setSoundOn] = useState(false);
  const chosen = useRef(false);
  const wanted = useRef<boolean | null>(null);

  const send = (on: boolean) => {
    const frame = document.querySelector<HTMLIFrameElement>(".hero-vimeo iframe");
    const target = frame?.contentWindow;
    if (!target) return;
    const post = (message: object) => target.postMessage(JSON.stringify(message), VIMEO_ORIGIN);
    post({ method: "setVolume", value: on ? 1 : 0 });
    post({ method: "setMuted", value: !on });
    if (on) post({ method: "play" });
  };

  const apply = (on: boolean) => {
    wanted.current = on;
    setSoundOn(on);
    send(on);
  };

  useEffect(() => {
    // If the player finishes loading after the visitor asked for sound, apply it then.
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== VIMEO_ORIGIN) return;
      let data: { event?: string } | null = null;
      try {
        data = typeof event.data === "string" ? JSON.parse(event.data) : event.data;
      } catch {
        return;
      }
      if (data?.event === "ready" && wanted.current !== null) send(wanted.current);
    };
    const firstGesture = () => {
      if (chosen.current) return;
      chosen.current = true;
      apply(true);
    };
    window.addEventListener("message", onMessage);
    window.addEventListener("pointerdown", firstGesture, { once: true });
    window.addEventListener("keydown", firstGesture, { once: true });
    return () => {
      window.removeEventListener("message", onMessage);
      window.removeEventListener("pointerdown", firstGesture);
      window.removeEventListener("keydown", firstGesture);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <button
      type="button"
      aria-pressed={soundOn}
      aria-label={soundOn ? labels.off : labels.on}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={() => {
        chosen.current = true;
        apply(!soundOn);
      }}
      className="absolute bottom-24 right-5 z-40 flex h-12 min-w-12 items-center justify-center gap-2 rounded-full bg-bordeaux px-3 text-sm text-cream shadow-lg transition-transform duration-300 hover:scale-[1.04] md:bottom-8 md:right-8 md:px-4"
    >
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 9.5h3.5L12 5v14l-4.5-4.5H4z" fill="currentColor" stroke="none" />
        {soundOn ? (
          <>
            <path d="M15.5 9a4.5 4.5 0 0 1 0 6" />
            <path d="M18 6.5a8 8 0 0 1 0 11" />
          </>
        ) : (
          <path d="M16 10l5 5M21 10l-5 5" />
        )}
      </svg>
      {/* Icon only on phones, so the button leaves room for the logo at the bottom centre. */}
      <span className="hidden md:inline">{soundOn ? labels.off : labels.on}</span>
    </button>
  );
}
