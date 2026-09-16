import Image from "next/image";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { formatPrice, type Sculpture } from "@/lib/content";

type Props = {
  sculpture: Sculpture;
  locale: Locale;
  statusLabel: string;
  onRequestLabel: string;
  /** Kept for compatibility with the V1 layout (wide first card). */
  large?: boolean;
  /** "compact": dense grid, title + dimensions only, badge only when not available. */
  variant?: "compact" | "full";
};

export function SculptureCard({ sculpture, locale, statusLabel, onRequestLabel, large = false, variant = "full" }: Props) {
  const t = sculpture[locale];
  const compact = variant === "compact";
  const price = formatPrice(sculpture.price, locale) ?? onRequestLabel;
  // Listings show the works only: no "sold" / "commission" labels on compact cards.
  const showBadge = !compact;

  return (
    <Link
      href={{ pathname: "/sculptures/[slug]", params: { slug: sculpture.slug } }}
      className={`group block ${large && !compact ? "md:col-span-2" : ""}`}
      data-reveal
    >
      <div className={`relative overflow-hidden bg-black/30 ${large && !compact ? "aspect-[16/10]" : "aspect-[4/5]"}`}>
        <Image
          src={sculpture.images[0]}
          alt={t.title}
          fill
          sizes={compact ? "(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw" : large ? "(min-width: 768px) 66vw, 100vw" : "(min-width: 768px) 33vw, 100vw"}
          className="object-cover transition-transform duration-[1200ms] group-hover:scale-[1.03]"
        />
        {showBadge && (
          <span className="absolute left-3 top-3 rounded-full border border-cream/30 bg-black/30 px-3 py-1 text-[0.7rem] uppercase tracking-[0.22em] text-cream backdrop-blur">
            {statusLabel}
          </span>
        )}
      </div>
      {compact ? (
        <>
          <h3 className="mt-3 font-display text-lg lg:text-2xl">{t.title}</h3>
          {sculpture.dimensions && <p className="mt-0.5 text-sm text-fg-soft">{sculpture.dimensions}</p>}
        </>
      ) : (
        <>
          <div className="mt-5 flex items-end justify-between gap-4">
            <h3 className={`font-display ${large ? "text-4xl lg:text-6xl" : "text-2xl lg:text-3xl"}`}>{t.title}</h3>
            <span className="text-sm text-fg-soft whitespace-nowrap">{sculpture.status === "sold" ? "" : price}</span>
          </div>
          <p className="mt-1 text-sm text-fg-soft">{[sculpture.material, sculpture.dimensions].filter(Boolean).join(" · ")}</p>
        </>
      )}
    </Link>
  );
}
