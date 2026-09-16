import type { Site } from "@/lib/content";

type Labels = { title: string; email: string; phone: string; instagram: string };

/** Email, phone and Instagram of the studio, taken from content/site.json. */
export function ContactLinks({ site, labels, className = "" }: { site: Site; labels: Labels; className?: string }) {
  const insta = site.social.find((s) => /instagram/i.test(s.label) || /instagram\.com/i.test(s.url));
  const handle = insta
    ? "@" + insta.url.replace(/^https?:\/\/(www\.)?instagram\.com\//i, "").replace(/\/.*$/, "")
    : null;

  const items = [
    site.publicEmail && { label: labels.email, value: site.publicEmail, href: `mailto:${site.publicEmail}`, external: false },
    site.phone && { label: labels.phone, value: site.phone, href: `tel:${site.phone.replace(/\s/g, "")}`, external: false },
    insta && handle && { label: labels.instagram, value: handle, href: insta.url, external: true },
  ].filter(Boolean) as { label: string; value: string; href: string; external: boolean }[];

  if (items.length === 0) return null;

  return (
    <div className={className}>
      <p className="text-[0.72rem] uppercase tracking-[0.28em] text-fg-soft">{labels.title}</p>
      <ul className="mt-4 grid gap-x-10 gap-y-3 border-t border-line pt-5 sm:grid-cols-[auto_auto_auto] sm:justify-start">
        {items.map((item) => (
          <li key={item.label}>
            <span className="block text-[0.7rem] uppercase tracking-[0.22em] text-fg-soft">{item.label}</span>
            <a
              href={item.href}
              {...(item.external ? { target: "_blank", rel: "noreferrer" } : {})}
              className="block break-words py-2.5 text-base underline-offset-4 transition-colors hover:text-menu hover:underline"
            >
              {item.value}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
