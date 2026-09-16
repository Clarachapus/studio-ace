import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { Site } from "@/lib/content";

export function Footer({ site, locale }: { site: Site; locale: string }) {
  const t = useTranslations("Footer");
  const tagline = site[locale as "fr" | "en"].tagline;

  return (
    <footer className="bg-bg text-fg border-t border-line transition-colors duration-500">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12 py-16 grid gap-10 md:grid-cols-3">
        <div>
          <p className="font-display text-2xl tracking-[-0.01em]">{site.name}</p>
          {tagline && <p className="mt-2 text-sm uppercase tracking-[0.28em] opacity-70">{tagline}</p>}
        </div>
        <address className="not-italic text-sm leading-7 opacity-85">
          {site.address.map((line) => (
            <div key={line}>{line}</div>
          ))}
          <a className="block py-1 mt-3 hover:text-menu" href={`mailto:${site.publicEmail}`}>
            {site.publicEmail}
          </a>
          {site.phone && (
            <a className="block py-1 hover:text-menu" href={`tel:${site.phone.replace(/\s/g, "")}`}>
              {site.phone}
            </a>
          )}
        </address>
        <div className="text-sm leading-7 opacity-85 md:text-right">
          {site.social.map((s) => (
            <a key={s.url} href={s.url} target="_blank" rel="noreferrer" className="block py-1 hover:text-menu">
              {s.label}
            </a>
          ))}
          <div className="mt-3 flex gap-4 md:justify-end">
            <Link href="/mentions-legales" className="inline-block py-2 hover:text-menu">
              {t("legal")}
            </Link>
            <Link href="/confidentialite" className="inline-block py-2 hover:text-menu">
              {t("privacy")}
            </Link>
          </div>
        </div>
      </div>
      <div className="flex justify-center pb-10">
        <div className="brand-logo" role="img" aria-label={site.name} data-testid="footer-logo" />
      </div>
      <div className="border-t border-line py-5 text-center text-xs opacity-50">
        © {new Date().getFullYear()} {site.name}. {t("rights")}
      </div>
    </footer>
  );
}
