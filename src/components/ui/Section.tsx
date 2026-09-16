import type { ReactNode } from "react";

type Mood = "minimal" | "brut" | "editorial";

export function Section({
  mood = "minimal",
  children,
  className = "",
  id,
}: {
  mood?: Mood;
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section id={id} data-tone="light" className={`mood-${mood} relative ${className}`}>
      <div className="relative mx-auto w-full max-w-7xl px-5 sm:px-8 lg:px-12 py-14 sm:py-20 lg:py-32">{children}</div>
    </section>
  );
}

export function Eyebrow({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <p className={`text-[0.7rem] uppercase tracking-[0.32em] text-fg-soft ${className}`}>{children}</p>
  );
}
