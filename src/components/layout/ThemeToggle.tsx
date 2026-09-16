"use client";

import { useSyncExternalStore } from "react";

export type Theme = "light" | "dark";
const STORAGE_KEY = "ace-theme";
const EVENT = "ace-theme-change";

function readTheme(): Theme {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

function subscribe(onChange: () => void) {
  window.addEventListener(EVENT, onChange);
  return () => window.removeEventListener(EVENT, onChange);
}

/** Applies a theme to <html> and remembers it in this browser. */
export function setTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // Private mode or blocked storage: the theme still applies for this visit.
  }
  window.dispatchEvent(new Event(EVENT));
}

/** Runs before first paint (inlined in the root layout) so the page never flashes the wrong theme. */
export const themeInitScript = `try{var t=localStorage.getItem("${STORAGE_KEY}");if(t==="dark"||t==="light"){document.documentElement.dataset.theme=t}}catch(e){}`;

/** Small sun / moon button that switches the site between day and night. */
export function ThemeToggle({ labels }: { labels: { toDark: string; toLight: string } }) {
  const theme = useSyncExternalStore(subscribe, readTheme, () => "light" as Theme);
  const dark = theme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(dark ? "light" : "dark")}
      aria-label={dark ? labels.toLight : labels.toDark}
      title={dark ? labels.toLight : labels.toDark}
      className="relative grid h-11 w-11 place-items-center rounded-full md:h-8 md:w-8 opacity-70 transition-opacity hover:opacity-100"
    >
      {/* Sun */}
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className={`absolute h-[18px] w-[18px] transition-all duration-500 ${dark ? "scale-50 rotate-90 opacity-0" : "scale-100 rotate-0 opacity-100"}`}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      >
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4" />
      </svg>
      {/* Moon */}
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className={`absolute h-[17px] w-[17px] transition-all duration-500 ${dark ? "scale-100 rotate-0 opacity-100" : "scale-50 -rotate-90 opacity-0"}`}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      >
        <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" />
      </svg>
    </button>
  );
}
