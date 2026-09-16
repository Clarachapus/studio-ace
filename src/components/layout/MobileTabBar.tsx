"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { AceIcon } from "@/components/ui/AceIcons";
import { NAV_ITEMS, isNavActive } from "./nav";

/** Phone navigation: three large, always-visible buttons at the bottom of the screen. */
export function MobileTabBar() {
  const t = useTranslations("Nav");
  const pathname = usePathname();
  const isHome = pathname === "/";

  return (
    <>
      {/* Keeps the end of inner pages clear of the bar; the home fits one screen and needs none. */}
      {!isHome && <div aria-hidden="true" className="h-20 md:hidden" />}
      <nav aria-label={t("mainNav")} className="fixed inset-x-0 bottom-0 z-50 border-t border-line bg-bg/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden">
        <ul className="grid grid-cols-3">
          {NAV_ITEMS.map((item) => {
            const on = isNavActive(pathname, item.href);
            return (
              <li key={item.key}>
                <Link
                  href={item.href}
                  aria-current={on ? "page" : undefined}
                  className={`flex min-h-16 flex-col items-center justify-center gap-1 py-2 text-[0.82rem] transition-colors hover:text-menu ${on ? "text-menu" : "text-fg"}`}
                >
                  <AceIcon name={item.icon} className="h-6" />
                  <span className={on ? "font-semibold" : ""}>{t(item.key)}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
