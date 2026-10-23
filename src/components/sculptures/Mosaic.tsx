import Image from "next/image";
import type { CSSProperties } from "react";
import { Link } from "@/i18n/navigation";

export type MosaicZone = { slug: string; title: string; x: number; y: number; w: number; h: number };
export type MosaicItem =
  | { kind: "photo"; key: string; src: string; ratio: number; slug: string; title: string }
  | { kind: "group"; key: string; src: string; ratio: number; zones: MosaicZone[] };

const SIZES = "(min-width: 1024px) 40vw, (min-width: 768px) 50vw, 70vw";

/**
 * Photos of mixed formats in rows of equal height, each keeping its own shape
 * (portrait, landscape, square). No text: every photo opens its sculpture.
 */
export function Mosaic({ items, label }: { items: MosaicItem[]; label: string }) {
  return (
    <ul className="mosaic flex flex-wrap gap-3 md:gap-5" aria-label={label}>
      {items.map((item) => {
        const style = { "--r": item.ratio } as CSSProperties;
        const frame = (
          <span className="relative block bg-black/5" style={{ paddingBottom: `${100 / item.ratio}%` }}>
            <Image src={item.src} alt={item.kind === "photo" ? item.title : ""} fill sizes={SIZES} className="object-cover" />
          </span>
        );
        return (
          <li key={item.key} className="mosaic__item" style={style} data-kind={item.kind}>
            {item.kind === "photo" ? (
              <Link href={{ pathname: "/sculptures/[slug]", params: { slug: item.slug } }} className="block transition-opacity duration-300 hover:opacity-85" aria-label={item.title}>
                {frame}
              </Link>
            ) : (
              <span className="relative block">
                {frame}
                {item.zones.map((z, i) => (
                  <Link
                    key={`${z.slug}-${i}`}
                    href={{ pathname: "/sculptures/[slug]", params: { slug: z.slug } }}
                    aria-label={z.title}
                    className="mosaic__zone absolute"
                    style={{ left: `${z.x}%`, top: `${z.y}%`, width: `${z.w}%`, height: `${z.h}%` }}
                  />
                ))}
              </span>
            )}
          </li>
        );
      })}
      <li aria-hidden className="mosaic__end" />
    </ul>
  );
}
