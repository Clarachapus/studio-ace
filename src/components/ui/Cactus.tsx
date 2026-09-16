/** Small cactus glyph used as an ornament. */
export function Cactus({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 60" aria-hidden="true" className={className} fill="currentColor">
      <rect x="16" y="6" width="8" height="54" rx="4" />
      <rect x="4" y="18" width="6" height="18" rx="3" />
      <rect x="4" y="32" width="14" height="5" rx="2.5" />
      <rect x="30" y="10" width="6" height="22" rx="3" />
      <rect x="22" y="28" width="14" height="5" rx="2.5" />
    </svg>
  );
}
