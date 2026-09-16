"use client";

import Image from "next/image";
import { useState } from "react";

type Props = { front: string; back: string | null; alt: string; sizes: string; priority?: boolean };

/**
 * Two stacked images: the front one by default, the back one (e.g. the same
 * room at night) while the pointer is over the card. The crossfade lasts 2 s.
 * Driven by pointer events rather than CSS :hover, so it behaves the same with
 * a mouse, a pen or a finger (a tap toggles the view on touch screens).
 */
export function HoverSwap({ front, back, alt, sizes, priority }: Props) {
  const [active, setActive] = useState(false);

  return (
    <div
      className="relative h-full w-full"
      onPointerEnter={(e) => back && e.pointerType === "mouse" && setActive(true)}
      onPointerLeave={(e) => back && e.pointerType === "mouse" && setActive(false)}
      onTouchStart={() => back && setActive((v) => !v)}
    >
      <Image src={front} alt={alt} fill sizes={sizes} priority={priority} className="object-cover" />
      {back && (
        <Image
          src={back}
          alt=""
          fill
          sizes={sizes}
          className={`object-cover transition-opacity duration-[2000ms] ease-in-out ${active ? "opacity-100" : "opacity-0"}`}
        />
      )}
    </div>
  );
}
