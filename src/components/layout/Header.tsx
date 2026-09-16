"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { ThemeToggle } from "./ThemeToggle";
import { NAV_ITEMS, isNavActive } from "./nav";

type SwitchHref = Parameters<typeof Link>[0]["href"];

/**
 * Top bar. Each section is its own page: links simply navigate, and the page you
 * are on is highlighted. On phones the sections live in the bottom tab bar.
 */
export function Header({ siteName }: { siteName: string }) {
  const t = useTranslations("Nav");
  const locale = useLocale();
  const pathname = usePathname();
  const params = useParams<{ slug?: string }>();
  const [scrolled, setScrolled] = useState(false);
  const isHome = pathname === "/";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const otherLocale = locale === "fr" ? "en" : "fr";
  const switchHref = localeSwitchHref(pathname, params.slug);
  // Over the home video the bar is transparent with cream text; elsewhere it follows the site theme.
  const tone = isHome ? "text-cream" : "text-fg";
  const surface = isHome ? "" : scrolled ? "bg-bg/90 backdrop-blur-md border-b border-line" : "bg-bg";

  return (
    <header className={`fixed inset-x-0 top-0 z-50 transition-colors duration-500 ${surface}`}>
      <div className={`mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8 lg:h-20 lg:px-12 ${tone}`}>
        <Link href="/" className="-my-2 py-2 font-display text-xl tracking-[-0.01em]" aria-label={siteName}>
          {siteName}
        </Link>

        <nav aria-label={t("mainNav")} className="hidden items-center gap-6 md:flex">
          {/* Plain text menu: the link turns bordeaux on hover; the current page stays bordeaux, finely underlined. */}
          <div className="flex items-center gap-7">
            {NAV_ITEMS.map((item) => {
              const on = isNavActive(pathname, item.href);
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  aria-current={on ? "page" : undefined}
                  className={`py-2 text-[0.98rem] tracking-[0.02em] transition-colors duration-300 hover:text-menu ${
                    on ? "text-menu underline decoration-1 underline-offset-8" : ""
                  }`}
                >
                  {t(item.key)}
                </Link>
              );
            })}
          </div>
          <Link href={switchHref} locale={otherLocale} className="rounded-full border border-current/40 px-3 py-1.5 text-sm opacity-80 hover:opacity-100">
            {locale === "fr" ? "EN" : "FR"}
          </Link>
          <ThemeToggle labels={{ toDark: t("toDark"), toLight: t("toLight") }} />
        </nav>

        <div className="flex items-center gap-1 md:hidden">
          <Link
            href={switchHref}
            locale={otherLocale}
            aria-label={t("switchLocale")}
            className="grid h-11 min-w-11 place-items-center px-1 text-[0.72rem] uppercase tracking-[0.18em] opacity-80 hover:opacity-100"
          >
            <span className="rounded-full border border-current/40 px-2.5 py-1">{locale === "fr" ? "EN" : "FR"}</span>
          </Link>
          <ThemeToggle labels={{ toDark: t("toDark"), toLight: t("toLight") }} />
        </div>
      </div>
    </header>
  );
}

/** Maps the current internal pathname to a typed href so the locale switch keeps the page. */
function localeSwitchHref(pathname: string, slug?: string): SwitchHref {
  if (slug && pathname.startsWith("/projets/")) return { pathname: "/projets/[slug]", params: { slug } };
  if (slug && pathname.startsWith("/sculptures/")) return { pathname: "/sculptures/[slug]", params: { slug } };
  const statics = ["/projets", "/sculptures", "/a-propos", "/mentions-legales", "/confidentialite"] as const;
  const hit = statics.find((s) => pathname === s);
  return hit ?? "/";
}
