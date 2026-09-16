import { siteUrl } from "@/lib/site-url";
import type { ReactNode } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { routing, type Locale } from "@/i18n/routing";
import { getSite } from "@/lib/content";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SmoothScroll } from "@/components/layout/SmoothScroll";
import { LangAttribute } from "@/components/layout/LangAttribute";
import { FooterGate } from "@/components/layout/FooterGate";
import { MobileTabBar } from "@/components/layout/MobileTabBar";
import { CustomCursor } from "@/components/layout/CustomCursor";

type Props = { children: ReactNode; params: Promise<{ locale: string }> };

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const site = await getSite();
  const seo = site[locale as Locale].seo;
  const base = siteUrl();
  return {
    metadataBase: new URL(base),
    title: { default: seo.title, template: `%s — ${site.name}` },
    description: seo.description,
    openGraph: { title: seo.title, description: seo.description, siteName: site.name, locale, type: "website" },
    alternates: { languages: { fr: "/fr", en: "/en" } },
  };
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const site = await getSite();

  return (
    <NextIntlClientProvider>
      <LangAttribute locale={locale} />
      <SmoothScroll />
      <Header siteName={site.name} />
      <main className="flex-1">{children}</main>
      <FooterGate>
        <Footer site={site} locale={locale} />
      </FooterGate>
      <MobileTabBar />
      <CustomCursor />
    </NextIntlClientProvider>
  );
}
