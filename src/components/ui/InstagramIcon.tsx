/** Instagram glyph (rounded square, lens, flash), in the current text colour. */
export function InstagramIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className={className} aria-hidden>
      <rect x={3} y={3} width={18} height={18} rx={5} />
      <circle cx={12} cy={12} r={4.2} />
      <circle cx={17.3} cy={6.7} r={1.1} fill="currentColor" stroke="none" />
    </svg>
  );
}

export const isInstagram = (link: { label: string; url: string }) => /instagram/i.test(link.label) || /instagram\.com/i.test(link.url);
