import type Lenis from "lenis";

/** The single Lenis instance, set by <SmoothScroll />, for components that need to scroll programmatically. */
let instance: Lenis | null = null;
export const setLenis = (l: Lenis | null) => { instance = l; };
export const getLenis = () => instance;
