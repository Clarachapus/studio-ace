import { Cactus } from "./Cactus";
import type { NavIcon } from "@/components/layout/nav";

/** The three A.C.E symbols: Arch, Cactus, Escalier (stairs). */
export function AceIcon({ name, className = "" }: { name: NavIcon; className?: string }) {
  if (name === "cactus") return <Cactus className={className} />;
  if (name === "arch") {
    return (
      <svg viewBox="0 0 40 60" aria-hidden="true" className={className} fill="currentColor">
        <path d="M4 60V20a16 16 0 0 1 32 0v40h-8V20a8 8 0 0 0-16 0v40z" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" className={className} fill="currentColor">
      <path d="M0 64V48h16V32h16V16h16V0h16v64z" />
    </svg>
  );
}
