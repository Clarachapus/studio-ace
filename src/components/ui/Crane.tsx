/** Line drawing of a tower crane, in the current text colour. */
export function Crane({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 140 110" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      {/* Mast: two uprights braced by a zigzag */}
      <path d="M44 32V106M54 32V106" />
      <path d="M44 32L54 41L44 50L54 59L44 68L54 77L44 86L54 95L44 104" />
      <path d="M36 106H62" />
      {/* Jib and counter-jib */}
      <path d="M8 32H134M8 38H54M54 38L134 32" />
      <path d="M62 32L68 37.4L74 32L80 36.9L86 32L92 36.5L98 32L104 36L110 32L116 35.5L122 32L128 34.6" />
      {/* Peak and tie rods */}
      <path d="M49 32V12M49 12L134 32M49 12L8 32" />
      {/* Counterweight and cab */}
      <rect x={12} y={38} width={14} height={9} />
      <rect x={54} y={38} width={9} height={8} />
      {/* Trolley, cable and hook */}
      <path d="M100 32V35H106V32M103 35V70" />
      <path d="M103 70C103 75 108 75 108 71" />
    </svg>
  );
}
