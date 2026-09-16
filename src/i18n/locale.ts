import { notFound } from "next/navigation";
import { locales, type Locale } from "./routing";

/** True when the URL segment is one of the site languages. */
export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

/**
 * Pages render in parallel with the [locale] layout, so they must check the
 * segment themselves: paths like /favicon.ico would otherwise reach a page
 * with locale "favicon.ico" and crash. Unknown values answer a clean 404.
 */
export function requireLocale(value: string): Locale {
  if (!isLocale(value)) notFound();
  return value;
}
