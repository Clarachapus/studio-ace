"use client";

import { usePathname, useRouter } from "@/i18n/navigation";

type Option = { value: string; label: string };

/** Query-string filter (?param=value), as plain text: bordeaux on hover and when selected. */
export function FilterBar({ allLabel, param, active, options }: { allLabel: string; param: string; active?: string; options: Option[] }) {
  const router = useRouter();
  const pathname = usePathname();

  const go = (value?: string) => {
    const search = value ? `?${param}=${value}` : "";
    router.replace(`${pathname}${search}` as never, { scroll: false });
  };

  const cls = (on: boolean) =>
    `shrink-0 whitespace-nowrap py-2 text-[0.8rem] uppercase tracking-[0.2em] transition-colors hover:text-menu ${
      on ? "text-menu underline decoration-1 underline-offset-8" : "text-fg-soft"
    }`;

  return (
    <div className="-mx-5 mt-8 flex gap-6 overflow-x-auto px-5 [scrollbar-width:none] sm:mx-0 sm:mt-12 sm:flex-wrap sm:overflow-visible sm:px-0 [&::-webkit-scrollbar]:hidden" data-reveal>
      <button type="button" className={cls(!active)} aria-pressed={!active} onClick={() => go()}>
        {allLabel}
      </button>
      {options.map((o) => (
        <button key={o.value} type="button" className={cls(active === o.value)} aria-pressed={active === o.value} onClick={() => go(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}
