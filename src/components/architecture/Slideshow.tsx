"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { Crane } from "@/components/ui/Crane";

/** One image at a time, changing every two seconds, under "site under construction" and a crane. */
export function Slideshow({ images, label }: { images: string[]; label: string }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (images.length < 2) return;
    const timer = window.setInterval(() => setIndex((i) => (i + 1) % images.length), 2000);
    return () => window.clearInterval(timer);
  }, [images.length]);

  return (
    <div className="relative mx-auto h-[62svh] min-h-[320px] w-full max-w-4xl" data-testid="architecture-slideshow">
      {images.map((src, i) => (
        <Image
          key={src}
          src={src}
          alt=""
          fill
          priority={i === 0}
          sizes="(min-width: 1024px) 56rem, 100vw"
          className={`object-contain transition-opacity duration-300 ${i === index ? "opacity-100" : "opacity-0"}`}
          data-active={i === index ? "true" : undefined}
        />
      ))}
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-4 px-4 text-center text-bordeaux">
        <p className="font-display text-[clamp(1.6rem,4.2vw,2.9rem)] font-semibold uppercase leading-none tracking-[0.01em]">{label}</p>
        <Crane className="w-[clamp(5.5rem,11vw,8.5rem)]" />
      </div>
    </div>
  );
}
