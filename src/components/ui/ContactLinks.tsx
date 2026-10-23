import type { ReactNode } from "react";
import type { Site } from "@/lib/content";
import { InstagramIcon, isInstagram } from "./InstagramIcon";

type Labels = { title: string; email: string; phone: string; instagram: string };

/** Email, phone and Instagram of the studio, taken from content/site.json. */
export function ContactLinks({ site, labels, className = "" }: { site: Site; labels: Labels; className?: string }) {
  const insta = site.social.find(isInstagram);
  const instaName = insta ? (/instagram/i.test(insta.label) ? site.name : insta.label) : null;

  const items = [
    site.publicEmail && { label: labels.email, value: site.publicEmail, href: `mailto:${site.publicEmail}`, external: false, nowrap: false },
    site.phone && { label: labels.phone, value: site.phone, href: `tel:${site.phone.replace(/\s/g, "")}`, external: false, nowrap: true },
    insta && instaName && {
      label: labels.instagram,
      value: (
        <span className="inline-flex items-center gap-1.5">
          <InstagramIcon className="h-4 w-4 shrink-0" />
          {instaName}
        </span>
      ),
      href: insta.url,
      external: true,
      nowrap: true,
    },
  ].filter(Boolean) as { label: string; value: ReactNode; href: string; external: boolean; nowrap: boolean }[];

  if (items.length === 0) return null;

  return (
    <div className={className}>
      <p className="text-[0.72rem] uppercase tracking-[0.28em] text-fg-soft">{labels.title}</p>
      <ul className="mt-4 grid gap-x-6 gap-y-3 border-t border-line pt-5 sm:grid-cols-[auto_auto_auto] sm:justify-start">
        {items.map((item) => (
          <li key={item.label}>
            <span className="block text-[0.7rem] uppercase tracking-[0.22em] text-fg-soft">{item.label}</span>
            <a
              href={item.href}
              {...(item.external ? { target: "_blank", rel: "noreferrer" } : {})}
              className={`block py-2.5 text-[0.9rem] underline-offset-4 transition-colors hover:text-menu hover:underline ${item.nowrap ? "whitespace-nowrap" : "break-words"}`}
            >
              {item.value}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
